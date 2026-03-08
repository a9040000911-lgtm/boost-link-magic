import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CreditCard, Save, RefreshCw, CheckCircle2, Circle, AlertTriangle, Shield } from "lucide-react";
import { toast } from "sonner";

interface FieldDef {
  key: string;
  label: string;
  hint: string;
  secret?: boolean;
  group?: "test" | "prod";
}

interface PaymentSystem {
  id: string;
  name: string;
  description: string;
  logo: string;
  fields: FieldDef[];
}

const PAYMENT_SYSTEMS: PaymentSystem[] = [
  {
    id: "yookassa",
    name: "ЮKassa",
    description: "Приём платежей банковскими картами, электронными кошельками, через СБП и другие способы",
    logo: "💳",
    fields: [
      // Test credentials
      { key: "yookassa_test_shop_id", label: "Shop ID (тестовый)", hint: "Тестовый идентификатор магазина из ЮKassa", group: "test" },
      { key: "yookassa_test_secret_key", label: "Секретный ключ (тестовый)", hint: "Тестовый секретный ключ из ЮKassa", secret: true, group: "test" },
      // Production credentials
      { key: "yookassa_shop_id", label: "Shop ID (боевой)", hint: "Боевой идентификатор магазина из личного кабинета ЮKassa", group: "prod" },
      { key: "yookassa_secret_key", label: "Секретный ключ (боевой)", hint: "Боевой секретный ключ из настроек ЮKassa", secret: true, group: "prod" },
      // Common
      { key: "yookassa_return_url", label: "URL возврата", hint: "Страница, на которую вернётся пользователь после оплаты" },
      { key: "yookassa_test_mode", label: "Тестовый режим", hint: "При включении используются тестовые ключи. Реальные списания НЕ производятся." },
    ],
  },
  {
    id: "robokassa",
    name: "Робокасса",
    description: "Приём платежей картами, через интернет-банкинг, электронные деньги и терминалы",
    logo: "🏦",
    fields: [
      { key: "robokassa_login", label: "Логин магазина", hint: "MerchantLogin из настроек Робокассы" },
      { key: "robokassa_password1", label: "Пароль #1", hint: "Пароль для формирования подписи запроса", secret: true },
      { key: "robokassa_password2", label: "Пароль #2", hint: "Пароль для проверки подписи уведомления", secret: true },
      { key: "robokassa_test_mode", label: "Тестовый режим", hint: "Использовать тестовый режим Робокассы (без реальных списаний)" },
    ],
  },
];

const ACTIVE_KEY = "active_payment_system";

