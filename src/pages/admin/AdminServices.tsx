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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { RefreshCw, Search, Filter, Shield, DollarSign, Package, Plus, Link2, Trash2, ArrowUpDown } from "lucide-react";
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

  // Create service dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newService, setNewService] = useState({ name: "", description: "", category: "", network: "", min_quantity: "100", max_quantity: "10000", price: "0" });

  // Mapping dialog
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

  // --- Services CRUD ---
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

    // Auto-create mapping
    await supabase.from("service_provider_mappings").insert({
      service_id: data.id,
      provider_service_id: ps.id,
      priority: 1,
    });

    toast.success("Услуга создана и привязана к провайдеру");
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
    if (!confirm("Удалить услугу? Все маппинги будут удалены.")) return;
    await supabase.from("services").delete().eq("id", id);
    toast.success("Услуга удалена");
    await loadAll();
  };

  // --- Mappings ---
  const addMapping = async () => {
    if (!mappingServiceId || !mappingProviderServiceId) return;
    const { error } = await supabase.from("service_provider_mappings").insert({
      service_id: mappingServiceId,
      provider_service_id: mappingProviderServiceId,
      priority: parseInt(mappingPriority) || 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Маппинг добавлен");
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
    toast.success("Маппинг удалён");
  };

  // --- Helpers ---
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
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <h1 className="text-2xl font-bold">Админ: Услуги</h1>
        </div>
        <div className="flex items-center gap-3 flex-wrap">
          <Button onClick={() => handleSync()} disabled={syncing} className="bg-gradient-to-r from-primary to-secondary text-primary-foreground">
            <RefreshCw className={`h-4 w-4 mr-2 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Синхр..." : "Синхр. провайдеров"}
          </Button>
        </div>
      </div>

      {/* Provider cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {PROVIDERS.map((p) => {
          const pServices = providerServices.filter((s) => s.provider === p.key);
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
                <p className="text-sm">Услуг: <strong>{pServices.length}</strong></p>
                {balances[p.key] && <Badge variant="outline" className="mt-2">{balances[p.key]}</Badge>}
              </CardContent>
            </Card>
          );
        })}
        <Card className="border-border/60">
          <CardHeader className="pb-2">
            <CardTitle className="text-base">Наш каталог</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xl font-bold">{services.length} услуг</p>
            <p className="text-sm text-muted-foreground">{services.filter((s) => s.is_enabled).length} включено</p>
          </CardContent>
        </Card>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="catalog">Наш каталог</TabsTrigger>
          <TabsTrigger value="providers">Услуги провайдеров</TabsTrigger>
        </TabsList>

        {/* Filters */}
        <Card className="border-border/60 mt-4">
          <CardHeader className="pb-3">
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input placeholder="Поиск..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-9" />
              </div>
              {activeTab === "providers" && (
                <Select value={providerFilter} onValueChange={setProviderFilter}>
                  <SelectTrigger className="w-full sm:w-[160px]"><SelectValue placeholder="Провайдер" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все провайдеры</SelectItem>
                    {PROVIDERS.map((p) => <SelectItem key={p.key} value={p.key}>{p.label}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
              <Select value={networkFilter} onValueChange={setNetworkFilter}>
                <SelectTrigger className="w-full sm:w-[160px]">
                  <Filter className="h-4 w-4 mr-2" /><SelectValue placeholder="Платформа" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все платформы</SelectItem>
                  {networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
                </SelectContent>
              </Select>
              {activeTab === "catalog" && (
                <>
                  <Select value={enabledFilter} onValueChange={setEnabledFilter}>
                    <SelectTrigger className="w-full sm:w-[140px]"><SelectValue placeholder="Статус" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      <SelectItem value="enabled">Включены</SelectItem>
                      <SelectItem value="disabled">Выключены</SelectItem>
                    </SelectContent>
                  </Select>
                  <Dialog open={createOpen} onOpenChange={setCreateOpen}>
                    <DialogTrigger asChild>
                      <Button><Plus className="h-4 w-4 mr-2" />Создать</Button>
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
          </CardHeader>

          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
              </div>
            ) : (
              <>
                <TabsContent value="catalog" className="mt-0">
                  {filteredServices.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>Нет услуг. Создайте вручную или из провайдера.</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[50px]">Вкл</TableHead>
                            <TableHead>Услуга</TableHead>
                            <TableHead>Платформа</TableHead>
                            <TableHead>Мин/Макс</TableHead>
                            <TableHead>Цена</TableHead>
                            <TableHead>Провайдеры</TableHead>
                            <TableHead className="w-[100px]">Действия</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredServices.map((svc) => {
                            const svcMappings = getMappingsForService(svc.id);
                            return (
                              <TableRow key={svc.id} className={!svc.is_enabled ? "opacity-50" : ""}>
                                <TableCell>
                                  <Switch checked={svc.is_enabled} onCheckedChange={(v) => toggleServiceEnabled(svc.id, v)} />
                                </TableCell>
                                <TableCell className="max-w-[250px]">
                                  <Input className="font-medium text-sm h-8 mb-1" defaultValue={svc.name} onBlur={(e) => { if (e.target.value !== svc.name) updateServiceField(svc.id, "name", e.target.value); }} />
                                  <Input className="text-xs text-muted-foreground h-7" placeholder="Описание" defaultValue={svc.description ?? ""} onBlur={(e) => { const v = e.target.value || null; if (v !== svc.description) updateServiceField(svc.id, "description", v); }} />
                                </TableCell>
                                <TableCell><Badge variant="outline">{svc.network}</Badge></TableCell>
                                <TableCell className="text-xs">{svc.min_quantity}/{svc.max_quantity}</TableCell>
                                <TableCell>
                                  <Input type="number" className="w-[100px] h-8 text-sm" defaultValue={svc.price} onBlur={(e) => { const v = parseFloat(e.target.value) || 0; if (v !== svc.price) updateServiceField(svc.id, "price", v); }} />
                                </TableCell>
                                <TableCell>
                                  <div className="space-y-1">
                                    {svcMappings.length === 0 ? (
                                      <span className="text-xs text-muted-foreground">Нет привязок</span>
                                    ) : (
                                      svcMappings.map((m) => {
                                        const ps = getProviderService(m.provider_service_id);
                                        return (
                                          <div key={m.id} className="flex items-center gap-1">
                                            <Badge variant={m.is_active ? "default" : "secondary"} className="text-[10px]">
                                              P{m.priority} {ps?.provider}
                                            </Badge>
                                            <Switch className="scale-75" checked={m.is_active} onCheckedChange={(v) => toggleMapping(m.id, v)} />
                                            <Button variant="ghost" size="sm" className="h-5 w-5 p-0" onClick={() => deleteMapping(m.id)}>
                                              <Trash2 className="h-3 w-3 text-destructive" />
                                            </Button>
                                          </div>
                                        );
                                      })
                                    )}
                                    <Button
                                      variant="ghost"
                                      size="sm"
                                      className="h-6 text-xs"
                                      onClick={() => { setMappingServiceId(svc.id); setMappingOpen(true); }}
                                    >
                                      <Link2 className="h-3 w-3 mr-1" />Привязать
                                    </Button>
                                  </div>
                                </TableCell>
                                <TableCell>
                                  <Button variant="ghost" size="sm" onClick={() => deleteService(svc.id)}>
                                    <Trash2 className="h-4 w-4 text-destructive" />
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="providers" className="mt-0">
                  {filteredProviderServices.length === 0 ? (
                    <div className="text-center py-12 text-muted-foreground">
                      <Package className="h-12 w-12 mx-auto mb-4 opacity-40" />
                      <p>Услуги не загружены. Нажмите «Синхр. провайдеров»</p>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Провайдер</TableHead>
                            <TableHead>ID</TableHead>
                            <TableHead>Услуга</TableHead>
                            <TableHead>Платформа</TableHead>
                            <TableHead>Мин/Макс</TableHead>
                            <TableHead>Цена пров.</TableHead>
                            <TableHead>Привязки</TableHead>
                            <TableHead>Действие</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {filteredProviderServices.map((svc) => {
                            const svcMappings = mappings.filter((m) => m.provider_service_id === svc.id);
                            return (
                              <TableRow key={svc.id}>
                                <TableCell><Badge variant="secondary" className="text-xs">{svc.provider}</Badge></TableCell>
                                <TableCell className="text-xs text-muted-foreground">{svc.provider_service_id}</TableCell>
                                <TableCell className="max-w-[250px]">
                                  <div className="font-medium text-sm truncate">{svc.name}</div>
                                  {svc.description && <div className="text-xs text-muted-foreground truncate">{svc.description}</div>}
                                </TableCell>
                                <TableCell><Badge variant="outline">{svc.network}</Badge></TableCell>
                                <TableCell className="text-xs">{svc.min_quantity}/{svc.max_quantity}</TableCell>
                                <TableCell className="text-sm">{Number(svc.rate).toFixed(2)} ₽</TableCell>
                                <TableCell>
                                  {svcMappings.length > 0 ? (
                                    svcMappings.map((m) => {
                                      const s = services.find((sv) => sv.id === m.service_id);
                                      return (
                                        <Badge key={m.id} variant="outline" className="text-[10px] mr-1">
                                          P{m.priority}: {s?.name?.slice(0, 20) || "?"}
                                        </Badge>
                                      );
                                    })
                                  ) : (
                                    <span className="text-xs text-muted-foreground">—</span>
                                  )}
                                </TableCell>
                                <TableCell>
                                  <Button variant="outline" size="sm" className="text-xs" onClick={() => createFromProvider(svc)}>
                                    <Plus className="h-3 w-3 mr-1" />В каталог
                                  </Button>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </CardContent>
        </Card>
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
            <Input
              type="number"
              placeholder="Приоритет (1 = основной)"
              value={mappingPriority}
              onChange={(e) => setMappingPriority(e.target.value)}
            />
            <p className="text-xs text-muted-foreground">
              Приоритет 1 = основной провайдер. При сбое система переключится на следующий по приоритету.
            </p>
            <Button onClick={addMapping} disabled={!mappingProviderServiceId} className="w-full">Привязать</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
