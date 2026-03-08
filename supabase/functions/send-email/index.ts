import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { to, subject, html, text } = await req.json();

    const SMTP_HOST = Deno.env.get("SMTP_HOST");
    const SMTP_PORT = Deno.env.get("SMTP_PORT");
    const SMTP_USER = Deno.env.get("SMTP_USER");
    const SMTP_PASSWORD = Deno.env.get("SMTP_PASSWORD");

    if (!SMTP_HOST || !SMTP_USER || !SMTP_PASSWORD) {
      throw new Error("SMTP credentials not configured");
    }

    // Use Deno SMTP via fetch to Yandex SMTP API
    // Since Deno edge functions can't do raw SMTP, we use a simple HTTP-based approach
    // For Yandex, we'll use their SMTP relay through a base64 encoded auth
    
    const port = parseInt(SMTP_PORT || "465");
    
    // Connect via Deno's built-in TLS
    const conn = await Deno.connectTls({
      hostname: SMTP_HOST,
      port: port,
    });

    const encoder = new TextEncoder();
    const decoder = new TextDecoder();
    
    const read = async () => {
      const buf = new Uint8Array(4096);
      const n = await conn.read(buf);
      return n ? decoder.decode(buf.subarray(0, n)) : "";
    };

    const write = async (cmd: string) => {
      await conn.write(encoder.encode(cmd + "\r\n"));
      return await read();
    };

    // SMTP handshake
    await read(); // greeting
    await write(`EHLO lovable.dev`);
    
    // AUTH LOGIN
    await write("AUTH LOGIN");
    await write(btoa(SMTP_USER));
    await write(btoa(SMTP_PASSWORD));

    // MAIL FROM
    await write(`MAIL FROM:<${SMTP_USER}>`);
    await write(`RCPT TO:<${to}>`);
    await write("DATA");
    
    const boundary = `boundary_${Date.now()}`;
    const emailContent = [
      `From: VexBoost Support <${SMTP_USER}>`,
      `To: ${to}`,
      `Subject: =?UTF-8?B?${btoa(unescape(encodeURIComponent(subject)))}?=`,
      `MIME-Version: 1.0`,
      `Content-Type: multipart/alternative; boundary="${boundary}"`,
      ``,
      `--${boundary}`,
      `Content-Type: text/plain; charset=UTF-8`,
      ``,
      text || subject,
      ``,
      `--${boundary}`,
      `Content-Type: text/html; charset=UTF-8`,
      ``,
      html || `<p>${text || subject}</p>`,
      ``,
      `--${boundary}--`,
      `.`,
    ].join("\r\n");

    await write(emailContent);
    await write("QUIT");
    conn.close();

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("SMTP Error:", error);
    return new Response(JSON.stringify({ success: false, error: String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
