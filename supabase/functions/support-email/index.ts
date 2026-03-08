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

async function sendEmail(smtp: { host: string; port: number; user: string; password: string; fromName: string; fromEmail: string }, to: string, subject: string, body: string) {
  // Use Deno's built-in SMTP or a simple SMTP implementation
  // For now, we'll use the existing send-email function pattern
  const encoder = new TextEncoder();
  
  const conn = await Deno.connectTls({
    hostname: smtp.host,
    port: smtp.port,
  }).catch(async () => {
    // Fallback: connect plain then STARTTLS
    const plainConn = await Deno.connect({ hostname: smtp.host, port: smtp.port });
    return plainConn;
  });

  // Simple SMTP dialog
  const reader = conn.readable.getReader();
  const writer = conn.writable.getWriter();

  async function readLine(): Promise<string> {
    const { value } = await reader.read();
    return new TextDecoder().decode(value);
  }

  async function writeLine(line: string) {
    await writer.write(encoder.encode(line + "\r\n"));
  }

  try {
    await readLine(); // greeting
    await writeLine(`EHLO localhost`);
    await readLine();
    
    // AUTH LOGIN
    await writeLine(`AUTH LOGIN`);
    await readLine();
    await writeLine(btoa(smtp.user));
    await readLine();
    await writeLine(btoa(smtp.password));
    await readLine();

    await writeLine(`MAIL FROM:<${smtp.fromEmail}>`);
    await readLine();
    await writeLine(`RCPT TO:<${to}>`);
    await readLine();
    await writeLine(`DATA`);
    await readLine();

    const message = [
      `From: ${smtp.fromName} <${smtp.fromEmail}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: text/html; charset=utf-8`,
      ``,
      body,
      `.`,
    ].join("\r\n");

    await writer.write(encoder.encode(message + "\r\n"));
    await readLine();
    await writeLine(`QUIT`);
  } finally {
    try { conn.close(); } catch {}
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

    const settings = await getSettings(supabase, [
      'support_email_address', 'support_smtp_host', 'support_smtp_port',
      'support_smtp_user', 'support_smtp_password', 'support_email_from_name'
    ]);

    // === INBOUND: Process incoming email (from webhook) ===
    if (action === "inbound") {
      const { from, subject, text, html } = body;
      
      if (!from) return json({ error: "from required" }, 400);

      // Find existing ticket by email
      const emailSubject = `Email: ${from}`;
      const { data: existing } = await supabase
        .from("support_tickets")
        .select("id")
        .eq("channel", "email")
        .like("subject", `%${from}%`)
        .neq("status", "closed")
        .limit(1);

      let ticketId: string;

      if (existing && existing.length > 0) {
        ticketId = existing[0].id;
        await supabase.from("support_tickets").update({
          status: "open",
          auto_close_at: null,
          updated_at: new Date().toISOString(),
        }).eq("id", ticketId);
      } else {
        const { data: newTicket, error } = await supabase
          .from("support_tickets")
          .insert({
            subject: `📧 ${subject || 'Без темы'} (${from})`,
            user_id: "00000000-0000-0000-0000-000000000000",
            channel: "email",
            priority: "normal",
          })
          .select("id")
          .single();

        if (error) {
          console.error("Failed to create email ticket:", error);
          return json({ error: error.message }, 500);
        }
        ticketId = newTicket.id;
      }

      await supabase.from("support_messages").insert({
        ticket_id: ticketId,
        user_id: "00000000-0000-0000-0000-000000000000",
        message: text || html || "(пустое сообщение)",
        is_admin: false,
      });

      return json({ ok: true, ticket_id: ticketId });
    }

    // === REPLY: Send email reply from admin ===
    if (action === "reply") {
      const { to, subject, text } = body;
      
      if (!to || !text) return json({ error: "to and text required" }, 400);

      const smtpHost = settings.support_smtp_host;
      const smtpPort = parseInt(settings.support_smtp_port || "587");
      const smtpUser = settings.support_smtp_user;
      const smtpPassword = settings.support_smtp_password;
      const fromName = settings.support_email_from_name || "Support";
      const fromEmail = settings.support_email_address || smtpUser;

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return json({ error: "SMTP not configured" }, 500);
      }

      const htmlBody = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <div style="background: #f8f9fa; padding: 20px; border-radius: 8px;">
            <h3 style="margin: 0 0 10px;">💬 Ответ поддержки</h3>
            <p style="white-space: pre-wrap;">${text.replace(/</g, '&lt;').replace(/>/g, '&gt;')}</p>
          </div>
          <p style="color: #999; font-size: 12px; margin-top: 20px;">
            Ответьте на это письмо, чтобы продолжить диалог.
          </p>
        </div>
      `;

      try {
        await sendEmail(
          { host: smtpHost, port: smtpPort, user: smtpUser, password: smtpPassword, fromName, fromEmail },
          to,
          subject || "Ответ поддержки",
          htmlBody
        );
        return json({ success: true });
      } catch (err) {
        console.error("Email send error:", err);
        return json({ error: `Failed to send email: ${err}` }, 500);
      }
    }

    // === TEST: Test SMTP connection ===
    if (action === "test") {
      const { to } = body;
      const smtpHost = settings.support_smtp_host;
      const smtpUser = settings.support_smtp_user;
      const smtpPassword = settings.support_smtp_password;
      const smtpPort = parseInt(settings.support_smtp_port || "587");

      if (!smtpHost || !smtpUser || !smtpPassword) {
        return json({ error: "SMTP not configured in settings" }, 400);
      }

      try {
        await sendEmail(
          { host: smtpHost, port: smtpPort, user: smtpUser, password: smtpPassword, fromName: "Test", fromEmail: smtpUser },
          to || smtpUser,
          "Тест почты поддержки",
          "<p>✅ Если вы видите это письмо — почта поддержки настроена правильно.</p>"
        );
        return json({ success: true, message: "Test email sent" });
      } catch (err) {
        return json({ error: `SMTP test failed: ${err}` }, 500);
      }
    }

    return json({ error: "Unknown action" }, 400);
  } catch (error) {
    console.error("Email support error:", error);
    return json({ error: String(error) }, 500);
  }
});
