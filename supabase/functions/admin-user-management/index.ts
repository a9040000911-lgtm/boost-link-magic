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

  const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
  const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

  // Verify the caller is an admin
  const authHeader = req.headers.get("Authorization");
  if (!authHeader) {
    return new Response(JSON.stringify({ error: "No auth" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  const callerClient = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_ANON_KEY")!, {
    global: { headers: { Authorization: authHeader } },
  });
  const { data: { user: caller } } = await callerClient.auth.getUser();
  if (!caller) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  // Check admin role
  const adminClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);
  const { data: roleData } = await adminClient.from("user_roles").select("role").eq("user_id", caller.id).eq("role", "admin").single();
  if (!roleData) {
    return new Response(JSON.stringify({ error: "Admin access required" }), { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }

  try {
    const { action, user_id, ...params } = await req.json();

    switch (action) {
      case "update_password": {
        const { password } = params;
        if (!password || password.length < 6) {
          return new Response(JSON.stringify({ error: "Password must be at least 6 characters" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { password });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "update_email": {
        const { email } = params;
        if (!email) {
          return new Response(JSON.stringify({ error: "Email is required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const { error } = await adminClient.auth.admin.updateUserById(user_id, { email, email_confirm: true });
        if (error) throw error;
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "get_user_auth": {
        const { data, error } = await adminClient.auth.admin.getUserById(user_id);
        if (error) throw error;
        return new Response(JSON.stringify({
          email: data.user.email,
          phone: data.user.phone,
          email_confirmed: data.user.email_confirmed_at != null,
          created_at: data.user.created_at,
          last_sign_in: data.user.last_sign_in_at,
          mfa_enabled: (data.user.factors || []).some((f: any) => f.status === "verified"),
          factors: data.user.factors || [],
          banned: data.user.banned_until != null,
          banned_until: data.user.banned_until,
        }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "ban_user": {
        const { duration } = params; // "none", "24h", "7d", "30d", "permanent"
        let ban_duration = "none";
        if (duration === "24h") ban_duration = "24h";
        else if (duration === "7d") ban_duration = "168h";
        else if (duration === "30d") ban_duration = "720h";
        else if (duration === "permanent") ban_duration = "876000h"; // ~100 years

        if (duration === "none") {
          const { error } = await adminClient.auth.admin.updateUserById(user_id, { ban_duration: "none" });
          if (error) throw error;
        } else {
          const { error } = await adminClient.auth.admin.updateUserById(user_id, { ban_duration });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "delete_mfa_factors": {
        const { data: userData } = await adminClient.auth.admin.getUserById(user_id);
        if (userData?.user?.factors) {
          for (const factor of userData.user.factors) {
            await adminClient.auth.admin.mfa.deleteFactor({ id: factor.id, userId: user_id });
          }
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "confirm_email": {
        const { data: userData } = await adminClient.auth.admin.getUserById(user_id);
        if (userData?.user) {
          const { error } = await adminClient.auth.admin.updateUserById(user_id, { email_confirm: true });
          if (error) throw error;
        }
        return new Response(JSON.stringify({ success: true }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      case "list_users_auth": {
        const { user_ids } = params;
        if (!user_ids || !Array.isArray(user_ids)) {
          return new Response(JSON.stringify({ error: "user_ids array required" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
        }
        const result: Record<string, any> = {};
        // Fetch in parallel batches of 20
        const batchSize = 20;
        for (let i = 0; i < user_ids.length; i += batchSize) {
          const batch = user_ids.slice(i, i + batchSize);
          const promises = batch.map((uid: string) => adminClient.auth.admin.getUserById(uid));
          const results = await Promise.all(promises);
          for (const r of results) {
            if (r.data?.user) {
              const u = r.data.user;
              result[u.id] = {
                email: u.email,
                last_sign_in: u.last_sign_in_at,
                banned: u.banned_until != null,
              };
            }
          }
        }
        return new Response(JSON.stringify(result), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
      }

      default:
        return new Response(JSON.stringify({ error: "Unknown action" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
  } catch (error) {
    console.error("Admin user management error:", error);
    return new Response(JSON.stringify({ error: String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});
