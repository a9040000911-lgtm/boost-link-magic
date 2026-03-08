import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Plus, Save, Trash2, GripVertical, FolderOpen, RefreshCw } from "lucide-react";
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

const AdminCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null);

  // Inline new row
  const [newName, setNewName] = useState("");
  const [newSlug, setNewSlug] = useState("");

  // Inline edits tracked per-row
  const [edits, setEdits] = useState<Record<string, Partial<Category>>>({});

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("categories").select("*").order("sort_order");
    setCategories((data as Category[]) || []);
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

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <FolderOpen className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Категории ({categories.length})</h1>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      {/* Add new — inline at top, minimal actions */}
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

      {/* Table with inline editing */}
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
                <TableHead className="px-2 w-[60px]">Порядок</TableHead>
                <TableHead className="px-2 w-[60px]">Вкл</TableHead>
                <TableHead className="px-2 w-[90px]">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {categories.length === 0 ? (
                <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">Нет категорий</TableCell></TableRow>
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
    </div>
  );
};

export default AdminCategories;
