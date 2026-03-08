import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

async function hmacSign(secret: string, data: string): Promise<string> {
  const enc = new TextEncoder();
  const key = await crypto.subtle.importKey(
    "raw",
    enc.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const sig = await crypto.subtle.sign("HMAC", key, enc.encode(data));
  return Array.from(new Uint8Array(sig))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

async function hmacVerify(
  secret: string,
  data: string,
  signature: string
): Promise<boolean> {
  const expected = await hmacSign(secret, data);
  return expected === signature;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { action, license_key, domain, plan, expires_at } = await req.json();

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LICENSE_SECRET = Deno.env.get("LICENSE_SECRET");
    if (!LICENSE_SECRET) {
      return new Response(
        JSON.stringify({ valid: false, error: "Server misconfigured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === GENERATE LICENSE (admin only) ===
    if (action === "generate") {
      const authHeader = req.headers.get("Authorization");
      if (!authHeader?.startsWith("Bearer ")) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const authClient = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );
      const { data: claimsData, error: claimsErr } = await authClient.auth.getClaims(
        authHeader.replace("Bearer ", "")
      );
      if (claimsErr || !claimsData?.claims) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const userId = claimsData.claims.sub as string;
      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        return new Response(
          JSON.stringify({ error: "Forbidden" }),
          { status: 403, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!domain) {
        return new Response(
          JSON.stringify({ error: "Domain is required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const payload = `${domain}:${plan || "standard"}:${expires_at || "forever"}`;
      const signature = await hmacSign(LICENSE_SECRET, payload);
      const key = `${btoa(payload)}.${signature}`;

      const { data: lic, error: insErr } = await supabase
        .from("licenses")
        .insert({
          license_key: key,
          domain,
          plan: plan || "standard",
          expires_at: expires_at || null,
        })
        .select()
        .single();

      if (insErr) {
        return new Response(
          JSON.stringify({ error: insErr.message }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({ license: lic }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // === VERIFY LICENSE (public) ===
    if (action === "verify") {
      if (!license_key) {
        return new Response(
          JSON.stringify({ valid: false, error: "License key required" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const parts = license_key.split(".");
      if (parts.length !== 2) {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid key format" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const [encodedPayload, signature] = parts;
      let payload: string;
      try {
        payload = atob(encodedPayload);
      } catch {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid key encoding" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      const isValid = await hmacVerify(LICENSE_SECRET, payload, signature);
      if (!isValid) {
        return new Response(
          JSON.stringify({ valid: false, error: "Invalid signature" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check in DB
      const { data: dbLicense } = await supabase
        .from("licenses")
        .select("*")
        .eq("license_key", license_key)
        .maybeSingle();

      if (!dbLicense) {
        return new Response(
          JSON.stringify({ valid: false, error: "License not found" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (!dbLicense.is_active) {
        return new Response(
          JSON.stringify({ valid: false, error: "License deactivated" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      if (dbLicense.expires_at && new Date(dbLicense.expires_at) < new Date()) {
        return new Response(
          JSON.stringify({ valid: false, error: "License expired" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      // Check domain
      const requestDomain = domain || "";
      if (dbLicense.domain !== "*" && requestDomain && !requestDomain.includes(dbLicense.domain)) {
        return new Response(
          JSON.stringify({ valid: false, error: "Domain mismatch" }),
          { headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }

      return new Response(
        JSON.stringify({
          valid: true,
          plan: dbLicense.plan,
          domain: dbLicense.domain,
          expires_at: dbLicense.expires_at,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(
      JSON.stringify({ error: "Unknown action" }),
      { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (err) {
    return new Response(
      JSON.stringify({ error: err.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
