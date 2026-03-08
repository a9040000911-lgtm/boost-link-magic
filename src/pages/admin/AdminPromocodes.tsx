import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Search, Tag, RefreshCw, Plus, Copy, Trash2, BarChart3, Edit } from "lucide-react";
import { toast } from "sonner";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/admin/TablePagination";

interface Promocode {
  id: string;
  code: string;
  discount_type: string;
  discount_value: number;
  max_uses: number | null;
  used_count: number;
  min_order_amount: number;
  applies_to: string;
  applies_to_id: string | null;
  is_active: boolean;
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

const emptyForm = {
  code: "",
  discount_type: "percent",
  discount_value: 0,
  max_uses: null as number | null,
  min_order_amount: 0,
  applies_to: "all",
  applies_to_id: null as string | null,
  is_active: true,
  starts_at: new Date().toISOString().slice(0, 16),
  expires_at: "",
};

const AdminPromocodes = () => {
  const { user } = useAuth();
  const [codes, setCodes] = useState<Promocode[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [form, setForm] = useState({ ...emptyForm });
  const [saving, setSaving] = useState(false);
  const [statsId, setStatsId] = useState<string | null>(null);
  const [usages, setUsages] = useState<any[]>([]);
  const [usagesLoading, setUsagesLoading] = useState(false);

  useEffect(() => {
    if (user) load();
  }, [user]);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("promocodes").select("*").order("created_at", { ascending: false });
    setCodes((data as any) || []);
    setLoading(false);
  };

  const filtered = useMemo(() => {
    if (!search) return codes;
    const s = search.toLowerCase();
    return codes.filter((c) => c.code.toLowerCase().includes(s));
  }, [codes, search]);

  const pagination = useTableControls({ data: filtered, pageSize: 50 });

  const generateCode = () => {
    const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
    let code = "";
    for (let i = 0; i < 8; i++) code += chars[Math.floor(Math.random() * chars.length)];
    setForm((f) => ({ ...f, code }));
  };

  const openCreate = () => {
    setEditId(null);
    setForm({ ...emptyForm });
    generateCode();
    setDialogOpen(true);
  };

  const openEdit = (p: Promocode) => {
    setEditId(p.id);
    setForm({
      code: p.code,
      discount_type: p.discount_type,
      discount_value: p.discount_value,
      max_uses: p.max_uses,
      min_order_amount: p.min_order_amount,
      applies_to: p.applies_to,
      applies_to_id: p.applies_to_id,
      is_active: p.is_active,
      starts_at: p.starts_at ? new Date(p.starts_at).toISOString().slice(0, 16) : "",
      expires_at: p.expires_at ? new Date(p.expires_at).toISOString().slice(0, 16) : "",
    });
    setDialogOpen(true);
  };

  const save = async () => {
    if (!form.code.trim()) { toast.error("Введите код"); return; }
    if (form.discount_value <= 0) { toast.error("Укажите значение скидки"); return; }
    setSaving(true);

    const payload: any = {
      code: form.code.toUpperCase().trim(),
      discount_type: form.discount_type,
      discount_value: form.discount_value,
      max_uses: form.max_uses || null,
      min_order_amount: form.min_order_amount,
      applies_to: form.applies_to,
      applies_to_id: form.applies_to_id || null,
      is_active: form.is_active,
      starts_at: form.starts_at ? new Date(form.starts_at).toISOString() : new Date().toISOString(),
      expires_at: form.expires_at ? new Date(form.expires_at).toISOString() : null,
    };

    let error;
    if (editId) {
      ({ error } = await supabase.from("promocodes").update(payload).eq("id", editId));
    } else {
      ({ error } = await supabase.from("promocodes").insert(payload));
    }

    setSaving(false);
    if (error) {
      toast.error(error.message.includes("unique") ? "Такой код уже существует" : error.message);
    } else {
      toast.success(editId ? "Промокод обновлён" : "Промокод создан");
      setDialogOpen(false);
      load();
    }
  };

  const toggleActive = async (id: string, val: boolean) => {
    await supabase.from("promocodes").update({ is_active: val }).eq("id", id);
    setCodes((prev) => prev.map((c) => (c.id === id ? { ...c, is_active: val } : c)));
  };

  const deleteCode = async (id: string) => {
    if (!confirm("Удалить промокод?")) return;
    await supabase.from("promocodes").delete().eq("id", id);
    toast.success("Удалено");
    load();
  };

  const openStats = async (id: string) => {
    setStatsId(id);
    setUsagesLoading(true);
    const { data } = await supabase.from("promocode_usages").select("*").eq("promocode_id", id).order("used_at", { ascending: false }).limit(50);
    setUsages((data as any) || []);
    setUsagesLoading(false);
  };

  const copyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    toast.success("Скопировано");
  };

