import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find tickets where auto_close_at has passed and status is waiting_reply
    const now = new Date().toISOString();

    const { data: expiredTickets, error } = await adminClient
      .from('support_tickets')
      .select('id, user_id, subject')
      .eq('status', 'waiting_reply')
      .not('auto_close_at', 'is', null)
      .lte('auto_close_at', now);

    if (error) throw error;

    const closedIds: string[] = [];

    for (const ticket of (expiredTickets || [])) {
      // Close the ticket
      await adminClient.from('support_tickets').update({
        status: 'closed',
        auto_closed: true,
        updated_at: now,
      }).eq('id', ticket.id);

      // Add auto-close system message
      await adminClient.from('support_messages').insert({
        ticket_id: ticket.id,
        user_id: '00000000-0000-0000-0000-000000000000',
        message: '🔒 Тикет автоматически закрыт — клиент не ответил в течение 24 часов. Клиент может переоткрыть тикет в течение 48 часов.',
        is_admin: true,
      });

      closedIds.push(ticket.id);
    }

    // Send notification if tickets were closed
    if (closedIds.length > 0) {
      try {
        await fetch(`${Deno.env.get('SUPABASE_URL')}/functions/v1/telegram-bot`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${Deno.env.get('SUPABASE_ANON_KEY')}`,
          },
          body: JSON.stringify({
            action: 'notify',
            text: `🔒 Автозакрытие: ${closedIds.length} тикетов закрыто по таймеру`,
          }),
        });
      } catch (e) {
        // Non-critical
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      closed: closedIds.length,
      ticket_ids: closedIds,
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Auto-close error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
