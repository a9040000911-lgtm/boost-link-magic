import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield } from "lucide-react";
import { getPlanLimits, type PlanLimits } from "@/lib/plan-limits";

interface LicenseGateProps {
  children: ReactNode;
}

const LICENSE_CACHE_KEY = "app_license_cache";
const CACHE_TTL = 1000 * 60 * 60; // 1 hour

const BYPASS_PREFIXES = ["/admin", "/auth", "/reset-password"];

interface LicenseCache {
  valid: boolean;
  plan: string;
  timestamp: number;
}

interface LicenseContextValue {
  plan: string;
  limits: PlanLimits;
  isLicensed: boolean;
}

const LicenseContext = createContext<LicenseContextValue>({
  plan: "standard",
  limits: getPlanLimits("standard"),
  isLicensed: false,
});

export function useLicense() {
  return useContext(LicenseContext);
}

export default function LicenseGate({ children }: LicenseGateProps) {
  const location = useLocation();
  const [status, setStatus] = useState<"loading" | "valid" | "invalid">("loading");
  const [plan, setPlan] = useState("standard");

  const isBypassed = BYPASS_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isBypassed) return;
    checkLicense();
  }, [isBypassed]);

  if (isBypassed) return <>{children}</>;

  async function checkLicense() {
    // Check local cache first
    try {
      const cached = JSON.parse(localStorage.getItem(LICENSE_CACHE_KEY) || "{}") as LicenseCache;
      if (cached.valid && Date.now() - cached.timestamp < CACHE_TTL) {
        setPlan(cached.plan || "standard");
        setStatus("valid");
        return;
      }
    } catch {}

    // Read license key from app_settings (set once by admin)
    const { data: setting } = await supabase
      .from("app_settings")
      .select("value")
      .eq("key", "license_key")
      .maybeSingle();

    const storedKey = setting?.value;
    if (!storedKey) {
      // No license configured — allow access with standard plan (or block if you prefer)
      setPlan("standard");
      setStatus("valid");
      localStorage.setItem(
        LICENSE_CACHE_KEY,
        JSON.stringify({ valid: true, plan: "standard", timestamp: Date.now() })
      );
      return;
    }

    // Verify with edge function
    try {
      const currentDomain = window.location.hostname;
      const { data, error: fnError } = await supabase.functions.invoke("verify-license", {
        body: { action: "verify", license_key: storedKey, domain: currentDomain },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.valid) {
        const licensePlan = data.plan || "standard";
        setPlan(licensePlan);
        localStorage.setItem(
          LICENSE_CACHE_KEY,
          JSON.stringify({ valid: true, plan: licensePlan, timestamp: Date.now() })
        );
        setStatus("valid");
      } else {
        // License invalid — still allow access with standard defaults
        setPlan("standard");
        setStatus("valid");
      }
    } catch {
      // On error — allow access with standard plan
      setPlan("standard");
      setStatus("valid");
    }
  }

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex items-center gap-3 text-muted-foreground">
          <Shield className="h-6 w-6 animate-pulse" />
          <span>Проверка лицензии…</span>
        </div>
      </div>
    );
  }

  return (
    <LicenseContext.Provider value={{ plan, limits: getPlanLimits(plan), isLicensed: status === "valid" && plan !== "standard" }}>
      {children}
    </LicenseContext.Provider>
  );
}
