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

interface ProviderService {
  id: string;
  provider_service_id: number;
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
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [balance, setBalance] = useState<string | null>(null);

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
      .order("network", { ascending: true });
    setServices((data as ProviderService[]) || []);
    setLoading(false);
  };

  const handleSync = async () => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-services");
      if (error) throw error;
      toast.success(`Синхронизировано: ${data.total} услуг (${data.inserted} новых, ${data.updated} обновлено)`);
      await loadServices();
    } catch (e: any) {
      toast.error("Ошибка синхронизации: " + e.message);
    }
    setSyncing(false);
  };

  const handleFetchBalance = async () => {
    try {
      const { data, error } = await supabase.functions.invoke("vexboost-proxy", {
        body: { action: "balance" },
      });
      if (error) throw error;
      setBalance(`${data.balance} ${data.currency}`);
    } catch (e: any) {
      toast.error("Ошибка получения баланса");
    }
  };

  const toggleService = async (id: string, enabled: boolean) => {
    await supabase
      .from("provider_services")
      .update({ is_enabled: enabled })
      .eq("id", id);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, is_enabled: enabled } : s))
    );
  };

  const updatePrice = async (id: string, price: string) => {
    const numPrice = price ? parseFloat(price) : null;
    await supabase
      .from("provider_services")
      .update({ our_price: numPrice })
      .eq("id", id);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, our_price: numPrice } : s))
    );
  };

  const updateMarkup = async (id: string, markup: string) => {
    const numMarkup = markup ? parseFloat(markup) : null;
    await supabase
      .from("provider_services")
      .update({ markup_percent: numMarkup })
      .eq("id", id);
    setServices((prev) =>
      prev.map((s) => (s.id === id ? { ...s, markup_percent: numMarkup } : s))
    );
  };

  const networks = useMemo(
    () => [...new Set(services.map((s) => s.network))].sort(),
    [services]
  );

  const filtered = useMemo(() => {
    return services.filter((s) => {
      if (networkFilter !== "all" && s.network !== networkFilter) return false;
      if (enabledFilter === "enabled" && !s.is_enabled) return false;
      if (enabledFilter === "disabled" && s.is_enabled) return false;
      if (
        search &&
        !s.name.toLowerCase().includes(search.toLowerCase()) &&
        !s.category.toLowerCase().includes(search.toLowerCase())
      )
        return false;
      return true;
    });
  }, [services, search, networkFilter, enabledFilter]);

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
        <div className="flex items-center gap-3">
          {balance && (
            <Badge variant="outline" className="text-sm">
              Баланс: {balance}
            </Badge>
          )}
          <Button variant="outline" size="sm" onClick={handleFetchBalance}>
            <DollarSign className="h-4 w-4 mr-1" /> Баланс
          </Button>
          <Button onClick={handleSync} disabled={syncing} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Синхронизация..." : "Синхронизировать"}
          </Button>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Всего услуг</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{services.length}</p></CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Включено</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold text-green-500">{services.filter((s) => s.is_enabled).length}</p></CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Платформ</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{networks.length}</p></CardContent>
        </Card>
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-xs text-muted-foreground">Категорий</CardTitle>
          </CardHeader>
          <CardContent><p className="text-xl font-bold">{new Set(services.map((s) => s.category)).size}</p></CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по названию или категории..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={networkFilter} onValueChange={setNetworkFilter}>
              <SelectTrigger className="w-full sm:w-[180px]">
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
              <SelectTrigger className="w-full sm:w-[160px]">
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
                  <p>Услуги не загружены. Нажмите «Синхронизировать»</p>
                </div>
              ) : (
                "Ничего не найдено"
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[50px]">Вкл</TableHead>
                    <TableHead>ID</TableHead>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Платформа</TableHead>
                    <TableHead>Категория</TableHead>
                    <TableHead>Мин/Макс</TableHead>
                    <TableHead>Цена провайдера</TableHead>
                    <TableHead>Наценка %</TableHead>
                    <TableHead>Наша цена</TableHead>
                    <TableHead>Итого клиенту</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((svc) => (
                    <TableRow key={svc.id} className={!svc.is_enabled ? "opacity-50" : ""}>
                      <TableCell>
                        <Switch
                          checked={svc.is_enabled}
                          onCheckedChange={(v) => toggleService(svc.id, v)}
                        />
                      </TableCell>
                      <TableCell className="text-xs text-muted-foreground">{svc.provider_service_id}</TableCell>
                      <TableCell className="max-w-[200px]">
                        <div className="font-medium text-sm truncate">{svc.name}</div>
                        {svc.description && (
                          <div className="text-xs text-muted-foreground truncate">{svc.description}</div>
                        )}
                      </TableCell>
                      <TableCell><Badge variant="outline">{svc.network}</Badge></TableCell>
                      <TableCell className="text-xs max-w-[150px] truncate">{svc.category}</TableCell>
                      <TableCell className="text-xs">{svc.min_quantity} / {svc.max_quantity}</TableCell>
                      <TableCell className="text-sm">{Number(svc.rate).toFixed(2)} ₽</TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-[80px] h-8 text-sm"
                          defaultValue={svc.markup_percent ?? 30}
                          onBlur={(e) => updateMarkup(svc.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell>
                        <Input
                          type="number"
                          className="w-[100px] h-8 text-sm"
                          placeholder="Авто"
                          defaultValue={svc.our_price ?? ""}
                          onBlur={(e) => updatePrice(svc.id, e.target.value)}
                        />
                      </TableCell>
                      <TableCell className="font-bold text-sm">
                        {getClientPrice(svc).toFixed(2)} ₽
                      </TableCell>
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
