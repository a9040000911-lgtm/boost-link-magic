import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { RefreshCw, Search, Filter, Shield, DollarSign, Package } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  { key: "vexboost", label: "VexBoost" },
  { key: "smmpanelus", label: "SMMPanelUS" },
];

interface ProviderService {
  id: string;
  provider_service_id: number;
  provider: string;
  name: string;
  category: string;
  network: string;
  description: string | null;
  rate: number;
  min_quantity: number;
  max_quantity: number;
  our_price: number | null;
  markup_percent: number | null;
  is_enabled: boolean;
  can_cancel: boolean;
  can_refill: boolean;
}

const AdminServices = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [services, setServices] = useState<ProviderService[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isAdmin, setIsAdmin] = useState(false);
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [balances, setBalances] = useState<Record<string, string>>({});

  useEffect(() => {
    if (!user) return;
    checkAdminAndLoad();
  }, [user]);

  const checkAdminAndLoad = async () => {
    if (!user) return;
    const { data: roleData } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", user.id)
      .eq("role", "admin")
      .single();

    if (!roleData) {
      navigate("/dashboard");
      return;
    }
    setIsAdmin(true);
    await loadServices();
  };

  const loadServices = async () => {
    const { data } = await supabase
      .from("provider_services")
      .select("*")
      .order("provider", { ascending: true })
      .order("network", { ascending: true });
    setServices((data as ProviderService[]) || []);
    setLoading(false);
  };

  const handleSync = async (providerKey?: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-services", {
        body: { provider: providerKey || "all" },
      });
      if (error) throw error;
      const results = data.results;
      const msgs = Object.entries(results).map(
        ([k, v]: [string, any]) => `${k}: ${v.total} (${v.inserted} новых, ${v.updated} обнов.)`
      );
      toast.success(`Синхронизировано: ${msgs.join("; ")}`);
      await loadServices();
    } catch (e: any) {
      toast.error("Ошибка синхронизации: " + e.message);
    }
    setSyncing(false);
  };

  const handleFetchBalance = async (providerKey: string) => {
    try {
      const { data, error } = await supabase.functions.invoke("vexboost-proxy", {
        body: { action: "balance", provider: providerKey },
      });
      if (error) throw error;
      setBalances((prev) => ({ ...prev, [providerKey]: `${data.balance} ${data.currency}` }));
    } catch {
      toast.error(`Ошибка баланса ${providerKey}`);
    }
  };

  const toggleService = async (id: string, enabled: boolean) => {
    await supabase.from("provider_services").update({ is_enabled: enabled }).eq("id", id);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, is_enabled: enabled } : s)));
  };

  const updatePrice = async (id: string, price: string) => {
    const numPrice = price ? parseFloat(price) : null;
    await supabase.from("provider_services").update({ our_price: numPrice }).eq("id", id);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, our_price: numPrice } : s)));
  };

  const updateMarkup = async (id: string, markup: string) => {
    const numMarkup = markup ? parseFloat(markup) : null;
    await supabase.from("provider_services").update({ markup_percent: numMarkup }).eq("id", id);
    setServices((prev) => prev.map((s) => (s.id === id ? { ...s, markup_percent: numMarkup } : s)));
  };

  const networks = useMemo(() => [...new Set(services.map((s) => s.network))].sort(), [services]);

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (providerFilter !== "all" && s.provider !== providerFilter) return false;
      if (networkFilter !== "all" && s.network !== networkFilter) return false;
      if (enabledFilter === "enabled" && !s.is_enabled) return false;
      if (enabledFilter === "disabled" && s.is_enabled) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [services, search, networkFilter, providerFilter, enabledFilter]);

  const getClientPrice = (s: ProviderService) => {
    if (s.our_price !== null) return s.our_price;
    const markup = s.markup_percent ?? 30;
    return s.rate * (1 + markup / 100);
  };

  if (!isAdmin) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Админ: Услуги</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => handleSync()} disabled={syncing} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Синхр..." : "Синхр. все"}
          </Button>
        </div>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {PROVIDERS.map((p) => {
          const pServices = services.filter((s) => s.provider === p.key);
          const enabled = pServices.filter((s) => s.is_enabled).length;
          return (
            <Card key={p.key} className="border-border/60">
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-base">{p.label}</CardTitle>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={() => handleFetchBalance(p.key)}>
                      <DollarSign className="h-3 w-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => handleSync(p.key)} disabled={syncing}>
                      <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                    </Button>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-4 text-sm">
                  <span>Услуг: <strong>{pServices.length}</strong></span>
                  <span>Вкл: <strong className="text-green-500">{enabled}</strong></span>
                </div>
                {balances[p.key] && (
                  <Badge variant="outline" className="mt-2">{balances[p.key]}</Badge>
                )}
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Итого</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{services.length} услуг</p>
            <p className="text-sm text-muted-foreground">{services.filter((s) => s.is_enabled).length} включено</p>
          </CardContent>
        </Card>
      </div>

      {/* Filters & Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
            </div>
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Провайдер" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все провайдеры</SelectItem>
                {PROVIDERS.map((p) => (
                  <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Платформа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все платформы</SelectItem>
                {networks.map((n) => (
                  <SelectItem key={n} value={n}>{n}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={enabledFilter} onValueChange={setEnabledFilter}>
              <SelectTrigger className="w-full sm:w-[140px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                <SelectItem value="enabled">Включены</SelectItem>
                <SelectItem value="disabled">Выключены</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {services.length === 0 ? (
                <div>
                  <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                  <p>Услуги не загружены. Нажмите «Синхр. все»</p>
                </div>
              ) : "Ничего не найдено"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Вкл</TableHead>
                    <TableHead>Провайдер</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Платформа</TableHead>
                    <TableHead>Мин/Макс</TableHead>
                    <TableHead>Цена пров.</TableHead>
                    <TableHead>Наценка %</TableHead>
                    <TableHead>Наша цена</TableHead>
                    <TableHead>Клиенту</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((svc) => (
                    <TableRow key={svc.id} className={!svc.is_enabled ? "opacity-50" : ""}>
                      <TableCell>
                        <Switch checked={svc.is_enabled} onCheckedChange={(v) => toggleService(svc.id, v)} />
                      </TableCell>
                      <TableCell>
                        <Badge variant="secondary" className="text-xs">{svc.provider}</Badge>
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{svc.provider_service_id}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium text-sm truncate">{svc.name}</div>
                        {svc.description && <div className="text-xs text-muted-foreground truncate">{svc.description}</div>}
                      </TableCell>
                      <TableCell><Badge variant="outline">{svc.network}</Badge></TableCell>
                      <TableCell className="text-xs">{svc.min_quantity}/{svc.max_quantity}</TableCell>
                      <TableCell className="text-sm">{Number(svc.rate).toFixed(2)} ₽</TableCell>
                      <TableCell>
                        <Input type="number" className="w-[80px] h-8 text-sm" defaultValue={svc.markup_percent ?? 30} onBlur={(e) => updateMarkup(svc.id, e.target.value)} />
                      </TableCell>
                      <TableCell>
                        <Input type="number" className="w-[100px] h-8 text-sm" placeholder="Авто" defaultValue={svc.our_price ?? ""} onBlur={(e) => updatePrice(svc.id, e.target.value)} />
                      </TableCell>
                      <TableCell className="font-bold text-sm">{getClientPrice(svc).toFixed(2)} ₽</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminServices;
