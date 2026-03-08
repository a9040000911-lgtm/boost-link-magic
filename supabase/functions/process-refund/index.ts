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
    const { order_id, reason } = await req.json();

    if (!order_id) {
      return new Response(JSON.stringify({ error: 'order_id is required' }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Auth check
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
    const { data: claimsData, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claimsData?.claims) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const actorId = claimsData.claims.sub;

    // Use admin client for privileged operations
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if actor is admin or moderator with refund permission
    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', actorId)
      .in('role', ['admin', 'moderator']);

    if (!roleData || roleData.length === 0) {
      return new Response(JSON.stringify({ error: 'Access denied' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const isAdmin = roleData.some(r => r.role === 'admin');

    // If moderator, check refund permission
    if (!isAdmin) {
      const { data: permData } = await adminClient
        .from('staff_permissions')
        .select('permission')
        .eq('user_id', actorId)
        .eq('permission', 'process_refunds')
        .single();

      if (!permData) {
        return new Response(JSON.stringify({ error: 'No refund permission' }), {
          status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
        });
      }
    }

    // Get the order
    const { data: order, error: orderError } = await adminClient
      .from('orders')
      .select('*')
      .eq('id', order_id)
      .single();

    if (orderError || !order) {
      return new Response(JSON.stringify({ error: 'Order not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Double refund protection
    if (order.refund_status === 'refunded') {
      // Log the attempt
      await adminClient.from('admin_audit_logs').insert({
        actor_id: actorId,
        action: 'double_refund_attempt',
        target_type: 'order',
        target_id: order_id,
        details: { reason, order_price: order.price, already_refunded: order.refunded_amount },
      });

      return new Response(JSON.stringify({ error: 'Order already refunded', refunded_at: order.refunded_at }), {
        status: 409, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // SECURITY: Check order isn't too old (optional: 30 day limit)
    const orderDate = new Date(order.created_at);
    const daysSinceOrder = (Date.now() - orderDate.getTime()) / (1000 * 60 * 60 * 24);
    if (daysSinceOrder > 30 && !isAdmin) {
      return new Response(JSON.stringify({ error: 'Refund period expired (30 days). Admin required.' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const refundAmount = Number(order.price);

    // Get user's current balance
    const { data: profile } = await adminClient
      .from('profiles')
      .select('balance')
      .eq('id', order.user_id)
      .single();

    if (!profile) {
      return new Response(JSON.stringify({ error: 'User profile not found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const newBalance = Number(profile.balance) + refundAmount;

    // Execute refund atomically-ish (update order, update balance, create transaction)
    const now = new Date().toISOString();

    // 1. Mark order as refunded
    await adminClient.from('orders').update({
      refund_status: 'refunded',
      refunded_amount: refundAmount,
      refunded_at: now,
      refunded_by: actorId,
      status: 'refunded',
    }).eq('id', order_id);

    // 2. Credit user balance
    await adminClient.from('profiles').update({
      balance: newBalance,
    }).eq('id', order.user_id);

    // 3. Create refund transaction
    await adminClient.from('transactions').insert({
      user_id: order.user_id,
      type: 'refund',
      amount: refundAmount,
      balance_after: newBalance,
      order_id: order_id,
      status: 'completed',
      description: `Возврат за заказ #${order_id.slice(0, 8)}${reason ? ': ' + reason : ''}`,
    });

    // 4. Audit log
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
      },
    });

    return new Response(JSON.stringify({
      success: true,
      refund_amount: refundAmount,
      new_balance: newBalance,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error: unknown) {
    console.error('Refund error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
