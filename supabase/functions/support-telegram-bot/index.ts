import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const json = (body: object, status = 200) =>
  new Response(JSON.stringify(body), { status, headers: { ...corsHeaders, 'Content-Type': 'application/json' } });

async function getSettings(supabase: any, keys: string[]): Promise<Record<string, string>> {
  const { data } = await supabase.from('app_settings').select('key, value').in('key', keys);
  const map: Record<string, string> = {};
  (data || []).forEach((r: any) => { map[r.key] = r.value; });
  return map;
}

async function tgSend(token: string, chatId: string | number, text: string, parseMode = "HTML") {
  const res = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text, parse_mode: parseMode }),
  });
  return res.json();
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
  const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

  try {
    const body = await req.json();
    const { action } = body;

    // Get bot token - prefer dedicated support bot, fall back to main bot
    const settings = await getSettings(supabase, [
      'support_bot_token', 'support_bot_welcome', 'support_bot_confirm'
    ]);
    const BOT_TOKEN = settings.support_bot_token || Deno.env.get("TELEGRAM_BOT_TOKEN");
    const ADMIN_CHAT_ID = Deno.env.get("TELEGRAM_ADMIN_CHAT_ID");

    if (!BOT_TOKEN) {
      return json({ error: "Support bot token not configured" }, 500);
    }

    // === WEBHOOK: incoming Telegram update ===
    if (action === "webhook") {
      const update = body.update;
      if (!update?.message) return json({ ok: true });

      const chatId = update.message.chat.id;
      const text = update.message.text || "";
      const firstName = update.message.from?.first_name || "User";
      const username = update.message.from?.username || "";

      // Handle /start command
      if (text === "/start") {
        const welcome = settings.support_bot_welcome || 
          "👋 Здравствуйте! Опишите вашу проблему, и мы ответим в ближайшее время.";
        await tgSend(BOT_TOKEN, chatId, welcome);
        return json({ ok: true });
      }

      // Find or create ticket for this chat_id
      const ticketSubject = `TG: ${firstName}${username ? ` @${username}` : ''} (${chatId})`;

      const { data: existingTickets } = await supabase
        .from("support_tickets")
        .select("id, status")
        .eq("channel", "telegram")
        .like("subject", `%${chatId}%`)
        .neq("status", "closed")
        .limit(1);

      let ticketId: string;
      let isNewTicket = false;

      if (existingTickets && existingTickets.length > 0) {
        ticketId = existingTickets[0].id;
        // Update ticket status to open if it was waiting
        if (existingTickets[0].status === "waiting_reply") {
          await supabase.from("support_tickets").update({
            status: "open",
            auto_close_at: null,
            updated_at: new Date().toISOString(),
          }).eq("id", ticketId);
        }
      } else {
        // Create new ticket with system user
        const { data: newTicket, error } = await supabase
          .from("support_tickets")
          .insert({
            subject: ticketSubject,
            user_id: "00000000-0000-0000-0000-000000000000",
            channel: "telegram",
            priority: "normal",
          })
          .select("id")
          .single();

        if (error) {
          console.error("Failed to create ticket:", error);
          await tgSend(BOT_TOKEN, chatId, "⚠️ Произошла ошибка. Попробуйте позже.");
          return json({ ok: false });
        }
        ticketId = newTicket.id;
        isNewTicket = true;
      }

      // Add message
      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        user_id: "00000000-0000-0000-0000-000000000000",
        message: text,
        is_admin: false,
      });

      // Handle file attachments
      if (update.message.photo || update.message.document || update.message.voice || update.message.video) {
        let fileId = "";
        let attachType = "file";
        let fileName = "attachment";

        if (update.message.photo) {
          const photo = update.message.photo[update.message.photo.length - 1];
          fileId = photo.file_id;
          attachType = "image/jpeg";
          fileName = "photo.jpg";
        } else if (update.message.document) {
          fileId = update.message.document.file_id;
          fileName = update.message.document.file_name || "document";
          attachType = update.message.document.mime_type || "application/octet-stream";
        } else if (update.message.voice) {
          fileId = update.message.voice.file_id;
          attachType = "audio/ogg";
          fileName = "voice.ogg";
        } else if (update.message.video) {
          fileId = update.message.video.file_id;
          attachType = "video/mp4";
          fileName = "video.mp4";
        }

        if (fileId) {
          // Get file URL from Telegram
          const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          if (fileData.ok) {
            const filePath = fileData.result.file_path;
            const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

            // Download and upload to storage
            const fileResponse = await fetch(fileUrl);
            const fileBlob = await fileResponse.blob();
            const storagePath = `telegram/${ticketId}/${Date.now()}_${fileName}`;
            
            await supabase.storage.from("support-attachments").upload(storagePath, fileBlob, {
              contentType: attachType,
            });
            
            const { data: urlData } = supabase.storage.from("support-attachments").getPublicUrl(storagePath);

            await supabase.from("support_messages").insert({
              ticket_id: ticketId,
              user_id: "00000000-0000-0000-0000-000000000000",
              message: update.message.caption || `📎 ${fileName}`,
              is_admin: false,
              attachment_url: urlData.publicUrl,
              attachment_type: attachType,
              attachment_name: fileName,
            });
          }
        }
      }

      // Confirm to user
      const confirmMsg = settings.support_bot_confirm || "✅ Ваше сообщение получено! Мы ответим в ближайшее время.";
      if (isNewTicket) {
        await tgSend(BOT_TOKEN, chatId, confirmMsg);
      }

      // Notify admin chat
      if (ADMIN_CHAT_ID) {
        const emoji = isNewTicket ? "🆕" : "📩";
        await tgSend(BOT_TOKEN, ADMIN_CHAT_ID,
          `${emoji} <b>${firstName}</b>${username ? ` (@${username})` : ''}:\n\n${text || '📎 Файл'}`
        );
      }

      return json({ ok: true });
    }

    // === REPLY: admin sends reply to telegram user ===
    if (action === "reply") {
      const { chat_id, text: replyText } = body;
      if (!chat_id || !replyText) return json({ error: "chat_id and text required" }, 400);
      
      const result = await tgSend(BOT_TOKEN, chat_id, `💬 Ответ поддержки:\n\n${replyText}`);
      return json({ success: result.ok });
    }

    // === SET WEBHOOK: register webhook URL with Telegram ===
    if (action === "set_webhook") {
      const { url } = body;
      if (!url) return json({ error: "url required" }, 400);
      
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/setWebhook`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url }),
      });
      const data = await res.json();
      return json(data);
    }

    // === GET BOT INFO ===
    if (action === "bot_info") {
      const res = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getMe`);
      const data = await res.json();
      return json(data);
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Support bot error:", error);
    return json({ error: String(error) }, 500);
  }
});
