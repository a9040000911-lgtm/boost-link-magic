import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkLicense } from "../_shared/license.ts";

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

  // === HARDENED LICENSE VERIFICATION ===
  const { valid, error: licError, userId } = await checkLicense(req);
  if (!valid) {
    console.error(`[License Blocked] Domain: ${req.headers.get('origin') || 'Unknown'}, Error: ${licError}`);
    return json({ error: `License invalid: ${licError}. Please check settings.`, license_error: true }, 403);
  }

  if (!userId) {
    return json({ error: 'Unauthorized' }, 401);
  }

  try {
    const { code } = await req.json();

    if (!code || typeof code !== 'string' || code.length !== 6) {
      return json({ error: 'Введите 6-значный код' }, 400);
    }

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // Find valid code
    const { data: validCode } = await adminClient
      .from('staff_2fa_codes')
      .select('*')
      .eq('user_id', userId)
      .eq('code', code)
      .eq('used', false)
      .gt('expires_at', new Date().toISOString())
      .single();

    if (!validCode) {
      // Check for brute force: count failed attempts
      const { count } = await adminClient
        .from('staff_2fa_codes')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('used', false);

      // If no valid codes left, user needs to request a new one
      if (!count || count === 0) {
        return json({ error: 'Код истёк. Запросите новый.' }, 410);
      }

      return json({ error: 'Неверный код' }, 401);
    }

    // Mark code as used
    await adminClient
      .from('staff_2fa_codes')
      .update({ used: true })
      .eq('id', validCode.id);

    // Audit log
    await adminClient.from('admin_audit_logs').insert({
      actor_id: userId,
      action: '2fa_verified',
      target_type: 'auth',
      target_id: userId,
      details: { ip: req.headers.get('x-forwarded-for') || '' },
    });

    return json({ verified: true });
  } catch (error: unknown) {
    console.error('Verify 2FA error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return json({ error: message }, 500);
  }
});
