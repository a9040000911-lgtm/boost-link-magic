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
    const { action, provider: providerKey, ...params } = await req.json();

    if (!providerKey) {
      return new Response(JSON.stringify({ error: 'Provider key is required' }), {
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

    // Fetch provider from DB with admin privileges
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    const { data: provider, error: provErr } = await adminClient
      .from('providers')
      .select('key, label, api_url, api_key, api_key_env')
      .eq('key', providerKey)
      .single();

    if (provErr || !provider) {
      return new Response(JSON.stringify({ error: `Unknown provider: ${providerKey}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    // Get API key: prefer direct key from DB, fallback to ENV variable
    let apiKey = provider.api_key;

    // If no direct key, try ENV variable
    if (!apiKey && provider.api_key_env) {
      apiKey = Deno.env.get(provider.api_key_env);
    }

    if (!apiKey) {
      const errorMsg = provider.api_key_env
        ? `API key not found. Set ${provider.api_key_env} in ENV or add api_key in database.`
        : `API key not configured for provider ${provider.label}. Add api_key in admin panel.`;
      return new Response(JSON.stringify({ error: errorMsg }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    let body: Record<string, string> = { key: apiKey, action };

    if (action === 'add') {
      body = { ...body, service: params.service, link: params.link, quantity: params.quantity };
    } else if (action === 'status') {
      body = { ...body, order: params.order };
    }

    const response = await fetch(provider.api_url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

    // Update provider balance if balance action
    if (action === 'balance' && data.balance) {
      await adminClient
        .from('providers')
        .update({
          balance: parseFloat(data.balance),
          balance_currency: data.currency || 'USD',
          last_health_check: new Date().toISOString(),
          health_status: 'healthy',
          updated_at: new Date().toISOString(),
        })
        .eq('key', providerKey);
    }

    return new Response(JSON.stringify(data), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Provider API error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
