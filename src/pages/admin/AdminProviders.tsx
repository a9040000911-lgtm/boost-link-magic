import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Server, Plus, Trash2, RefreshCw, Activity, DollarSign, Wifi, WifiOff, Clock, ArrowRightLeft } from "lucide-react";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";

interface Provider {
  id: string;
  key: string;
  label: string;
  api_url: string;
  api_key_env: string;
  is_enabled: boolean;
  last_health_check: string | null;
  health_status: string | null;
  health_latency_ms: number | null;
  balance: number | null;
  balance_currency: string | null;
  rate_currency: string;
  services_count: number | null;
  created_at: string;
}

interface ExchangeRate {
  base_currency: string;
  target_currency: string;
  rate: number;
  fetched_at: string;
}

const CURRENCIES = ["RUB", "USD", "EUR", "GBP", "TRY", "UAH", "KZT", "BRL", "INR", "CNY"];

const AdminProviders = () => {
  const { user } = useAuth();
  const [providers, setProviders] = useState<Provider[]>([]);
  const [loading, setLoading] = useState(true);
  const [checking, setChecking] = useState<string | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [newProvider, setNewProvider] = useState({ key: "", label: "", api_url: "", api_key_env: "", balance_currency: "USD", rate_currency: "RUB" });
  const [exchangeRates, setExchangeRates] = useState<ExchangeRate[]>([]);
  const [fetchingRates, setFetchingRates] = useState(false);

  useEffect(() => {
    if (user) {
      loadProviders();
      loadExchangeRates();
    }
  }, [user]);

  const loadProviders = async () => {
    setLoading(true);
    const { data } = await supabase.from("providers").select("*").order("created_at");
    
    if (data) {
      const enriched = await Promise.all(data.map(async (p) => {
        const { count } = await supabase
          .from("provider_services")
          .select("*", { count: "exact", head: true })
          .eq("provider", p.key);
        return { ...p, services_count: count || 0 } as Provider;
      }));
      setProviders(enriched);
    }
    setLoading(false);
  };

  const loadExchangeRates = async () => {
    const { data } = await supabase.from("exchange_rates").select("*");
    if (data) setExchangeRates(data as ExchangeRate[]);
  };

  const refreshExchangeRates = async () => {
    setFetchingRates(true);
    try {
      const { data, error } = await supabase.functions.invoke("fetch-exchange-rates", { body: {} });
      if (error) throw error;
      toast.success("Курсы обновлены");
      await loadExchangeRates();
    } catch (e: any) {
      toast.error("Ошибка обновления курсов: " + e.message);
    }
    setFetchingRates(false);
  };

  const healthCheck = async (provider: Provider) => {
    setChecking(provider.id);
    const start = Date.now();
    try {
      const { data, error } = await supabase.functions.invoke("vexboost-proxy", {
        body: { action: "balance", provider: provider.key },
      });

      const latency = Date.now() - start;
      const isOk = !error && data && !data.error;

      await supabase.from("providers").update({
        last_health_check: new Date().toISOString(),
        health_status: isOk ? "healthy" : "error",
        health_latency_ms: latency,
        balance: isOk && data.balance ? parseFloat(data.balance) : null,
        balance_currency: isOk && data.currency ? data.currency : provider.balance_currency,
        updated_at: new Date().toISOString(),
      }).eq("id", provider.id);

      toast.success(`${provider.label}: ${isOk ? "OK" : "Ошибка"} (${latency}ms)`);
    } catch (e: any) {
      const latency = Date.now() - start;
      await supabase.from("providers").update({
        last_health_check: new Date().toISOString(),
        health_status: "error",
        health_latency_ms: latency,
        updated_at: new Date().toISOString(),
      }).eq("id", provider.id);
      toast.error(`${provider.label}: ${e.message}`);
    }
    setChecking(null);
    await loadProviders();
  };

  const checkAll = async () => {
    for (const p of providers) {
      await healthCheck(p);
    }
  };

  const toggleEnabled = async (provider: Provider) => {
    await supabase.from("providers").update({
      is_enabled: !provider.is_enabled,
      updated_at: new Date().toISOString(),
    }).eq("id", provider.id);
    await logAuditAction("toggle_service", "provider", provider.id, { key: provider.key, enabled: !provider.is_enabled });
    toast.success(`${provider.label} ${!provider.is_enabled ? "включен" : "выключен"}`);
    await loadProviders();
  };

  const deleteProvider = async (provider: Provider) => {
    if (!confirm(`Удалить провайдера ${provider.label}? Все связанные услуги останутся.`)) return;
    await supabase.from("providers").delete().eq("id", provider.id);
    await logAuditAction("delete_service", "provider", provider.id, { key: provider.key });
    toast.success("Провайдер удалён");
    await loadProviders();
  };

  const addProvider = async () => {
    if (!newProvider.key || !newProvider.label || !newProvider.api_url || !newProvider.api_key_env) {
      toast.error("Заполните все поля");
      return;
    }
    const { error } = await supabase.from("providers").insert({
      key: newProvider.key,
      label: newProvider.label,
      api_url: newProvider.api_url,
      api_key_env: newProvider.api_key_env,
      balance_currency: newProvider.balance_currency,
      rate_currency: newProvider.rate_currency,
    } as any);
    if (error) {
      toast.error("Ошибка: " + error.message);
      return;
    }
    await logAuditAction("create_service", "provider", newProvider.key, { label: newProvider.label });
    toast.success("Провайдер добавлен");
    setAddOpen(false);
    setNewProvider({ key: "", label: "", api_url: "", api_key_env: "", balance_currency: "USD", rate_currency: "RUB" });
    await loadProviders();
  };

  const formatDate = (d: string | null) => {
    if (!d) return "—";
    return new Date(d).toLocaleString("ru-RU", { day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const statusBadge = (status: string | null) => {
    if (!status || status === "unknown") return <Badge variant="secondary" className="text-[9px]">Не проверен</Badge>;
    if (status === "healthy") return <Badge className="bg-green-500/20 text-green-600 text-[9px]">Healthy</Badge>;
    return <Badge variant="destructive" className="text-[9px]">Error</Badge>;
  };

  const getRate = (base: string, target: string) => {
    return exchangeRates.find(r => r.base_currency === base && r.target_currency === target);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-3">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Server className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Провайдеры</h1>
          <span className="text-xs text-muted-foreground">({providers.length})</span>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={checkAll} disabled={!!checking}>
            <Activity className="h-3 w-3 mr-1" />Health Check All
          </Button>
          <Dialog open={addOpen} onOpenChange={setAddOpen}>
            <DialogTrigger asChild>
              <Button size="sm" className="h-7 text-xs"><Plus className="h-3 w-3 mr-1" />Добавить</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader><DialogTitle>Новый провайдер</DialogTitle></DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label className="text-xs">Ключ (уникальный идентификатор)</Label>
                  <Input placeholder="mysmmpanel" value={newProvider.key} onChange={(e) => setNewProvider(p => ({ ...p, key: e.target.value }))} className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Название</Label>
                  <Input placeholder="My SMM Panel" value={newProvider.label} onChange={(e) => setNewProvider(p => ({ ...p, label: e.target.value }))} className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs">API URL</Label>
                  <Input placeholder="https://example.com/api/v2" value={newProvider.api_url} onChange={(e) => setNewProvider(p => ({ ...p, api_url: e.target.value }))} className="text-xs" />
                </div>
                <div>
                  <Label className="text-xs">Переменная окружения API ключа</Label>
                  <Input placeholder="MY_PANEL_API_KEY" value={newProvider.api_key_env} onChange={(e) => setNewProvider(p => ({ ...p, api_key_env: e.target.value.toUpperCase() }))} className="text-xs" />
                  <p className="text-[10px] text-muted-foreground mt-1">Имя секрета в Lovable Cloud. Добавьте ключ в настройках после создания.</p>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label className="text-xs">Валюта баланса</Label>
                    <Select value={newProvider.balance_currency} onValueChange={(v) => setNewProvider(p => ({ ...p, balance_currency: v }))}>
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-0.5">В чём отображается баланс аккаунта</p>
                  </div>
                  <div>
                    <Label className="text-xs">Валюта услуг (rate)</Label>
                    <Select value={newProvider.rate_currency} onValueChange={(v) => setNewProvider(p => ({ ...p, rate_currency: v }))}>
                      <SelectTrigger className="text-xs h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {CURRENCIES.map(c => <SelectItem key={c} value={c} className="text-xs">{c}</SelectItem>)}
                      </SelectContent>
                    </Select>
                    <p className="text-[10px] text-muted-foreground mt-0.5">В какой валюте цены на услуги</p>
                  </div>
                </div>
                <Button onClick={addProvider} className="w-full text-xs">Создать провайдера</Button>
              </div>
            </DialogContent>
          </Dialog>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadProviders}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Exchange rates bar */}
      <div className="flex items-center gap-3 px-3 py-1.5 border rounded-md bg-muted/30 shrink-0">
        <ArrowRightLeft className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
        <span className="text-[11px] font-medium text-muted-foreground">Курсы:</span>
        {exchangeRates.length === 0 ? (
          <span className="text-[11px] text-muted-foreground">Нет данных</span>
        ) : (
          exchangeRates.map(r => (
            <span key={`${r.base_currency}${r.target_currency}`} className="text-[11px] font-mono">
              1 {r.base_currency} = <span className="font-bold text-foreground">{Number(r.rate).toFixed(2)}</span> {r.target_currency}
            </span>
          ))
        )}
        {exchangeRates.length > 0 && (
          <span className="text-[10px] text-muted-foreground ml-auto">
            Обновлено: {formatDate(exchangeRates[0]?.fetched_at)}
          </span>
        )}
        <Button size="sm" variant="ghost" className="h-6 text-[10px] px-2" onClick={refreshExchangeRates} disabled={fetchingRates}>
          <RefreshCw className={`h-3 w-3 mr-1 ${fetchingRates ? "animate-spin" : ""}`} />
          {fetchingRates ? "..." : "Обновить"}
        </Button>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        {providers.map((p) => (
          <Card key={p.id} className={`border-border/60 ${!p.is_enabled ? "opacity-50" : ""}`}>
            <CardContent className="p-3 space-y-2">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {p.health_status === "healthy" ? <Wifi className="h-3.5 w-3.5 text-green-500" /> : <WifiOff className="h-3.5 w-3.5 text-muted-foreground" />}
                  <span className="font-bold text-sm">{p.label}</span>
                </div>
                <Switch checked={p.is_enabled} onCheckedChange={() => toggleEnabled(p)} className="scale-75" />
              </div>

              <div className="text-[10px] text-muted-foreground space-y-0.5">
                <p className="font-mono">{p.api_url}</p>
                <p>Ключ: <code className="bg-muted px-1 rounded">{p.api_key_env}</code></p>
              </div>

              <div className="flex items-center gap-3 text-[11px]">
                {statusBadge(p.health_status)}
                {p.health_latency_ms != null && (
                  <span className="flex items-center gap-0.5 text-muted-foreground">
                    <Clock className="h-2.5 w-2.5" />{p.health_latency_ms}ms
                  </span>
                )}
                {p.balance != null && (
                  <span className="flex items-center gap-0.5 text-green-600">
                    <DollarSign className="h-2.5 w-2.5" />{Number(p.balance).toFixed(2)} {p.balance_currency}
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-[10px]">
                <Badge variant="outline" className="text-[9px] px-1.5">Баланс: {p.balance_currency || "—"}</Badge>
                <Badge variant="outline" className="text-[9px] px-1.5">Rate: {(p as any).rate_currency || "RUB"}</Badge>
              </div>

              <div className="flex items-center justify-between text-[10px]">
                <span className="text-muted-foreground">{p.services_count} услуг</span>
                <span className="text-muted-foreground">Проверка: {formatDate(p.last_health_check)}</span>
              </div>

              <div className="flex gap-1 pt-1">
                <Button size="sm" variant="outline" className="h-6 text-[10px] flex-1" onClick={() => healthCheck(p)} disabled={checking === p.id}>
                  <Activity className="h-2.5 w-2.5 mr-1" />{checking === p.id ? "..." : "Check"}
                </Button>
                <Button size="sm" variant="destructive" className="h-6 text-[10px] px-2" onClick={() => deleteProvider(p)}>
                  <Trash2 className="h-2.5 w-2.5" />
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* History table */}
      <div className="flex-1 min-h-0 border rounded-md flex flex-col overflow-hidden">
        <div className="p-2 border-b bg-muted/30 shrink-0">
          <h2 className="text-xs font-bold">Все провайдеры</h2>
        </div>
        <div className="flex-1 overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="px-2">Статус</TableHead>
                <TableHead className="px-2">Провайдер</TableHead>
                <TableHead className="px-2">API URL</TableHead>
                <TableHead className="px-2">Ключ ENV</TableHead>
                <TableHead className="px-2">Баланс</TableHead>
                <TableHead className="px-2">Вал. баланса</TableHead>
                <TableHead className="px-2">Вал. услуг</TableHead>
                <TableHead className="px-2">Latency</TableHead>
                <TableHead className="px-2">Услуг</TableHead>
                <TableHead className="px-2">Последняя проверка</TableHead>
                <TableHead className="px-2">Активен</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {providers.map((p) => (
                <TableRow key={p.id} className="text-[11px]">
                  <TableCell className="px-2">{statusBadge(p.health_status)}</TableCell>
                  <TableCell className="px-2 font-medium">{p.label} <span className="text-muted-foreground">({p.key})</span></TableCell>
                  <TableCell className="px-2 font-mono text-[10px] text-muted-foreground">{p.api_url}</TableCell>
                  <TableCell className="px-2"><code className="bg-muted px-1 rounded text-[10px]">{p.api_key_env}</code></TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{p.balance != null ? `${Number(p.balance).toFixed(2)} ${p.balance_currency}` : "—"}</TableCell>
                  <TableCell className="px-2"><Badge variant="outline" className="text-[9px]">{p.balance_currency || "—"}</Badge></TableCell>
                  <TableCell className="px-2"><Badge variant="outline" className="text-[9px]">{(p as any).rate_currency || "RUB"}</Badge></TableCell>
                  <TableCell className="px-2">{p.health_latency_ms != null ? `${p.health_latency_ms}ms` : "—"}</TableCell>
                  <TableCell className="px-2">{p.services_count}</TableCell>
                  <TableCell className="px-2 whitespace-nowrap">{formatDate(p.last_health_check)}</TableCell>
                  <TableCell className="px-2"><Switch checked={p.is_enabled} onCheckedChange={() => toggleEnabled(p)} className="scale-[0.6]" /></TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminProviders;
