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
    const { data: claimsData, error: claimsErr } = await supabase.auth.getClaims(token);
    if (claimsErr || !claimsData?.claims) {
      return json({ error: 'Unauthorized' }, 401);
    }
    const userId = claimsData.claims.sub;
    const userEmail = claimsData.claims.email || '';

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Check if user is admin or moderator
    const { data: hasAdmin } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'admin' });
    const { data: hasMod } = await adminClient.rpc('has_role', { _user_id: userId, _role: 'moderator' });

    if (!hasAdmin && !hasMod) {
      return json({ error: '2FA not required for regular users' }, 400);
    }

    // Rate limit: max 1 code per 60 seconds
    const { data: recentCodes } = await adminClient
      .from('staff_2fa_codes')
      .select('id')
      .eq('user_id', userId)
      .eq('used', false)
      .gt('created_at', new Date(Date.now() - 60_000).toISOString());

    if (recentCodes && recentCodes.length > 0) {
      return json({ error: 'Код уже отправлен. Подождите минуту.' }, 429);
    }

    // Cleanup old codes for this user
    await adminClient
      .from('staff_2fa_codes')
      .delete()
      .eq('user_id', userId);

    // Generate 6-digit code
    const code = String(Math.floor(100000 + Math.random() * 900000));

    // Store code
    const ip = req.headers.get('x-forwarded-for') || req.headers.get('cf-connecting-ip') || '';
    await adminClient.from('staff_2fa_codes').insert({
      user_id: userId,
      code,
      ip_address: ip,
    });

    // Get user's telegram_chat_id
    const { data: profile } = await adminClient
      .from('profiles')
      .select('telegram_chat_id, display_name')
      .eq('id', userId)
      .single();

    const telegramChatId = profile?.telegram_chat_id;
    const displayName = profile?.display_name || userEmail;

    let telegramSent = false;
    let emailSent = false;

    // Send via Telegram (if chat_id exists)
    if (telegramChatId) {
      try {
        const botToken = Deno.env.get('TELEGRAM_BOT_TOKEN');
        if (botToken) {
          const tgMessage = `🔐 Код для входа в панель управления:\n\n<b>${code}</b>\n\nДействителен 5 минут.\nЕсли вы не запрашивали код — немедленно смените пароль.`;
          const tgRes = await fetch(`https://api.telegram.org/bot${botToken}/sendMessage`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              chat_id: telegramChatId,
              text: tgMessage,
              parse_mode: 'HTML',
            }),
          });
          const tgData = await tgRes.json();
          telegramSent = tgData.ok === true;
        }
      } catch (e) {
        console.error('Telegram send failed:', e);
      }
    }

    // Send via Email (always)
    if (userEmail) {
      try {
        const { data: emailResult, error: emailErr } = await adminClient.functions.invoke('send-email', {
          body: {
            to: userEmail,
            subject: `Код безопасности: ${code}`,
            html: `
              <div style="font-family: Arial, sans-serif; max-width: 420px; margin: 0 auto; padding: 32px;">
                <h2 style="color: #1a1a1a; margin-bottom: 8px;">🔐 Код для входа</h2>
                <p style="color: #666; font-size: 14px;">Здравствуйте, ${displayName}!</p>
                <div style="background: #f5f5f5; border-radius: 12px; padding: 24px; text-align: center; margin: 24px 0;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #1a1a1a;">${code}</span>
                </div>
                <p style="color: #999; font-size: 12px;">Код действителен 5 минут. Если вы не запрашивали код — немедленно смените пароль.</p>
              </div>
            `,
            text: `Код для входа: ${code}. Действителен 5 минут.`,
          },
        });
        emailSent = !emailErr;
      } catch (e) {
        console.error('Email send failed:', e);
      }
    }

    if (!telegramSent && !emailSent) {
      return json({ error: 'Не удалось отправить код ни одним способом' }, 500);
    }

    return json({
      sent: true,
      channels: {
        telegram: telegramSent,
        email: emailSent,
      },
      email_hint: userEmail ? `${userEmail.slice(0, 3)}***@${userEmail.split('@')[1]}` : null,
      telegram_hint: telegramSent,
    });
  } catch (error: unknown) {
    console.error('Send 2FA error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
