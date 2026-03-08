import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { 'Content-Type': 'application/json' } });

serve(async (req) => {
  if (req.method !== 'POST') {
    return json({ error: 'Method not allowed' }, 405);
  }

  try {
    const body = await req.json();
    const event = body.event;
    const paymentObj = body.object;

    if (!paymentObj || !event) {
      return json({ error: 'Invalid payload' }, 400);
    }

    // Only process successful payments
    if (event !== 'payment.succeeded') {
      console.log(`Ignoring event: ${event}`);
      return json({ ok: true });
    }

    const paymentId = paymentObj.id;
    const amount = Number(paymentObj.amount?.value || 0);
    const metadata = paymentObj.metadata || {};
    const transactionId = metadata.transaction_id;
    const userId = metadata.user_id;

    if (!transactionId || !userId || amount <= 0) {
      console.error('Missing metadata or invalid amount:', { transactionId, userId, amount });
      return json({ error: 'Invalid metadata' }, 400);
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if transaction already processed (idempotency)
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

    // Update transaction status
    await adminClient.from('transactions').update({
      status: 'completed',
      balance_after: newBalance,
      description: `Пополнение через ЮKassa (${paymentId}) — ${amount} ₽`,
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
      },
    });

    console.log(`Payment ${paymentId} processed: +${amount}₽ for user ${userId}, new balance: ${newBalance}`);
    return json({ ok: true, new_balance: newBalance });
  } catch (error: unknown) {
    console.error('Webhook error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
