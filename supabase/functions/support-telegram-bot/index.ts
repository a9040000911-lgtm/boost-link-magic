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

// Try AI auto-reply if enabled
async function tryAIAutoReply(
  supabase: any,
  ticketId: string,
  userMessage: string,
  ticketSubject: string,
): Promise<{ replied: boolean; answer?: string }> {
  try {
    const settings = await getSettings(supabase, [
      'support_ai_enabled', 'support_ai_mode',
    ]);

    if (settings.support_ai_enabled !== "true" || settings.support_ai_mode !== "auto") {
      return { replied: false };
    }

    // Load recent messages for context
    const { data: recentMessages } = await supabase
      .from("support_messages")
      .select("message, is_admin")
      .eq("ticket_id", ticketId)
      .order("created_at", { ascending: true })
      .limit(20);

    const messages = (recentMessages || []).map((m: any) => ({
      message: m.message,
      is_admin: m.is_admin,
    }));

    // Call AI suggest function internally
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const aiResponse = await fetch(`${SUPABASE_URL}/functions/v1/support-ai-suggest`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
      },
      body: JSON.stringify({
        _internal: true,
        messages,
        ticket_subject: ticketSubject,
        channel: "telegram",
        mode: "auto",
      }),
    });

    if (!aiResponse.ok) return { replied: false };

    const aiData = await aiResponse.json();

    if (aiData.should_auto_reply && aiData.answer) {
      // Save AI response as admin message
      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        user_id: "00000000-0000-0000-0000-000000000000",
        message: `🤖 ${aiData.answer}`,
        is_admin: true,
      });

      return { replied: true, answer: aiData.answer };
    }

    return { replied: false };
  } catch (e) {
    console.error("AI auto-reply error:", e);
    return { replied: false };
  }
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
        if (existingTickets[0].status === "waiting_reply") {
          await supabase.from("support_tickets").update({
            status: "open",
            auto_close_at: null,
            updated_at: new Date().toISOString(),
          }).eq("id", ticketId);
        }
      } else {
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
          const fileRes = await fetch(`https://api.telegram.org/bot${BOT_TOKEN}/getFile?file_id=${fileId}`);
          const fileData = await fileRes.json();
          if (fileData.ok) {
            const filePath = fileData.result.file_path;
            const fileUrl = `https://api.telegram.org/file/bot${BOT_TOKEN}/${filePath}`;

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

      // Try AI auto-reply
      if (text && text.length > 3) {
        const aiResult = await tryAIAutoReply(supabase, ticketId, text, ticketSubject);
        if (aiResult.replied && aiResult.answer) {
          // Send AI answer to user in Telegram
          await tgSend(BOT_TOKEN, chatId, `💬 ${aiResult.answer}`);

          // Update ticket to waiting_reply (AI answered)
          await supabase.from("support_tickets").update({
            status: "waiting_reply",
            last_admin_reply_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
          }).eq("id", ticketId);

          // Notify admin about auto-reply
          if (ADMIN_CHAT_ID) {
            await tgSend(BOT_TOKEN, ADMIN_CHAT_ID,
              `🤖 Авто-ответ для <b>${firstName}</b>:\n\nВопрос: ${text}\nОтвет: ${aiResult.answer}`
            );
          }

          return json({ ok: true, ai_replied: true });
        }
      }

      // No AI auto-reply — standard flow
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

    // === SET WEBHOOK ===
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
