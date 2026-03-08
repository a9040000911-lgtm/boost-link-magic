import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RefreshCw, Search, Package, Plus, Link2, Trash2, ArrowUp, ArrowDown,
  Zap, ShieldCheck, AlertTriangle, Settings2, ChevronRight, Percent, Layers
} from "lucide-react";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";

interface MarkupTier {
  maxRate: number;
  markup: number;
}

const DEFAULT_MARKUP_LADDER: MarkupTier[] = [
  { maxRate: 20, markup: 80 },
  { maxRate: 50, markup: 60 },
  { maxRate: 150, markup: 40 },
  { maxRate: 500, markup: 30 },
  { maxRate: Infinity, markup: 20 },
];

const getMarkupForRate = (rate: number, ladder: MarkupTier[]): number => {
  for (const tier of ladder) {
    if (rate <= tier.maxRate) return tier.markup;
  }
  return 30;
};

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
  speed: string;
  guarantee: string;
  warning_text: string | null;
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
    min_quantity: "100", max_quantity: "10000", price: "0",
    speed: "medium", guarantee: "none", warning_text: ""
  });

  // Edit dialog
  const [editService, setEditService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({ name: "", description: "", category: "", network: "", min_quantity: "", max_quantity: "", price: "", speed: "medium", guarantee: "none", warning_text: "" });

  // Mapping add state inside edit dialog
  const [addMappingOpen, setAddMappingOpen] = useState(false);
  const [mappingProviderServiceId, setMappingProviderServiceId] = useState("");
  const [mappingPriority, setMappingPriority] = useState("1");
  const [mappingProviderFilter, setMappingProviderFilter] = useState("all");
  const [mappingSearch, setMappingSearch] = useState("");

  // Bulk selection
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMarkup, setBulkMarkup] = useState("");
  const [showBulkBar, setShowBulkBar] = useState(false);
  const [markupLadder, setMarkupLadder] = useState<MarkupTier[]>(DEFAULT_MARKUP_LADDER);

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [psRes, sRes, mRes, pRes, ladderRes] = await Promise.all([
      supabase.from("provider_services").select("*").order("provider").order("network"),
      supabase.from("services").select("*").order("network").order("category").order("name"),
      supabase.from("service_provider_mappings").select("*").order("priority"),
      supabase.from("providers").select("*").eq("is_enabled", true),
      supabase.from("app_settings").select("value").eq("key", "markup_ladder").single(),
    ]);
    setProviderServices((psRes.data as ProviderService[]) || []);
    setServices((sRes.data as Service[]) || []);
    setMappings((mRes.data as Mapping[]) || []);
    setProviders(pRes.data || []);
    if (ladderRes.data?.value) {
      try { setMarkupLadder(JSON.parse(ladderRes.data.value)); } catch {}
    }
    setSelectedIds(new Set());
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
      speed: newService.speed || "medium",
      guarantee: newService.guarantee || "none",
      warning_text: newService.warning_text || null,
    });
    if (error) { toast.error(error.message); return; }
    await logAuditAction("create_service", "service", undefined, { name: newService.name });
    toast.success("Услуга создана");
    setCreateOpen(false);
    setNewService({ name: "", description: "", category: "", network: "", min_quantity: "100", max_quantity: "10000", price: "0", speed: "medium", guarantee: "none", warning_text: "" });
    await loadAll();
  };

  const createFromProvider = async (ps: ProviderService) => {
    const price = ps.our_price ?? ps.rate * (1 + (ps.markup_percent ?? 30) / 100);
    const { data, error } = await supabase.from("services").insert({
      name: ps.name, description: ps.description, category: ps.category,
      network: ps.network, min_quantity: ps.min_quantity, max_quantity: ps.max_quantity, price,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("service_provider_mappings").insert({
      service_id: data.id, provider_service_id: ps.id, priority: 1,
    });
    await logAuditAction("create_service", "service", data.id, { from_provider: ps.provider });
    toast.success("Услуга создана и привязана");
    await loadAll();
  };

  const toggleServiceEnabled = async (id: string, enabled: boolean) => {
    await supabase.from("services").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).eq("id", id);
    await logAuditAction("toggle_service", "service", id, { enabled });
    setServices((prev) => prev.map((s) => s.id === id ? { ...s, is_enabled: enabled } : s));
  };

  const saveEditService = async () => {
    if (!editService) return;
    const updates: any = {};
    if (editForm.name !== editService.name) updates.name = editForm.name;
    if ((editForm.description || null) !== editService.description) updates.description = editForm.description || null;
    if (editForm.category !== editService.category) updates.category = editForm.category;
    if (editForm.network !== editService.network) updates.network = editForm.network;
    const minQ = parseInt(editForm.min_quantity) || 0;
    const maxQ = parseInt(editForm.max_quantity) || 0;
    const price = parseFloat(editForm.price) || 0;
    if (minQ !== editService.min_quantity) updates.min_quantity = minQ;
    if (maxQ !== editService.max_quantity) updates.max_quantity = maxQ;
    if (price !== editService.price) updates.price = price;
    if (editForm.speed !== editService.speed) updates.speed = editForm.speed;
    if (editForm.guarantee !== editService.guarantee) updates.guarantee = editForm.guarantee;
    if ((editForm.warning_text || null) !== editService.warning_text) updates.warning_text = editForm.warning_text || null;

    if (Object.keys(updates).length === 0) { toast.info("Нет изменений"); return; }
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("services").update(updates).eq("id", editService.id);
    if (error) { toast.error(error.message); return; }
    await logAuditAction("update_service", "service", editService.id, updates);
    toast.success("Сохранено");
    await loadAll();
    // Update editService reference
    setEditService(prev => prev ? { ...prev, ...updates } : null);
  };

  const deleteService = async (id: string) => {
    if (!confirm("Удалить услугу? Все привязки будут удалены.")) return;
    await supabase.from("service_provider_mappings").delete().eq("service_id", id);
    await supabase.from("services").delete().eq("id", id);
    await logAuditAction("delete_service", "service", id);
    toast.success("Удалено");
    setEditService(null);
    await loadAll();
  };

  const addMapping = async (serviceId: string) => {
    if (!mappingProviderServiceId) return;
    const { error } = await supabase.from("service_provider_mappings").insert({
      service_id: serviceId, provider_service_id: mappingProviderServiceId,
      priority: parseInt(mappingPriority) || 1,
    });
    if (error) { toast.error(error.message); return; }
    toast.success("Провайдер привязан");
    setAddMappingOpen(false);
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

  // === Bulk actions ===
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredProviderServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredProviderServices.map((s) => s.id)));
    }
  };

  const applyBulkMarkup = async () => {
    const markup = parseFloat(bulkMarkup);
    if (isNaN(markup) || markup < 0) { toast.error("Введите корректный %"); return; }
    const ids = [...selectedIds];
    for (const id of ids) {
      const ps = providerServices.find((p) => p.id === id);
      if (!ps) continue;
      const ourPrice = ps.rate * (1 + markup / 100);
      await supabase.from("provider_services").update({ markup_percent: markup, our_price: ourPrice }).eq("id", id);
    }
    toast.success(`Наценка ${markup}% применена к ${ids.length} услугам`);
    await logAuditAction("bulk_markup", "provider_services", undefined, { count: ids.length, markup });
    setSelectedIds(new Set());
    setBulkMarkup("");
    await loadAll();
  };

  const applyLadderToSelected = async () => {
    const ids = [...selectedIds];
    let updated = 0;
    for (const id of ids) {
      const ps = providerServices.find((p) => p.id === id);
      if (!ps) continue;
      const markup = getMarkupForRate(ps.rate, markupLadder);
      const ourPrice = ps.rate * (1 + markup / 100);
      await supabase.from("provider_services").update({ markup_percent: markup, our_price: ourPrice }).eq("id", id);
      updated++;
    }
    toast.success(`Лестница наценок применена к ${updated} услугам`);
    await logAuditAction("ladder_markup", "provider_services", undefined, { count: updated });
    setSelectedIds(new Set());
    await loadAll();
  };

  const getMappingsForService = (serviceId: string) =>
    mappings.filter((m) => m.service_id === serviceId).sort((a, b) => a.priority - b.priority);

  const getProviderService = (psId: string) => providerServices.find((ps) => ps.id === psId);

  const openEditDialog = (svc: Service) => {
    setEditService(svc);
    setEditForm({
      name: svc.name, description: svc.description || "", category: svc.category,
      network: svc.network, min_quantity: String(svc.min_quantity),
      max_quantity: String(svc.max_quantity), price: String(svc.price),
      speed: svc.speed || "medium", guarantee: svc.guarantee || "none",
      warning_text: svc.warning_text || "",
    });
    setAddMappingOpen(false);
  };

  // Derived
  const categories = useMemo(() => {
    const src = activeTab === "catalog" ? services : providerServices;
    return [...new Set(src.map((s) => s.category))].sort();
  }, [services, providerServices, activeTab]);

  const networks = useMemo(() => {
    const src = activeTab === "catalog" ? services : providerServices;
    return [...new Set(src.map((s) => s.network))].sort();
  }, [services, providerServices, activeTab]);

  const providerKeys = useMemo(() => [...new Set(providerServices.map((s) => s.provider))].sort(), [providerServices]);

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

      {/* Stats */}
      <div className="grid grid-cols-5 gap-2 shrink-0">
        <Card className="border-border/60"><CardContent className="p-2">
          <p className="text-lg font-bold">{services.length}</p>
          <p className="text-[10px] text-muted-foreground">Всего услуг ({statsEnabled} вкл.)</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2">
          <p className="text-lg font-bold">{providerServices.length}</p>
          <p className="text-[10px] text-muted-foreground">Услуг провайдеров</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2 flex items-center gap-1">
          <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
          <div><p className="text-lg font-bold">{statsWithFailover}</p><p className="text-[10px] text-muted-foreground">С failover (2+ пров.)</p></div>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2 flex items-center gap-1">
          <Zap className="h-3.5 w-3.5 text-primary" />
          <div><p className="text-lg font-bold">{statsWithProviders}</p><p className="text-[10px] text-muted-foreground">С привязками</p></div>
        </CardContent></Card>
        {statsOrphan > 0 ? (
          <Card className="border-destructive/50"><CardContent className="p-2 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 text-destructive" />
            <div><p className="text-lg font-bold text-destructive">{statsOrphan}</p><p className="text-[10px] text-destructive">Без провайдера!</p></div>
          </CardContent></Card>
        ) : (
          <Card className="border-green-500/30"><CardContent className="p-2 flex items-center gap-1">
            <ShieldCheck className="h-3.5 w-3.5 text-green-500" />
            <div><p className="text-lg font-bold text-green-600">0</p><p className="text-[10px] text-green-600">Все привязаны ✓</p></div>
          </CardContent></Card>
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
                    <div><Label className="text-xs">Название</Label><Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} /></div>
                    <div><Label className="text-xs">Описание</Label><Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><Label className="text-xs">Категория</Label><Input value={newService.category} onChange={(e) => setNewService({ ...newService, category: e.target.value })} placeholder="Подписчики" /></div>
                      <div><Label className="text-xs">Платформа</Label><Input value={newService.network} onChange={(e) => setNewService({ ...newService, network: e.target.value })} placeholder="Instagram" /></div>
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                      <div><Label className="text-xs">Мин</Label><Input type="number" value={newService.min_quantity} onChange={(e) => setNewService({ ...newService, min_quantity: e.target.value })} /></div>
                      <div><Label className="text-xs">Макс</Label><Input type="number" value={newService.max_quantity} onChange={(e) => setNewService({ ...newService, max_quantity: e.target.value })} /></div>
                      <div><Label className="text-xs">Цена/1к</Label><Input type="number" value={newService.price} onChange={(e) => setNewService({ ...newService, price: e.target.value })} /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Скорость</Label>
                        <Select value={newService.speed} onValueChange={(v) => setNewService({ ...newService, speed: v })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="instant">⚡ Мгновенно</SelectItem>
                            <SelectItem value="fast">🚀 Быстро</SelectItem>
                            <SelectItem value="medium">⏱ Средне</SelectItem>
                            <SelectItem value="slow">🐢 Медленно</SelectItem>
                            <SelectItem value="gradual">📈 Постепенно</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Гарантия</Label>
                        <Select value={newService.guarantee} onValueChange={(v) => setNewService({ ...newService, guarantee: v })}>
                          <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">Без гарантии</SelectItem>
                            <SelectItem value="7d">7 дней</SelectItem>
                            <SelectItem value="30d">30 дней</SelectItem>
                            <SelectItem value="60d">60 дней</SelectItem>
                            <SelectItem value="lifetime">♾ Навсегда</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div>
                      <Label className="text-xs">Предупреждение (warning)</Label>
                      <Textarea value={newService.warning_text} onChange={(e) => setNewService({ ...newService, warning_text: e.target.value })} placeholder="Текст предупреждения перед заказом..." className="h-16" />
                    </div>
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
            <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
          ) : (
            <>
              {/* === CATALOG TABLE (compact) === */}
              <TabsContent value="catalog" className="mt-0">
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Нет услуг</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px]">
                        <TableHead className="w-10 px-2">Вкл</TableHead>
                        <TableHead className="px-2">Название</TableHead>
                        <TableHead className="px-2 w-[100px]">Сеть</TableHead>
                        <TableHead className="px-2 w-[120px]">Категория</TableHead>
                        <TableHead className="px-2 w-[80px] text-right">Цена/1к</TableHead>
                        <TableHead className="px-2 w-[140px]">Провайдеры</TableHead>
                        <TableHead className="px-2 w-10"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((svc) => {
                        const svcMappings = getMappingsForService(svc.id);
                        const activeCount = svcMappings.filter(m => m.is_active).length;
                        const isOrphan = svc.is_enabled && activeCount === 0;

                        return (
                          <TableRow
                            key={svc.id}
                            className={`text-xs cursor-pointer hover:bg-muted/50 ${!svc.is_enabled ? "opacity-40" : ""} ${isOrphan ? "bg-destructive/5" : ""}`}
                            onClick={() => openEditDialog(svc)}
                          >
                            <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                              <Switch checked={svc.is_enabled} onCheckedChange={(v) => toggleServiceEnabled(svc.id, v)} className="scale-[0.65]" />
                            </TableCell>
                            <TableCell className="px-2 font-medium">{svc.name}</TableCell>
                            <TableCell className="px-2">
                              <Badge variant="outline" className="text-[10px] px-1.5">{svc.network}</Badge>
                            </TableCell>
                            <TableCell className="px-2 text-muted-foreground">{svc.category}</TableCell>
                            <TableCell className="px-2 text-right font-mono">{Number(svc.price).toFixed(2)}</TableCell>
                            <TableCell className="px-2">
                              {isOrphan ? (
                                <Badge variant="destructive" className="text-[9px] px-1">
                                  <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Нет
                                </Badge>
                              ) : activeCount > 0 ? (
                                <div className="flex items-center gap-1">
                                  <Badge variant="secondary" className="text-[9px] px-1">{activeCount} пров.</Badge>
                                  {activeCount >= 2 && <ShieldCheck className="h-3 w-3 text-green-500" />}
                                </div>
                              ) : (
                                <span className="text-muted-foreground text-[10px]">—</span>
                              )}
                            </TableCell>
                            <TableCell className="px-2">
                              <Settings2 className="h-3.5 w-3.5 text-muted-foreground" />
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* === PROVIDER SERVICES TABLE === */}
              <TabsContent value="providers" className="mt-0">
                {filteredProviderServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Синхронизируйте провайдеров</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px]">
                        <TableHead className="px-2">Пров.</TableHead>
                        <TableHead className="px-2">SID</TableHead>
                        <TableHead className="px-2">Услуга</TableHead>
                        <TableHead className="px-2 w-[90px]">Сеть</TableHead>
                        <TableHead className="px-2 w-[80px] text-right">Цена</TableHead>
                        <TableHead className="px-2 w-[80px]">Привязки</TableHead>
                        <TableHead className="px-2 w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProviderServices.map((svc) => {
                        const svcMappings = mappings.filter((m) => m.provider_service_id === svc.id);
                        return (
                          <TableRow key={svc.id} className="text-xs">
                            <TableCell className="px-2"><Badge variant="secondary" className="text-[10px]">{svc.provider}</Badge></TableCell>
                            <TableCell className="px-2 text-muted-foreground font-mono">{svc.provider_service_id}</TableCell>
                            <TableCell className="px-2">
                              <div className="truncate max-w-[280px] font-medium">{svc.name}</div>
                            </TableCell>
                            <TableCell className="px-2"><Badge variant="outline" className="text-[10px]">{svc.network}</Badge></TableCell>
                            <TableCell className="px-2 text-right font-mono">{Number(svc.rate).toFixed(2)}₽</TableCell>
                            <TableCell className="px-2">
                              {svcMappings.length > 0 ? (
                                <Badge variant="outline" className="text-[9px]">{svcMappings.length}</Badge>
                              ) : <span className="text-muted-foreground text-[10px]">—</span>}
                            </TableCell>
                            <TableCell className="px-2">
                              <Button variant="outline" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => createFromProvider(svc)}>
                                <Plus className="h-2.5 w-2.5 mr-0.5" />В каталог
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

      {/* === EDIT SERVICE DIALOG === */}
      <Dialog open={!!editService} onOpenChange={(open) => { if (!open) setEditService(null); }}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          {editService && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Settings2 className="h-4 w-4 text-primary" />
                  Редактирование услуги
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-4">
                {/* Basic info */}
                <div className="space-y-3">
                  <div>
                    <Label className="text-xs">Название</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} />
                  </div>
                  <div>
                    <Label className="text-xs">Описание</Label>
                    <Textarea value={editForm.description} onChange={(e) => setEditForm({ ...editForm, description: e.target.value })} className="h-16" />
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div><Label className="text-xs">Категория</Label><Input value={editForm.category} onChange={(e) => setEditForm({ ...editForm, category: e.target.value })} /></div>
                    <div><Label className="text-xs">Платформа</Label><Input value={editForm.network} onChange={(e) => setEditForm({ ...editForm, network: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Мин. кол-во</Label><Input type="number" value={editForm.min_quantity} onChange={(e) => setEditForm({ ...editForm, min_quantity: e.target.value })} /></div>
                    <div><Label className="text-xs">Макс. кол-во</Label><Input type="number" value={editForm.max_quantity} onChange={(e) => setEditForm({ ...editForm, max_quantity: e.target.value })} /></div>
                    <div><Label className="text-xs">Цена за 1000</Label><Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} /></div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <Label className="text-xs flex items-center gap-1"><Zap className="h-3 w-3" />Скорость</Label>
                      <Select value={editForm.speed} onValueChange={(v) => setEditForm({ ...editForm, speed: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="instant">⚡ Мгновенно</SelectItem>
                          <SelectItem value="fast">🚀 Быстро</SelectItem>
                          <SelectItem value="medium">⏱ Средне</SelectItem>
                          <SelectItem value="slow">🐢 Медленно</SelectItem>
                          <SelectItem value="gradual">📈 Постепенно</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs flex items-center gap-1"><ShieldCheck className="h-3 w-3" />Гарантия</Label>
                      <Select value={editForm.guarantee} onValueChange={(v) => setEditForm({ ...editForm, guarantee: v })}>
                        <SelectTrigger className="h-9"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">Без гарантии</SelectItem>
                          <SelectItem value="7d">7 дней</SelectItem>
                          <SelectItem value="30d">30 дней</SelectItem>
                          <SelectItem value="60d">60 дней</SelectItem>
                          <SelectItem value="lifetime">♾ Навсегда</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div>
                    <Label className="text-xs flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Предупреждение</Label>
                    <Textarea value={editForm.warning_text} onChange={(e) => setEditForm({ ...editForm, warning_text: e.target.value })} placeholder="Текст предупреждения перед заказом..." className="h-16" />
                  </div>
                  <Button onClick={saveEditService} className="w-full" size="sm">Сохранить изменения</Button>
                </div>

                {/* Failover chain */}
                <div className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-sm font-semibold">Failover цепочка</p>
                    <Button size="sm" variant="outline" className="h-6 text-[10px]" onClick={() => setAddMappingOpen(!addMappingOpen)}>
                      <Plus className="h-3 w-3 mr-0.5" />{addMappingOpen ? "Отмена" : "Добавить"}
                    </Button>
                  </div>

                  {(() => {
                    const svcMappings = getMappingsForService(editService.id);
                    if (svcMappings.length === 0) {
                      return <p className="text-xs text-destructive flex items-center gap-1"><AlertTriangle className="h-3 w-3" />Нет привязанных провайдеров</p>;
                    }
                    return (
                      <div className="space-y-1.5">
                        {svcMappings.map((m, i) => {
                          const ps = getProviderService(m.provider_service_id);
                          if (!ps) return null;
                          return (
                            <div key={m.id} className={`flex items-center gap-2 text-xs p-2 rounded-md border ${!m.is_active ? "opacity-40 border-dashed" : i === 0 ? "bg-primary/5 border-primary/20" : "bg-muted/30"}`}>
                              <Badge variant={i === 0 ? "default" : "secondary"} className="text-[9px] shrink-0">
                                {i === 0 ? "⚡" : `P${m.priority}`}
                              </Badge>
                              <div className="flex-1 min-w-0">
                                <span className="font-medium">{ps.provider}</span>
                                <span className="text-muted-foreground ml-1">#{ps.provider_service_id}</span>
                                <p className="text-[10px] text-muted-foreground truncate">{ps.name}</p>
                              </div>
                              <span className="text-[10px] text-muted-foreground shrink-0">{Number(ps.rate).toFixed(2)}₽</span>
                              <div className="flex items-center gap-0.5 shrink-0">
                                {m.priority > 1 && (
                                  <button onClick={() => updateMappingPriority(m.id, m.priority - 1)} className="p-0.5 hover:bg-muted rounded"><ArrowUp className="h-3 w-3" /></button>
                                )}
                                <button onClick={() => updateMappingPriority(m.id, m.priority + 1)} className="p-0.5 hover:bg-muted rounded"><ArrowDown className="h-3 w-3" /></button>
                                <Switch className="scale-50" checked={m.is_active} onCheckedChange={(v) => toggleMapping(m.id, v)} />
                                <button onClick={() => deleteMapping(m.id)} className="text-destructive p-0.5 hover:bg-destructive/10 rounded"><Trash2 className="h-3 w-3" /></button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    );
                  })()}

                  {/* Add mapping inline */}
                  {addMappingOpen && (
                    <div className="border-t pt-2 space-y-2 mt-2">
                      <div className="flex items-center gap-2">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input placeholder="Поиск провайдера..." value={mappingSearch} onChange={(e) => setMappingSearch(e.target.value)} className="pl-7 h-7 text-xs" />
                        </div>
                        <Select value={mappingProviderFilter} onValueChange={setMappingProviderFilter}>
                          <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            {providerKeys.map(p => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                        <Input type="number" placeholder="P" value={mappingPriority} onChange={(e) => setMappingPriority(e.target.value)} className="w-[60px] h-7 text-xs" />
                      </div>
                      <div className="border rounded max-h-[200px] overflow-auto">
                        <Table>
                          <TableBody>
                            {filteredMappingProviders.slice(0, 30).map((ps) => (
                              <TableRow
                                key={ps.id}
                                className={`text-[11px] cursor-pointer ${mappingProviderServiceId === ps.id ? "bg-primary/10" : ""}`}
                                onClick={() => setMappingProviderServiceId(ps.id)}
                              >
                                <TableCell className="px-2 py-1"><Badge variant="secondary" className="text-[9px]">{ps.provider}</Badge></TableCell>
                                <TableCell className="px-2 py-1 text-muted-foreground">{ps.provider_service_id}</TableCell>
                                <TableCell className="px-2 py-1 truncate max-w-[200px]">{ps.name}</TableCell>
                                <TableCell className="px-2 py-1 text-right">{Number(ps.rate).toFixed(2)}₽</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                      <Button onClick={() => addMapping(editService.id)} disabled={!mappingProviderServiceId} size="sm" className="w-full">
                        <Link2 className="h-3 w-3 mr-1" />Привязать
                      </Button>
                    </div>
                  )}

                  <p className="text-[10px] text-muted-foreground">P1 = основной. При сбое → P2 → P3. Все попытки логируются.</p>
                </div>

                {/* Danger zone */}
                <div className="border border-destructive/30 rounded-lg p-3">
                  <Button variant="destructive" size="sm" className="w-full text-xs" onClick={() => deleteService(editService.id)}>
                    <Trash2 className="h-3 w-3 mr-1" />Удалить услугу
                  </Button>
                </div>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
