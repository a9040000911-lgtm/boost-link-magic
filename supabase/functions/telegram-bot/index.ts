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

  const TELEGRAM_BOT_TOKEN = Deno.env.get("TELEGRAM_BOT_TOKEN");
  const TELEGRAM_ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");
  const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

  if (!TELEGRAM_BOT_TOKEN || !TELEGRAM_ADMIN_CHAT_ID) {
    return new Response(JSON.stringify({ error: "Telegram not configured" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const body = await req.json();
    const { action } = body;

    // Action: send notification to admin
    if (action === "notify") {
      const { text, parse_mode } = body;
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id: TELEGRAM_ADMIN_CHAT_ID,
          text,
          parse_mode: parse_mode || "HTML",
        }),
      });
      const tgData = await tgRes.json();
      return new Response(JSON.stringify({ success: tgData.ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: handle Telegram webhook (incoming messages from users)
    if (action === "webhook") {
      const update = body.update;
      if (!update?.message?.text) {
        return new Response(JSON.stringify({ ok: true }), {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const chatId = update.message.chat.id;
      const text = update.message.text;
      const firstName = update.message.from?.first_name || "Telegram User";

      // Create support ticket from Telegram
      if (SUPABASE_URL && SUPABASE_SERVICE_ROLE_KEY) {
        const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

        // Check for existing open ticket from this chat
        const { data: existingTickets } = await supabase
          .from("support_tickets")
          .select("id")
          .eq("channel", "telegram")
          .eq("subject", `TG: ${firstName} (${chatId})`)
          .neq("status", "closed")
          .limit(1);

        let ticketId: string;

        if (existingTickets && existingTickets.length > 0) {
          ticketId = existingTickets[0].id;
        } else {
          // Create new ticket - use a system user ID for telegram tickets
          const { data: newTicket, error } = await supabase
            .from("support_tickets")
            .insert({
              subject: `TG: ${firstName} (${chatId})`,
              user_id: "00000000-0000-0000-0000-000000000000", // system placeholder
              channel: "telegram",
              priority: "normal",
            })
            .select("id")
            .single();

          if (error) {
            console.error("Failed to create ticket:", error);
            // Reply to user
            await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                chat_id: chatId,
                text: "⚠️ Произошла ошибка. Попробуйте позже.",
              }),
            });
            return new Response(JSON.stringify({ ok: false }), {
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            });
          }
          ticketId = newTicket.id;
        }

        // Add message to ticket
        await supabase.from("support_messages").insert({
          ticket_id: ticketId,
          user_id: "00000000-0000-0000-0000-000000000000",
          message: text,
          is_admin: false,
        });

        // Notify admin
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: TELEGRAM_ADMIN_CHAT_ID,
            text: `📩 Новое сообщение от <b>${firstName}</b>:\n\n${text}`,
            parse_mode: "HTML",
          }),
        });

        // Confirm to user
        await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            chat_id: chatId,
            text: "✅ Ваше сообщение получено! Мы ответим в ближайшее время.",
          }),
        });
      }

      return new Response(JSON.stringify({ ok: true }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Action: reply to telegram user from admin
    if (action === "reply") {
      const { chat_id, text } = body;
      const tgRes = await fetch(`https://api.telegram.org/bot${TELEGRAM_BOT_TOKEN}/sendMessage`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          chat_id,
          text,
        }),
      });
      const tgData = await tgRes.json();
      return new Response(JSON.stringify({ success: tgData.ok }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ error: "Unknown action" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Telegram bot error:", error);
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
