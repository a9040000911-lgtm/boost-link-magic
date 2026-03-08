import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

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

  try {
    const { order_id, reason } = await req.json();

    if (!order_id || typeof order_id !== 'string') {
      return json({ error: 'order_id is required' }, 400);
    }

    // UUID format validation
    if (!/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(order_id)) {
      return json({ error: 'Invalid order_id format' }, 400);
    }

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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }

    const actorId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check role
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', actorId)
      .in('role', ['admin', 'moderator']);

    if (!roleData || roleData.length === 0) {
      return json({ error: 'Access denied' }, 403);
    }

    const isAdmin = roleData.some(r => r.role === 'admin');

    // Moderator permission check
    if (!isAdmin) {
      const { data: permData } = await adminClient
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', actorId)
        .eq('permission', 'process_refunds')
        .single();

      if (!permData) {
        return json({ error: 'No refund permission' }, 403);
      }
    }

    // Get order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return json({ error: 'Order not found' }, 404);
    }

    // === DOUBLE REFUND PROTECTION ===
    if (order.refund_status === 'refunded') {
      await adminClient.from('admin_audit_logs').insert({
        actor_id: actorId,
        action: 'double_refund_attempt',
        target_type: 'order',
        target_id: order_id,
        details: { reason, order_price: order.price, already_refunded: order.refunded_amount },
      });

      // Create financial alert for suspicious activity
      await adminClient.from('financial_alerts').insert({
        alert_type: 'double_refund_attempt',
        severity: 'high',
        user_id: order.user_id,
        actor_id: actorId,
        details: { order_id, order_price: order.price, reason },
      });

      return json({ error: 'Order already refunded', refunded_at: order.refunded_at }, 409);
    }

    // 30-day limit for moderators
    const orderDate = new Date(order.created_at);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder > 30 && !isAdmin) {
      return json({ error: 'Refund period expired (30 days). Admin required.' }, 403);
    }

    const refundAmount = Number(order.price);

    // === PREVENT REFUND OF 0 AMOUNT ===
    if (refundAmount <= 0) {
      return json({ error: 'Cannot refund zero-amount order' }, 400);
    }

    // === LARGE REFUND ALERT ===
    if (refundAmount > 5000) {
      await adminClient.from('financial_alerts').insert({
        alert_type: 'large_refund',
        severity: 'medium',
        user_id: order.user_id,
        actor_id: actorId,
        details: { order_id, amount: refundAmount, reason, service_name: order.service_name },
      });
    }

    // === ATOMICALLY mark order as refunded FIRST (prevents double refund race) ===
    const now = new Date().toISOString();
    const { data: updatedOrder, error: updateErr } = await adminClient
      .from('orders')
      .update({
        refund_status: 'refunded',
        refunded_amount: refundAmount,
        refunded_at: now,
        refunded_by: actorId,
        status: 'refunded',
      })
      .eq('id', order_id)
      .neq('refund_status', 'refunded') // THIS prevents race condition
      .select()
      .single();

    if (updateErr || !updatedOrder) {
      // Another concurrent request already refunded
      return json({ error: 'Order was already refunded by another request' }, 409);
    }

    // === ATOMIC BALANCE CREDIT ===
    const { data: newBalance, error: creditErr } = await adminClient.rpc('credit_balance', {
      p_user_id: order.user_id,
      p_amount: refundAmount,
    });

    if (creditErr || newBalance === -1) {
      // Rollback the order status
      await adminClient.from('orders').update({
        refund_status: null,
        refunded_amount: 0,
        refunded_at: null,
        refunded_by: null,
        status: order.status,
      }).eq('id', order_id);
      return json({ error: 'Failed to credit balance' }, 500);
    }

    // Transaction record
    await adminClient.from('transactions').insert({
      user_id: order.user_id,
      type: 'refund',
      amount: refundAmount,
      balance_after: newBalance,
      order_id: order_id,
      status: 'completed',
      description: `Возврат за заказ #${order_id.slice(0, 8)}${reason ? ': ' + reason : ''}`,
    });

    // Audit
    await adminClient.from('admin_audit_logs').insert({
      actor_id: actorId,
      action: 'refund_order',
      target_type: 'order',
      target_id: order_id,
      details: {
        amount: refundAmount,
        user_id: order.user_id,
        reason: reason || null,
        order_status: order.status,
        service_name: order.service_name,
        new_balance: newBalance,
      },
    });

    // === STAFF FRAUD DETECTION: Check if actor refunds same user too often ===
    const { data: recentRefunds } = await adminClient
      .from('admin_audit_logs')
      .select('id')
      .eq('actor_id', actorId)
      .eq('action', 'refund_order')
      .gte('created_at', new Date(Date.now() - 3600000).toISOString()); // Last hour

    if (recentRefunds && recentRefunds.length > 10) {
      await adminClient.from('financial_alerts').insert({
        alert_type: 'excessive_refunds_by_staff',
        severity: 'critical',
        actor_id: actorId,
        details: {
          refund_count_last_hour: recentRefunds.length,
          latest_order_id: order_id,
          latest_amount: refundAmount,
        },
      });
    }

    return json({
      success: true,
      refund_amount: refundAmount,
      new_balance: newBalance,
    });

  } catch (error: unknown) {
    console.error('Refund error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
