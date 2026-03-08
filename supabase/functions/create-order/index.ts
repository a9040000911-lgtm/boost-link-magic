import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { service_id, link, quantity, project_id } = await req.json();

    if (!service_id || !link || !quantity) {
      return new Response(JSON.stringify({ error: 'service_id, link, quantity required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }
    const userId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // 1. Get service
    const { data: service, error: svcErr } = await adminClient
      .from('services')
      .select('*')
      .eq('id', service_id)
      .eq('is_enabled', true)
      .single();

    if (svcErr || !service) {
      return new Response(JSON.stringify({ error: 'Service not found or disabled' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Validate quantity
    if (quantity < service.min_quantity || quantity > service.max_quantity) {
      return new Response(JSON.stringify({ 
        error: `Quantity must be ${service.min_quantity}-${service.max_quantity}` 
      }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 2. Calculate price
    const pricePerUnit = Number(service.price) / 1000;
    const totalPrice = pricePerUnit * quantity;

    // 3. Check user balance
    const { data: profile } = await adminClient
      .from('profiles')
      .select('balance')
      .eq('id', userId)
      .single();

    if (!profile || Number(profile.balance) < totalPrice) {
      return new Response(JSON.stringify({ error: 'Insufficient balance', required: totalPrice, balance: profile?.balance || 0 }), {
        status: 402, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 4. Deduct balance first (atomic)
    const newBalance = Number(profile.balance) - totalPrice;
    await adminClient.from('profiles').update({ balance: newBalance }).eq('id', userId);

    // 5. Get provider mappings ordered by priority
    const { data: mappingsData } = await adminClient
      .from('service_provider_mappings')
      .select('*, provider_services(*)')
      .eq('service_id', service_id)
      .eq('is_active', true)
      .order('priority', { ascending: true });

    const mappings = mappingsData || [];

    if (mappings.length === 0) {
      // Refund - no providers
      await adminClient.from('profiles').update({ balance: Number(profile.balance) }).eq('id', userId);
      return new Response(JSON.stringify({ error: 'No providers configured for this service' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // 6. Get providers from DB
    const providerKeys = [...new Set(mappings.map((m: any) => m.provider_services?.provider).filter(Boolean))];
    const { data: providersData } = await adminClient
      .from('providers')
      .select('*')
      .in('key', providerKeys)
      .eq('is_enabled', true);

    const providers: Record<string, any> = {};
    (providersData || []).forEach((p: any) => { providers[p.key] = p; });

    // 7. Try each provider in priority order
    const attempts: Array<{ provider: string; provider_service_id: number; success: boolean; error?: string; order_id?: string; latency_ms: number }> = [];
    let successResult: { provider: string; providerOrderId: string; providerServiceId: string } | null = null;

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
        const response = await fetch(provider.api_url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            key: apiKey,
            action: 'add',
            service: ps.provider_service_id.toString(),
            link,
            quantity: quantity.toString(),
          }),
        });

        const data = await response.json();
        const latency = Date.now() - start;

        if (data.order) {
          attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: true, order_id: String(data.order), latency_ms: latency });
          successResult = {
            provider: ps.provider,
            providerOrderId: String(data.order),
            providerServiceId: ps.id,
          };
          break; // Success!
        } else {
          attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: false, error: data.error || 'Unknown provider error', latency_ms: latency });
        }
      } catch (e: any) {
        const latency = Date.now() - start;
        attempts.push({ provider: ps.provider, provider_service_id: ps.provider_service_id, success: false, error: e.message, latency_ms: latency });
      }
    }

    // 8. Handle result
    if (successResult) {
      // Create order
      const { data: order } = await adminClient.from('orders').insert({
        user_id: userId,
        service_id,
        service_name: service.name,
        link,
        quantity,
        price: totalPrice,
        platform: service.network,
        provider: successResult.provider,
        provider_order_id: successResult.providerOrderId,
        provider_service_id: successResult.providerServiceId,
        status: 'processing',
        project_id: project_id || null,
      }).select().single();

      // Create transaction
      await adminClient.from('transactions').insert({
        user_id: userId,
        type: 'purchase',
        amount: -totalPrice,
        balance_after: newBalance,
        order_id: order?.id,
        status: 'completed',
        description: `Заказ: ${service.name} (${quantity} шт.)`,
      });

      // Audit log with all attempts
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
        },
      });

      return new Response(JSON.stringify({
        success: true,
        order_id: order?.id,
        provider: successResult.provider,
        provider_order_id: successResult.providerOrderId,
        price: totalPrice,
        new_balance: newBalance,
        failover_used: attempts.length > 1,
        attempts_count: attempts.length,
      }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    } else {
      // All providers failed - refund
      await adminClient.from('profiles').update({ balance: Number(profile.balance) }).eq('id', userId);

      // Create failed order for tracking
      const { data: failedOrder } = await adminClient.from('orders').insert({
        user_id: userId,
        service_id,
        service_name: service.name,
        link,
        quantity,
        price: totalPrice,
        platform: service.network,
        status: 'canceled',
        refund_status: 'auto_refunded',
        refunded_amount: totalPrice,
        refunded_at: new Date().toISOString(),
        project_id: project_id || null,
      }).select().single();

      // Refund transaction
      await adminClient.from('transactions').insert({
        user_id: userId,
        type: 'refund',
        amount: totalPrice,
        balance_after: Number(profile.balance),
        order_id: failedOrder?.id,
        status: 'completed',
        description: `Автовозврат: все провайдеры недоступны (${service.name})`,
      });

      // Audit
      await adminClient.from('admin_audit_logs').insert({
        actor_id: userId,
        action: 'order_all_providers_failed',
        target_type: 'order',
        target_id: failedOrder?.id,
        details: { service_name: service.name, attempts, total_price: totalPrice },
      });

      return new Response(JSON.stringify({
        success: false,
        error: 'All providers failed. Balance refunded automatically.',
        attempts,
        refunded: totalPrice,
      }), {
        status: 503,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }
  } catch (error: unknown) {
    console.error('Create order error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
