import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

const VEXBOOST_API_URL = 'https://vexboost.ru/api/v2';

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const VEXBOOST_API_KEY = Deno.env.get('VEXBOOST_API_KEY');
    if (!VEXBOOST_API_KEY) throw new Error('VEXBOOST_API_KEY is not configured');

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

    // Check admin role using service role client
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

    // Fetch services from VexBoost
    const response = await fetch(VEXBOOST_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ key: VEXBOOST_API_KEY, action: 'services' }),
    });

    const services = await response.json();
    if (!Array.isArray(services)) {
      throw new Error('Invalid response from provider');
    }

    // Upsert services
    let inserted = 0;
    let updated = 0;

    for (const svc of services) {
      const { data: existing } = await adminClient
        .from('provider_services')
        .select('id, our_price, is_enabled, markup_percent')
        .eq('provider_service_id', svc.service)
        .single();

      if (existing) {
        await adminClient
          .from('provider_services')
          .update({
            name: svc.name,
            category: svc.category,
            network: svc.network,
            description: svc.description || null,
            type: svc.type,
            rate: parseFloat(svc.rate),
            min_quantity: svc.min,
            max_quantity: svc.max,
            can_cancel: svc.cancel || false,
            can_refill: svc.refill || false,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
        updated++;
      } else {
        await adminClient
          .from('provider_services')
          .insert({
            provider_service_id: svc.service,
            name: svc.name,
            category: svc.category,
            network: svc.network,
            description: svc.description || null,
            type: svc.type,
            rate: parseFloat(svc.rate),
            min_quantity: svc.min,
            max_quantity: svc.max,
            can_cancel: svc.cancel || false,
            can_refill: svc.refill || false,
            is_enabled: false,
            markup_percent: 30,
          });
        inserted++;
      }
    }

    return new Response(JSON.stringify({ 
      success: true, 
      total: services.length,
      inserted, 
      updated 
    }), {
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
