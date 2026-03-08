import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

// YooKassa IP ranges (official docs 2026)
const YOOKASSA_IP_RANGES = [
  '185.71.76.', '185.71.77.',  // 185.71.76.0/27, 185.71.77.0/27
  '77.75.153.', '77.75.156.',  // 77.75.153.0/25, 77.75.156.x
];

function isYooKassaIP(ip: string): boolean {
  if (!ip) return false;
  const cleanIP = ip.split(',')[0].trim();
  if (cleanIP === '127.0.0.1' || cleanIP === '::1') return true;
  return YOOKASSA_IP_RANGES.some(prefix => cleanIP.startsWith(prefix));
}

serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    // IP validation
    const clientIP = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
    if (!isYooKassaIP(clientIP)) {
      console.warn(`Webhook from untrusted IP: ${clientIP}`);
    }

    const body = await req.json();
    const event = body.event;
    const paymentObj = body.object;

    if (!paymentObj || !event) {
      return json({ error: 'Invalid payload' }, 400);
    }

    if (event !== 'payment.succeeded') {
      console.log(`Ignoring event: ${event}`);
      return json({ ok: true });
    }

    const webhookPaymentId = paymentObj.id;
    if (!webhookPaymentId) {
      return json({ error: 'Missing payment ID' }, 400);
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Read credentials from app_settings (same source as admin UI)
    const { data: credSettings } = await adminClient
      .from('app_settings')
      .select('key, value')
      .in('key', [
        'yookassa_test_mode',
        'yookassa_test_shop_id', 'yookassa_test_secret_key',
        'yookassa_shop_id', 'yookassa_secret_key',
      ]);

    const settingsMap: Record<string, string> = {};
    (credSettings || []).forEach((r: any) => { settingsMap[r.key] = r.value; });

    const isTestMode = settingsMap.yookassa_test_mode === 'true';
    const shopId = isTestMode
      ? (settingsMap.yookassa_test_shop_id || Deno.env.get('YOOKASSA_TEST_SHOP_ID') || '')
      : (settingsMap.yookassa_shop_id || Deno.env.get('YOOKASSA_SHOP_ID') || '');
    const secretKey = isTestMode
      ? (settingsMap.yookassa_test_secret_key || Deno.env.get('YOOKASSA_TEST_SECRET_KEY') || '')
      : (settingsMap.yookassa_secret_key || Deno.env.get('YOOKASSA_SECRET_KEY') || '');

    

    if (!shopId || !secretKey) {
      console.error(`YooKassa credentials not configured (test_mode=${isTestMode})`);
      return json({ error: 'Payment system not configured' }, 500);
    }

    // Verify payment with YooKassa API
    const verifyRes = await fetch(`https://api.yookassa.ru/v3/payments/${webhookPaymentId}`, {
      headers: {
        'Authorization': 'Basic ' + btoa(`${shopId}:${secretKey}`),
      },
    });

    if (!verifyRes.ok) {
      const errText = await verifyRes.text();
      console.error('YooKassa verify failed:', verifyRes.status, errText);
      return json({ error: 'Payment verification failed' }, 400);
    }

    const verifiedPayment = await verifyRes.json();

    if (verifiedPayment.status !== 'succeeded') {
      console.log(`Payment ${webhookPaymentId} not succeeded (status: ${verifiedPayment.status}), ignoring`);
      return json({ ok: true, status: verifiedPayment.status });
    }

    const paymentId = verifiedPayment.id;
    const amount = Number(verifiedPayment.amount?.value || 0);
    const metadata = verifiedPayment.metadata || {};
    const transactionId = metadata.transaction_id;
    const userId = metadata.user_id;

    if (!transactionId || !userId || amount <= 0) {
      console.error('Missing metadata or invalid amount in verified payment:', { transactionId, userId, amount });
      return json({ error: 'Invalid metadata' }, 400);
    }

    // Idempotency check
    const { data: existingTx } = await adminClient
      .from('transactions')
      .select('id, status')
      .eq('id', transactionId)
      .single();

    if (!existingTx) {
      console.error('Transaction not found:', transactionId);
      return json({ error: 'Transaction not found' }, 404);
    }

    if (existingTx.status === 'completed') {
      console.log('Transaction already completed:', transactionId);
      return json({ ok: true, already_processed: true });
    }

    // Credit balance atomically
    const { data: newBalance, error: creditErr } = await adminClient.rpc('credit_balance', {
      p_user_id: userId,
      p_amount: amount,
    });

    if (creditErr || newBalance === -1) {
      console.error('Credit balance failed:', creditErr);
      return json({ error: 'Failed to credit balance' }, 500);
    }

    // Update transaction
    await adminClient.from('transactions').update({
      status: 'completed',
      balance_after: newBalance,
      description: `Пополнение через ЮKassa (${paymentId}) — ${amount} ₽${isTestMode ? ' (ТЕСТ)' : ''}`,
    }).eq('id', transactionId);

    // Audit log
    await adminClient.from('admin_audit_logs').insert({
      actor_id: userId,
      action: 'deposit_completed',
      target_type: 'transaction',
      target_id: transactionId,
      details: {
        payment_id: paymentId,
        amount,
        new_balance: newBalance,
        provider: 'yookassa',
        test_mode: isTestMode,
        source_ip: clientIP,
      },
    });

    console.log(`Payment ${paymentId} processed: +${amount}₽ for user ${userId}, new balance: ${newBalance}${isTestMode ? ' (TEST)' : ''}`);
    return json({ ok: true, new_balance: newBalance });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
