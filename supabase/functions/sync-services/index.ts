import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { checkLicense } from "../_shared/license.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  // === HARDENED LICENSE VERIFICATION ===
  const { valid, error: licError } = await checkLicense(req);
  if (!valid) {
    console.error(`[License Blocked] Domain: ${req.headers.get('origin') || 'Unknown'}, Error: ${licError}`);
    return new Response(JSON.stringify({
      error: `License invalid: ${licError}. Please check settings.`,
      license_error: true
    }), {
      status: 403,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    });
  }

  try {
    const { provider: providerKey } = await req.json();

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

    const userId = claimsData.claims.sub;

    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: roleData } = await adminClient
      .from('user_roles')
      .select('role')
      .eq('user_id', userId)
      .eq('role', 'admin')
      .single();

    if (!roleData) {
      return new Response(JSON.stringify({ error: 'Admin access required' }), {
        status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Fetch providers from DB
    let providersQuery = adminClient.from('providers').select('*').eq('is_enabled', true);
    if (providerKey && providerKey !== 'all') {
      providersQuery = adminClient.from('providers').select('*').eq('key', providerKey);
    }

    const { data: dbProviders } = await providersQuery;
    if (!dbProviders || dbProviders.length === 0) {
      return new Response(JSON.stringify({ error: 'No providers found' }), {
        status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Load cleanup rules
    const { data: cleanupRules } = await adminClient
      .from('provider_cleanup_rules')
      .select('*')
      .eq('is_enabled', true);

    const applyCleanup = (field: string, value: string): string => {
      if (!cleanupRules || !value) return value;
      for (const rule of cleanupRules) {
        if (rule.field === field && value.includes(rule.match_value)) {
          value = value.replace(rule.match_value, rule.replace_value).trim();
        }
      }
      return value;
    };

    const results: Record<string, { total: number; inserted: number; updated: number }> = {};

    for (const prov of dbProviders) {
      const apiKey = Deno.env.get(prov.api_key_env);
      if (!apiKey) {
        results[prov.key] = { total: 0, inserted: 0, updated: 0 };
        continue;
      }

      const response = await fetch(prov.api_url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key: apiKey, action: 'services' }),
      });

      const services = await response.json();
      if (!Array.isArray(services)) {
        results[prov.key] = { total: 0, inserted: 0, updated: 0 };
        continue;
      }

      let inserted = 0;
      let updated = 0;

      for (const svc of services) {
        const { data: existing } = await adminClient
          .from('provider_services')
          .select('id, our_price, is_enabled, markup_percent')
          .eq('provider', prov.key)
          .eq('provider_service_id', svc.service)
          .single();

        const rawCategory = svc.category || 'Uncategorized';
        const rawNetwork = svc.network || svc.category?.split(' ')[0] || 'Other';
        const rawName = svc.name || '';

        const serviceData = {
          name: applyCleanup('name', rawName),
          category: applyCleanup('category', rawCategory),
          network: applyCleanup('network', rawNetwork),
          description: svc.description || null,
          type: svc.type || 'Default',
          rate: parseFloat(svc.rate),
          min_quantity: svc.min,
          max_quantity: svc.max,
          can_cancel: svc.cancel || false,
          can_refill: svc.refill || false,
          updated_at: new Date().toISOString(),
        };

        if (existing) {
          await adminClient
            .from('provider_services')
            .update(serviceData)
            .eq('id', existing.id);
          updated++;
        } else {
          await adminClient
            .from('provider_services')
            .insert({
              ...serviceData,
              provider: prov.key,
              provider_service_id: svc.service,
              is_enabled: false,
              markup_percent: 30,
            });
          inserted++;
        }
      }

      results[prov.key] = { total: services.length, inserted, updated };
    }

    return new Response(JSON.stringify({ success: true, results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Sync error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