const AdminPayments = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const allKeys = [ACTIVE_KEY, ...PAYMENT_SYSTEMS.flatMap(ps => ps.fields.map(f => f.key))];

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key, value").in("key", allKeys);
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    setValues(map);
    setOriginal(map);
    setLoading(false);
  };

  const updateVal = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  const setActive = (systemId: string) => {
    setValues(prev => ({
      ...prev,
      [ACTIVE_KEY]: prev[ACTIVE_KEY] === systemId ? "" : systemId,
    }));
  };

  const hasChanges = allKeys.some(k => (values[k] ?? "") !== (original[k] ?? ""));
  const changedCount = allKeys.filter(k => (values[k] ?? "") !== (original[k] ?? "")).length;

  const saveAll = async () => {
    setSaving(true);
    try {
      const changedKeys = allKeys.filter(k => (values[k] ?? "") !== (original[k] ?? ""));
      for (const key of changedKeys) {
        const { error } = await supabase.from("app_settings")
          .upsert({ key, value: values[key] ?? "", updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success(`Сохранено (${changedKeys.length} параметров)`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  const activeSystem = values[ACTIVE_KEY] || "";

  const renderField = (field: FieldDef) => {
    const val = values[field.key] ?? "";
    const changed = val !== (original[field.key] ?? "");

    if (field.key.includes("test_mode")) {
      return (
        <div key={field.key} className="space-y-1">
          <Label className={`text-xs font-medium ${changed ? "text-primary" : ""}`}>
            {field.label} {changed && <span className="text-[9px]">●</span>}
          </Label>
          <p className="text-[11px] text-muted-foreground">{field.hint}</p>
          <div className="flex items-center gap-2 pt-1">
            <Switch
              checked={val === "true"}
              onCheckedChange={v => updateVal(field.key, v ? "true" : "false")}
            />
            <span className="text-xs text-muted-foreground">{val === "true" ? "Включён" : "Выключен"}</span>
          </div>
        </div>
      );
    }

    return (
      <div key={field.key} className="space-y-1">
        <Label className={`text-xs font-medium ${changed ? "text-primary" : ""}`}>
          {field.label} {changed && <span className="text-[9px]">●</span>}
        </Label>
        <p className="text-[11px] text-muted-foreground">{field.hint}</p>
        <Input
          type={field.secret ? "password" : "text"}
          value={val}
          onChange={e => updateVal(field.key, e.target.value)}
          className="text-xs h-8 max-w-md"
          placeholder={field.secret ? "••••••••" : ""}
        />
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full gap-4 overflow-auto">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <CreditCard className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Платёжные системы</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" />Сбросить
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={saveAll} disabled={saving || !hasChanges}>
            <Save className="h-3 w-3 mr-1" />{saving ? "..." : `Сохранить${hasChanges ? ` (${changedCount})` : ""}`}
          </Button>
        </div>
      </div>

      <p className="text-xs text-muted-foreground">
        Выберите активную платёжную систему и настройте параметры подключения. Одновременно может быть активна только одна система.
      </p>

      <div className="grid gap-4">
        {PAYMENT_SYSTEMS.map(ps => {
          const isActive = activeSystem === ps.id;
          const isConfigured = ps.fields.some(f => !f.key.includes("test_mode") && !f.group && (values[f.key] ?? "").length > 0);
          const isTestMode = values[`${ps.id}_test_mode`] === "true";

          const testFields = ps.fields.filter(f => f.group === "test");
          const prodFields = ps.fields.filter(f => f.group === "prod");
          const commonFields = ps.fields.filter(f => !f.group && !f.key.includes("test_mode"));
          const testModeField = ps.fields.find(f => f.key.includes("test_mode"));

          return (
            <Card
              key={ps.id}
              className={`border-2 transition-colors ${isActive ? "border-primary bg-primary/5" : "border-border/60"}`}
            >
              <CardHeader className="p-4 pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-bold flex items-center gap-2">
                    <span className="text-xl">{ps.logo}</span>
                    {ps.name}
                    {isActive && <Badge variant="default" className="text-[10px] h-5">Активна</Badge>}
                    {!isActive && isConfigured && <Badge variant="secondary" className="text-[10px] h-5">Настроена</Badge>}
                  </CardTitle>
                  <Button
                    size="sm"
                    variant={isActive ? "default" : "outline"}
                    className="h-7 text-xs gap-1.5"
                    onClick={() => setActive(ps.id)}
                  >
                    {isActive ? <CheckCircle2 className="h-3 w-3" /> : <Circle className="h-3 w-3" />}
                    {isActive ? "Активна" : "Сделать активной"}
                  </Button>
                </div>
                <p className="text-[11px] text-muted-foreground mt-1">{ps.description}</p>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                {/* Test mode toggle */}
                {testModeField && renderField(testModeField)}

                {/* Test mode warning banner */}
                {isActive && isTestMode && (
                  <Alert className="border-yellow-500/50 bg-yellow-500/10">
                    <AlertTriangle className="h-4 w-4 text-yellow-600" />
                    <AlertDescription className="text-xs text-yellow-700 dark:text-yellow-400">
                      Используются <strong>тестовые ключи</strong>. Реальные списания не производятся.
                    </AlertDescription>
                  </Alert>
                )}

                {/* Test credentials section */}
                {testFields.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-1">
                      <AlertTriangle className="h-3 w-3 text-yellow-500" />
                      <span className="text-xs font-semibold text-yellow-600 dark:text-yellow-400">Тестовые ключи</span>
                      {isTestMode && <Badge variant="outline" className="text-[9px] h-4 border-yellow-500 text-yellow-600">Активны</Badge>}
                    </div>
                    {testFields.map(renderField)}
                  </div>
                )}

                {/* Production credentials section */}
                {prodFields.length > 0 && (
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 pt-1">
                      <Shield className="h-3 w-3 text-green-500" />
                      <span className="text-xs font-semibold text-green-600 dark:text-green-400">Боевые ключи</span>
                      {!isTestMode && <Badge variant="outline" className="text-[9px] h-4 border-green-500 text-green-600">Активны</Badge>}
                    </div>
                    {prodFields.map(renderField)}
                  </div>
                )}

                {/* Common fields */}
                {commonFields.map(renderField)}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {hasChanges && (
        <div className="sticky bottom-0 bg-background border-t p-2 flex items-center justify-between -mx-3 -mb-3 px-3">
          <span className="text-xs text-muted-foreground">Изменено: {changedCount} параметров</span>
          <Button size="sm" className="h-8 text-xs px-4" onClick={saveAll} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />{saving ? "Сохранение..." : "Сохранить все изменения"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
