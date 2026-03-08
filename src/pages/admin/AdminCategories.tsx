import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Plus, Save, Trash2, FolderOpen, RefreshCw, ArrowRightLeft, Search, Package } from "lucide-react";
import { toast } from "sonner";

interface Category {
  id: string;
  name: string;
  slug: string;
  icon: string | null;
  sort_order: number;
  is_enabled: boolean;
  created_at: string;
}

interface ServiceInfo {
  id: string;
  name: string;
  category: string;
  network: string;
  is_enabled: boolean;
}

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");
  const [edits, setEdits] = useState<Record<string, Partial<Category>>>({});

  // Services data for counts & transfer
  const [services, setServices] = useState<ServiceInfo[]>([]);
  const [serviceCounts, setServiceCounts] = useState<Record<string, number>>({});

  // Transfer dialog
  const [transferOpen, setTransferOpen] = useState(false);
  const [transferFrom, setTransferFrom] = useState<string>("");
  const [transferTo, setTransferTo] = useState<string>("");
  const [transferServices, setTransferServices] = useState<ServiceInfo[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [transferSearch, setTransferSearch] = useState("");
  const [transferring, setTransferring] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const [{ data: cats }, { data: svcs }] = await Promise.all([
      supabase.from("categories").select("*").order("sort_order"),
      supabase.from("services").select("id, name, category, network, is_enabled"),
    ]);
    setCategories((cats as Category[]) || []);
    const svcList = (svcs as ServiceInfo[]) || [];
    setServices(svcList);

    // Count services per category name
    const counts: Record<string, number> = {};
    svcList.forEach(s => {
      counts[s.category] = (counts[s.category] || 0) + 1;
    });
    setServiceCounts(counts);
    setEdits({});
    setLoading(false);
  };

  const slugify = (s: string) => s.toLowerCase().replace(/[^a-zа-яё0-9]+/gi, "-").replace(/^-|-$/g, "");

  const handleEdit = (id: string, field: keyof Category, value: any) => {
    setEdits(prev => ({ ...prev, [id]: { ...prev[id], [field]: value } }));
  };

  const getVal = (cat: Category, field: keyof Category) => {
    return edits[cat.id]?.[field] !== undefined ? edits[cat.id][field] : cat[field];
  };

  const isDirty = (id: string) => !!edits[id] && Object.keys(edits[id]).length > 0;

  const saveRow = async (cat: Category) => {
    const changes = edits[cat.id];
    if (!changes || Object.keys(changes).length === 0) return;
    setSaving(cat.id);
    try {
      const { error } = await supabase.from("categories").update({
        ...changes, updated_at: new Date().toISOString(),
      }).eq("id", cat.id);
      if (error) throw error;
      toast.success(`«${changes.name || cat.name}» сохранена`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(null);
  };

  const addCategory = async () => {
    if (!newName.trim()) { toast.error("Введите название"); return; }
    const slug = newSlug.trim() || slugify(newName);
    setSaving("new");
    try {
      const maxOrder = categories.length > 0 ? Math.max(...categories.map(c => c.sort_order)) : 0;
      const { error } = await supabase.from("categories").insert({
        name: newName.trim(), slug, sort_order: maxOrder + 1,
      });
      if (error) throw error;
      toast.success(`«${newName.trim()}» создана`);
      setNewName(""); setNewSlug("");
      await load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(null);
  };

  const deleteCategory = async (cat: Category) => {
    if (!confirm(`Удалить «${cat.name}»? Услуги с этой категорией останутся без изменений.`)) return;
    setSaving(cat.id);
    try {
      const { error } = await supabase.from("categories").delete().eq("id", cat.id);
      if (error) throw error;
      toast.success("Удалена");
      await load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(null);
  };

  const moveRow = async (cat: Category, direction: "up" | "down") => {
    const idx = categories.findIndex(c => c.id === cat.id);
    const swapIdx = direction === "up" ? idx - 1 : idx + 1;
    if (swapIdx < 0 || swapIdx >= categories.length) return;
    const other = categories[swapIdx];
    await Promise.all([
      supabase.from("categories").update({ sort_order: other.sort_order }).eq("id", cat.id),
      supabase.from("categories").update({ sort_order: cat.sort_order }).eq("id", other.id),
    ]);
    await load();
  };

  // All unique category names (from services + categories table)
  const allCategoryNames = useMemo(() => {
    const names = new Set<string>();
    categories.forEach(c => names.add(c.name));
    services.forEach(s => { if (s.category) names.add(s.category); });
    return [...names].sort();
  }, [categories, services]);

  // Open transfer dialog for a specific category
  const openTransfer = (fromCategory?: string) => {
    setTransferFrom(fromCategory || "");
    setTransferTo("");
    setSelectedIds(new Set());
    setTransferSearch("");
    setTransferOpen(true);
  };

  // Services filtered by "from" category
  useEffect(() => {
    if (!transferFrom) { setTransferServices([]); return; }
    setTransferServices(services.filter(s => s.category === transferFrom));
    setSelectedIds(new Set());
  }, [transferFrom, services]);

  const filteredTransferServices = useMemo(() => {
    if (!transferSearch) return transferServices;
    const s = transferSearch.toLowerCase();
    return transferServices.filter(sv => sv.name.toLowerCase().includes(s) || sv.network.toLowerCase().includes(s));
  }, [transferServices, transferSearch]);

  const toggleSelect = (id: string) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const selectAll = () => {
    if (selectedIds.size === filteredTransferServices.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredTransferServices.map(s => s.id)));
    }
  };

  const executeTransfer = async () => {
    if (!transferTo || selectedIds.size === 0) return;
    setTransferring(true);
    try {
      const ids = [...selectedIds];
      const { error } = await supabase.from("services").update({ category: transferTo, updated_at: new Date().toISOString() }).in("id", ids);
      if (error) throw error;
      toast.success(`${ids.length} услуг перенесено в «${transferTo}»`);
      setTransferOpen(false);
      await load();
    } catch (e: any) { toast.error(e.message); }
    setTransferring(false);
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Категории ({categories.length})</h1>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => openTransfer()}>
            <ArrowRightLeft className="h-3 w-3 mr-1" />Перенос услуг
          </Button>
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" />Обновить
          </Button>
        </div>
      </div>

      {/* Add new */}
      <div className="flex items-center gap-2 shrink-0 bg-muted/30 rounded-md px-3 py-2">
        <Input value={newName} onChange={e => { setNewName(e.target.value); if (!newSlug) setNewSlug(""); }}
          placeholder="Название категории" className="h-7 text-xs w-[200px]"
          onKeyDown={e => e.key === "Enter" && addCategory()} />
        <Input value={newSlug || (newName ? slugify(newName) : "")} onChange={e => setNewSlug(e.target.value)}
          placeholder="slug" className="h-7 text-xs w-[150px] font-mono text-[10px]" />
        <Button size="sm" className="h-7 text-xs px-3" onClick={addCategory} disabled={saving === "new" || !newName.trim()}>
          <Plus className="h-3 w-3 mr-1" />Создать
        </Button>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto border rounded-md">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="px-1 w-8">↕</TableHead>
                <TableHead className="px-2">Название</TableHead>
                <TableHead className="px-2">Slug</TableHead>
                <TableHead className="px-2 w-[70px]">Услуг</TableHead>
                <TableHead className="px-2 w-[60px]">Порядок</TableHead>
                <TableHead className="px-2 w-[60px]">Вкл</TableHead>
                <TableHead className="px-2 w-[110px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-8">Нет категорий</TableCell></TableRow>
              ) : categories.map((cat, idx) => (
                <TableRow key={cat.id} className="text-[11px]">
                  <TableCell className="px-1">
                    <div className="flex flex-col gap-0.5">
                      <button className="text-muted-foreground hover:text-foreground text-[9px] leading-none disabled:opacity-30"
                        disabled={idx === 0} onClick={() => moveRow(cat, "up")}>▲</button>
                      <button className="text-muted-foreground hover:text-foreground text-[9px] leading-none disabled:opacity-30"
                        disabled={idx === categories.length - 1} onClick={() => moveRow(cat, "down")}>▼</button>
                    </div>
                  </TableCell>
                  <TableCell className="px-2">
                    <Input value={getVal(cat, "name") as string} onChange={e => handleEdit(cat.id, "name", e.target.value)}
                      className="h-7 text-xs border-transparent hover:border-border focus:border-border" />
                  </TableCell>
                  <TableCell className="px-2">
                    <Input value={getVal(cat, "slug") as string} onChange={e => handleEdit(cat.id, "slug", e.target.value)}
                      className="h-7 text-xs font-mono text-[10px] border-transparent hover:border-border focus:border-border" />
                  </TableCell>
                  <TableCell className="px-2">
                    <button
                      className="flex items-center gap-1 hover:text-primary transition-colors"
                      onClick={() => openTransfer(cat.name)}
                      title="Управление услугами в этой категории"
                    >
                      <Package className="h-3 w-3" />
                      <span className="font-medium">{serviceCounts[cat.name] || 0}</span>
                    </button>
                  </TableCell>
                  <TableCell className="px-2">
                    <Input type="number" value={getVal(cat, "sort_order") as number} onChange={e => handleEdit(cat.id, "sort_order", parseInt(e.target.value) || 0)}
                      className="h-7 text-xs w-[50px] border-transparent hover:border-border focus:border-border" />
                  </TableCell>
                  <TableCell className="px-2">
                    <Switch checked={getVal(cat, "is_enabled") as boolean}
                      onCheckedChange={async (v) => {
                        await supabase.from("categories").update({ is_enabled: v, updated_at: new Date().toISOString() }).eq("id", cat.id);
                        await load();
                      }} />
                  </TableCell>
                  <TableCell className="px-2">
                    <div className="flex items-center gap-1">
                      {isDirty(cat.id) && (
                        <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => saveRow(cat)} disabled={saving === cat.id}>
                          <Save className="h-3 w-3 text-primary" />
                        </Button>
                      )}
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => openTransfer(cat.name)} title="Перенести услуги">
                        <ArrowRightLeft className="h-3 w-3" />
                      </Button>
                      <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteCategory(cat)} disabled={saving === cat.id}>
                        <Trash2 className="h-3 w-3 text-destructive" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Transfer Dialog */}
      <Dialog open={transferOpen} onOpenChange={setTransferOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-sm flex items-center gap-2">
              <ArrowRightLeft className="h-4 w-4" />Перенос услуг между категориями
            </DialogTitle>
          </DialogHeader>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">Из категории</label>
              <Select value={transferFrom} onValueChange={setTransferFrom}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Выберите..." /></SelectTrigger>
                <SelectContent>
                  {allCategoryNames.map(n => (
                    <SelectItem key={n} value={n} className="text-xs">
                      {n} ({serviceCounts[n] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <label className="text-[11px] text-muted-foreground font-medium">В категорию</label>
              <Select value={transferTo} onValueChange={setTransferTo}>
                <SelectTrigger className="h-8 text-xs mt-1"><SelectValue placeholder="Выберите..." /></SelectTrigger>
                <SelectContent>
                  {allCategoryNames.filter(n => n !== transferFrom).map(n => (
                    <SelectItem key={n} value={n} className="text-xs">
                      {n} ({serviceCounts[n] || 0})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {transferFrom && (
            <>
              <div className="flex items-center gap-2 mt-1">
                <div className="relative flex-1">
                  <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                  <Input placeholder="Поиск услуг..." value={transferSearch} onChange={e => setTransferSearch(e.target.value)} className="pl-7 h-7 text-xs" />
                </div>
                <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={selectAll}>
                  {selectedIds.size === filteredTransferServices.length && filteredTransferServices.length > 0 ? "Снять все" : "Выбрать все"}
                </Button>
                <Badge variant="secondary" className="text-[10px]">{selectedIds.size} выбрано</Badge>
              </div>

              <div className="flex-1 min-h-0 overflow-auto border rounded-md max-h-[40vh]">
                {filteredTransferServices.length === 0 ? (
                  <div className="text-center text-xs text-muted-foreground py-8">Нет услуг в этой категории</div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow className="text-[10px]">
                        <TableHead className="px-2 w-8">
                          <Checkbox
                            checked={selectedIds.size === filteredTransferServices.length && filteredTransferServices.length > 0}
                            onCheckedChange={selectAll}
                          />
                        </TableHead>
                        <TableHead className="px-2">Название</TableHead>
                        <TableHead className="px-2">Сеть</TableHead>
                        <TableHead className="px-2">Статус</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredTransferServices.map(s => (
                        <TableRow key={s.id} className="text-[11px] cursor-pointer hover:bg-muted/50" onClick={() => toggleSelect(s.id)}>
                          <TableCell className="px-2">
                            <Checkbox checked={selectedIds.has(s.id)} onCheckedChange={() => toggleSelect(s.id)} />
                          </TableCell>
                          <TableCell className="px-2 max-w-[250px] truncate">{s.name}</TableCell>
                          <TableCell className="px-2">{s.network}</TableCell>
                          <TableCell className="px-2">
                            <Badge variant={s.is_enabled ? "default" : "secondary"} className="text-[9px] px-1">
                              {s.is_enabled ? "Вкл" : "Выкл"}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </>
          )}

          <DialogFooter>
            <Button size="sm" className="text-xs" disabled={!transferTo || selectedIds.size === 0 || transferring} onClick={executeTransfer}>
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              {transferring ? "Перенос..." : `Перенести ${selectedIds.size} услуг`}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCategories;