  const formatDate = (d: string) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" });
  };

  const formatDiscount = (p: Promocode) => {
    return p.discount_type === "percent" ? `${p.discount_value}%` : `${p.discount_value}₽`;
  };

  const isExpired = (p: Promocode) => {
    if (!p.expires_at) return false;
    return new Date(p.expires_at) < new Date();
  };

  const isLimitReached = (p: Promocode) => {
    if (p.max_uses === null) return false;
    return p.used_count >= p.max_uses;
  };

  return (
    <div className="flex flex-col h-full gap-2">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Tag className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Промокоды ({filtered.length})</h1>
        </div>
        <div className="flex gap-1">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" />Обновить
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={openCreate}>
            <Plus className="h-3 w-3 mr-1" />Создать
          </Button>
        </div>
      </div>

      <div className="relative shrink-0">
        <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
        <Input placeholder="Поиск по коду..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[300px] text-xs" />
      </div>

      <div className="flex-1 min-h-0 overflow-auto border rounded-md">
        {loading ? (
          <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : filtered.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-muted-foreground text-sm">
            <Tag className="h-8 w-8 mb-2 opacity-30" />
            <p>Нет промокодов</p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="px-2">Код</TableHead>
                <TableHead className="px-2">Скидка</TableHead>
                <TableHead className="px-2">Использований</TableHead>
                <TableHead className="px-2">Мин. сумма</TableHead>
                <TableHead className="px-2">Область</TableHead>
                <TableHead className="px-2">Действует</TableHead>
                <TableHead className="px-2">Статус</TableHead>
                <TableHead className="px-2">Активен</TableHead>
                <TableHead className="px-2">Действия</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((p) => (
                <TableRow key={p.id} className="text-[11px]">
                  <TableCell className="px-2 font-mono font-bold">
                    <div className="flex items-center gap-1">
                      {p.code}
                      <button onClick={() => copyCode(p.code)} className="text-muted-foreground hover:text-primary"><Copy className="h-3 w-3" /></button>
                    </div>
                  </TableCell>
                  <TableCell className="px-2 font-medium">{formatDiscount(p)}</TableCell>
                  <TableCell className="px-2">
                    {p.used_count}{p.max_uses !== null ? ` / ${p.max_uses}` : " / ∞"}
                  </TableCell>
                  <TableCell className="px-2">{p.min_order_amount > 0 ? `${p.min_order_amount}₽` : "—"}</TableCell>
                  <TableCell className="px-2">
                    <Badge variant="outline" className="text-[9px] px-1">
                      {p.applies_to === "all" ? "Все" : p.applies_to === "category" ? "Категория" : "Услуга"}
                    </Badge>
                  </TableCell>
                  <TableCell className="px-2 whitespace-nowrap text-muted-foreground">
                    {formatDate(p.starts_at)} — {p.expires_at ? formatDate(p.expires_at) : "∞"}
                  </TableCell>
                  <TableCell className="px-2">
                    {isExpired(p) ? (
                      <Badge variant="secondary" className="text-[9px] px-1">Истёк</Badge>
                    ) : isLimitReached(p) ? (
                      <Badge variant="secondary" className="text-[9px] px-1">Лимит</Badge>
                    ) : p.is_active ? (
                      <Badge className="text-[9px] px-1 bg-green-100 text-green-700 border-green-200">Активен</Badge>
                    ) : (
                      <Badge variant="secondary" className="text-[9px] px-1">Выкл</Badge>
                    )}
                  </TableCell>
                  <TableCell className="px-2">
                    <Switch checked={p.is_active} onCheckedChange={(v) => toggleActive(p.id, v)} className="scale-75" />
                  </TableCell>
                  <TableCell className="px-2">
                    <div className="flex gap-0.5">
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openEdit(p)}><Edit className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={() => openStats(p.id)}><BarChart3 className="h-3 w-3" /></Button>
                      <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive" onClick={() => deleteCode(p.id)}><Trash2 className="h-3 w-3" /></Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle className="text-sm">{editId ? "Редактировать промокод" : "Новый промокод"}</DialogTitle>
          </DialogHeader>
          <div className="grid gap-3 text-xs">
            <div>
              <Label className="text-xs">Код</Label>
              <div className="flex gap-1">
                <Input value={form.code} onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))} className="h-7 text-xs font-mono" placeholder="PROMO2024" />
                <Button variant="outline" size="sm" className="h-7 text-xs shrink-0" onClick={generateCode}>Сгенерировать</Button>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Тип скидки</Label>
                <Select value={form.discount_type} onValueChange={(v) => setForm((f) => ({ ...f, discount_type: v }))}>
                  <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percent">Процент (%)</SelectItem>
                    <SelectItem value="fixed">Фиксированная (₽)</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Значение</Label>
                <Input type="number" value={form.discount_value} onChange={(e) => setForm((f) => ({ ...f, discount_value: Number(e.target.value) }))} className="h-7 text-xs" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Макс. использований</Label>
                <Input type="number" value={form.max_uses ?? ""} onChange={(e) => setForm((f) => ({ ...f, max_uses: e.target.value ? Number(e.target.value) : null }))} className="h-7 text-xs" placeholder="Без лимита" />
              </div>
              <div>
                <Label className="text-xs">Мин. сумма заказа (₽)</Label>
                <Input type="number" value={form.min_order_amount} onChange={(e) => setForm((f) => ({ ...f, min_order_amount: Number(e.target.value) }))} className="h-7 text-xs" />
              </div>
            </div>
            <div>
              <Label className="text-xs">Область применения</Label>
              <Select value={form.applies_to} onValueChange={(v) => setForm((f) => ({ ...f, applies_to: v }))}>
                <SelectTrigger className="h-7 text-xs"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все услуги</SelectItem>
                  <SelectItem value="category">Определённая категория</SelectItem>
                  <SelectItem value="service">Определённая услуга</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <Label className="text-xs">Начало действия</Label>
                <Input type="datetime-local" value={form.starts_at} onChange={(e) => setForm((f) => ({ ...f, starts_at: e.target.value }))} className="h-7 text-xs" />
              </div>
              <div>
                <Label className="text-xs">Конец действия</Label>
                <Input type="datetime-local" value={form.expires_at} onChange={(e) => setForm((f) => ({ ...f, expires_at: e.target.value }))} className="h-7 text-xs" placeholder="Бессрочно" />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch checked={form.is_active} onCheckedChange={(v) => setForm((f) => ({ ...f, is_active: v }))} />
              <Label className="text-xs">Активен</Label>
            </div>
          </div>
          <DialogFooter>
            <Button size="sm" className="text-xs" onClick={save} disabled={saving}>
              {saving ? "Сохранение..." : editId ? "Сохранить" : "Создать"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Stats Dialog */}
      <Dialog open={!!statsId} onOpenChange={() => setStatsId(null)}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle className="text-sm">Статистика использований</DialogTitle>
          </DialogHeader>
          {usagesLoading ? (
            <div className="flex justify-center py-6"><div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" /></div>
          ) : usages.length === 0 ? (
            <p className="text-center text-muted-foreground text-xs py-6">Ещё никто не использовал этот промокод</p>
          ) : (
            <div className="max-h-[300px] overflow-auto">
              <Table>
                <TableHeader>
                  <TableRow className="text-[11px]">
                    <TableHead className="px-2">Пользователь</TableHead>
                    <TableHead className="px-2">Скидка</TableHead>
                    <TableHead className="px-2">Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {usages.map((u) => (
                    <TableRow key={u.id} className="text-[11px]">
                      <TableCell className="px-2 font-mono text-muted-foreground">{u.user_id.slice(0, 8)}…</TableCell>
                      <TableCell className="px-2">{u.discount_amount}₽</TableCell>
                      <TableCell className="px-2">{new Date(u.used_at).toLocaleString("ru-RU")}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPromocodes;
