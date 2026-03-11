import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
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
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  RefreshCw, Search, Package, Plus, Link2, Trash2, ArrowUp, ArrowDown,
  Zap, ShieldCheck, AlertTriangle, Settings2, ChevronRight, Percent, Layers,
  DollarSign, Hash, Eye, Pencil, Info, CheckCircle2, XCircle
} from "lucide-react";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";
import { CleanupRulesDialog } from "@/components/admin/CleanupRulesDialog";

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
  created_at?: string;
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
  link_type: string;
  warning_text: string | null;
  created_at?: string;
}

interface Mapping {
  id: string;
  service_id: string;
  provider_service_id: string;
  priority: number;
  is_active: boolean;
}

interface Platform {
  id: string;
  name: string;
  sort_order: number;
}

interface Category {
  id: string;
  name: string;
  network: string;
  sort_order: number;
}

const MIN_MARKUP_DEFAULT = 200;

const AdminServices = () => {
  const { user } = useAuth();
  const [providerServices, setProviderServices] = useState<ProviderService[]>([]);
  const [services, setServices] = useState<Service[]>([]);
  const [mappings, setMappings] = useState<Mapping[]>([]);
  const [providers, setProviders] = useState<any[]>([]);
  const [dbPlatforms, setDbPlatforms] = useState<Platform[]>([]);
  const [dbCategories, setDbCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [search, setSearch] = useState("");
  const [networkFilter, setNetworkFilter] = useState("all");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [providerFilter, setProviderFilter] = useState("all");
  const [enabledFilter, setEnabledFilter] = useState("all");
  const [activeTab, setActiveTab] = useState("catalog");
  const [minMarkup, setMinMarkup] = useState(MIN_MARKUP_DEFAULT);

  // Create dialog
  const [createOpen, setCreateOpen] = useState(false);
  const [newService, setNewService] = useState({
    name: "", description: "", category: "", network: "",
    min_quantity: "100", max_quantity: "10000", price: "0",
    speed: "medium", guarantee: "none", warning_text: ""
  });
  const [createMappingIds, setCreateMappingIds] = useState<string[]>([]);
  const [createProviderSearch, setCreateProviderSearch] = useState("");
  const [createProviderFilter, setCreateProviderFilter] = useState("all");

  // Edit dialog
  const [editService, setEditService] = useState<Service | null>(null);
  const [editForm, setEditForm] = useState({
    name: "", description: "", category: "", network: "", 
    min_quantity: "", max_quantity: "", price: "", 
    speed: "", guarantee: "", link_type: "unknown", warning_text: ""
  });

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
  const [bulkCategory, setBulkCategory] = useState("");
  const [bulkNetwork, setBulkNetwork] = useState("");

  // Price display toggles
  const [priceMode, setPriceMode] = useState<"per1k" | "per1">("per1k");
  const [currency, setCurrency] = useState<"RUB" | "USD">("RUB");
  const [usdRate, setUsdRate] = useState<number>(0);
  // UX Optimization state
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingPrice, setEditingPrice] = useState<string>("");
  const [editingName, setEditingName] = useState<string>("");
  const [showDrawer, setShowDrawer] = useState(false);
  const [showSmartImport, setShowSmartImport] = useState(false);
  const [smartFilter, setSmartFilter] = useState<"all" | "error" | "low_margin" | "no_provider">("all");

  useEffect(() => {
    if (!user) return;
    loadAll();
  }, [user]);

  const loadAll = async () => {
    setLoading(true);
    const [psRes, sRes, mRes, pRes, platRes, catRes, ladderRes, minMarkupRes, rateRes] = await Promise.all([
      supabase.from("provider_services").select("*").order("provider").order("network"),
      supabase.from("services").select("*").order("network").order("category").order("name"),
      supabase.from("service_provider_mappings").select("*").order("priority"),
      supabase.from("providers").select("*").eq("is_enabled", true),
      supabase.from("platforms").select("*").order("sort_order"),
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("app_settings").select("value").eq("key", "markup_ladder").single(),
      supabase.from("app_settings").select("value").eq("key", "min_markup_percent").single(),
      supabase.from("exchange_rates").select("rate").eq("base_currency", "USD").eq("target_currency", "RUB").order("fetched_at", { ascending: false }).limit(1).single(),
    ]);
    setProviderServices((psRes.data as ProviderService[]) || []);
    setServices((sRes.data as any[]) || []);
    setMappings((mRes.data as Mapping[]) || []);
    setProviders(pRes.data || []);
    setDbPlatforms((platRes.data as Platform[]) || []);
    setDbCategories((catRes.data as Category[]) || []);
    if (ladderRes.data?.value) {
      try { setMarkupLadder(JSON.parse(ladderRes.data.value)); } catch {}
    }
    if (minMarkupRes.data?.value) {
      setMinMarkup(Number(minMarkupRes.data.value) || MIN_MARKUP_DEFAULT);
    }
    if (rateRes.data?.rate) {
      setUsdRate(Number(rateRes.data.rate));
    }
    setSelectedIds(new Set());
    setLoading(false);
  };

  const handleInlineSave = async (id: string, field: "price" | "name", value: string) => {
    const updates: any = { [field]: field === "price" ? parseFloat(value) : value, updated_at: new Date().toISOString() };
    
    // Safety check for price
    if (field === "price") {
      const cheapest = getCheapestRate(id);
      if (cheapest && cheapest > 0) {
        const minAllowedPrice = cheapest * (1 + minMarkup / 100);
        if (updates.price < minAllowedPrice) {
          toast.error(`Минимальная цена: ${minAllowedPrice.toFixed(2)}`);
          return;
        }
      }
    }

    const { error } = await supabase.from("services").update(updates).eq("id", id);
    if (error) {
      toast.error(error.message);
    } else {
      setServices(prev => prev.map(s => s.id === id ? { ...s, ...updates } : s));
      setEditingId(null);
      toast.success("Обновлено");
      await logAuditAction("update_service", "service", id, updates);
    }
  };

  // Price formatting helper
  const fmtPrice = (pricePerK: number): string => {
    let val = priceMode === "per1" ? pricePerK / 1000 : pricePerK;
    if (currency === "USD" && usdRate > 0) val = val / usdRate;
    const sym = currency === "USD" ? "$" : "₽";
    return currency === "USD" ? `${sym}${val.toFixed(4)}` : `${val.toFixed(2)}${sym}`;
  };

  const priceLabel = priceMode === "per1" ? "Цена/1шт" : "Цена/1к";
  const currLabel = currency === "USD" ? "USD" : "RUB";

  const handleSync = async (providerKey?: string) => {
    setSyncing(true);
    try {
      const { data, error } = await supabase.functions.invoke("sync-services", {
        body: { provider: providerKey || "all" },
      });
      
      if (error) {
        console.error("Sync Edge Function error:", error);
        throw new Error(error.message || "Ошибка вызова Edge Function (проверьте консоль)");
      }
      
      const results = data.results || {};
      const msgs: string[] = [];
      const errors: string[] = [];

      Object.entries(results).forEach(([k, v]: [string, any]) => {
        if (v.error) {
          errors.push(`${k}: ${v.error}`);
        } else {
          msgs.push(`${k}: ${v.total} (${v.inserted}+, ${v.updated}~)`);
        }
      });

      if (msgs.length > 0) toast.success(`Синхр.: ${msgs.join("; ")}`);
      if (errors.length > 0) toast.error(`Ошибки: ${errors.join("; ")}`, { duration: 5000 });

      await logAuditAction("sync_services", "provider_services", providerKey || "all");
      await loadAll();
    } catch (e: any) {
      console.error("Sync full error:", e);
      // More helpful error messages
      let errorMsg = e.message || "Неизвестная ошибка";
      if (errorMsg.includes("Failed to fetch")) {
        errorMsg = "Не удалось подключиться к Edge Function. Проверьте 'supabase start' и сеть.";
      }
      toast.error(`Ошибка синхронизации: ${errorMsg}`);
    } finally {
      setSyncing(false);
    }
  };

  const createService = async () => {
    const { data, error } = await supabase.from("services").insert({
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
    }).select().single();
    if (error) { toast.error(error.message); return; }

    // Create provider mappings if selected
    if (createMappingIds.length > 0 && data) {
      for (let i = 0; i < createMappingIds.length; i++) {
        await supabase.from("service_provider_mappings").insert({
          service_id: data.id, provider_service_id: createMappingIds[i], priority: i + 1,
        });
      }
    }

    await logAuditAction("create_service", "service", data?.id, { name: newService.name, mappings: createMappingIds.length });
    toast.success(createMappingIds.length > 0 ? `Услуга создана + ${createMappingIds.length} провайдер(ов) привязано` : "Услуга создана");
    setCreateOpen(false);
    setNewService({ name: "", description: "", category: "", network: "", min_quantity: "100", max_quantity: "10000", price: "0", speed: "medium", guarantee: "none", warning_text: "" });
    setCreateMappingIds([]);
    setCreateProviderSearch("");
    setCreateProviderFilter("all");
    await loadAll();
  };

  const createFromProvider = async (ps: ProviderService) => {
    const ladderMarkup = getMarkupForRate(ps.rate, markupLadder);
    let effectiveMarkup = ps.markup_percent ?? ladderMarkup;
    if (effectiveMarkup < minMarkup) {
      effectiveMarkup = minMarkup;
      toast.info(`Наценка повышена до минимальных ${minMarkup}%`);
    }
    const price = ps.our_price ?? ps.rate * (1 + effectiveMarkup / 100);
    const minAllowedPrice = ps.rate * (1 + minMarkup / 100);
    const finalPrice = Math.max(price, minAllowedPrice);
    const { data, error } = await supabase.from("services").insert({
      name: ps.name, description: ps.description, category: ps.category,
      network: ps.network, min_quantity: ps.min_quantity, max_quantity: ps.max_quantity, price: finalPrice,
    }).select().single();
    if (error) { toast.error(error.message); return; }
    await supabase.from("service_provider_mappings").insert({
      service_id: data.id, provider_service_id: ps.id, priority: 1,
    });
    await logAuditAction("create_service", "service", data.id, { from_provider: ps.provider, markup: effectiveMarkup });
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

    // Enforce minimum markup on price changes
    if (updates.price !== undefined) {
      const cheapest = getCheapestRate(editService.id);
      if (cheapest && cheapest > 0) {
        const minAllowedPrice = cheapest * (1 + minMarkup / 100);
        if (updates.price < minAllowedPrice) {
          toast.error(`Минимальная цена для этой услуги: ${minAllowedPrice.toFixed(2)} (наценка ${minMarkup}% от ${cheapest.toFixed(2)})`);
          return;
        }
      }
    }

    if (Object.keys(updates).length === 0) { toast.info("Нет изменений"); return; }
    updates.updated_at = new Date().toISOString();

    const { error } = await supabase.from("services").update(updates).eq("id", editService.id);
    if (error) { toast.error(error.message); return; }
    await logAuditAction("update_service", "service", editService.id, updates);
    toast.success("Сохранено");
    await loadAll();
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

  // === Helper: get cheapest active provider rate for a catalog service ===
  const getCheapestRate = (serviceId: string): number | null => {
    const svcMappings = mappings.filter(m => m.service_id === serviceId && m.is_active);
    if (svcMappings.length === 0) return null;
    const rates = svcMappings.map(m => {
      const ps = providerServices.find(p => p.id === m.provider_service_id);
      return ps ? Number(ps.rate) : Infinity;
    }).filter(r => r !== Infinity);
    return rates.length > 0 ? Math.min(...rates) : null;
  };

  // === Bulk actions (catalog tab) ===
  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id); else next.add(id);
      return next;
    });
  };

  const toggleSelectAll = () => {
    const target = activeTab === "catalog" ? filteredServices : filteredProviderServices;
    if (selectedIds.size === target.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(target.map((s) => s.id)));
    }
  };

  const applyBulkMarkup = async () => {
    const markup = parseFloat(bulkMarkup);
    if (isNaN(markup) || markup < 0) { toast.error("Введите корректный %"); return; }
    if (markup < minMarkup) {
      toast.error(`Минимальная наценка: ${minMarkup}%. Нельзя установить ниже.`);
      return;
    }
    const ids = [...selectedIds];
    let updated = 0;
    let skipped = 0;
    for (const id of ids) {
      const rate = getCheapestRate(id);
      if (!rate) { skipped++; continue; }
      const newPrice = rate * (1 + markup / 100);
      await supabase.from("services").update({ price: newPrice, updated_at: new Date().toISOString() }).eq("id", id);
      updated++;
    }
    toast.success(`Наценка ${markup}% → ${updated} услуг${skipped ? ` (${skipped} без провайдера)` : ""}`);
    await logAuditAction("bulk_markup", "services", undefined, { count: updated, markup, skipped });
    setSelectedIds(new Set());
    setBulkMarkup("");
    await loadAll();
  };

  const applyLadderToSelected = async () => {
    const ids = [...selectedIds];
    let updated = 0;
    let skipped = 0;
    for (const id of ids) {
      const rate = getCheapestRate(id);
      if (!rate) { skipped++; continue; }
      let markup = getMarkupForRate(rate, markupLadder);
      if (markup < minMarkup) markup = minMarkup;
      const newPrice = rate * (1 + markup / 100);
      await supabase.from("services").update({ price: newPrice, updated_at: new Date().toISOString() }).eq("id", id);
      updated++;
    }
    const msg = `Лестница применена к ${updated} услугам${skipped ? ` (${skipped} без провайдера)` : ""}`;
    toast.success(msg);
    await logAuditAction("ladder_markup", "services", undefined, { count: updated, skipped });
    setSelectedIds(new Set());
    await loadAll();
  };

  const applyBulkCategory = async () => {
    if (!bulkCategory.trim()) { toast.error("Введите категорию"); return; }
    const ids = [...selectedIds];
    for (const id of ids) {
      await supabase.from("services").update({ category: bulkCategory.trim(), updated_at: new Date().toISOString() }).eq("id", id);
    }
    toast.success(`Категория «${bulkCategory}» → ${ids.length} услуг`);
    await logAuditAction("bulk_category", "services", undefined, { count: ids.length, category: bulkCategory });
    setSelectedIds(new Set());
    setBulkCategory("");
    await loadAll();
  };

  const applyBulkNetwork = async () => {
    if (!bulkNetwork.trim()) { toast.error("Введите платформу"); return; }
    const ids = [...selectedIds];
    for (const id of ids) {
      await supabase.from("services").update({ network: bulkNetwork.trim(), updated_at: new Date().toISOString() }).eq("id", id);
    }
    toast.success(`Платформа «${bulkNetwork}» → ${ids.length} услуг`);
    await logAuditAction("bulk_network", "services", undefined, { count: ids.length, network: bulkNetwork });
    setSelectedIds(new Set());
    setBulkNetwork("");
    await loadAll();
  };

  const handleCleanup = async () => {
    try {
      if (!confirm("Вы уверены, что хотите удалить неиспользуемые услуги провайдеров?")) return;
      
      const { data: allProviders } = await supabase.from('providers').select('key');
      const allKeys = (allProviders || []).map(p => p.key);
      
      // Determine what to delete: services where provider is NOT in our current providers list
      // Or services where provider is disabled (optional, but let's stick to orphaned for now)
      
      if (allKeys.length === 0) {
        // If no providers exist, all provider_services are orphaned? 
        // Safer to just delete if we have at least one provider.
        toast.error("Сначала добавьте хотя бы одного провайдера");
        return;
      }

      // Query services that have a provider key NOT in allKeys
      const { data: orphaned } = await supabase.from('provider_services').select('id, provider');
      const toDelete = (orphaned || []).filter(ps => !allKeys.includes(ps.provider)).map(ps => ps.id);

      if (toDelete.length === 0) {
        toast.info("Осиротевших услуг не найдено");
        return;
      }

      const { error } = await supabase
        .from('provider_services')
        .delete()
        .in('id', toDelete);
        
      if (error) throw error;
      
      toast.success(`Очистка завершена: удалено ${toDelete.length} услуг`);
      await logAuditAction("bulk_delete_provider_services" as any, "provider_services", undefined, { count: toDelete.length, reason: "cleanup_orphaned" });
      await loadAll();
    } catch (error: any) {
      console.error("Cleanup error:", error);
      toast.error("Ошибка очистки: " + error.message);
    }
  };

  const handleBulkDelete = async () => {
    const table = activeTab === "catalog" ? "services" : "provider_services";
    const label = activeTab === "catalog" ? "услуг в каталоге" : "услуг провайдеров";
    
    if (!confirm(`Удалить ${selectedIds.size} ${label}? Это действие необратимо.`)) return;
    
    setLoading(true);
    const ids = [...selectedIds];
    const { error } = await supabase.from(table).delete().in("id", ids);
    
    if (error) {
      toast.error(`Ошибка удаления: ${error.message}`);
    } else {
      toast.success(`Удалено ${ids.length} ${label}`);
      await logAuditAction(`bulk_delete_${table}` as any, table, undefined, { count: ids.length });
      setSelectedIds(new Set());
      await loadAll();
    }
    setLoading(false);
  };

  const handleBulkMoveCategory = async () => {
    const table = activeTab === "catalog" ? "services" : "provider_services";
    const category = bulkCategory.trim();
    if (!category) { toast.error("Введите категорию"); return; }
    
    setLoading(true);
    const ids = [...selectedIds];
    const { error } = await supabase.from(table).update({ category, updated_at: new Date().toISOString() }).in("id", ids);
    
    if (error) {
      toast.error(`Ошибка обновления: ${error.message}`);
    } else {
      toast.success(`Категория «${category}» → ${ids.length} строк`);
      await logAuditAction(`bulk_move_category_${table}` as any, table, undefined, { count: ids.length, category });
      setSelectedIds(new Set());
      setBulkCategory("");
      await loadAll();
    }
    setLoading(false);
  };

  const handleBulkMoveNetwork = async () => {
    const table = activeTab === "catalog" ? "services" : "provider_services";
    const network = bulkNetwork.trim();
    if (!network) { toast.error("Введите платформу"); return; }
    
    setLoading(true);
    const ids = [...selectedIds];
    const { error } = await supabase.from(table).update({ network, updated_at: new Date().toISOString() }).in("id", ids);
    
    if (error) {
      toast.error(`Ошибка обновления: ${error.message}`);
    } else {
      toast.success(`Платформа «${network}» → ${ids.length} строк`);
      await logAuditAction(`bulk_move_network_${table}` as any, table, undefined, { count: ids.length, network });
      setSelectedIds(new Set());
      setBulkNetwork("");
      await loadAll();
    }
    setLoading(false);
  };

  const handleBulkAlignPrices = async () => {
    setLoading(true);
    const ids = [...selectedIds];
    let updated = 0;
    let skipped = 0;
    for (const id of ids) {
      const rate = getCheapestRate(id);
      if (!rate) { skipped++; continue; }
      const newPrice = rate * (1 + minMarkup / 100);
      const { error } = await supabase.from("services").update({ price: newPrice, updated_at: new Date().toISOString() }).eq("id", id);
      if (!error) updated++;
    }
    const msg = `Цены выровнены до мин. наценки (${minMarkup}%) для ${updated} услуг${skipped ? ` (${skipped} без провайдера)` : ""}`;
    toast.success(msg);
    await logAuditAction("bulk_align_prices" as any, "services", undefined, { count: updated, minMarkup, skipped });
    setSelectedIds(new Set());
    await loadAll();
    setLoading(false);
  };

  const handleBulkToggleStatus = async (enabled: boolean) => {
    setLoading(true);
    const ids = [...selectedIds];
    const { error } = await supabase.from("services").update({ is_enabled: enabled, updated_at: new Date().toISOString() }).in("id", ids);
    if (error) {
      toast.error(`Ошибка обновления статуса: ${error.message}`);
    } else {
      toast.success(`Статус изменен для ${ids.length} услуг`);
      await logAuditAction("bulk_toggle_service_status" as any, "services", undefined, { count: ids.length, enabled });
      setSelectedIds(new Set());
      await loadAll();
    }
    setLoading(false);
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
      speed: svc.speed || "medium", 
      guarantee: svc.guarantee || "none",
      link_type: svc.link_type || "unknown",
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
      
      // Smart filters
      if (smartFilter === "error") {
        const svcMappings = getMappingsForService(s.id);
        const hasActiveProvider = svcMappings.some(m => m.is_active);
        if (s.is_enabled && !hasActiveProvider) return true;
        // Also check if primary provider is disabled
        const primary = svcMappings.find(m => m.is_active) || svcMappings[0];
        const ps = primary ? getProviderService(primary.provider_service_id) : null;
        if (s.is_enabled && ps && !ps.is_enabled) return true;
        return false;
      }
      if (smartFilter === "low_margin") {
        const rate = getCheapestRate(s.id);
        if (!rate) return false;
        const markupPct = Math.round(((s.price / rate) - 1) * 100);
        return markupPct < minMarkup;
      }
      if (smartFilter === "no_provider") {
        return getMappingsForService(s.id).length === 0;
      }

      if (search) {
        const q = search.toLowerCase();
        if (!s.name.toLowerCase().includes(q) && !s.category.toLowerCase().includes(q) && !s.id.includes(q)) return false;
      }
      return true;
    });
  }, [services, search, networkFilter, categoryFilter, enabledFilter, smartFilter, mappings, providerServices]);

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
          <Button size="sm" variant="outline" onClick={handleCleanup} className="h-7 text-xs border-destructive/30 hover:bg-destructive/5 text-destructive">
            <Trash2 className="h-3 w-3 mr-1" />Очистка
          </Button>
          <Button size="sm" variant="default" onClick={() => setShowSmartImport(true)} className="h-7 text-xs bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700">
            <Zap className="h-3 w-3 mr-1" />Умный импорт
          </Button>
          <CleanupRulesDialog />
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
      <Tabs value={activeTab} onValueChange={(v) => { setActiveTab(v); setSelectedIds(new Set()); }} className="flex flex-col flex-1 min-h-0">
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
            <div className="flex items-center gap-1.5 ml-2 p-1 bg-muted/30 rounded-lg border border-border/40">
              <button
                onClick={() => setSmartFilter("all")}
                className={`px-2 py-1 rounded-md text-[10px] font-medium transition-all ${smartFilter === "all" ? "bg-primary text-primary-foreground shadow-sm" : "hover:bg-muted text-muted-foreground"}`}
              >
                Все
              </button>
              <button
                onClick={() => setSmartFilter("error")}
                className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all ${smartFilter === "error" ? "bg-destructive text-destructive-foreground shadow-sm" : "hover:bg-destructive/10 text-destructive"}`}
              >
                <AlertTriangle className="h-3 w-3" /> Ошибки
              </button>
              <button
                onClick={() => setSmartFilter("low_margin")}
                className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all ${smartFilter === "low_margin" ? "bg-amber-500 text-white shadow-sm" : "hover:bg-amber-500/10 text-amber-600"}`}
              >
                <Percent className="h-3 w-3" /> Наценка
              </button>
              <button
                onClick={() => setSmartFilter("no_provider")}
                className={`px-2 py-1 rounded-md text-[10px] font-medium flex items-center gap-1 transition-all ${smartFilter === "no_provider" ? "bg-zinc-600 text-white shadow-sm" : "hover:bg-zinc-600/10 text-zinc-600"}`}
              >
                <Link2 className="h-3 w-3" /> Без пров.
              </button>
            </div>
          )}

          {/* Price display toggles */}
          <div className="flex items-center gap-0.5 ml-auto border rounded-md">
            <Button
              size="sm"
              variant={priceMode === "per1" ? "default" : "ghost"}
              className="h-7 text-[10px] px-2 rounded-r-none"
              onClick={() => setPriceMode("per1")}
            >
              <Hash className="h-3 w-3 mr-0.5" />1шт
            </Button>
            <Button
              size="sm"
              variant={priceMode === "per1k" ? "default" : "ghost"}
              className="h-7 text-[10px] px-2 rounded-l-none"
              onClick={() => setPriceMode("per1k")}
            >
              1000
            </Button>
          </div>
          <div className="flex items-center gap-0.5 border rounded-md">
            <Button
              size="sm"
              variant={currency === "RUB" ? "default" : "ghost"}
              className="h-7 text-[10px] px-2 rounded-r-none"
              onClick={() => setCurrency("RUB")}
            >
              ₽
            </Button>
            <Button
              size="sm"
              variant={currency === "USD" ? "default" : "ghost"}
              className="h-7 text-[10px] px-2 rounded-l-none"
              onClick={() => setCurrency("USD")}
              disabled={!usdRate}
              title={!usdRate ? "Курс USD не загружен" : `1 USD = ${usdRate.toFixed(2)} ₽`}
            >
              <DollarSign className="h-3 w-3" />
            </Button>
          </div>
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
                <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                  <DialogHeader><DialogTitle>Новая услуга</DialogTitle></DialogHeader>
                  <div className="space-y-3">
                    <div><Label className="text-xs">Название</Label><Input value={newService.name} onChange={(e) => setNewService({ ...newService, name: e.target.value })} /></div>
                    <div><Label className="text-xs">Описание</Label><Textarea value={newService.description} onChange={(e) => setNewService({ ...newService, description: e.target.value })} /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <Label className="text-xs">Платформа</Label>
                        <Select value={newService.network} onValueChange={(v) => {
                          setNewService({ ...newService, network: v });
                          const firstCat = dbCategories.find(c => c.network === v)?.name;
                          if (firstCat) setNewService(prev => ({ ...prev, network: v, category: firstCat }));
                        }}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Выберите платформу" /></SelectTrigger>
                          <SelectContent>
                            {dbPlatforms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>
                      <div>
                        <Label className="text-xs">Категория</Label>
                        <Select value={newService.category} onValueChange={(v) => setNewService({ ...newService, category: v })}>
                          <SelectTrigger className="h-9"><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                          <SelectContent>
                            {dbCategories
                              .filter(c => !newService.network || c.network === newService.network)
                              .map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                            {dbCategories.filter(c => c.network === newService.network).length === 0 && (
                              dbCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                            )}
                          </SelectContent>
                        </Select>
                      </div>
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

                    {/* Provider mapping section */}
                    <div className="border rounded-md p-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <Label className="text-xs font-semibold flex items-center gap-1">
                          <Link2 className="h-3 w-3" />Привязка провайдеров
                          {createMappingIds.length > 0 && (
                            <Badge variant="default" className="text-[9px] ml-1">{createMappingIds.length}</Badge>
                          )}
                        </Label>
                      </div>

                      {/* Selected providers */}
                      {createMappingIds.length > 0 && (
                        <div className="flex flex-wrap gap-1">
                          {createMappingIds.map((psId, idx) => {
                            const ps = providerServices.find(p => p.id === psId);
                            if (!ps) return null;
                            return (
                              <Badge key={psId} variant="secondary" className="text-[9px] gap-1 pr-1">
                                <span className="font-mono">#{idx + 1}</span> {ps.provider} · {ps.name} · {ps.rate.toFixed(2)}₽
                                <button
                                  onClick={() => setCreateMappingIds(prev => prev.filter(id => id !== psId))}
                                  className="ml-1 hover:text-destructive"
                                >×</button>
                              </Badge>
                            );
                          })}
                        </div>
                      )}

                      {/* Search & filter */}
                      <div className="flex gap-1">
                        <div className="relative flex-1">
                          <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                          <Input
                            placeholder="Поиск провайдерской услуги..."
                            value={createProviderSearch}
                            onChange={(e) => setCreateProviderSearch(e.target.value)}
                            className="pl-7 h-7 text-xs"
                          />
                        </div>
                        <Select value={createProviderFilter} onValueChange={setCreateProviderFilter}>
                          <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue /></SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">Все</SelectItem>
                            {providerKeys.map((p) => <SelectItem key={p} value={p}>{p}</SelectItem>)}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Provider services list */}
                      <div className="max-h-[180px] overflow-y-auto border rounded text-[10px]">
                        {providerServices
                          .filter(ps => {
                            if (createProviderFilter !== "all" && ps.provider !== createProviderFilter) return false;
                            if (createProviderSearch) {
                              const q = createProviderSearch.toLowerCase();
                              if (!ps.name.toLowerCase().includes(q) && !String(ps.provider_service_id).includes(q)) return false;
                            }
                            return true;
                          })
                          .slice(0, 50)
                          .map(ps => {
                            const isSelected = createMappingIds.includes(ps.id);
                            return (
                              <div
                                key={ps.id}
                                className={`flex items-center gap-2 px-2 py-1 cursor-pointer hover:bg-muted/50 border-b border-border/30 ${isSelected ? "bg-primary/10" : ""}`}
                                onClick={() => {
                                  if (isSelected) {
                                    setCreateMappingIds(prev => prev.filter(id => id !== ps.id));
                                  } else {
                                    setCreateMappingIds(prev => [...prev, ps.id]);
                                    // Auto-fill fields from first selected provider
                                    if (createMappingIds.length === 0) {
                                      setNewService(prev => ({
                                        ...prev,
                                        name: prev.name || ps.name,
                                        category: prev.category || ps.category,
                                        network: prev.network || ps.network,
                                        description: prev.description || ps.description || "",
                                        min_quantity: prev.min_quantity === "100" ? String(ps.min_quantity) : prev.min_quantity,
                                        max_quantity: prev.max_quantity === "10000" ? String(ps.max_quantity) : prev.max_quantity,
                                      }));
                                      // Auto-calculate price with ladder
                                      const ladderMarkup = getMarkupForRate(ps.rate, markupLadder);
                                      const effectiveMarkup = Math.max(ladderMarkup, minMarkup);
                                      const autoPrice = ps.rate * (1 + effectiveMarkup / 100);
                                      setNewService(prev => ({
                                        ...prev,
                                        price: prev.price === "0" ? autoPrice.toFixed(2) : prev.price,
                                      }));
                                    }
                                  }
                                }}
                              >
                                <Checkbox checked={isSelected} className="scale-[0.7]" />
                                <span className="text-muted-foreground w-[60px] shrink-0">{ps.provider}</span>
                                <span className="flex-1">{ps.name}</span>
                                <span className="text-muted-foreground shrink-0">{ps.network}</span>
                                <span className="font-mono shrink-0 w-[70px] text-right">{ps.rate.toFixed(2)}₽</span>
                              </div>
                            );
                          })}
                      </div>
                      <p className="text-[9px] text-muted-foreground">Выберите одну или несколько услуг провайдера. Приоритет — порядок выбора.</p>
                    </div>

                    <Button onClick={createService} disabled={!newService.name} className="w-full">
                      Создать{createMappingIds.length > 0 ? ` + ${createMappingIds.length} привязок` : ""}
                    </Button>
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
                {/* Bulk action bar */}
                {selectedIds.size > 0 && activeTab === "catalog" && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 border-b border-primary/20 sticky top-0 z-10 flex-wrap">
                    <Badge variant="default" className="text-[10px]">{selectedIds.size} выбрано</Badge>
                    {/* Markup */}
                    <div className="flex items-center gap-1">
                      <Input
                        type="number"
                        placeholder={`≥${minMarkup}%`}
                        min={minMarkup}
                        value={bulkMarkup}
                        onChange={(e) => {
                          const v = e.target.value;
                          if (v && parseFloat(v) < minMarkup) {
                            setBulkMarkup(String(minMarkup));
                          } else {
                            setBulkMarkup(v);
                          }
                        }}
                        className="h-7 w-[80px] text-xs"
                      />
                      <Button size="sm" className="h-7 text-xs" onClick={applyBulkMarkup} disabled={!bulkMarkup}>
                        <Percent className="h-3 w-3 mr-1" />Наценка
                      </Button>
                    </div>
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={applyLadderToSelected}>
                      <Layers className="h-3 w-3 mr-1" />Лестница
                    </Button>
                    <div className="w-px h-5 bg-border" />
                    {/* Category */}
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Категория"
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="h-7 w-[120px] text-xs"
                        list="bulk-categories"
                      />
                      <datalist id="bulk-categories">
                        {categories.map(c => <option key={c} value={c} />)}
                      </datalist>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={applyBulkCategory} disabled={!bulkCategory.trim()}>
                        Категория
                      </Button>
                    </div>
                    {/* Network */}
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Платформа"
                        value={bulkNetwork}
                        onChange={(e) => setBulkNetwork(e.target.value)}
                        className="h-7 w-[110px] text-xs"
                        list="bulk-networks"
                      />
                      <datalist id="bulk-networks">
                        {networks.map(n => <option key={n} value={n} />)}
                      </datalist>
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={applyBulkNetwork} disabled={!bulkNetwork.trim()}>
                        Платформа
                      </Button>
                    </div>
                    <div className="w-px h-5 bg-border" />
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>
                      <Trash2 className="h-3 w-3 mr-1" />Удалить ({selectedIds.size})
                    </Button>
                    <div className="w-px h-5 bg-border" />
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                      Сбросить
                    </Button>
                  </div>
                )}
                {filteredServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Нет услуг</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[10px] uppercase bg-muted/30">
                        <TableHead className="px-2 w-8">
                          <Checkbox
                            checked={selectedIds.size === filteredServices.length && filteredServices.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="scale-[0.75]"
                          />
                        </TableHead>
                        <TableHead className="px-2 w-10">ID</TableHead>
                        <TableHead className="px-2">Название</TableHead>
                        <TableHead className="px-2">Категория</TableHead>
                        <TableHead className="px-2">Активность (Группа)</TableHead>
                        <TableHead className="px-2 min-w-[150px]">Активность (Услуга)</TableHead>
                        <TableHead className="px-2">Статус</TableHead>
                        <TableHead className="px-2">Статус Пров.</TableHead>
                        <TableHead className="px-2 text-right">Процент</TableHead>
                        <TableHead className="px-2 text-right">Реальная наценка</TableHead>
                        <TableHead className="px-2 text-right">Цена</TableHead>
                        <TableHead className="px-2">Индикатор</TableHead>
                        <TableHead className="px-2">Создана</TableHead>
                        <TableHead className="px-2 w-16">Действия</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredServices.map((svc, index) => {
                        const svcMappings = getMappingsForService(svc.id);
                        const activeCount = svcMappings.filter(m => m.is_active).length;
                        const primaryMapping = svcMappings.find(m => m.is_active) || svcMappings[0];
                        const ps = primaryMapping ? getProviderService(primaryMapping.provider_service_id) : null;
                        
                        const isOrphan = svc.is_enabled && activeCount === 0;
                        const cheapestRate = getCheapestRate(svc.id);
                        const markupPct = cheapestRate && cheapestRate > 0
                          ? Math.round(((svc.price / cheapestRate) - 1) * 100)
                          : null;
                        const isBelowMin = markupPct !== null && markupPct < minMarkup;

                        return (
                          <Tooltip key={svc.id}>
                            <TooltipTrigger asChild>
                          <TableRow
                            className={`text-[11px] cursor-pointer hover:bg-muted/50 transition-colors ${selectedIds.has(svc.id) ? "bg-primary/5 border-l-2 border-l-primary" : "border-l-2 border-l-transparent"} ${!svc.is_enabled ? "opacity-60 bg-muted/20" : ""} ${isOrphan ? "bg-destructive/5" : ""} ${isBelowMin ? "bg-destructive/10" : ""}`}
                            onClick={() => openEditDialog(svc)}
                          >
                            <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                              <Checkbox
                                checked={selectedIds.has(svc.id)}
                                onCheckedChange={() => toggleSelect(svc.id)}
                                className="scale-[0.75]"
                              />
                            </TableCell>
                            <TableCell className="px-2 font-mono text-muted-foreground">{index + 1}</TableCell>
                            <TableCell className="px-2 font-semibold text-primary" onClick={(e) => {
                              e.stopPropagation();
                              setEditingId(svc.id);
                              setEditingName(svc.name);
                            }}>
                              {editingId === svc.id ? (
                                <Input
                                  value={editingName}
                                  onChange={(e) => setEditingName(e.target.value)}
                                  onBlur={() => handleInlineSave(svc.id, "name", editingName)}
                                  onKeyDown={(e) => e.key === "Enter" && handleInlineSave(svc.id, "name", editingName)}
                                  className="h-7 text-xs"
                                  autoFocus
                                />
                              ) : (
                                <span className="cursor-pointer hover:underline decoration-dotted block leading-normal py-1">
                                  {svc.name}
                                </span>
                              )}
                            </TableCell>
                            <TableCell className="px-2">{svc.network}</TableCell>
                            <TableCell className="px-2 text-muted-foreground">{svc.network} - {svc.category}</TableCell>
                            <TableCell className="px-2 max-w-[250px]">
                              {ps ? (
                                <div className="flex flex-col">
                                  <span className="block leading-tight">{ps.name}</span>
                                  <span className="text-[9px] text-muted-foreground/70 uppercase">{ps.provider} #{ps.provider_service_id}</span>
                                </div>
                              ) : <span className="text-destructive font-bold uppercase text-[9px]">Не привязана</span>}
                            </TableCell>
                            <TableCell className="px-2">
                              {svc.is_enabled ? (
                                <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[9px] font-bold uppercase shadow-none">Активна</Badge>
                              ) : (
                                <Badge className="bg-destructive/10 text-destructive border-destructive/20 text-[9px] font-bold uppercase shadow-none">Деактивирована</Badge>
                              )}
                            </TableCell>
                            <TableCell className="px-2">
                              {ps ? (
                                ps.is_enabled ? (
                                  <Badge variant="outline" className="text-green-500 border-green-500/50 text-[9px] uppercase shadow-none">Активна</Badge>
                                ) : (
                                  <Badge variant="outline" className="text-destructive border-destructive/50 text-[9px] uppercase shadow-none">Удалена</Badge>
                                )
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="px-2 text-right font-mono">{markupPct ?? "—"}</TableCell>
                            <TableCell className="px-2 text-right font-mono font-bold">
                              {markupPct !== null ? `${markupPct}%` : "—"}
                            </TableCell>
                            <TableCell className="px-2 text-right">
                              <div className="font-mono font-bold text-sm" onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(svc.id);
                                setEditingPrice(svc.price.toString());
                              }}>
                                {editingId === svc.id ? (
                                  <Input
                                    type="number"
                                    value={editingPrice}
                                    onChange={(e) => setEditingPrice(e.target.value)}
                                    onBlur={() => handleInlineSave(svc.id, "price", editingPrice)}
                                    onKeyDown={(e) => e.key === "Enter" && handleInlineSave(svc.id, "price", editingPrice)}
                                    className="h-7 text-xs w-[80px] ml-auto"
                                    autoFocus
                                  />
                                ) : (
                                  <span className="cursor-pointer hover:underline decoration-dotted">{fmtPrice(Number(svc.price))}</span>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-2">
                              {svc.is_enabled ? (
                                <Badge className="bg-green-100 text-green-700 text-[9px] font-bold uppercase">Активно</Badge>
                              ) : <span className="text-muted-foreground">—</span>}
                            </TableCell>
                            <TableCell className="px-2 text-[9px] text-muted-foreground leading-tight">
                              {svc.created_at ? new Date(svc.created_at).toLocaleString('ru-RU', {
                                year: 'numeric', month: '2-digit', day: '2-digit',
                                hour: '2-digit', minute: '2-digit', second: '2-digit'
                              }).replace(',', '') : '—'}
                            </TableCell>
                            <TableCell className="px-2" onClick={(e) => e.stopPropagation()}>
                              <div className="flex gap-1">
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                  setEditService(svc);
                                  setEditForm({
                                    name: svc.name,
                                    description: svc.description || "",
                                    category: svc.category,
                                    network: svc.network,
                                    min_quantity: String(svc.min_quantity),
                                    max_quantity: String(svc.max_quantity),
                                    price: String(svc.price),
                                    speed: svc.speed || "medium",
                                    guarantee: svc.guarantee || "none",
                                    link_type: svc.link_type || "unknown",
                                    warning_text: svc.warning_text || ""
                                  });
                                  setShowDrawer(true);
                                }}>
                                  <Eye className="h-3 w-3 text-primary" />
                                </Button>
                                <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => {
                                  setEditService(svc);
                                  setEditForm({
                                    name: svc.name,
                                    description: svc.description || "",
                                    category: svc.category,
                                    network: svc.network,
                                    min_quantity: String(svc.min_quantity),
                                    max_quantity: String(svc.max_quantity),
                                    price: String(svc.price),
                                    speed: svc.speed || "medium",
                                    guarantee: svc.guarantee || "none",
                                    link_type: svc.link_type || "unknown",
                                    warning_text: svc.warning_text || ""
                                  });
                                  setShowDrawer(true);
                                }}>
                                  <Pencil className="h-3 w-3" />
                                </Button>
                              </div>
                            </TableCell>
                          </TableRow>
                            </TooltipTrigger>
                            {isBelowMin && (
                              <TooltipContent side="top" className="text-xs max-w-[220px]">
                                <p className="font-semibold text-destructive">⚠ Наценка ниже минимума!</p>
                                <p>Текущая: {markupPct}% · Мин: {minMarkup}%</p>
                              </TooltipContent>
                            )}
                          </Tooltip>
                        );
                      })}
                    </TableBody>
                  </Table>
                )}
              </TabsContent>

              {/* === PROVIDER SERVICES TABLE === */}
              <TabsContent value="providers" className="mt-0">
                {/* Bulk action bar for providers */}
                {selectedIds.size > 0 && activeTab === "providers" && (
                  <div className="flex items-center gap-2 p-2 bg-primary/5 border-b border-primary/20 sticky top-0 z-10">
                    <Badge variant="default" className="text-[10px]">{selectedIds.size} выбрано</Badge>
                    <Button size="sm" className="h-7 text-xs" onClick={async () => {
                      const ids = [...selectedIds];
                      let created = 0;
                      let skipped = 0;
                      for (const id of ids) {
                        const ps = providerServices.find(p => p.id === id);
                        if (!ps) { skipped++; continue; }
                        // Check if already mapped
                        const alreadyMapped = mappings.some(m => m.provider_service_id === id);
                        if (alreadyMapped) { skipped++; continue; }
                        await createFromProvider(ps);
                        created++;
                      }
                      toast.success(`Добавлено в каталог: ${created}${skipped ? ` (${skipped} пропущено)` : ""}`);
                      setSelectedIds(new Set());
                      await loadAll();
                    }}>
                      <Plus className="h-3 w-3 mr-1" />В каталог ({selectedIds.size})
                    </Button>
                    <div className="w-px h-5 bg-border" />
                    {/* Category for providers */}
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Категория"
                        value={bulkCategory}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="h-7 w-[120px] text-xs"
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkMoveCategory} disabled={!bulkCategory.trim()}>
                        Кат.
                      </Button>
                    </div>
                    {/* Network for providers */}
                    <div className="flex items-center gap-1">
                      <Input
                        placeholder="Платформа"
                        value={bulkNetwork}
                        onChange={(e) => setBulkNetwork(e.target.value)}
                        className="h-7 w-[100px] text-xs"
                      />
                      <Button size="sm" variant="outline" className="h-7 text-xs" onClick={handleBulkMoveNetwork} disabled={!bulkNetwork.trim()}>
                        Плат.
                      </Button>
                    </div>
                    <div className="w-px h-5 bg-border" />
                    <Button size="sm" variant="destructive" className="h-7 text-xs" onClick={handleBulkDelete}>
                      <Trash2 className="h-3 w-3 mr-1" />Удалить
                    </Button>
                    <div className="w-px h-5 bg-border" />
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>
                      Сбросить
                    </Button>
                  </div>
                )}
                {filteredProviderServices.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-sm">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-40" /><p>Синхронизируйте провайдеров</p>
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[11px]">
                        <TableHead className="px-2 w-8">
                          <Checkbox
                            checked={selectedIds.size === filteredProviderServices.length && filteredProviderServices.length > 0}
                            onCheckedChange={toggleSelectAll}
                            className="scale-[0.75]"
                          />
                        </TableHead>
                        <TableHead className="px-2">Пров.</TableHead>
                        <TableHead className="px-2">SID</TableHead>
                        <TableHead className="px-2">Услуга</TableHead>
                        <TableHead className="px-2 w-[90px]">Сеть</TableHead>
                        <TableHead className="px-2 w-[90px] text-right">Закупка</TableHead>
                        <TableHead className="px-2 w-[80px]">Привязки</TableHead>
                        <TableHead className="px-2 w-[80px]"></TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProviderServices.map((svc) => {
                        const svcMappings = mappings.filter((m) => m.provider_service_id === svc.id);
                        const alreadyInCatalog = svcMappings.length > 0;
                        return (
                          <TableRow key={svc.id} className={`text-xs ${selectedIds.has(svc.id) ? "bg-primary/5" : ""} ${alreadyInCatalog ? "opacity-60" : ""}`}>
                            <TableCell className="px-2">
                              <Checkbox
                                checked={selectedIds.has(svc.id)}
                                onCheckedChange={() => toggleSelect(svc.id)}
                                className="scale-[0.75]"
                              />
                            </TableCell>
                            <TableCell className="px-2"><Badge variant="secondary" className="text-[10px]">{svc.provider}</Badge></TableCell>
                            <TableCell className="px-2 text-muted-foreground font-mono">{svc.provider_service_id}</TableCell>
                            <TableCell className="px-2">
                              <div className="flex items-center gap-1.5 py-1">
                                <div className="font-medium leading-normal">{svc.name}</div>
                                {svc.description && (
                                  <Tooltip>
                                    <TooltipTrigger asChild>
                                      <Button variant="ghost" size="icon" className="h-5 w-5 rounded-full shrink-0" onClick={(e) => {
                                        e.stopPropagation();
                                        alert(svc.description); // Simple for now, can be improved to a nicer dialog
                                      }}>
                                        <Info className="h-3 w-3 text-muted-foreground" />
                                      </Button>
                                    </TooltipTrigger>
                                    <TooltipContent className="max-w-[300px] text-xs">
                                      {svc.description}
                                    </TooltipContent>
                                  </Tooltip>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="px-2"><Badge variant="outline" className="text-[10px]">{svc.network}</Badge></TableCell>
                            <TableCell className="px-2 text-right font-mono">{fmtPrice(Number(svc.rate))}</TableCell>
                            <TableCell className="px-2">
                              {svcMappings.length > 0 ? (
                                <Badge variant="outline" className="text-[9px]">{svcMappings.length}</Badge>
                              ) : <span className="text-muted-foreground text-[10px]">—</span>}
                            </TableCell>
                            <TableCell className="px-2">
                              <Button variant="outline" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => createFromProvider(svc)} disabled={alreadyInCatalog}>
                                <Plus className="h-2.5 w-2.5 mr-0.5" />{alreadyInCatalog ? "Уже" : "В каталог"}
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
                    <div>
                      <Label className="text-xs">Платформа</Label>
                      <Select value={editForm.network} onValueChange={(v) => {
                        setEditForm({ ...editForm, network: v });
                        // Optionally auto-set first category of this network
                        const firstCat = dbCategories.find(c => c.network === v)?.name;
                        if (firstCat) setEditForm(prev => ({ ...prev, network: v, category: firstCat }));
                      }}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Выберите платформу" /></SelectTrigger>
                        <SelectContent>
                          {dbPlatforms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-xs">Категория</Label>
                      <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                        <SelectTrigger className="h-9"><SelectValue placeholder="Выберите категорию" /></SelectTrigger>
                        <SelectContent>
                          {dbCategories
                            .filter(c => !editForm.network || c.network === editForm.network)
                            .map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          {/* If no categories for this network, show all as fallback or allow adding? */}
                          {dbCategories.filter(c => c.network === editForm.network).length === 0 && (
                            dbCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div><Label className="text-xs">Мин. кол-во</Label><Input type="number" value={editForm.min_quantity} onChange={(e) => setEditForm({ ...editForm, min_quantity: e.target.value })} /></div>
                    <div><Label className="text-xs">Макс. кол-во</Label><Input type="number" value={editForm.max_quantity} onChange={(e) => setEditForm({ ...editForm, max_quantity: e.target.value })} /></div>
                    <div>
                      <Label className="text-xs">Цена за 1000</Label>
                      <Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} />
                      {editService && (() => {
                        const cr = getCheapestRate(editService.id);
                        if (cr && cr > 0) {
                          const minP = cr * (1 + minMarkup / 100);
                          return <p className="text-[10px] text-muted-foreground mt-0.5">Мин. цена: {minP.toFixed(2)} (наценка {minMarkup}%)</p>;
                        }
                        return null;
                      })()}
                    </div>
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

      {/* === SERVICE INSPECTOR (DRAWER) === */}
      <Sheet open={showDrawer} onOpenChange={setShowDrawer}>
        <SheetContent className="sm:max-w-md overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4 text-primary" />
              Инспектор услуги
            </SheetTitle>
            <SheetDescription className="text-[10px] uppercase font-mono">
              ID: {editService?.id}
            </SheetDescription>
          </SheetHeader>

          {editService && (
            <div className="space-y-6 mt-6 pb-12">
              {/* Internal Info */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Общая информация</h3>
                  <Badge variant={editService.is_enabled ? "default" : "secondary"} className="text-[9px]">
                    {editService.is_enabled ? "Активна" : "Пауза"}
                  </Badge>
                </div>
                
                <div className="grid gap-3">
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Название</Label>
                    <Input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })} className="h-8 text-xs font-semibold" />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Платформа</Label>
                      <Select value={editForm.network} onValueChange={(v) => {
                        setEditForm({ ...editForm, network: v });
                         const firstCat = dbCategories.find(c => c.network === v)?.name;
                         if (firstCat) setEditForm(prev => ({ ...prev, network: v, category: firstCat }));
                      }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Сеть" /></SelectTrigger>
                        <SelectContent>
                          {dbPlatforms.map(p => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div>
                      <Label className="text-[10px] text-muted-foreground">Категория</Label>
                      <Select value={editForm.category} onValueChange={(v) => setEditForm({ ...editForm, category: v })}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Категория" /></SelectTrigger>
                        <SelectContent>
                          {dbCategories
                            .filter(c => !editForm.network || c.network === editForm.network)
                            .map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                          {dbCategories.filter(c => c.network === editForm.network).length === 0 && (
                            dbCategories.map(c => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)
                          )}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>
              </div>

              {/* Pricing & Limits */}
              <div className="space-y-3 p-3 bg-muted/40 rounded-lg border border-border/50">
                <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Цены и лимиты</h3>
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2">
                    <Label className="text-[10px] text-muted-foreground">Цена (за 1000)</Label>
                    <div className="relative">
                      <Input type="number" value={editForm.price} onChange={(e) => setEditForm({ ...editForm, price: e.target.value })} className="h-10 text-lg font-mono font-bold" />
                      <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">₽</span>
                    </div>
                    {(() => {
                      const cr = getCheapestRate(editService.id);
                      if (cr && cr > 0) {
                        const minP = cr * (1 + minMarkup / 100);
                        const currentMarkup = Math.round(((parseFloat(editForm.price) / cr) - 1) * 100);
                        return (
                          <div className="mt-1 flex justify-between items-center text-[10px]">
                            <span className="text-muted-foreground">Закупка: {cr.toFixed(2)}₽</span>
                            <span className={`font-bold ${currentMarkup < minMarkup ? "text-destructive" : "text-green-600"}`}>Наценка: {currentMarkup}%</span>
                          </div>
                        );
                      }
                      return null;
                    })()}
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Минимум</Label>
                    <Input type="number" value={editForm.min_quantity} onChange={(e) => setEditForm({ ...editForm, min_quantity: e.target.value })} className="h-8 text-xs font-mono" />
                  </div>
                  <div>
                    <Label className="text-[10px] text-muted-foreground">Максимум</Label>
                    <Input type="number" value={editForm.max_quantity} onChange={(e) => setEditForm({ ...editForm, max_quantity: e.target.value })} className="h-8 text-xs font-mono" />
                  </div>
                </div>
              </div>

              {/* Behavior */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-[10px] text-muted-foreground">Скорость</Label>
                  <Select value={editForm.speed} onValueChange={(v) => setEditForm({ ...editForm, speed: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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
                  <Label className="text-[10px] text-muted-foreground">Гарантия</Label>
                  <Select value={editForm.guarantee} onValueChange={(v) => setEditForm({ ...editForm, guarantee: v })}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
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

              {/* Failover Visualization */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Failover Цепочка</h3>
                  <Button size="sm" variant="outline" className="h-6 text-[10px] px-2" onClick={() => setAddMappingOpen(!addMappingOpen)}>
                    {addMappingOpen ? "Закрыть" : "+ Провайдер"}
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Тип ссылки</Label>
                    <Select 
                      value={editForm.link_type} 
                      onValueChange={(v) => setEditForm(prev => ({ ...prev, link_type: v }))}
                    >
                      <SelectTrigger className="h-9">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {['profile', 'post', 'reel', 'story', 'video', 'shorts', 'channel', 'group', 'unknown'].map(t => (
                          <SelectItem key={t} value={t}>{t}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-[10px] text-muted-foreground uppercase font-bold">Наценка (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input 
                        type="number" 
                        value={Math.round(((Number(editForm.price) / (getCheapestRate(editService!.id) || 1)) - 1) * 100)} 
                        readOnly 
                        className="h-9 bg-muted w-20"
                      />
                      <Badge variant="outline">Текущая</Badge>
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  {getMappingsForService(editService.id).map((m, i) => {
                    const ps = getProviderService(m.provider_service_id);
                    if (!ps) return null;
                    return (
                      <div key={m.id} className={`group relative flex items-center gap-3 p-2 rounded-lg border transition-all ${!m.is_active ? "opacity-40 grayscale" : i === 0 ? "border-primary/40 bg-primary/5 shadow-sm" : "bg-muted/30"}`}>
                        <div className="flex flex-col items-center justify-center w-6 h-6 rounded bg-background border text-[10px] font-bold">
                          {i === 0 ? "⚡" : `P${m.priority}`}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5">
                            <span className="text-[11px] font-bold truncate">{ps.provider}</span>
                            <span className="text-[9px] text-muted-foreground font-mono">#{ps.provider_service_id}</span>
                          </div>
                          <p className="text-[10px] text-muted-foreground truncate">{ps.name}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] font-mono leading-none">{ps.rate.toFixed(2)}₽</p>
                          <p className="text-[8px] text-muted-foreground uppercase mt-0.5">Закупка</p>
                        </div>
                        <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => updateMappingPriority(m.id, m.priority - 1)} className="p-1 hover:bg-muted rounded"><ArrowUp className="h-2 w-2" /></button>
                          <button onClick={() => updateMappingPriority(m.id, m.priority + 1)} className="p-1 hover:bg-muted rounded"><ArrowDown className="h-2 w-2" /></button>
                        </div>
                        <Switch className="scale-75" checked={m.is_active} onCheckedChange={(v) => toggleMapping(m.id, v)} />
                        <button 
                          onClick={() => deleteMapping(m.id)}
                          className="p-1.5 opacity-0 group-hover:opacity-100 transition-opacity text-destructive hover:bg-destructive/10 rounded-md"
                        >
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>

                {addMappingOpen && (
                  <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="p-3 bg-muted rounded-lg border space-y-3">
                    <div className="flex gap-2">
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                        <Input placeholder="Поиск..." value={mappingSearch} onChange={(e) => setMappingSearch(e.target.value)} className="pl-7 h-8 text-xs bg-background" />
                      </div>
                    </div>
                    <div className="max-h-[150px] overflow-auto border rounded bg-background">
                      {filteredMappingProviders.slice(0, 20).map(ps => (
                        <div 
                          key={ps.id} 
                          className={`flex items-center gap-2 p-2 text-[10px] cursor-pointer hover:bg-muted ${mappingProviderServiceId === ps.id ? "bg-primary/10" : ""}`}
                          onClick={() => setMappingProviderServiceId(ps.id)}
                        >
                          <Badge variant="secondary" className="px-1 py-0">{ps.provider}</Badge>
                          <span className="flex-1 truncate">{ps.name}</span>
                          <span className="font-mono">{ps.rate.toFixed(2)}₽</span>
                        </div>
                      ))}
                    </div>
                    <Button onClick={() => addMapping(editService.id)} disabled={!mappingProviderServiceId} size="sm" className="w-full h-8">
                      Привязать
                    </Button>
                  </motion.div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-4 border-t sticky bottom-0 bg-background pb-4">
                <Button onClick={saveEditService} className="flex-1 shadow-lg shadow-primary/20">
                  Сохранить изменения
                </Button>
                <Button variant="outline" onClick={() => setShowDrawer(false)}>
                  Отмена
                </Button>
              </div>

              {/* Danger Zone */}
              <div className="pt-8 opacity-40 hover:opacity-100 transition-opacity">
                <Button variant="ghost" size="sm" className="w-full text-destructive hover:bg-destructive/10 text-[10px]" onClick={() => deleteService(editService.id)}>
                  УДАЛИТЬ УСЛУГУ ПОЛНОСТЬЮ
                </Button>
              </div>
            </div>
          )}
        </SheetContent>
      </Sheet>

      {/* === SMART IMPORT DIALOG === */}
      <SmartImportDialog 
        open={showSmartImport} 
        onOpenChange={setShowSmartImport} 
        providerServices={providerServices}
        platforms={dbPlatforms}
        categories={dbCategories}
        onImportComplete={loadAll}
      />

      {/* Bulk Action Toolbar */}
      <AnimatePresence>
        {selectedIds.size > 0 && (
          <motion.div 
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-4 bg-background/95 backdrop-blur-md border border-primary/20 shadow-2xl px-6 py-3 rounded-2xl"
          >
            <div className="flex flex-col border-r pr-4">
              <span className="text-[10px] text-muted-foreground uppercase font-bold">Выбрано</span>
              <span className="text-xl font-black text-primary leading-none">{selectedIds.size}</span>
            </div>
            
            <div className="flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-9 px-3 text-xs gap-1.5 border-amber-200 hover:bg-amber-50 text-amber-600" onClick={handleBulkAlignPrices}>
                <Percent className="h-3.5 w-3.5" />
                Выровнять цены
              </Button>
              <Button size="sm" variant="outline" className="h-9 px-3 text-xs gap-1.5" onClick={() => handleBulkToggleStatus(true)}>
                <CheckCircle2 className="h-3.5 w-3.5 text-green-500" />
                Включить
              </Button>
              <Button size="sm" variant="outline" className="h-9 px-3 text-xs gap-1.5" onClick={() => handleBulkToggleStatus(false)}>
                <XCircle className="h-3.5 w-3.5 text-destructive" />
                Выключить
              </Button>
              <Button size="sm" variant="outline" className="h-9 px-3 text-xs gap-1.5 border-destructive/20 text-destructive hover:bg-destructive/5" onClick={handleBulkDelete}>
                <Trash2 className="h-3.5 w-3.5" />
                Удалить
              </Button>
              <Button size="sm" variant="ghost" className="h-9 px-3 text-xs" onClick={() => setSelectedIds(new Set())}>
                Сброс
              </Button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SmartImportDialog = ({ open, onOpenChange, providerServices, platforms, categories, onImportComplete }: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  providerServices: ProviderService[];
  platforms: Platform[];
  categories: Category[];
  onImportComplete: () => void;
}) => {
  const [step, setStep] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [processing, setProcessing] = useState(false);

  // Filters
  const [importSearch, setImportSearch] = useState("");
  const [importProviderFilter, setImportProviderFilter] = useState("all");

  // Overrides
  const [overrideNetwork, setOverrideNetwork] = useState<string>("auto");
  const [overrideCategory, setOverrideCategory] = useState<string>("auto");
  const [overrideLinkType, setOverrideLinkType] = useState<string>("auto");

  const stats = useMemo(() => {
    const unmapped = providerServices.filter((ps: ProviderService) => ps.is_enabled); // we could filter for actually unmapped ones later
    return { total: providerServices.length, active: unmapped.length };
  }, [providerServices]);

  const filteredImportList = useMemo(() => {
    return providerServices.filter((ps: ProviderService) => {
      if (importProviderFilter !== "all" && ps.provider !== importProviderFilter) return false;
      if (importSearch) {
        const q = importSearch.toLowerCase();
        if (!ps.name.toLowerCase().includes(q) && !ps.category.toLowerCase().includes(q)) return false;
      }
      return true;
    });
  }, [providerServices, importSearch, importProviderFilter]);

  const providerKeys = useMemo(() => Array.from(new Set(providerServices.map((ps: ProviderService) => ps.provider))), [providerServices]);

  const detectMetadata = (name: string, category: string, network: string) => {
    const n = name.toLowerCase();
    const c = category.toLowerCase();
    const net = network.toLowerCase();

    let detectedNetwork = network;
    if (n.includes("instagram") || c.includes("instagram")) detectedNetwork = "Instagram";
    else if (n.includes("telegram") || c.includes("telegram") || n.includes(" tg ")) detectedNetwork = "Telegram";
    else if (n.includes("tiktok") || c.includes("tiktok")) detectedNetwork = "TikTok";
    else if (n.includes("youtube") || c.includes("youtube") || n.includes("yt ")) detectedNetwork = "YouTube";
    else if (n.includes("vkontakte") || n.includes(" vk ") || n.includes("вк ")) detectedNetwork = "VK";

    let detectedCategory = "Other";
    if (n.includes("like") || n.includes("лайк") || c.includes("like")) detectedCategory = "Лайки";
    else if (n.includes("follower") || n.includes("subscriber") || n.includes("подписчик") || c.includes("follower")) detectedCategory = "Подписчики";
    else if (n.includes("view") || n.includes("просмотр") || c.includes("view")) detectedCategory = "Просмотры";
    else if (n.includes("comment") || n.includes("коммент") || c.includes("comment")) detectedCategory = "Комментарии";
    else if (n.includes("reach") || n.includes("охват")) detectedCategory = "Охват";
    else if (n.includes("save") || n.includes("сохранение")) detectedCategory = "Сохранения";

    let tier = "Standard";
    if (n.includes("econom") || n.includes("эконом") || n.includes("cheap")) tier = "Econom";
    else if (n.includes("premium") || n.includes("премиум") || n.includes("hq") || n.includes("high quality")) tier = "Premium";
    else if (n.includes("real") || n.includes("живые") || n.includes("active")) tier = "Real";

    let speed = "medium";
    if (n.includes("instant") || n.includes("мгновен")) speed = "instant";
    else if (n.includes("fast") || n.includes("быстр")) speed = "fast";
    else if (n.includes("slow") || n.includes("медлен")) speed = "slow";

    let guarantee = "none";
    if (n.includes("30 day") || n.includes("30 дней")) guarantee = "30d";
    else if (n.includes("60 day") || n.includes("60 дней")) guarantee = "60d";
    else if (n.includes("lifetime") || n.includes("вечн")) guarantee = "lifetime";

    let link_type = "unknown";
    if (n.includes("post") || n.includes("picture") || n.includes("photo") || n.includes("публикация") || n.includes("фото") || n.includes("reel") || n.includes("shorts")) {
      link_type = "post";
    } else if (n.includes("profile") || n.includes("account") || n.includes("channel") || n.includes("профиль") || n.includes("аккаунт") || n.includes("канал") || n.includes("group") || n.includes("группа")) {
      link_type = "profile";
    } else if (n.includes("story") || n.includes("сторис")) {
      link_type = "story";
    } else if (n.includes("video") || n.includes("view") || n.includes("просмотр") || n.includes("видео")) {
      // Special check for Telegram mass views (on last posts)
      if (detectedNetwork === "Telegram" && (n.includes("last") || n.includes("последн"))) {
        link_type = "profile";
      } else {
        link_type = "video";
      }
    }

    return { network: detectedNetwork, category: detectedCategory, tier, speed, guarantee, link_type };
  };

  const handleImport = async () => {
    setProcessing(true);
    const ids = Array.from(selectedIds);
    let count = 0;
    
    for (const id of ids) {
      const ps = providerServices.find((p: ProviderService) => p.id === id);
      if (!ps) continue;

      const meta = detectMetadata(ps.name, ps.category, ps.network);
      const cleanName = `${meta.category} — ${meta.tier}`;

      // Overrides
      const network = overrideNetwork === "auto" ? meta.network : overrideNetwork;
      const finalCategory = overrideCategory === "auto" ? meta.category : overrideCategory;
      const link_type = overrideLinkType === "auto" ? meta.link_type : overrideLinkType;

      // 1. Create service
      const { data: svc, error: svcErr } = await supabase.from("services").insert({
        name: cleanName,
        category: finalCategory,
        network: network,
        link_type: link_type,
        description: ps.description,
        min_quantity: ps.min_quantity,
        max_quantity: ps.max_quantity,
        price: ps.rate * 2.5, // Default 150% markup
        speed: meta.speed,
        guarantee: meta.guarantee,
        is_enabled: true
      }).select().single();

      if (svcErr) {
        console.error("Import error:", svcErr);
        continue;
      }

      // 2. Map provider
      await supabase.from("service_provider_mappings").insert({
        service_id: svc.id,
        provider_service_id: ps.id,
        priority: 1,
        is_active: true
      });
      
      count++;
    }

    toast.success(`Успешно импортировано ${count} услуг`);
    setProcessing(false);
    onImportComplete();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-violet-500" />
            Умный импорт услуг v2
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 overflow-y-auto space-y-4 py-4">
          {step === 1 ? (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Card><CardContent className="p-4">
                  <p className="text-2xl font-bold">{stats.total}</p>
                  <p className="text-xs text-muted-foreground">Всего услуг у провайдеров</p>
                </CardContent></Card>
                <Card><CardContent className="p-4">
                  <p className="text-2xl font-bold">{stats.active}</p>
                  <p className="text-xs text-muted-foreground">Доступно для анализа</p>
                </CardContent></Card>
              </div>
              <div className="bg-muted/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-semibold">Как это работает?</p>
                <ul className="text-xs space-y-1 text-muted-foreground list-disc pl-4">
                  <li>Система анализирует названия и категории провайдера.</li>
                  <li>Автоматически определяет соцсеть (Instagram, Telegram и т.д.).</li>
                  <li>Группирует по типу (Лайки, Подписчики) и качеству (Эконом, Премиум).</li>
                  <li>Создает красивые кнопки в каталоге и привязывает их к базе.</li>
                </ul>
              </div>
              <Button className="w-full" onClick={() => setStep(2)}>Начать анализ и выбор</Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="sticky top-0 bg-background pt-2 pb-3 border-b z-20 space-y-4">
                <div className="grid grid-cols-2 gap-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                    <Input 
                      placeholder="Поиск по названию..." 
                      value={importSearch} 
                      onChange={(e) => setImportSearch(e.target.value)} 
                      className="pl-8 h-8 text-xs"
                    />
                  </div>
                  <Select value={importProviderFilter} onValueChange={setImportProviderFilter}>
                    <SelectTrigger className="h-8 text-xs"><SelectValue placeholder="Провайдер" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все провайдеры</SelectItem>
                      {providerKeys.map((pk: string) => <SelectItem key={pk} value={pk}>{pk}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </div>

                <div className="p-3 bg-violet-50/50 rounded-lg border border-violet-100 space-y-3">
                  <div className="flex items-center gap-2 text-xs font-bold text-violet-700">
                    <Settings2 className="h-3.5 w-3.5" />
                    ПРАВИЛА ИМПОРТА (BATCH OVERRIDES)
                  </div>
                  <div className="grid grid-cols-3 gap-3">
                    <div className="space-y-1">
                      <Label className="text-[10px] text-violet-600 uppercase font-bold">Соцсеть</Label>
                      <Select value={overrideNetwork} onValueChange={setOverrideNetwork}>
                        <SelectTrigger className="h-7 text-[10px] bg-white border-violet-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🪄 Авто (анализ)</SelectItem>
                          {platforms.map((p: Platform) => <SelectItem key={p.id} value={p.name}>{p.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-violet-600 uppercase font-bold">Категория</Label>
                      <Select value={overrideCategory} onValueChange={setOverrideCategory}>
                        <SelectTrigger className="h-7 text-[10px] bg-white border-violet-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🪄 Авто (анализ)</SelectItem>
                          {categories.map((c: Category) => <SelectItem key={c.id} value={c.name}>{c.name}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-1">
                      <Label className="text-[10px] text-violet-600 uppercase font-bold">Тип ссылки</Label>
                      <Select value={overrideLinkType} onValueChange={setOverrideLinkType}>
                        <SelectTrigger className="h-7 text-[10px] bg-white border-violet-200">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="auto">🪄 Авто</SelectItem>
                          {['profile', 'post', 'reel', 'story', 'video', 'shorts', 'channel', 'group', 'unknown'].map(t => (
                            <SelectItem key={t} value={t}>{t}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <p className="text-[9px] text-violet-500 italic">Эти параметры заменят автоматическое определение для всех выбранных услуг.</p>
                </div>

                <div className="flex items-center justify-between">
                  <p className="text-sm font-medium">Выберите услуги ({filteredImportList.length})</p>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setSelectedIds(new Set(filteredImportList.slice(0, 50).map((ps: any) => ps.id)))}>Топ 50</Button>
                    <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => setSelectedIds(new Set())}>Сброс</Button>
                  </div>
                </div>
              </div>
              
              <div className="space-y-1">
                {filteredImportList.slice(0, 50).map((ps: any) => {
                  const meta = detectMetadata(ps.name, ps.category, ps.network);
                  const isSelected = selectedIds.has(ps.id);
                  return (
                    <div 
                      key={ps.id} 
                      className={`flex items-center gap-3 p-2 rounded-md border cursor-pointer hover:bg-muted/50 transition-colors ${isSelected ? "border-violet-500 bg-violet-50" : ""}`}
                      onClick={() => {
                        const next = new Set(selectedIds);
                        if (next.has(ps.id)) next.delete(ps.id); else next.add(ps.id);
                        setSelectedIds(next);
                      }}
                    >
                      <Checkbox checked={isSelected} />
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium leading-normal">{ps.name}</p>
                        <div className="flex items-center gap-2 mt-0.5">
                          <Badge variant="outline" className="text-[9px] px-1 bg-white">{overrideNetwork === "auto" ? meta.network : overrideNetwork}</Badge>
                          <Badge variant="secondary" className="text-[9px] px-1 bg-white">{overrideCategory === "auto" ? meta.category : overrideCategory}</Badge>
                          <Badge variant="default" className="text-[9px] px-1">{meta.tier}</Badge>
                          <span className="text-[9px] text-muted-foreground font-mono ml-auto">#{ps.provider_service_id}</span>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-[10px] font-mono">{ps.rate.toFixed(2)}₽</p>
                        <p className="text-[9px] text-muted-foreground">за 1к</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        <div className="border-t pt-4 flex justify-between items-center">
          <p className="text-xs text-muted-foreground">
            {selectedIds.size > 0 ? `Выбрано: ${selectedIds.size}` : "Выберите услуги для продолжения"}
          </p>
          <div className="flex gap-2">
            <Button variant="ghost" size="sm" onClick={() => onOpenChange(false)}>Отмена</Button>
            {step === 2 && (
              <Button 
                size="sm" 
                onClick={handleImport} 
                disabled={selectedIds.size === 0 || processing}
                className="bg-violet-600 hover:bg-violet-700"
              >
                {processing ? "Импорт..." : "Импортировать"}
              </Button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default AdminServices;
