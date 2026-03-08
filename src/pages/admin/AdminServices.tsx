import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Search, Shield, DollarSign, Package, Plus, Link2, Trash2 } from "lucide-react";
import { toast } from "sonner";

const PROVIDERS = [
  { key: "vexboost", label: "VexBoost" },
  { key: "smmpanelus", label: "SMMPanelUS" },
];

interface ApiResponse<T> {
  success: boolean;
  data: T | null;
  error: string | null;
}

interface VexBoostService {
  service: number;
  name: string;
  category: string;
  type: string;
  rate: string;
  min: string;
  max: string;
  dripfeed: string;
  desc: string;
  average_time: string;
}

interface VexBoostBalance {
  balance: string;
  currency: string;
}

interface VexBoostOrderResponse {
  order: number;
  error: string;
}

interface SmmpanelusService {
  service: number;
  name: string;
  category: string;
  rate: string;
  min: string;
  max: string;
  desc: string;
}

interface SmmpanelusBalance {
  balance: number;
  currency: string;
}

interface SmmpanelusOrderResponse {
  order: number;
  error: string;
}

interface SmmpanelusRefillResponse {
  refill: number;
  error: string;
}

interface SmmpanelusStatusResponse {
  status: string;
  remains: number;
  start_count: number;
  error: string;
}

interface SmmpanelusMultiStatusResponse {
  [order_id: string]: SmmpanelusStatusResponse;
}

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

interface Service {
  id: string;
  name: string;
  description: string | null;
  category: string;
  network: string;
  min_quantity: number;
  max_quantity: number;
  price: number;
  is_enabled: boolean;
}

interface Mapping {
  id: string;
  service_id: string;
  provider_service_id: string;
  priority: number;
  is_active: boolean;
}

