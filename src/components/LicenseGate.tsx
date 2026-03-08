import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useLocation } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Shield, AlertTriangle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getPlanLimits, type PlanLimits } from "@/lib/plan-limits";

interface LicenseGateProps {
  children: ReactNode;
}

const LICENSE_STORAGE_KEY = "app_license_key";
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
  const [status, setStatus] = useState<"loading" | "valid" | "invalid" | "input">("loading");
  const [error, setError] = useState("");
  const [keyInput, setKeyInput] = useState("");
  const [checking, setChecking] = useState(false);
  const [plan, setPlan] = useState("standard");

  const isBypassed = BYPASS_PREFIXES.some((p) => location.pathname.startsWith(p));

  useEffect(() => {
    if (isBypassed) return;
    checkLicense();
  }, [isBypassed]);

  if (isBypassed) return <>{children}</>;

  async function checkLicense() {
    const storedKey = localStorage.getItem(LICENSE_STORAGE_KEY);
    if (!storedKey) {
      setStatus("input");
      return;
    }

    try {
      const cached = JSON.parse(localStorage.getItem(LICENSE_CACHE_KEY) || "{}") as LicenseCache;
      if (cached.valid && Date.now() - cached.timestamp < CACHE_TTL) {
        setPlan(cached.plan || "standard");
        setStatus("valid");
        return;
      }
    } catch {}

    await verifyKey(storedKey);
  }

  async function verifyKey(key: string) {
    setChecking(true);
    setError("");
    try {
      const currentDomain = window.location.hostname;
      const { data, error: fnError } = await supabase.functions.invoke("verify-license", {
        body: { action: "verify", license_key: key, domain: currentDomain },
      });

      if (fnError) throw new Error(fnError.message);

      if (data?.valid) {
        const licensePlan = data.plan || "standard";
        setPlan(licensePlan);
        localStorage.setItem(LICENSE_STORAGE_KEY, key);
        localStorage.setItem(
          LICENSE_CACHE_KEY,
          JSON.stringify({ valid: true, plan: licensePlan, timestamp: Date.now() })
        );
        setStatus("valid");
      } else {
        localStorage.removeItem(LICENSE_STORAGE_KEY);
        localStorage.removeItem(LICENSE_CACHE_KEY);
        setError(data?.error || "Недействительная лицензия");
        setStatus("invalid");
      }
    } catch (err: any) {
      setError(err.message || "Ошибка проверки лицензии");
      setStatus("invalid");
    } finally {
      setChecking(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!keyInput.trim()) return;
    await verifyKey(keyInput.trim());
    if (status !== "valid") {
      setStatus("input");
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

  if (status === "valid") {
    return (
      <LicenseContext.Provider value={{ plan, limits: getPlanLimits(plan), isLicensed: true }}>
        {children}
      </LicenseContext.Provider>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-3 flex h-14 w-14 items-center justify-center rounded-full bg-destructive/10">
            <AlertTriangle className="h-7 w-7 text-destructive" />
          </div>
          <CardTitle className="text-xl">Активация лицензии</CardTitle>
          <p className="text-sm text-muted-foreground mt-1">
            Для работы приложения необходим действующий лицензионный ключ
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              value={keyInput}
              onChange={(e) => setKeyInput(e.target.value)}
              placeholder="Введите лицензионный ключ"
              className="font-mono text-sm"
            />
            {error && (
              <p className="text-sm text-destructive">{error}</p>
            )}
            <Button type="submit" className="w-full" disabled={checking || !keyInput.trim()}>
              {checking ? "Проверка…" : "Активировать"}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
