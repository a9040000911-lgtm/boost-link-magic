import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, User, ExternalLink, Search, KeyRound,
  Wallet, Shield, Ban, CheckCircle, Mail, Clock, AlertTriangle,
  Save, Plus, Minus, RefreshCw
} from "lucide-react";
import { toast } from "sonner";
import { logAuditAction } from "@/lib/audit";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600",
  processing: "bg-blue-500/20 text-blue-600",
  in_progress: "bg-blue-500/20 text-blue-600",
  completed: "bg-green-500/20 text-green-600",
  partial: "bg-orange-500/20 text-orange-600",
  canceled: "bg-red-500/20 text-red-600",
  refunded: "bg-purple-500/20 text-purple-600",
};

const AdminUserDetail = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [orders, setOrders] = useState<any[]>([]);
  const [transactions, setTransactions] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState("orders");
  const [orderStatusFilter, setOrderStatusFilter] = useState("all");
  const [txTypeFilter, setTxTypeFilter] = useState("all");
  const [search, setSearch] = useState("");

  // Inline edit fields
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [balanceAmount, setBalanceAmount] = useState("");
  const [saving, setSaving] = useState(false);

  // Auth info
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);

  useEffect(() => {
    if (!user || !userId) return;
    loadData();
    loadAuthInfo();
  }, [user, userId]);

  const loadData = async () => {
    setLoading(true);
    const [profileRes, ordersRes, txRes] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
      supabase.from("transactions").select("*").eq("user_id", userId).order("created_at", { ascending: false }),
    ]);
    setProfile(profileRes.data);
    setOrders(ordersRes.data || []);
    setTransactions(txRes.data || []);
    if (profileRes.data) {
      setEditName(profileRes.data.display_name || "");
      setEditBio(profileRes.data.bio || "");
      setEditDiscount(String(profileRes.data.discount ?? 0));
    }
    setLoading(false);
  };

  const loadAuthInfo = async () => {
    setAuthLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "get_user_auth", user_id: userId },
      });
      if (error) throw error;
      setAuthInfo(data);
      setEditEmail(data.email || "");
    } catch (e) {
      // Non-critical
    }
    setAuthLoading(false);
  };

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: editName, bio: editBio, updated_at: new Date().toISOString(),
      }).eq("id", userId);
      if (error) throw error;
      await logAuditAction("update_user_profile", "user", userId, { display_name: editName });
      toast.success("Профиль сохранён");
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const addBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Введите сумму"); return; }
    setSaving(true);
    try {
      const newBalance = Number(profile.balance) + amount;
      await supabase.from("profiles").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", userId);
      await supabase.from("transactions").insert({
        user_id: userId!, type: "admin_deposit", amount, balance_after: newBalance,
        status: "completed", description: "Пополнение администратором",
      });
      await logAuditAction("update_user_balance", "user", userId, { action: "add", amount, new_balance: newBalance });
      toast.success(`+${amount.toFixed(2)}₽ → Баланс: ${newBalance.toFixed(2)}₽`);
      setBalanceAmount("");
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const subtractBalance = async () => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) { toast.error("Введите сумму"); return; }
    setSaving(true);
    try {
      const newBalance = Math.max(0, Number(profile.balance) - amount);
      await supabase.from("profiles").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", userId);
      await supabase.from("transactions").insert({
        user_id: userId!, type: "admin_withdraw", amount, balance_after: newBalance,
        status: "completed", description: "Списание администратором",
      });
      await logAuditAction("update_user_balance", "user", userId, { action: "subtract", amount, new_balance: newBalance });
      toast.success(`−${amount.toFixed(2)}₽ → Баланс: ${newBalance.toFixed(2)}₽`);
      setBalanceAmount("");
      await loadData();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const changeEmail = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "update_email", user_id: userId, email: editEmail },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("update_user_email", "user", userId, { email: editEmail });
      toast.success("Email обновлён");
      await loadAuthInfo();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const changePassword = async () => {
    if (editPassword.length < 6) { toast.error("Минимум 6 символов"); return; }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "update_password", user_id: userId, password: editPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("update_user_password", "user", userId, {});
      toast.success("Пароль изменён");
      setEditPassword("");
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const confirmEmail = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "confirm_email", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("Email подтверждён");
      await loadAuthInfo();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const handleBan = async (duration: string) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "ban_user", user_id: userId, duration },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("ban_user", "user", userId, { duration });
      toast.success(duration === "none" ? "Разблокирован" : "Заблокирован");
      await loadAuthInfo();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const disableMFA = async () => {
    if (!confirm("Отключить 2FA?")) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "delete_mfa_factors", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      toast.success("2FA отключена");
      await loadAuthInfo();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter(o => {
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (search && !o.service_name.toLowerCase().includes(search.toLowerCase()) && !o.link.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, orderStatusFilter, search]);

  const filteredTx = useMemo(() => {
    return transactions.filter(t => {
      if (txTypeFilter !== "all" && t.type !== txTypeFilter) return false;
      return true;
    });
  }, [transactions, txTypeFilter]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const orderStatuses = useMemo(() => [...new Set(orders.map(o => o.status))], [orders]);
  const txTypes = useMemo(() => [...new Set(transactions.map(t => t.type))], [transactions]);
  const totalSpent = useMemo(() => orders.reduce((s, o) => s + Number(o.price), 0), [orders]);

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  if (!profile) return <div className="text-center py-12 text-muted-foreground">Пользователь не найден</div>;

  return (
    <div className="flex flex-col h-full gap-3 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <User className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Редактирование</h1>
          <span className="text-xs text-muted-foreground">{authInfo?.email || profile.id.slice(0, 8)}</span>
        </div>
        <Button variant="outline" size="sm" className="h-7 text-xs" onClick={() => { loadData(); loadAuthInfo(); }}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-[340px_1fr] gap-3 flex-1 min-h-0">
        {/* Left column: Edit fields */}
        <div className="space-y-3 overflow-auto">
          {/* Profile card */}
          <Card className="border-border/60">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1"><User className="h-3 w-3" />Профиль</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2.5">
              <div>
                <Label className="text-[11px] text-muted-foreground">ID</Label>
                <Input value={profile.id} readOnly className="text-xs h-8 bg-muted/50 font-mono text-[10px]" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Имя</Label>
                <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-xs h-8" />
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Email</Label>
                <div className="flex gap-1">
                  <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="text-xs h-8 flex-1" disabled={authLoading} />
                  {authInfo && editEmail !== authInfo.email && (
                    <Button size="sm" className="h-8 text-[10px] px-2" onClick={changeEmail} disabled={saving}>
                      <Save className="h-3 w-3" />
                    </Button>
                  )}
                </div>
                {authInfo && !authInfo.email_confirmed && (
                  <Button variant="link" size="sm" className="h-5 text-[10px] px-0 text-orange-500" onClick={confirmEmail} disabled={saving}>
                    <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Подтвердить email
                  </Button>
                )}
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Пароль</Label>
                <div className="flex gap-1">
                  <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Новый пароль" className="text-xs h-8 flex-1" />
                  <Button size="sm" className="h-8 text-[10px] px-2" onClick={changePassword} disabled={saving || editPassword.length < 6}>
                    <KeyRound className="h-3 w-3" />
                  </Button>
                </div>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Описание</Label>
                <Textarea value={editBio} onChange={e => setEditBio(e.target.value)} className="text-xs min-h-[50px]" placeholder="О пользователе..." />
              </div>
              <Button size="sm" className="w-full h-8 text-xs" onClick={saveProfile} disabled={saving}>
                <Save className="h-3 w-3 mr-1" />{saving ? "..." : "Сохранить изменения"}
              </Button>
            </CardContent>
          </Card>

          {/* Balance card */}
          <Card className="border-border/60">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1"><Wallet className="h-3 w-3" />Баланс</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2.5">
              <div className="text-center py-2 bg-muted/30 rounded-md">
                <p className="text-[10px] text-muted-foreground">Текущий баланс</p>
                <p className="text-xl font-bold">{Number(profile.balance).toFixed(2)}₽</p>
              </div>
              <div>
                <Label className="text-[11px] text-muted-foreground">Сумма</Label>
                <Input type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)} placeholder="0.00" className="text-xs h-8" />
              </div>
              <div className="grid grid-cols-2 gap-1.5">
                <Button size="sm" variant="outline" className="h-8 text-xs text-green-600 border-green-200 hover:bg-green-50" onClick={addBalance} disabled={saving || !balanceAmount}>
                  <Plus className="h-3 w-3 mr-1" />Пополнить
                </Button>
                <Button size="sm" variant="outline" className="h-8 text-xs text-destructive border-red-200 hover:bg-red-50" onClick={subtractBalance} disabled={saving || !balanceAmount}>
                  <Minus className="h-3 w-3 mr-1" />Списать
                </Button>
              </div>
              <p className="text-[9px] text-muted-foreground text-center">Записывается в транзакции и аудит-лог</p>
            </CardContent>
          </Card>

          {/* Security & access card */}
          <Card className="border-border/60">
            <CardHeader className="p-3 pb-2">
              <CardTitle className="text-xs font-bold flex items-center gap-1"><Shield className="h-3 w-3" />Безопасность и доступ</CardTitle>
            </CardHeader>
            <CardContent className="p-3 pt-0 space-y-2.5">
              {authLoading ? (
                <div className="flex justify-center py-4"><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary" /></div>
              ) : authInfo ? (
                <>
                  {/* Status */}
                  <div className={`p-2 rounded-md flex items-center gap-2 ${authInfo.banned ? "bg-destructive/10" : "bg-green-500/10"}`}>
                    {authInfo.banned ? <Ban className="h-3.5 w-3.5 text-destructive" /> : <CheckCircle className="h-3.5 w-3.5 text-green-500" />}
                    <div>
                      <p className="text-xs font-medium">{authInfo.banned ? "Заблокирован" : "Активен"}</p>
                      {authInfo.banned && authInfo.banned_until && (
                        <p className="text-[9px] text-muted-foreground">До: {formatDate(authInfo.banned_until)}</p>
                      )}
                    </div>
                  </div>

                  {/* Quick info */}
                  <div className="space-y-1 text-[11px]">
                    <div className="flex justify-between"><span className="text-muted-foreground">Последний вход</span><span>{authInfo.last_sign_in ? formatDate(authInfo.last_sign_in) : "—"}</span></div>
                    <div className="flex justify-between"><span className="text-muted-foreground">Регистрация</span><span>{formatDate(profile.created_at)}</span></div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">2FA</span>
                      <div className="flex items-center gap-1">
                        <Badge variant={authInfo.mfa_enabled ? "default" : "secondary"} className="text-[8px] h-4">{authInfo.mfa_enabled ? "Вкл" : "Выкл"}</Badge>
                        {authInfo.mfa_enabled && (
                          <Button variant="ghost" size="sm" className="h-4 text-[9px] px-1 text-destructive" onClick={disableMFA} disabled={saving}>Сбросить</Button>
                        )}
                      </div>
                    </div>
                  </div>

                  <Separator />

                  {/* Ban actions */}
                  {authInfo.banned ? (
                    <Button size="sm" className="w-full h-8 text-xs" onClick={() => handleBan("none")} disabled={saving}>
                      <CheckCircle className="h-3 w-3 mr-1" />Разблокировать
                    </Button>
                  ) : (
                    <div className="space-y-1.5">
                      <Label className="text-[10px] text-muted-foreground">Заблокировать</Label>
                      <div className="grid grid-cols-2 gap-1">
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleBan("24h")} disabled={saving}>24 часа</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleBan("7d")} disabled={saving}>7 дней</Button>
                        <Button variant="outline" size="sm" className="h-7 text-[10px]" onClick={() => handleBan("30d")} disabled={saving}>30 дней</Button>
                        <Button variant="destructive" size="sm" className="h-7 text-[10px]" onClick={() => handleBan("permanent")} disabled={saving}>Навсегда</Button>
                      </div>
                    </div>
                  )}
                </>
              ) : (
                <p className="text-xs text-muted-foreground py-2">Не удалось загрузить</p>
              )}
            </CardContent>
          </Card>

          {/* Stats card */}
          <Card className="border-border/60">
            <CardContent className="p-3 space-y-1 text-[11px]">
              <div className="flex justify-between"><span className="text-muted-foreground">Заказов</span><span className="font-bold">{orders.length}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Потрачено</span><span className="font-bold">{totalSpent.toFixed(2)}₽</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Транзакций</span><span className="font-bold">{transactions.length}</span></div>
            </CardContent>
          </Card>
        </div>

        {/* Right column: Orders & Transactions */}
        <div className="flex flex-col min-h-0">
          <Tabs value={tab} onValueChange={setTab} className="flex flex-col flex-1 min-h-0">
            <div className="flex items-center gap-2 shrink-0">
              <TabsList className="h-7">
                <TabsTrigger value="orders" className="text-xs h-6 px-2">Заказы ({orders.length})</TabsTrigger>
                <TabsTrigger value="transactions" className="text-xs h-6 px-2">Транзакции ({transactions.length})</TabsTrigger>
              </TabsList>
              {tab === "orders" && (
                <>
                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 -translate-y-1/2 h-3 w-3 text-muted-foreground" />
                    <Input placeholder="Услуга, ссылка..." value={search} onChange={e => setSearch(e.target.value)} className="pl-7 h-7 w-[160px] text-xs" />
                  </div>
                  <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                    <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Все</SelectItem>
                      {orderStatuses.map(s => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                    </SelectContent>
                  </Select>
                </>
              )}
              {tab === "transactions" && (
                <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
                  <SelectTrigger className="w-[100px] h-7 text-xs"><SelectValue placeholder="Тип" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Все</SelectItem>
                    {txTypes.map(t => <SelectItem key={t} value={t}>{t}</SelectItem>)}
                  </SelectContent>
                </Select>
              )}
            </div>

            <div className="flex-1 min-h-0 overflow-auto border rounded-md mt-2">
              <TabsContent value="orders" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px]">
                      <TableHead className="px-1">Дата</TableHead>
                      <TableHead className="px-1">Соцсеть</TableHead>
                      <TableHead className="px-1">Услуга</TableHead>
                      <TableHead className="px-1">Ссылка</TableHead>
                      <TableHead className="px-1">Кол-во</TableHead>
                      <TableHead className="px-1">Цена</TableHead>
                      <TableHead className="px-1">Статус</TableHead>
                      <TableHead className="px-1">Пров.</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredOrders.length === 0 ? (
                      <TableRow><TableCell colSpan={8} className="text-center text-xs text-muted-foreground py-8">Нет заказов</TableCell></TableRow>
                    ) : filteredOrders.map(o => (
                      <TableRow key={o.id} className="text-[11px]">
                        <TableCell className="px-1 whitespace-nowrap">{formatDate(o.created_at)}</TableCell>
                        <TableCell className="px-1">{o.platform && <Badge variant="outline" className="text-[9px] px-1">{o.platform}</Badge>}</TableCell>
                        <TableCell className="px-1 max-w-[180px] truncate">{o.service_name}</TableCell>
                        <TableCell className="px-1">
                          <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">
                            {o.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 25)}<ExternalLink className="h-2 w-2 inline ml-0.5" />
                          </a>
                        </TableCell>
                        <TableCell className="px-1 whitespace-nowrap">{o.progress}/{o.quantity}</TableCell>
                        <TableCell className="px-1 whitespace-nowrap font-medium">{Number(o.price).toFixed(2)}₽</TableCell>
                        <TableCell className="px-1">
                          <span className={`px-1 py-0.5 rounded text-[9px] ${statusColors[o.status] || "bg-muted"}`}>{o.status}</span>
                        </TableCell>
                        <TableCell className="px-1">{o.provider && <Badge variant="secondary" className="text-[9px] px-1">{o.provider}</Badge>}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>

              <TabsContent value="transactions" className="mt-0">
                <Table>
                  <TableHeader>
                    <TableRow className="text-[11px]">
                      <TableHead className="px-1">Дата</TableHead>
                      <TableHead className="px-1">Тип</TableHead>
                      <TableHead className="px-1">Сумма</TableHead>
                      <TableHead className="px-1">Баланс после</TableHead>
                      <TableHead className="px-1">Статус</TableHead>
                      <TableHead className="px-1">Описание</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredTx.length === 0 ? (
                      <TableRow><TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-8">Нет транзакций</TableCell></TableRow>
                    ) : filteredTx.map(t => (
                      <TableRow key={t.id} className="text-[11px]">
                        <TableCell className="px-1 whitespace-nowrap">{formatDate(t.created_at)}</TableCell>
                        <TableCell className="px-1"><Badge variant="outline" className="text-[9px]">{t.type}</Badge></TableCell>
                        <TableCell className={`px-1 font-medium ${["deposit", "refund", "admin_deposit"].includes(t.type) ? "text-green-600" : "text-destructive"}`}>
                          {["deposit", "refund", "admin_deposit"].includes(t.type) ? "+" : "−"}{Number(t.amount).toFixed(2)}₽
                        </TableCell>
                        <TableCell className="px-1">{Number(t.balance_after).toFixed(2)}₽</TableCell>
                        <TableCell className="px-1"><Badge variant="secondary" className="text-[9px]">{t.status}</Badge></TableCell>
                        <TableCell className="px-1 text-muted-foreground max-w-[200px] truncate">{t.description || "—"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TabsContent>
            </div>
          </Tabs>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
