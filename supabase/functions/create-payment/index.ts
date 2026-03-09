import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkLicense } from "../_shared/license.ts";

const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') || '*';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // === HARDENED LICENSE VERIFICATION ===
  const { valid, error: licError } = await checkLicense(req);
  if (!valid) {
    console.error(`[License Blocked] Domain: ${req.headers.get('origin') || 'Unknown'}, Error: ${licError}`);
    return json({ error: `License invalid: ${licError}. Please check settings.`, license_error: true }, 403);
  }

  try {
    const { amount } = await req.json();

    // Validate amount: positive integer, no sub-kopek decimals
    if (!amount || typeof amount !== 'number' || amount < 1 || amount > 1000000 || !Number.isFinite(amount)) {
      return json({ error: 'Сумма должна быть от 1 до 1 000 000 ₽' }, 400);
    }
    // Round to 2 decimal places to prevent sub-kopek amounts
    const safeAmount = Math.round(amount * 100) / 100;

    // Auth
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_ANON_KEY')!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace('Bearer ', '');
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email || '';

    // Admin client for settings
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Read ALL relevant settings including credentials from app_settings
    const { data: settings } = await adminClient
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'min_deposit_amount', 'active_payment_system', 'yookassa_return_url',
        'yookassa_test_mode',
        'yookassa_test_shop_id', 'yookassa_test_secret_key',
        'yookassa_shop_id', 'yookassa_secret_key',
      ]);

    const settingsMap: Record<string, string> = {};
    (settings || []).forEach((r: any) => { settingsMap[r.key] = r.value; });

    const minDeposit = Number(settingsMap.min_deposit_amount || 50);
    if (safeAmount < minDeposit) {
      return json({ error: `Минимальная сумма пополнения: ${minDeposit} ₽` }, 400);
    }

    // Determine test or production mode — read credentials from app_settings (admin UI)
    // Fallback to env vars for backward compatibility
    const isTestMode = settingsMap.yookassa_test_mode === 'true';
    const shopId = isTestMode
      ? (settingsMap.yookassa_test_shop_id || Deno.env.get('YOOKASSA_TEST_SHOP_ID') || '')
      : (settingsMap.yookassa_shop_id || Deno.env.get('YOOKASSA_SHOP_ID') || '');
    const secretKey = isTestMode
      ? (settingsMap.yookassa_test_secret_key || Deno.env.get('YOOKASSA_TEST_SECRET_KEY') || '')
      : (settingsMap.yookassa_secret_key || Deno.env.get('YOOKASSA_SECRET_KEY') || '');

    if (!shopId || !secretKey) {
      console.error(`YooKassa credentials not configured (test_mode=${isTestMode})`);
      return json({ error: 'Платёжная система не настроена. Заполните ключи в админке.' }, 500);
    }

    const returnUrl = settingsMap.yookassa_return_url || `${req.headers.get('origin') || 'https://boost-link-magic.lovable.app'}/dashboard/transactions`;

    // Create pending transaction
    const { data: tx, error: txErr } = await adminClient
      .from('transactions')
      .insert({
        user_id: userId,
        type: 'deposit',
        amount: safeAmount,
        balance_after: 0,
        status: 'pending',
        description: `Пополнение через ЮKassa${isTestMode ? ' (ТЕСТ)' : ''}`,
      })
      .select()
      .single();

    if (txErr) {
      return json({ error: 'Failed to create transaction' }, 500);
    }

    // Create YooKassa payment
    const idempotenceKey = `deposit_${tx.id}`;
    const yooResponse = await fetch('https://api.yookassa.ru/v3/payments', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Basic ' + btoa(`${shopId}:${secretKey}`),
        'Idempotence-Key': idempotenceKey,
      },
      body: JSON.stringify({
        amount: {
          value: safeAmount.toFixed(2),
          currency: 'RUB',
        },
        capture: true,
        confirmation: {
          type: 'redirect',
          return_url: returnUrl,
        },
        description: `Пополнение баланса — ${safeAmount} ₽${isTestMode ? ' (тест)' : ''}`,
        metadata: {
          transaction_id: tx.id,
          user_id: userId,
        },
        receipt: userEmail ? {
          customer: { email: userEmail },
          items: [{
            description: `Пополнение баланса`,
            quantity: '1',
            amount: { value: safeAmount.toFixed(2), currency: 'RUB' },
            vat_code: 1,
          }],
        } : undefined,
      }),
    });

    const yooData = await yooResponse.json();

    if (!yooResponse.ok) {
      await adminClient.from('transactions').update({ status: 'cancelled' }).eq('id', tx.id);
      console.error('YooKassa error:', JSON.stringify(yooData));
      return json({ error: yooData.description || 'Ошибка создания платежа' }, 500);
    }

    await adminClient.from('transactions').update({
      description: `Пополнение через ЮKassa (${yooData.id})${isTestMode ? ' — ТЕСТ' : ''}`,
    }).eq('id', tx.id);

    return json({
      payment_id: yooData.id,
      confirmation_url: yooData.confirmation?.confirmation_url,
      transaction_id: tx.id,
      amount: safeAmount,
      test_mode: isTestMode,
    });
  } catch (error: unknown) {
    console.error('Create payment error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
