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
import { Label } from "@/components/ui/label";
import {
  RefreshCw, Search, Package, Plus, Link2, Trash2, ArrowUp, ArrowDown,
  ChevronRight, Eye, EyeOff, Zap, ShieldCheck, AlertTriangle, Copy
} from "lucide-react";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";

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
  const [providers, setProviders] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("catalog");

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "", description: "", category: "", network: "",
    min_quantity: "100", max_quantity: "10000", price: "0"
  });

  // Mapping dialog
  const [mappingOpen, setMappingOpen] = useState(false);
  const [mappingServiceId, setMappingServiceId] = useState<string | null>(null);
  const [mappingProviderServiceId, setMappingProviderServiceId] = useState("");
  const [mappingPriority, setMappingPriority] = useState("1");
  const [mappingProviderFilter, setMappingProviderFilter] = useState("all");
  const [mappingSearch, setMappingSearch] = useState("");

  // Detail dialog
  const [detailService, setDetailService] = useState<Service | null>(null);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [psRes, sRes, mRes, pRes] = await Promise.all([
      supabase.from("provider_services").select("*").order("provider").order("network"),
      supabase.from("services").select("*").order("network").order("category").order("name"),
      supabase.from("service_provider_mappings").select("*").order("priority"),
      supabase.from("providers").select("*").eq("is_enabled", true),
    ]);
    setProviderServices((psRes.data as ProviderService[]) || []);
    setServices((sRes.data as Service[]) || []);
    setMappings((mRes.data as Mapping[]) || []);
    setProviders(pRes.data || []);
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
      await logAuditAction("sync_services", "provider_services", providerKey || "all");
      await loadAll();
    } catch (e: any) {
      toast.error("Ошибка синхронизации: " + e.message);
    }
    setSyncing(false);
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
    await logAuditAction("create_service", "service", undefined, { name: newService.name });
    toast.success("Услуга создана");
    setCreateOpen(false);
    setNewService({ name: "", description: "", category: "", network: "", min_quantity: "100", max_quantity: "10000", price: "0" });
    await loadAll();
  };

  const createFromProvider = async (ps: ProviderService) => {
    const price = ps.our_price ?? ps.rate * (1 + (ps.markup_percent ?? 30) / 100);
    const { data, error } = await supabase.from("services").insert({
      name: ps.name,
      description: ps.description,
      category: ps.category,
      network: ps.network,
      min_quantity: ps.min_quantity,
      max_quantity: ps.max_quantity,
      price,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("service_provider_mappings").insert({
      service_id: data.id,
      provider_service_id: ps.id,
      priority: 1,
    });
    await logAuditAction("create_service", "service", data.id, { from_provider: ps.provider, provider_sid: ps.provider_service_id });
    toast.success("Услуга создана и привязана к провайдеру");
    await loadAll();
  };

  const toggleServiceEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("services").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", id);
    await logAuditAction("toggle_service", "service", id, { enabled });
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_enabled: enabled } : s));
  };

  const updateServiceField = async (id: string, field: string, value: any) => {
    await supabase.from("services").update({ [field]: value, updated_at: new Date().toISOString() }).eq("id", id);
    await logAuditAction("update_service", "service", id, { field, value });
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, [field]: value } : s));
  };

  const deleteService = async (id: string) => {
    if (!confirm("Удалить услугу? Все привязки будут удалены.")) return;
    await supabase.from("service_provider_mappings").delete().eq("service_id", id);
    await supabase.from("services").delete().eq("id", id);
    await logAuditAction("delete_service", "service", id);
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
    toast.success("Провайдер привязан");
    setMappingOpen(false);
    setMappingProviderServiceId("");
    setMappingPriority("1");
    setMappingSearch("");
    await loadAll();
  };

  const toggleMapping = async (id: string, active: boolean) => {
    await supabase.from("service_provider_mappings").update({ is_active: active }).eq("id", id);
    setMappings((prev) => prev.map((m) => m.id === id ? { ...m, is_active: active } : m));
  };

  const updateMappingPriority = async (id: string, newPriority: number) => {
    await supabase.from("service_provider_mappings").update({ priority: newPriority }).eq("id", id);
    setMappings((prev) => prev.map((m) => m.id === id ? { ...m, priority: newPriority } : m));
  };

  const deleteMapping = async (id: string) => {
    await supabase.from("service_provider_mappings").delete().eq("id", id);
    setMappings((prev) => prev.filter((m) => m.id !== id));
    toast.success("Привязка удалена");
  };

  const getMappingsForService = (serviceId: string) =>
    mappings.filter((m) => m.service_id === serviceId).sort((a, b) => a.priority - b.priority);

  const getProviderService = (psId: string) => providerServices.find((ps) => ps.id === psId);

  // Derived data
  const categories = useMemo(() => {
    const src = activeTab === "catalog" ? services : providerServices;
    return [...new Set(src.map((s) => s.category))].sort();
  }, [services, providerServices, activeTab]);

  const networks = useMemo(() => {
    const src = activeTab === "catalog" ? services : providerServices;
    return [...new Set(src.map((s) => s.network))].sort();
  }, [services, providerServices, activeTab]);

  const providerKeys = useMemo(() => {
    return [...new Set(providerServices.map((s) => s.provider))].sort();
  }, [providerServices]);

  const filteredServices = useMemo(() => {
    return services.filter((s) => {
      if (networkFilter !== "all" && s.network !== networkFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (enabledFilter === "enabled" && !s.is_enabled) return false;
      if (enabledFilter === "disabled" && s.is_enabled) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q) && !s.id.includes(q)) return false;
      }
      return true;
    });
  }, [services, search, networkFilter, categoryFilter, enabledFilter]);

  const filteredProviderServices = useMemo(() => {
    return providerServices.filter((s) => {
      if (providerFilter !== "all" && s.provider !== providerFilter) return false;
      if (networkFilter !== "all" && s.network !== networkFilter) return false;
      if (categoryFilter !== "all" && s.category !== categoryFilter) return false;
      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q) && !String(s.provider_service_id).includes(q)) return false;
      }
      return true;
    });
  }, [providerServices, search, networkFilter, categoryFilter, providerFilter]);

  // Stats
  const statsEnabled = services.filter((s) => s.is_enabled).length;
  const statsWithProviders = services.filter((s) => getMappingsForService(s.id).length > 0).length;
  const statsWithFailover = services.filter((s) => getMappingsForService(s.id).filter(m => m.is_active).length >= 2).length;
  const statsOrphan = services.filter((s) => s.is_enabled && getMappingsForService(s.id).filter(m => m.is_active).length === 0).length;

  const filteredMappingProviders = providerServices.filter((ps) => {
    if (mappingProviderFilter !== "all" && ps.provider !== mappingProviderFilter) return false;
    if (mappingSearch) {
      const q = mappingSearch.toLowerCase();
      if (!ps.name.toLowerCase().includes(q) && !String(ps.provider_service_id).includes(q)) return false;
    }
    return true;
  });

  const copyId = (id: string) => {
    navigator.clipboard.writeText(id);
    toast.success("ID скопирован");
  };

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Package className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Управление услугами</h1>
        </div>
        <div className="flex items-center gap-1">
          <Button size="sm" variant="outline" onClick={() => handleSync()} disabled={syncing} className="h-7 text-xs">
            <RefreshCw className={`h-3 w-3 mr-1 ${syncing ? "animate-spin" : ""}`} />
            {syncing ? "Синхр..." : "Синхр. провайдеров"}
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadAll}>
            <RefreshCw className="h-3 w-3" />
          </Button>
        </div>
      </div>

      {/* Stats cards */}
      <div className="grid grid-cols-5 gap-2 shrink-0">
        <Card className="border-border/60">
          <CardContent className="p-2">
            <p className="text-lg font-bold">{services.length}</p>
            <p className="text-[10px] text-muted-foreground">Всего услуг ({statsEnabled} вкл.)</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-2">
            <p className="text-lg font-bold">{providerServices.length}</p>
            <p className="text-[10px] text-muted-foreground">Услуг провайдеров</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-2 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <div>
              <p className="text-lg font-bold">{statsWithFailover}</p>
              <p className="text-[10px] text-muted-foreground">С failover (2+ пров.)</p>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-2 flex items-center gap-1">
            <Zap className="h-3.5 w-3.5 text-primary" />
            <div>
              <p className="text-lg font-bold">{statsWithProviders}</p>
              <p className="text-[10px] text-muted-foreground">С привязками</p>
            </div>
          </CardContent>
        </Card>
        {statsOrphan > 0 ? (
          <Card className="border-destructive/50">
            <CardContent className="p-2 flex items-center gap-1">
              <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
              <div>
                <p className="text-lg font-bold text-destructive">{statsOrphan}</p>
                <p className="text-[10px] text-destructive">Без провайдера!</p>
              </div>
            </CardContent>
          </Card>
        ) : (
          <Card className="border-green-500/30">
            <CardContent className="p-2 flex items-center gap-1">
              <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
              <div>
                <p className="text-lg font-bold text-green-600">0</p>
                <p className="text-[10px] text-green-600">Все привязаны ✓</p>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Tabs + filters */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <div className="flex items-center gap-2 shrink-0 flex-wrap">
          <TabsList className="h-7">
            <TabsTrigger value="catalog" className="text-xs h-6 px-2">Каталог ({services.length})</TabsTrigger>
            <TabsTrigger value="providers" className="text-xs h-6 px-2">Провайдеры ({providerServices.length})</TabsTrigger>
          </TabsList>
          <div className="relative">
            <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
            <Input placeholder="Поиск по имени, ID..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[180px] text-xs" />
          </div>
          <Select value={networkFilter} onValueChange={setNetworkFilter}>
            <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue placeholder="Платформа" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все платформы</SelectItem>
              {networks.map((n) => <SelectItem key={n} value={n}>{n}</SelectItem>)}
            </SelectContent>
          </Select>
          <Select value={categoryFilter} onValueChange={setCategoryFilter}>
            <SelectTrigger className="w-[150px] h-7 text-xs"><SelectValue placeholder="Категория" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Все категории</SelectItem>
              {categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}
            </SelectContent>
          </Select>
          {activeTab === "providers" && (
            <Select value={providerFilter} onValueChange={setProviderFilter}>
              <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue placeholder="Провайдер" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {providerKeys.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
          {activeTab === "catalog" && (
            <>
              <Select value={enabledFilter} onValueChange={setEnabledFilter}>
                <SelectTrigger className="w-[90px] h-7 text-xs"><SelectValue /></SelectTrigger>
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
                    <div>
                      <Label className="text-xs">Название (наше, видно клиентам)</Label>
                      <Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} />
                    </div>
                    <div>
                      <Label className="text-xs">Описание (для клиентов)</Label>
                      <Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Категория</Label>
                        <Input value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} placeholder="Подписчики" />
                      </div>
                      <div>
                        <Label className="text-xs">Платформа</Label>
                        <Input value={newService.network} onChange={(e) => setNewService({ ...newService, network: e.target.value })} placeholder="Instagram" />
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div>
                        <Label className="text-xs">Мин. кол-во</Label>
                        <Input type="number" value={newService.min_quantity} onChange={(e) => setNewService({ ...newService, min_quantity: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Макс. кол-во</Label>
                        <Input type="number" value={newService.max_quantity} onChange={(e) => setNewService({ ...newService, max_quantity: e.target.value })} />
                      </div>
                      <div>
                        <Label className="text-xs">Цена за 1000</Label>
                        <Input type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} />
                      </div>
                    </div>
                    <p className="text-[10px] text-muted-foreground">После создания привяжите услуги провайдеров для автоматического выполнения.</p>
                    <Button onClick={createService} disabled={!newService.name} className="w-full">Создать</Button>
                  </div>
                </DialogContent>
              </Dialog>
            </>
          )}
        </div>

        {/* Tables */}
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
                      <TableRow className="text-[10px]">
                        <TableHead className="w-8 px-1">Вкл</TableHead>
                        <TableHead className="px-1 w-[60px]">ID</TableHead>
                        <TableHead className="px-1">Название</TableHead>
                        <TableHead className="px-1">Описание</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Категория</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Сеть</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Мин</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Макс</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Цена/1к</TableHead>
                        <TableHead className="px-1">Failover цепочка</TableHead>
                        <TableHead className="w-8 px-1"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((svc) => {
                        const svcMappings = getMappingsForService(svc.id);
                        const activeCount = svcMappings.filter(m => m.is_active).length;
                        const hasFailover = activeCount >= 2;
                        const isOrphan = svc.is_enabled && activeCount === 0;

                        return (
                          <TableRow key={svc.id} className={`text-[11px] ${!svc.is_enabled ? "opacity-40" : ""} ${isOrphan ? "bg-destructive/5" : ""}`}>
                            <TableCell className="px-1">
                              <Switch checked={svc.is_enabled} onCheckedChange={(v) => toggleServiceEnabled(svc.id, v)} className="scale-[0.6]" />
                            </TableCell>
                            <TableCell className="px-1">
                              <button onClick={() => copyId(svc.id)} className="flex items-center gap-0.5 text-muted-foreground hover:text-foreground font-mono text-[9px]">
                                {svc.id.slice(0, 8)} <Copy className="h-2 w-2" />
                              </button>
                            </TableCell>
                            <TableCell className="px-1 min-w-[160px]">
                              <Input className="text-[11px] h-6 px-1 border-transparent hover:border-input focus:border-input" defaultValue={svc.name}
                                onBlur={(e) => { if (e.target.value !== svc.name) updateServiceField(svc.id, "name", e.target.value); }} />
                            </TableCell>
                            <TableCell className="px-1 min-w-[120px]">
                              <Input className="text-[11px] h-6 px-1 border-transparent hover:border-input focus:border-input" placeholder="—"
                                defaultValue={svc.description ?? ""}
                                onBlur={(e) => { const v = e.target.value || null; if (v !== svc.description) updateServiceField(svc.id, "description", v); }} />
                            </TableCell>
                            <TableCell className="px-1">
                              <Input className="text-[10px] h-6 px-1 w-[90px] border-transparent hover:border-input focus:border-input"
                                defaultValue={svc.category}
                                onBlur={(e) => { if (e.target.value !== svc.category) updateServiceField(svc.id, "category", e.target.value); }} />
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">
                              <Badge variant="outline" className="text-[9px] px-1">{svc.network}</Badge>
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">
                              <Input type="number" className="w-[55px] h-6 text-[10px] px-1 border-transparent hover:border-input focus:border-input"
                                defaultValue={svc.min_quantity}
                                onBlur={(e) => { const v = parseInt(e.target.value) || 0; if (v !== svc.min_quantity) updateServiceField(svc.id, "min_quantity", v); }} />
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">
                              <Input type="number" className="w-[60px] h-6 text-[10px] px-1 border-transparent hover:border-input focus:border-input"
                                defaultValue={svc.max_quantity}
                                onBlur={(e) => { const v = parseInt(e.target.value) || 0; if (v !== svc.max_quantity) updateServiceField(svc.id, "max_quantity", v); }} />
                            </TableCell>
                            <TableCell className="px-1">
                              <Input type="number" className="w-[65px] h-6 text-[10px] px-1 border-transparent hover:border-input focus:border-input"
                                defaultValue={svc.price}
                                onBlur={(e) => { const v = parseFloat(e.target.value) || 0; if (v !== svc.price) updateServiceField(svc.id, "price", v); }} />
                            </TableCell>
                            <TableCell className="px-1">
                              <div className="flex items-center gap-0.5 flex-wrap">
                                {isOrphan && (
                                  <Badge variant="destructive" className="text-[8px] px-0.5"><AlertTriangle className="h-2 w-2 mr-0.5" />Нет провайдера</Badge>
                                )}
                                {svcMappings.map((m, i) => {
                                  const ps = getProviderService(m.provider_service_id);
                                  return (
                                    <div key={m.id} className="flex items-center gap-0.5 group">
                                      <Badge
                                        variant={m.is_active ? (i === 0 ? "default" : "secondary") : "outline"}
                                        className={`text-[8px] px-0.5 leading-none cursor-pointer ${!m.is_active ? "line-through opacity-50" : ""}`}
                                        onClick={() => setDetailService(svc)}
                                      >
                                        {i === 0 ? "⚡" : `P${m.priority}`} {ps?.provider}:{ps?.provider_service_id}
                                      </Badge>
                                      <Switch className="scale-[0.4]" checked={m.is_active} onCheckedChange={(v) => toggleMapping(m.id, v)} />
                                      <button className="text-destructive opacity-0 group-hover:opacity-100 transition-opacity" onClick={() => deleteMapping(m.id)}>
                                        <Trash2 className="h-2 w-2" />
                                      </button>
                                    </div>
                                  );
                                })}
                                {hasFailover && <ShieldCheck className="h-3 w-3 text-green-500 ml-0.5" />}
                                <button className="text-primary hover:text-primary/80" onClick={() => { setMappingServiceId(svc.id); setMappingOpen(true); }}>
                                  <Plus className="h-3 w-3" />
                                </button>
                              </div>
                            </TableCell>
                            <TableCell className="px-1">
                              <button className="text-destructive hover:text-destructive/80" onClick={() => deleteService(svc.id)}>
                                <Trash2 className="h-3 w-3" />
                              </button>
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
                      <TableRow className="text-[10px]">
                        <TableHead className="px-1 whitespace-nowrap">Пров.</TableHead>
                        <TableHead className="px-1">SID</TableHead>
                        <TableHead className="px-1">Услуга</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Категория</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Сеть</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Мин</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Макс</TableHead>
                        <TableHead className="px-1 whitespace-nowrap">Цена</TableHead>
                        <TableHead className="px-1">Привязки</TableHead>
                        <TableHead className="px-1 w-[70px]"></TableHead>
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
                            <TableCell className="px-1 text-muted-foreground font-mono text-[10px]">{svc.provider_service_id}</TableCell>
                            <TableCell className="px-1">
                              <div className="truncate max-w-[250px] font-medium">{svc.name}</div>
                              {svc.description && <div className="truncate max-w-[250px] text-[9px] text-muted-foreground">{svc.description}</div>}
                            </TableCell>
                            <TableCell className="px-1 text-[10px]">{svc.category}</TableCell>
                            <TableCell className="px-1 whitespace-nowrap">
                              <Badge variant="outline" className="text-[9px] px-1">{svc.network}</Badge>
                            </TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{svc.min_quantity}</TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{svc.max_quantity}</TableCell>
                            <TableCell className="px-1 whitespace-nowrap">{Number(svc.rate).toFixed(2)}₽</TableCell>
                            <TableCell className="px-1">
                              {svcMappings.length > 0 ? svcMappings.map((m) => {
                                const s = services.find((sv) => sv.id === m.service_id);
                                return <Badge key={m.id} variant="outline" className="text-[8px] mr-0.5">P{m.priority}: {s?.name?.slice(0, 15) || "?"}</Badge>;
                              }) : <span className="text-muted-foreground text-[10px]">—</span>}
                            </TableCell>
                            <TableCell className="px-1">
                              <Button variant="outline" size="sm" className="h-5 text-[9px] px-1" onClick={() => createFromProvider(svc)}>
                                <Plus className="h-2 w-2 mr-0.5" />В каталог
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

      {/* Mapping dialog - improved */}
      <Dialog open={mappingOpen} onOpenChange={setMappingOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh]">
          <DialogHeader>
            <DialogTitle>
              Привязать провайдера
              {mappingServiceId && (() => {
                const svc = services.find(s => s.id === mappingServiceId);
                return svc ? <span className="text-muted-foreground font-normal ml-2">→ {svc.name}</span> : null;
              })()}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {/* Existing mappings */}
            {mappingServiceId && (() => {
              const existing = getMappingsForService(mappingServiceId);
              if (existing.length === 0) return null;
              return (
                <div className="border rounded p-2 space-y-1">
                  <p className="text-[10px] font-medium text-muted-foreground">Текущая цепочка failover:</p>
                  {existing.map((m, i) => {
                    const ps = getProviderService(m.provider_service_id);
                    return (
                      <div key={m.id} className="flex items-center gap-2 text-xs">
                        <Badge variant={i === 0 ? "default" : "secondary"} className="text-[9px] w-6 justify-center">P{m.priority}</Badge>
                        <span className="font-medium">{ps?.provider}</span>
                        <span className="text-muted-foreground">ID:{ps?.provider_service_id} — {ps?.name?.slice(0, 40)}</span>
                        <span className="text-muted-foreground ml-auto">{Number(ps?.rate || 0).toFixed(2)}₽</span>
                        <div className="flex items-center gap-0.5">
                          {m.priority > 1 && (
                            <button onClick={() => updateMappingPriority(m.id, m.priority - 1)} className="text-muted-foreground hover:text-foreground">
                              <ArrowUp className="h-3 w-3" />
                            </button>
                          )}
                          <button onClick={() => updateMappingPriority(m.id, m.priority + 1)} className="text-muted-foreground hover:text-foreground">
                            <ArrowDown className="h-3 w-3" />
                          </button>
                          <Switch className="scale-50" checked={m.is_active} onCheckedChange={(v) => toggleMapping(m.id, v)} />
                          <button onClick={() => deleteMapping(m.id)} className="text-destructive"><Trash2 className="h-3 w-3" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              );
            })()}

            <div className="flex items-center gap-2">
              <div className="relative flex-1">
                <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                <Input placeholder="Поиск услуги провайдера..." value={mappingSearch} onChange={(e) => setMappingSearch(e.target.value)} className="pl-7 h-7 text-xs" />
              </div>
              <Select value={mappingProviderFilter} onValueChange={setMappingProviderFilter}>
                <SelectTrigger className="w-[120px] h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {providerKeys.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                </SelectContent>
              </Select>
              <Input type="number" placeholder="Приоритет" value={mappingPriority} onChange={(e) => setMappingPriority(e.target.value)} className="w-[80px] h-7 text-xs" />
            </div>

            <div className="border rounded max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[10px]">
                    <TableHead className="px-1">Пров.</TableHead>
                    <TableHead className="px-1">ID</TableHead>
                    <TableHead className="px-1">Услуга</TableHead>
                    <TableHead className="px-1">Цена</TableHead>
                    <TableHead className="px-1 w-10"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredMappingProviders.slice(0, 50).map((ps) => (
                    <TableRow key={ps.id} className={`text-[11px] cursor-pointer ${mappingProviderServiceId === ps.id ? "bg-primary/10" : ""}`}
                      onClick={() => setMappingProviderServiceId(ps.id)}>
                      <TableCell className="px-1"><Badge variant="secondary" className="text-[9px]">{ps.provider}</Badge></TableCell>
                      <TableCell className="px-1 text-muted-foreground">{ps.provider_service_id}</TableCell>
                      <TableCell className="px-1 truncate max-w-[250px]">{ps.name}</TableCell>
                      <TableCell className="px-1 whitespace-nowrap">{Number(ps.rate).toFixed(2)}₽</TableCell>
                      <TableCell className="px-1">
                        {mappingProviderServiceId === ps.id && <Badge className="text-[8px]">✓</Badge>}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-[10px] text-muted-foreground">
                P1 = основной провайдер. При сбое → P2 → P3 → ... Все попытки логируются.
              </p>
              <Button onClick={addMapping} disabled={!mappingProviderServiceId} size="sm">
                <Link2 className="h-3 w-3 mr-1" />Привязать
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Service detail dialog */}
      <Dialog open={!!detailService} onOpenChange={() => setDetailService(null)}>
        <DialogContent className="max-w-lg">
          {detailService && (() => {
            const svcMappings = getMappingsForService(detailService.id);
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    {detailService.is_enabled ? <Eye className="h-4 w-4 text-green-500" /> : <EyeOff className="h-4 w-4 text-muted-foreground" />}
                    {detailService.name}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div><span className="text-muted-foreground">ID:</span> <code className="bg-muted px-1 rounded text-[10px]">{detailService.id}</code></div>
                    <div><span className="text-muted-foreground">Платформа:</span> {detailService.network}</div>
                    <div><span className="text-muted-foreground">Категория:</span> {detailService.category}</div>
                    <div><span className="text-muted-foreground">Цена/1000:</span> {Number(detailService.price).toFixed(2)}₽</div>
                    <div><span className="text-muted-foreground">Мин:</span> {detailService.min_quantity}</div>
                    <div><span className="text-muted-foreground">Макс:</span> {detailService.max_quantity}</div>
                  </div>
                  {detailService.description && (
                    <div className="text-xs"><span className="text-muted-foreground">Описание:</span> {detailService.description}</div>
                  )}

                  <div className="border rounded p-2">
                    <p className="text-xs font-bold mb-2">Failover цепочка ({svcMappings.filter(m => m.is_active).length} активных):</p>
                    {svcMappings.length === 0 ? (
                      <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Нет привязанных провайдеров</p>
                    ) : (
                      <div className="space-y-2">
                        {svcMappings.map((m, i) => {
                          const ps = getProviderService(m.provider_service_id);
                          if (!ps) return null;
                          return (
                            <div key={m.id} className={`flex items-start gap-2 text-xs p-1.5 rounded ${!m.is_active ? "opacity-40" : i === 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/50"}`}>
                              <Badge variant={i === 0 ? "default" : "secondary"} className="text-[9px] shrink-0 mt-0.5">
                                {i === 0 ? "⚡ P" + m.priority : "P" + m.priority}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <p className="font-medium">{ps.provider} #{ps.provider_service_id}</p>
                                <p className="text-muted-foreground truncate">{ps.name}</p>
                                <div className="flex gap-2 text-[10px] text-muted-foreground mt-0.5">
                                  <span>Цена: {Number(ps.rate).toFixed(2)}₽</span>
                                  <span>Мин: {ps.min_quantity}</span>
                                  <span>Макс: {ps.max_quantity}</span>
                                  {ps.can_cancel && <Badge variant="outline" className="text-[8px] h-3">Cancel</Badge>}
                                  {ps.can_refill && <Badge variant="outline" className="text-[8px] h-3">Refill</Badge>}
                                </div>
                              </div>
                              {i < svcMappings.length - 1 && m.is_active && (
                                <ChevronRight className="h-3 w-3 text-muted-foreground mt-1 shrink-0" />
                              )}
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