const AdminServices = () => {
  const { user } = useAuth();
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [balances, setBalances] = useState<Record<string, string>>({});
  const [activeTab, setActiveTab] = useState("catalog");
  const [createOpen, setCreateOpen] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", category: "", network: "", min_quantity: "100", max_quantity: "10000", price: "0" });
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingServiceId, setMappingServiceId] = useState<string | null>(null);
  const [mappingProviderServiceId, setMappingProviderServiceId] = useState("");
  const [mappingPriority, setMappingPriority] = useState("1");

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [psRes, sRes, mRes] = await Promise.all([
      supabase.from("provider_services").select("*").order("provider").order("network"),
      supabase.from("services").select("*").order("network").order("name"),
      supabase.from("service_provider_mappings").select("*").order("priority"),
    ]);
    setProviderServices((psRes.data as ProviderService[]) || []);
    setServices((sRes.data as Service[]) || []);
    setMappings((mRes.data as Mapping[]) || []);
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
      await loadAll();
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
      toast.error("Ошибка получения баланса");
    }
  };

  const createService = async () => {
    const { error } = await supabase.from("services").insert({
      name: newService.name,
      description: newService.description || null,
      category: newService.category || "Uncategorized",
      network: newService.network || "Other",
      min_quantity: parseInt(newService.min_quantity) || 100,
      max_quantity: parseInt(newService.max_quantity) || 10000,
      price: parseFloat(newService.price) || 0,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Услуга создана");
    setCreateOpen(false);
    setNewService({ name: "", description: "", category: "", network: "", min_quantity: "100", max_quantity: "10000", price: "0" });
    await loadAll();
  };

  const createFromProvider = async (ps: ProviderService) => {
    const { data, error } = await supabase.from("services").insert({
      name: ps.name,
      description: ps.description,
      category: ps.category,
      network: ps.network,
      min_quantity: ps.min_quantity,
      max_quantity: ps.max_quantity,
      price: ps.our_price ?? ps.rate * (1 + (ps.markup_percent ?? 30) / 100),
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("service_provider_mappings").insert({
      service_id: data.id,
      provider_service_id: ps.id,
      priority: 1,
    });
    toast.success("Услуга создана и привязана");
    await loadAll();
  };

  const toggleServiceEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("services").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", id);
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_enabled: enabled } : s));
  };

  const updateServiceField = async (id: string, field: string, value: any) => {
    await supabase.from("services").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteService = async (id: string) => {
    if (!confirm("Удалить услугу?")) return;
    await supabase.from("services").delete().eq("id", id);
    toast.success("Удалено");
    await loadAll();
  };

  const addMapping = async () => {
    if (!mappingServiceId || !mappingProviderServiceId) return;
    const { error } = await supabase.from("service_provider_mappings").insert({
      service_id: mappingServiceId,
      provider_service_id: mappingProviderServiceId,
      priority: parseInt(mappingPriority) || 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Привязано");
    setMappingOpen(false);
    setMappingProviderServiceId("");
    setMappingPriority("1");
    await loadAll();
  };

  const toggleMapping = async (id: string, active: boolean) => {
    await supabase.from("service_provider_mappings").update({ is_active: active }).eq("id", id);
    setMappings((prev) => prev.map((m) => m.id === id ? { ...m, is_active: active } : m));
  };

  const deleteMapping = async (id: string) => {
    await supabase.from("service_provider_mappings").delete().eq("id", id);
    setMappings((prev) => prev.filter((m) => m.id !== id));
  };

  const getMappingsForService = (serviceId: string) =>
    mappings.filter((m) => m.service_id === serviceId).sort((a, b) => a.priority - b.priority);

  const getProviderService = (psId: string) => providerServices.find((ps) => ps.id === psId);

  const networks = useMemo(() => {
    const src = activeTab === "catalog" ? services : providerServices;
    return [...new Set(src.map((s) => s.network))].sort();
  }, [services, providerServices, activeTab]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (networkFilter !== "all" && s.network !== networkFilter) return false;
      if (enabledFilter === "enabled" && !s.is_enabled) return false;
      if (enabledFilter === "disabled" && s.is_enabled) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [services, search, networkFilter, enabledFilter]);

  const filteredProviderServices = useMemo(() => {
    return providerServices.filter((s) => {
      if (providerFilter !== "all" && s.provider !== providerFilter) return false;
      if (networkFilter !== "all" && s.network !== networkFilter) return false;
      if (search && !s.name.toLowerCase().includes(search.toLowerCase()) && !s.category.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [providerServices, search, networkFilter, providerFilter]);

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Shield className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Услуги</h1>
        </div>
        <Button size="sm" variant="outline" onClick={() => handleSync()} disabled={syncing} className="h-7 text-xs">
          <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
          {syncing ? "Синхр..." : "Синхр. провайдеров"}
        </Button>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        {PROVIDERS.map((p) => {
          const cnt = providerServices.filter((s) => s.provider === p.key).length;
          return (
            <Card key={p.key} className="border-border/60">
              <CardContent className="p-2 flex items-center justify-between">
                <div>
                  <p className="font-medium text-xs">{p.label} ({cnt})</p>
                  {balances[p.key] && <span className="text-[10px] text-muted-foreground">{balances[p.key]}</span>}
                </div>
                <div className="flex gap-0.5">
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleFetchBalance(p.key)}>
                    <DollarSign className="h-3 w-3" />
                  </Button>
                  <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => handleSync(p.key)} disabled={syncing}>
                    <RefreshCw className={`h-3 w-3 ${syncing ? "animate-spin" : ""}`} />
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-border/60">
          <CardContent className="p-2">
            <p className="font-medium text-xs">Каталог: {services.length} ({services.filter((s) => s.is_enabled).length} вкл.)</p>
          </CardContent>
        </Card>
      </div>

      {/* Tabs + filters + table */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <TabsList className="h-7">
            <TabsTrigger value="catalog" className="text-xs h-6 px-2">Каталог</TabsTrigger>
            <TabsTrigger value="providers" className="text-xs h-6 px-2">Провайдеры</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[180px] text-xs" />
          </div>
          {activeTab === "providers" && (
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="Провайдер" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все провайдеры</SelectItem>
                {PROVIDERS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-[130px] h-7 text-xs"><SelectValue placeholder="Платформа" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все платформы</SelectItem>
              {networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeTab === "catalog" && (
            <>
              <Select value={enabledFilter} onValueChange={setEnabledFilter}>
                <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  <SelectItem value="enabled">Вкл</SelectItem>
                  <SelectItem value="disabled">Выкл</SelectItem>
                </SelectContent>
              </Select>
              <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                <DialogTrigger asChild>
                  <Button size="sm" className="h-7 text-xs px-2"><Plus className="h-3 w-3 mr-1" />Создать</Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader><DialogTitle>Новая услуга</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <Input placeholder="Название" value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                    <Textarea placeholder="Описание" value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
                    <div className="grid grid-cols-2 gap-3">
                      <Input placeholder="Категория" value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} />
                      <Input placeholder="Платформа" value={newService.network} onChange={(e) => setNewService({ ...newService, network: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <Input type="number" placeholder="Мин" value={newService.min_quantity} onChange={(e) => setNewService({ ...newService, min_quantity: e.target.value })} />
                      <Input type="number" placeholder="Макс" value={newService.max_quantity} onChange={(e) => setNewService({ ...newService, max_quantity: e.target.value })} />
                      <Input type="number" placeholder="Цена" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
                    </div>
                    <Button onClick={createService} disabled={!newService.name} className="w-full">Создать</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Table */}
        <div className="flex-1 min-h-0 overflow-auto mt-2 border rounded-md">
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
            </div>
          ) : (
            <>
              <TabsContent value="catalog" className="mt-0">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Нет услуг</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px]">
                        <TableHead className="w-10 px-1">Вкл</TableHead>
                        <TableHead className="px-1">Название</TableHead>
                        <TableHead className="px-1">Описание</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Сеть</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Мин</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Макс</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Цена</TableHead>
                        <TableHead className="px-1">Провайдеры</TableHead>
                        <TableHead className="w-8 px-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((svc) => {
                        const svcMappings = getMappingsForService(svc.id);
                        return (
                          <TableRow key={svc.id} className={`text-[11px] ${!svc.is_enabled ? "opacity-40" : ""}`}>
                            <TableCell className="px-1">
                              <Switch checked={svc.is_enabled} onCheckedChange={(v) => toggleServiceEnabled(svc.id, v)} className="scale-[0.65]" />
                            </TableCell>
                            <TableCell className="px-1 min-w-[180px]">
                              <Input className="text-[11px] h-6 px-1" defaultValue={svc.name} onBlur={(e) => { if (e.target.value !== svc.name) updateServiceField(svc.id, "name", e.target.value); }} />
                            </TableCell>
                            <TableCell className="px-1 min-w-[120px]">
                              <Input className="text-[11px] h-6 px-1" placeholder="—" defaultValue={svc.description ?? ""} onBlur={(e) => { const v = e.target.value || null; if (v !== svc.description) updateServiceField(svc.id, "description", v); }} />
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">
                              <Badge variant="outline" className="text-[9px] px-1">{svc.network}</Badge>
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{svc.min_quantity}</TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{svc.max_quantity}</TableCell>
                            <TableCell className="px-1">
                              <Input type="number" className="w-[70px] h-6 text-[11px] px-1" defaultValue={svc.price} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; if (v !== svc.price) updateServiceField(svc.id, "price", v); }} />
                            </TableCell>
                            <TableCell className="px-1">
                              <div className="flex items-center gap-0.5 flex-wrap">
                                {svcMappings.map((m) => {
                                  const ps = getProviderService(m.provider_service_id);
                                  return (
                                    <div key={m.id} className="flex items-center gap-0.5">
                                      <Badge variant={m.is_active ? "default" : "secondary"} className="text-[8px] px-0.5 leading-none">
                                        P{m.priority} {ps?.provider}
                                      </Badge>
                                      <Switch className="scale-50" checked={m.is_active} onCheckedChange={(v) => toggleMapping(m.id, v)} />
                                      <button className="text-destructive" onClick={() => deleteMapping(m.id)}><Trash2 className="h-2.5 w-2.5" /></button>
                                    </div>
                                  );
                                })}
                                <button className="text-primary" onClick={() => { setMappingServiceId(svc.id); setMappingOpen(true); }}>
                                  <Link2 className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="px-1">
                              <button className="text-destructive" onClick={() => deleteService(svc.id)}><Trash2 className="h-3 w-3" /></button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              <TabsContent value="providers" className="mt-0">
                {filteredProviderServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" />
                    <p>Синхронизируйте провайдеров</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px]">
                        <TableHead className="px-1 whitespace-nowrap">Пров.</TableHead>
                        <TableHead className="px-1">ID</TableHead>
                        <TableHead className="px-1">Услуга</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Сеть</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Мин</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Макс</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Цена</TableHead>
                        <TableHead className="px-1">Привязки</TableHead>
                        <TableHead className="px-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProviderServices.map((svc) => {
                        const svcMappings = mappings.filter((m) => m.provider_service_id === svc.id);
                        return (
                          <TableRow key={svc.id} className="text-[11px]">
                            <TableCell className="px-1 whitespace-nowrap">
                              <Badge variant="secondary" className="text-[9px] px-1">{svc.provider}</Badge>
                            </TableCell>
                            <TableCell className="px-1 text-muted-foreground">{svc.provider_service_id}</TableCell>
                            <TableCell className="px-1">
                              <div className="truncate max-w-[280px] font-medium">{svc.name}</div>
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">
                              <Badge variant="outline" className="text-[9px] px-1">{svc.network}</Badge>
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{svc.min_quantity}</TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{svc.max_quantity}</TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{Number(svc.rate).toFixed(2)}₽</TableCell>
                            <TableCell className="px-1">
                              {svcMappings.length > 0 ? svcMappings.map((m) => {
                                const s = services.find((sv) => sv.id === m.service_id);
                                return <Badge key={m.id} variant="outline" className="text-[8px] mr-0.5">P{m.priority}: {s?.name?.slice(0, 12) || "?"}</Badge>;
                              }) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="px-1">
                              <Button variant="outline" size="sm" className="h-5 text-[9px] px-1" onClick={() => createFromProvider(svc)}>
                                <Plus className="h-2 w-2 mr-0.5" />Каталог
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>
            </>
          )}
        </div>
      </Tabs>

      {/* Mapping dialog */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>Привязать провайдера</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <Select value={mappingProviderServiceId} onValueChange={setMappingProviderServiceId}>
              <SelectTrigger><SelectValue placeholder="Выберите услугу провайдера" /></SelectTrigger>
              <SelectContent>
                {providerServices.map((ps) => (
                  <SelectItem key={ps.id} value={ps.id}>
                    [{ps.provider}] {ps.name} ({ps.rate}₽)
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input type="number" placeholder="Приоритет (1 = основной)" value={mappingPriority} onChange={(e) => setMappingPriority(e.target.value)} />
            <p className="text-xs text-muted-foreground">P1 = основной. При сбое → следующий.</p>
            <Button onClick={addMapping} disabled={!mappingProviderServiceId} className="w-full">Привязать</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
