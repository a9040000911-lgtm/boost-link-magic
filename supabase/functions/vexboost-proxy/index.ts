import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const PROVIDERS: Record<string, { url: string; keyEnv: string; label: string }> = {
  vexboost: { url: 'https://vexboost.ru/api/v2', keyEnv: 'VEXBOOST_API_KEY', label: 'VexBoost' },
  smmpanelus: { url: 'https://smmpanelus.com/api/v2', keyEnv: 'SMMPANELUS_API_KEY', label: 'SMMPanelUS' },
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, provider: providerKey, ...params } = await req.json();
    
    const provider = PROVIDERS[providerKey];
    if (!provider) {
      return new Response(JSON.stringify({ error: `Unknown provider: ${providerKey}` }), {
        status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      });
    }

    const apiKey = Deno.env.get(provider.keyEnv);
    if (!apiKey) {
      throw new Error(`${provider.keyEnv} is not configured`);
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

    let body: Record<string, string> = { key: apiKey, action };

    if (action === 'add') {
      body = { ...body, service: params.service, link: params.link, quantity: params.quantity };
    } else if (action === 'status') {
      body = { ...body, order: params.order };
    }

    const response = await fetch(provider.url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    const data = await response.json();

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
