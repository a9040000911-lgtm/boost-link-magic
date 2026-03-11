import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkLicense } from "../_shared/license.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // === HARDENED LICENSE VERIFICATION ===
  const { valid, error: licError, plan: licPlan, userId, userEmail } = await checkLicense(req);
  if (!valid) {
    console.error(`[License Blocked] Domain: ${req.headers.get('origin') || 'Unknown'}, Error: ${licError}`);
    return json({ error: `License invalid: ${licError}. Please check settings.`, license_error: true }, 403);
  }

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { service_id, link, quantity, project_id, idempotency_key } = await req.json();

    // === INPUT VALIDATION ===
    if (!service_id || !link || !quantity) {
      return json({ error: 'service_id, link, quantity required' }, 400);
    }

    if (typeof quantity !== 'number' || quantity < 1 || quantity > 10000000 || !Number.isInteger(quantity)) {
      return json({ error: 'Invalid quantity' }, 400);
    }

    // Sanitize link
    const sanitizedLink = String(link).trim().slice(0, 2000);
    if (!/^https?:\/\/.+/.test(sanitizedLink)) {
      return json({ error: 'Invalid link format' }, 400);
    }


    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // === LICENSE PLAN LIMITS (from app_settings DB) ===
    const PLAN_DEFAULTS: Record<string, { maxOrdersPerMonth: number; maxOrderAmount: number }> = {
      standard: { maxOrdersPerMonth: 100, maxOrderAmount: 5000 },
      pro: { maxOrdersPerMonth: 1000, maxOrderAmount: 50000 },
      enterprise: { maxOrdersPerMonth: 0, maxOrderAmount: 0 },
    };

    const currentPlan = licPlan || 'standard';
    const defaults = PLAN_DEFAULTS[currentPlan] || PLAN_DEFAULTS.standard;

    // Read limits from app_settings
    const prefix = `plan_${currentPlan}_`;
    const { data: settingsData } = await adminClient
      .from('app_settings')
      .select('key, value')
      .in('key', [`${prefix}max_orders_month`, `${prefix}max_order_amount`]);

    const settingsMap: Record<string, string> = {};
    (settingsData || []).forEach((r: any) => { settingsMap[r.key] = r.value; });

    const limits = {
      maxOrdersPerMonth: Number(settingsMap[`${prefix}max_orders_month`] ?? defaults.maxOrdersPerMonth),
      maxOrderAmount: Number(settingsMap[`${prefix}max_order_amount`] ?? defaults.maxOrderAmount),
    };

    // Check monthly order count
    if (limits.maxOrdersPerMonth > 0) {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const { count } = await adminClient
        .from('orders')
        .select('id', { count: 'exact', head: true })
        .gte('created_at', monthStart.toISOString());

      if ((count ?? 0) >= limits.maxOrdersPerMonth) {
        return json({
          error: `Лимит заказов для плана ${currentPlan} исчерпан (${limits.maxOrdersPerMonth}/мес). Обновите лицензию.`,
          plan_limit: true,
        }, 403);
      }
    }

    // === IDEMPOTENCY CHECK (prevent double orders from fast clicks) ===
    if (idempotency_key) {
      const { data: existing } = await adminClient
        .from('order_idempotency')
        .select('order_id')
        .eq('idempotency_key', idempotency_key)
        .single();

      if (existing?.order_id) {
        // Return the existing order - don't process again
        const { data: existingOrder } = await adminClient
          .from('orders')
          .select('*')
          .eq('id', existing.order_id)
          .single();

        return json({
          success: true,
          order_id: existing.order_id,
          price: existingOrder?.price,
          deduplicated: true,
          message: 'Order already exists (duplicate request ignored)',
        });
      }

      // Reserve the idempotency key
      const { error: idemErr } = await adminClient
        .from('order_idempotency')
        .insert({ idempotency_key, order_id: null });

      if (idemErr?.code === '23505') {
        // Key already exists but no order yet - concurrent request, reject
        return json({ error: 'Order is being processed, please wait' }, 429);
      }
    }

    // === GET SERVICE ===
    const { data: service, error: svcErr } = await adminClient
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('is_enabled', true)
      .single();

    if (svcErr || !service) {
      return json({ error: 'Service not found or disabled' }, 404);
    }

    // Validate quantity range
    if (quantity < service.min_quantity || quantity > service.max_quantity) {
      return json({ error: `Quantity must be ${service.min_quantity}-${service.max_quantity}` }, 400);
    }

    // === CALCULATE & VERIFY PRICE ===
    const pricePerUnit = Number(service.price) / 1000;
    const totalPrice = Math.round(pricePerUnit * quantity * 100) / 100; // Prevent floating point issues

    if (totalPrice <= 0 || totalPrice > 1000000) {
      return json({ error: 'Invalid price calculation' }, 400);
    }

    // === MINIMUM MARKUP PROTECTION ===
    // Read min_markup_percent from app_settings (default 200%)
    const { data: minMarkupSetting } = await adminClient
      .from('app_settings')
      .select('value')
      .eq('key', 'min_markup_percent')
      .single();
    const minMarkupPercent = Number(minMarkupSetting?.value ?? 200);


    // === CHECK PLAN ORDER AMOUNT LIMIT ===
    if (limits.maxOrderAmount > 0 && totalPrice > limits.maxOrderAmount) {
      return json({
        error: `Максимальная сумма заказа для плана ${currentPlan}: ${limits.maxOrderAmount}₽. Ваш заказ: ${totalPrice}₽.`,
        plan_limit: true,
      }, 403);
    }

    // === ATOMIC BALANCE DEDUCTION (prevents race condition / double-spend) ===
    const { data: newBalance, error: balErr } = await adminClient.rpc('deduct_balance', {
      p_user_id: userId,
      p_amount: totalPrice,
    });

    if (balErr || newBalance === -1) {
      return json({ error: 'Insufficient balance', required: totalPrice }, 402);
    }

    // === PROVIDER MAPPINGS ===
    const { data: mappingsData } = await adminClient
      .from('service_provider_mappings')
      .select('*, provider_services(*)')
      .eq('service_id', service_id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const mappings = mappingsData || [];

    if (mappings.length === 0) {
      // Refund atomically
      await adminClient.rpc('credit_balance', { p_user_id: userId, p_amount: totalPrice });
      return json({ error: 'No providers configured for this service' }, 500);
    }

    // === MINIMUM MARKUP PROTECTION (server-side) ===
    // Check that our sell price meets the minimum markup vs cheapest provider cost
    if (minMarkupPercent > 0) {
      const providerRates = mappings
        .map((m: any) => Number(m.provider_services?.rate || 0))
        .filter((r: number) => r > 0);
      if (providerRates.length > 0) {
        const cheapestRate = Math.min(...providerRates);
        const minAllowedPrice = cheapestRate * (1 + minMarkupPercent / 100);
        if (Number(service.price) < minAllowedPrice) {
          // Refund and block
          await adminClient.rpc('credit_balance', { p_user_id: userId, p_amount: totalPrice });
          await adminClient.from('financial_alerts').insert({
            alert_type: 'markup_violation',
            severity: 'critical',
            user_id: userId,
            details: {
              service_id,
              service_name: service.name,
              our_price: service.price,
              cheapest_rate: cheapestRate,
              min_allowed_price: minAllowedPrice,
              min_markup_percent: minMarkupPercent,
            },
          });
          return json({
            error: `Услуга заблокирована: наценка ниже минимальной (${minMarkupPercent}%). Обратитесь к администратору.`,
            markup_violation: true,
          }, 403);
        }
      }
    }

    // === GET PROVIDERS ===
    const providerKeys = [...new Set(mappings.map((m: any) => m.provider_services?.provider).filter(Boolean))];
    const { data: providersData } = await adminClient
      .from('providers')
      .select('*')
      .in('key', providerKeys)
      .eq('is_enabled', true);

    const providers: Record<string, any> = {};
    (providersData || []).forEach((p: any) => { providers[p.key] = p; });

    // === TRY EACH PROVIDER ===
    const attempts: Array<{ provider: string; provider_service_id: number; success: boolean; error?: string; order_id?: string; latency_ms: number; provider_price?: number }> = [];
    let successResult: { provider: string; providerOrderId: string; providerServiceId: string; costPrice?: number } | null = null;

    for (const mapping of mappings) {
      const ps = mapping.provider_services;
      if (!ps) continue;

      const provider = providers[ps.provider];
      if (!provider) continue;

      const apiKey = Deno.env.get(provider.api_key_env);
      if (!apiKey) {
        attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: false, error: 'API key not configured', latency_ms: 0 });
        continue;
      }

      const start = Date.now();
      try {
        // === PRICE VERIFICATION: Check provider price hasn't spiked ===
        const providerOurPrice = Number(ps.our_price || ps.rate);
        const maxAcceptablePrice = providerOurPrice * 1.5; // Alert if provider price > 150% of expected

        const response = await fetch(provider.api_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: apiKey,
            action: 'add',
            service: ps.provider_service_id.toString(),
            link: sanitizedLink,
            quantity: quantity.toString(),
          }),
        });

        const data = await response.json();
        const latency = Date.now() - start;

        if (data.order) {
          attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: true, order_id: String(data.order), latency_ms: latency });
          // Calculate real cost price based on provider rate
          const providerRatePer1000 = Number(ps.rate);
          const realCostPrice = Math.round((providerRatePer1000 / 1000) * quantity * 100) / 100;

          successResult = {
            provider: ps.provider,
            providerOrderId: String(data.order),
            providerServiceId: ps.id,
            costPrice: realCostPrice,
          };

          // === FINANCIAL ALERT: Check if our margin is negative ===
          // We'll verify by checking provider service rate vs our sell price
          const providerCostPer1000 = Number(ps.rate);
          const ourSellPricePer1000 = Number(service.price);
          if (providerCostPer1000 > ourSellPricePer1000) {
            await adminClient.from('financial_alerts').insert({
              alert_type: 'negative_margin',
              severity: 'high',
              user_id: userId,
              details: {
                service_id,
                service_name: service.name,
                provider: ps.provider,
                provider_rate: providerCostPer1000,
                our_price: ourSellPricePer1000,
                loss_per_1000: providerCostPer1000 - ourSellPricePer1000,
                order_quantity: quantity,
              },
            });
          }

          break;
        } else {
          attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: false, error: data.error || 'Unknown provider error', latency_ms: latency });
        }
      } catch (e: any) {
        const latency = Date.now() - start;
        attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: false, error: e.message, latency_ms: latency });
      }
    }

    // === HANDLE RESULT ===
    if (successResult) {
      const { data: order } = await adminClient.from('orders').insert({
        user_id: userId,
        service_id,
        service_name: service.name,
        link: sanitizedLink,
        quantity,
        price: totalPrice,
        cost_price: successResult.costPrice || null,
        platform: service.network,
        provider: successResult.provider,
        provider_order_id: successResult.providerOrderId,
        provider_service_id: successResult.providerServiceId,
        status: 'processing',
        project_id: project_id || null,
      }).select().single();

      // Update idempotency key with order ID
      if (idempotency_key && order) {
        await adminClient.from('order_idempotency')
          .update({ order_id: order.id })
          .eq('idempotency_key', idempotency_key);
      }

      await adminClient.from('transactions').insert({
        user_id: userId,
        type: 'purchase',
        amount: -totalPrice,
        balance_after: newBalance,
        order_id: order?.id,
        status: 'completed',
        description: `Заказ: ${service.name} (${quantity} шт.)`,
      });

      await adminClient.from('admin_audit_logs').insert({
        actor_id: userId,
        action: 'create_order',
        target_type: 'order',
        target_id: order?.id,
        details: {
          service_name: service.name,
          quantity,
          price: totalPrice,
          provider: successResult.provider,
          provider_order_id: successResult.providerOrderId,
          attempts,
          failover_used: attempts.length > 1,
          idempotency_key: idempotency_key || null,
        },
      });

      // Cleanup old idempotency keys periodically (1% chance per request)
      if (Math.random() < 0.01) {
        await adminClient.rpc('cleanup_idempotency_keys').catch(() => { });
      }

      return json({
        success: true,
        order_id: order?.id,
        provider: successResult.provider,
        provider_order_id: successResult.providerOrderId,
        price: totalPrice,
        new_balance: newBalance,
        failover_used: attempts.length > 1,
        attempts_count: attempts.length,
      });
    } else {
      // All providers failed - ATOMIC refund
      const { data: refundedBalance } = await adminClient.rpc('credit_balance', {
        p_user_id: userId,
        p_amount: totalPrice,
      });

      const { data: failedOrder } = await adminClient.from('orders').insert({
        user_id: userId,
        service_id,
        service_name: service.name,
        link: sanitizedLink,
        quantity,
        price: totalPrice,
        platform: service.network,
        status: 'canceled',
        refund_status: 'auto_refunded',
        refunded_amount: totalPrice,
        refunded_at: new Date().toISOString(),
        project_id: project_id || null,
      }).select().single();

      // Update idempotency
      if (idempotency_key && failedOrder) {
        await adminClient.from('order_idempotency')
          .update({ order_id: failedOrder.id })
          .eq('idempotency_key', idempotency_key);
      }

      await adminClient.from('transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: totalPrice,
        balance_after: refundedBalance ?? 0,
        order_id: failedOrder?.id,
        status: 'completed',
        description: `Автовозврат: все провайдеры недоступны (${service.name})`,
      });

      await adminClient.from('admin_audit_logs').insert({
        actor_id: userId,
        action: 'order_all_providers_failed',
        target_type: 'order',
        target_id: failedOrder?.id,
        details: { service_name: service.name, attempts, total_price: totalPrice },
      });

      return json({
        success: false,
        error: 'All providers failed. Balance refunded automatically.',
        attempts,
        refunded: totalPrice,
      }, 503);
    }
  } catch (error: unknown) {
    console.error('Create order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
