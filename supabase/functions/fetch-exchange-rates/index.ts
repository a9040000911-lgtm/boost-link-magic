import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Fetch rate from CBR (Central Bank of Russia) API
async function fetchCbrRate(base: string, target: string): Promise<number | null> {
  try {
    if (base === 'USD' && target === 'RUB') {
      const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
      const data = await res.json();
      return data?.Valute?.USD?.Value ?? null;
    }
    if (base === 'EUR' && target === 'RUB') {
      const res = await fetch('https://www.cbr-xml-daily.ru/daily_json.js');
      const data = await res.json();
      return data?.Valute?.EUR?.Value ?? null;
    }
    return null;
  } catch (e) {
    console.error('CBR fetch error:', e);
    return null;
  }
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const adminClient = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!
    );

    // If called with auth header, check admin role (manual trigger)
    const authHeader = req.headers.get('Authorization');
    if (authHeader?.startsWith('Bearer ')) {
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
    }

    // Define pairs to fetch
    const pairs = [
      { base: 'USD', target: 'RUB' },
      { base: 'EUR', target: 'RUB' },
    ];

    const results: Record<string, number | null> = {};

    for (const pair of pairs) {
      const rate = await fetchCbrRate(pair.base, pair.target);
      results[`${pair.base}/${pair.target}`] = rate;

      if (rate !== null) {
        // Upsert exchange rate
        await adminClient
          .from('exchange_rates')
          .upsert(
            {
              base_currency: pair.base,
              target_currency: pair.target,
              rate,
              source: 'cbr',
              fetched_at: new Date().toISOString(),
            },
            { onConflict: 'base_currency,target_currency' }
          );
      }
    }

    return new Response(JSON.stringify({ success: true, rates: results }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error: unknown) {
    console.error('Exchange rate error:', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
