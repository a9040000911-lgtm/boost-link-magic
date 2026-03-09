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

export async function checkLicense(req: Request): Promise<{ valid: boolean; error?: string; plan?: string }> {
    const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const LICENSE_SECRET = Deno.env.get("LICENSE_SECRET");
    if (!LICENSE_SECRET) {
        console.error("[License] LICENSE_SECRET not found");
        return { valid: false, error: "Server misconfigured" };
    }

    // 1. Get license key from settings
    const { data: setting } = await supabase
        .from("app_settings")
        .select("value")
        .eq("key", "license_key")
        .maybeSingle();

    const licenseKey = setting?.value;
    if (!licenseKey) {
        return { valid: false, error: "License key not found in settings" };
    }

    // 2. Parse key
    const parts = licenseKey.split(".");
    if (parts.length !== 2) {
        return { valid: false, error: "Invalid license format" };
    }

    const [encodedPayload, signature] = parts;
    let payload: string;
    try {
        payload = atob(encodedPayload);
    } catch {
        return { valid: false, error: "Invalid license encoding" };
    }

    // 3. Verify HMAC
    const isValidHmac = await hmacVerify(LICENSE_SECRET, payload, signature);
    if (!isValidHmac) {
        return { valid: false, error: "Invalid license signature" };
    }

    // 4. Verify in DB
    const { data: dbLicense } = await supabase
        .from("licenses")
        .select("*")
        .eq("license_key", licenseKey)
        .maybeSingle();

    if (!dbLicense || !dbLicense.is_active) {
        return { valid: false, error: "License inactive or not found" };
    }

    // 5. Expiry
    if (dbLicense.expires_at && new Date(dbLicense.expires_at) < new Date()) {
        return { valid: false, error: "License expired" };
    }

    // 6. Domain check (optional but recommended for hard binding)
    const origin = req.headers.get("origin") || "";
    const host = req.headers.get("host") || "";
    const currentDomain = origin.replace(/^https?:\/\//, "").split(":")[0] || host.split(":")[0];

    if (dbLicense.domain !== "*" && currentDomain && !currentDomain.includes(dbLicense.domain)) {
        // For safety during local dev, allow localhost
        if (currentDomain !== "localhost" && currentDomain !== "127.0.0.1") {
            return { valid: false, error: `Domain mismatch: ${currentDomain} is not allowed` };
        }
    }

    return { valid: true, plan: dbLicense.plan };
}
