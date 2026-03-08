import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft, User, ExternalLink, Search, Settings2, KeyRound,
  Wallet, Shield, Ban, CheckCircle, Mail, Clock, AlertTriangle
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

  // Edit dialog
  const [editOpen, setEditOpen] = useState(false);
  const [editTab, setEditTab] = useState("profile");
  const [authInfo, setAuthInfo] = useState<any>(null);
  const [authLoading, setAuthLoading] = useState(false);

  // Edit fields
  const [editName, setEditName] = useState("");
  const [editBio, setEditBio] = useState("");
  const [editBalance, setEditBalance] = useState("");
  const [balanceAction, setBalanceAction] = useState<"set" | "add" | "subtract">("set");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [banDuration, setBanDuration] = useState("none");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!user || !userId) return;
    loadData();
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
      setEditBalance(String(profileRes.data.balance || 0));
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
      setBanDuration(data.banned ? "current" : "none");
    } catch (e) {
      toast.error("Ошибка загрузки данных авторизации");
    }
    setAuthLoading(false);
  };

  const openEditDialog = () => {
    setEditOpen(true);
    setEditTab("profile");
    loadAuthInfo();
  };

  // Save profile changes
  const saveProfile = async () => {
    setSaving(true);
    try {
      const { error } = await supabase.from("profiles").update({
        display_name: editName,
        bio: editBio,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);
      if (error) throw error;
      await logAuditAction("update_user_balance", "user", userId, { field: "profile", display_name: editName });
      toast.success("Профиль обновлён");
      await loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  // Save balance
  const saveBalance = async () => {
    setSaving(true);
    try {
      const amount = parseFloat(editBalance);
      if (isNaN(amount)) throw new Error("Некорректная сумма");

      let newBalance: number;
      const currentBalance = Number(profile.balance);

      if (balanceAction === "set") newBalance = amount;
      else if (balanceAction === "add") newBalance = currentBalance + amount;
      else newBalance = currentBalance - amount;

      if (newBalance < 0) newBalance = 0;

      const { error } = await supabase.from("profiles").update({
        balance: newBalance,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);
      if (error) throw error;

      // Log transaction
      const diff = newBalance - currentBalance;
      if (diff !== 0) {
        await supabase.from("transactions").insert({
          user_id: userId!,
          type: diff > 0 ? "admin_deposit" : "admin_withdraw",
          amount: Math.abs(diff),
          balance_after: newBalance,
          status: "completed",
          description: `Корректировка баланса администратором (${balanceAction})`,
        });
      }

      await logAuditAction("update_user_balance", "user", userId, { action: balanceAction, amount, new_balance: newBalance });
      toast.success(`Баланс обновлён: ${newBalance.toFixed(2)}₽`);
      await loadData();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  // Change email
  const changeEmail = async () => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "update_email", user_id: userId, email: editEmail },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("update_user_balance", "user", userId, { field: "email", email: editEmail });
      toast.success("Email обновлён");
      await loadAuthInfo();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  // Change password
  const changePassword = async () => {
    if (editPassword.length < 6) {
      toast.error("Минимум 6 символов");
      return;
    }
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "update_password", user_id: userId, password: editPassword },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("update_user_balance", "user", userId, { field: "password" });
      toast.success("Пароль изменён");
      setEditPassword("");
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  // Ban/unban
  const handleBan = async (duration: string) => {
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "ban_user", user_id: userId, duration },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("update_user_balance", "user", userId, { field: "ban", duration });
      toast.success(duration === "none" ? "Пользователь разблокирован" : "Пользователь заблокирован");
      await loadAuthInfo();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  // Disable MFA
  const disableMFA = async () => {
    if (!confirm("Отключить двухфакторную аутентификацию? Пользователь сможет войти без 2FA.")) return;
    setSaving(true);
    try {
      const { data, error } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "delete_mfa_factors", user_id: userId },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      await logAuditAction("update_user_balance", "user", userId, { field: "mfa", action: "disabled" });
      toast.success("2FA отключена");
      await loadAuthInfo();
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  // Confirm email
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
    } catch (e: any) {
      toast.error(e.message);
    }
    setSaving(false);
  };

  const filteredOrders = useMemo(() => {
    return orders.filter((o) => {
      if (orderStatusFilter !== "all" && o.status !== orderStatusFilter) return false;
      if (search && !o.service_name.toLowerCase().includes(search.toLowerCase()) && !o.link.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, orderStatusFilter, search]);

  const filteredTx = useMemo(() => {
    return transactions.filter((t) => {
      if (txTypeFilter !== "all" && t.type !== txTypeFilter) return false;
      return true;
    });
  }, [transactions, txTypeFilter]);

  const formatDate = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const orderStatuses = useMemo(() => [...new Set(orders.map((o) => o.status))], [orders]);
  const txTypes = useMemo(() => [...new Set(transactions.map((t) => t.type))], [transactions]);
  const totalSpent = useMemo(() => orders.reduce((s, o) => s + Number(o.price), 0), [orders]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  if (!profile) {
    return <div className="text-center py-12 text-muted-foreground">Пользователь не найден</div>;
  }

  return (
    <div className="flex flex-col h-full gap-2">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("/admin/users")}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <User className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">{profile.display_name || "Без имени"}</h1>
          <span className="text-[10px] text-muted-foreground font-mono">{profile.id}</span>
        </div>
        <Button size="sm" className="h-7 text-xs" onClick={openEditDialog}>
          <Settings2 className="h-3 w-3 mr-1" />Управление
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 shrink-0">
        <Card className="border-border/60"><CardContent className="p-2">
          <p className="text-[10px] text-muted-foreground">Баланс</p>
          <p className="text-sm font-bold">{Number(profile.balance).toFixed(2)}₽</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2">
          <p className="text-[10px] text-muted-foreground">Заказов</p>
          <p className="text-sm font-bold">{orders.length}</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2">
          <p className="text-[10px] text-muted-foreground">Потрачено</p>
          <p className="text-sm font-bold">{totalSpent.toFixed(2)}₽</p>
        </CardContent></Card>
        <Card className="border-border/60"><CardContent className="p-2">
          <p className="text-[10px] text-muted-foreground">Регистрация</p>
          <p className="text-sm font-bold">{formatDate(profile.created_at)}</p>
        </CardContent></Card>
      </div>

      {/* Tabs */}
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
                <Input placeholder="Услуга, ссылка..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-7 h-7 w-[180px] text-xs" />
              </div>
              <Select value={orderStatusFilter} onValueChange={setOrderStatusFilter}>
                <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Все</SelectItem>
                  {orderStatuses.map((s) => <SelectItem key={s} value={s}>{s}</SelectItem>)}
                </SelectContent>
              </Select>
            </>
          )}
          {tab === "transactions" && (
            <Select value={txTypeFilter} onValueChange={setTxTypeFilter}>
              <SelectTrigger className="w-[110px] h-7 text-xs"><SelectValue placeholder="Тип" /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все</SelectItem>
                {txTypes.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}
              </SelectContent>
            </Select>
          )}
        </div>

        <div className="flex-1 min-h-0 overflow-auto border rounded-md mt-2">
          <TabsContent value="orders" className="mt-0">
            <Table>
              <TableHeader>
                <TableRow className="text-[11px]">
                  <TableHead className="px-1">ID</TableHead>
                  <TableHead className="px-1">Дата</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Соцсеть</TableHead>
                  <TableHead className="px-1">Услуга</TableHead>
                  <TableHead className="px-1">Ссылка</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Кол-во</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Прогресс</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Цена</TableHead>
                  <TableHead className="px-1">Статус</TableHead>
                  <TableHead className="px-1">Пров.</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrders.map((o) => (
                  <TableRow key={o.id} className="text-[11px]">
                    <TableCell className="px-1 font-mono text-[10px] text-muted-foreground">{o.id.slice(0, 8)}</TableCell>
                    <TableCell className="px-1 whitespace-nowrap">{formatDate(o.created_at)}</TableCell>
                    <TableCell className="px-1">{o.platform && <Badge variant="outline" className="text-[9px] px-1">{o.platform}</Badge>}</TableCell>
                    <TableCell className="px-1 max-w-[180px] truncate">{o.service_name}</TableCell>
                    <TableCell className="px-1">
                      <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">
                        {o.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 25)}<ExternalLink className="h-2 w-2 inline ml-0.5" />
                      </a>
                    </TableCell>
                    <TableCell className="px-1 whitespace-nowrap">{o.quantity}</TableCell>
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
                {filteredTx.map((t) => (
                  <TableRow key={t.id} className="text-[11px]">
                    <TableCell className="px-1 whitespace-nowrap">{formatDate(t.created_at)}</TableCell>
                    <TableCell className="px-1"><Badge variant="outline" className="text-[9px]">{t.type}</Badge></TableCell>
                    <TableCell className={`px-1 font-medium ${t.type === "deposit" || t.type === "refund" || t.type === "admin_deposit" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "deposit" || t.type === "refund" || t.type === "admin_deposit" ? "+" : "−"}{Number(t.amount).toFixed(2)}₽
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

      {/* ── Management Dialog ── */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogContent className="max-w-xl max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Settings2 className="h-4 w-4" />
              Управление: {profile.display_name || "Пользователь"}
            </DialogTitle>
          </DialogHeader>

          <Tabs value={editTab} onValueChange={setEditTab}>
            <TabsList className="w-full">
              <TabsTrigger value="profile" className="flex-1 text-xs"><User className="h-3 w-3 mr-1" />Профиль</TabsTrigger>
              <TabsTrigger value="balance" className="flex-1 text-xs"><Wallet className="h-3 w-3 mr-1" />Баланс</TabsTrigger>
              <TabsTrigger value="security" className="flex-1 text-xs"><Shield className="h-3 w-3 mr-1" />Безопасность</TabsTrigger>
              <TabsTrigger value="access" className="flex-1 text-xs"><Ban className="h-3 w-3 mr-1" />Доступ</TabsTrigger>
            </TabsList>

            {/* ── Profile Tab ── */}
            <TabsContent value="profile" className="space-y-4 mt-4">
              <div>
                <Label className="text-xs">Имя пользователя</Label>
                <Input value={editName} onChange={(e) => setEditName(e.target.value)} className="mt-1" />
              </div>
              <div>
                <Label className="text-xs">Описание / Био</Label>
                <Textarea value={editBio} onChange={(e) => setEditBio(e.target.value)} className="mt-1" rows={3} placeholder="О пользователе..." />
              </div>
              <div className="flex items-center gap-2 p-2 bg-muted/50 rounded-md text-xs text-muted-foreground">
                <Clock className="h-3 w-3" />
                Зарегистрирован: {formatDate(profile.created_at)}
              </div>
              <Button onClick={saveProfile} disabled={saving} className="w-full">
                {saving ? "Сохранение..." : "Сохранить профиль"}
              </Button>
            </TabsContent>

            {/* ── Balance Tab ── */}
            <TabsContent value="balance" className="space-y-4 mt-4">
              <div className="p-3 bg-muted/50 rounded-lg text-center">
                <p className="text-[10px] text-muted-foreground">Текущий баланс</p>
                <p className="text-2xl font-bold">{Number(profile.balance).toFixed(2)}₽</p>
              </div>

              <div>
                <Label className="text-xs">Действие</Label>
                <Select value={balanceAction} onValueChange={(v) => setBalanceAction(v as any)}>
                  <SelectTrigger className="mt-1"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="set">Установить точную сумму</SelectItem>
                    <SelectItem value="add">Добавить к балансу</SelectItem>
                    <SelectItem value="subtract">Списать с баланса</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-xs">Сумма (₽)</Label>
                <Input type="number" value={editBalance} onChange={(e) => setEditBalance(e.target.value)} className="mt-1" />
                {balanceAction !== "set" && (
                  <p className="text-[10px] text-muted-foreground mt-1">
                    Итого: {balanceAction === "add"
                      ? (Number(profile.balance) + parseFloat(editBalance || "0")).toFixed(2)
                      : Math.max(0, Number(profile.balance) - parseFloat(editBalance || "0")).toFixed(2)
                    }₽
                  </p>
                )}
              </div>
              <Button onClick={saveBalance} disabled={saving} className="w-full">
                {saving ? "Сохранение..." : "Обновить баланс"}
              </Button>
              <p className="text-[10px] text-muted-foreground text-center">
                Изменение будет записано в транзакции и аудит-лог
              </p>
            </TabsContent>

            {/* ── Security Tab ── */}
            <TabsContent value="security" className="space-y-4 mt-4">
              {authLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : authInfo ? (
                <>
                  {/* Auth info */}
                  <div className="space-y-2 p-3 bg-muted/50 rounded-lg">
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Email</span>
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-medium">{authInfo.email}</span>
                        {authInfo.email_confirmed ? (
                          <CheckCircle className="h-3 w-3 text-green-500" />
                        ) : (
                          <AlertTriangle className="h-3 w-3 text-yellow-500" />
                        )}
                      </div>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">Последний вход</span>
                      <span className="text-xs">{authInfo.last_sign_in ? formatDate(authInfo.last_sign_in) : "—"}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span className="text-xs text-muted-foreground">2FA</span>
                      <Badge variant={authInfo.mfa_enabled ? "default" : "secondary"} className="text-[9px]">
                        {authInfo.mfa_enabled ? "Включена" : "Выключена"}
                      </Badge>
                    </div>
                  </div>

                  {/* Change email */}
                  <Separator />
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Mail className="h-3 w-3" />Изменить email</Label>
                    <div className="flex gap-2 mt-1">
                      <Input value={editEmail} onChange={(e) => setEditEmail(e.target.value)} className="flex-1" />
                      <Button size="sm" onClick={changeEmail} disabled={saving || editEmail === authInfo.email}>
                        Сохранить
                      </Button>
                    </div>
                    {!authInfo.email_confirmed && (
                      <Button variant="outline" size="sm" className="mt-2 text-xs w-full" onClick={confirmEmail} disabled={saving}>
                        <CheckCircle className="h-3 w-3 mr-1" />Подтвердить email вручную
                      </Button>
                    )}
                  </div>

                  {/* Change password */}
                  <Separator />
                  <div>
                    <Label className="text-xs flex items-center gap-1"><KeyRound className="h-3 w-3" />Новый пароль</Label>
                    <div className="flex gap-2 mt-1">
                      <Input
                        type="password"
                        value={editPassword}
                        onChange={(e) => setEditPassword(e.target.value)}
                        placeholder="Минимум 6 символов"
                        className="flex-1"
                      />
                      <Button size="sm" onClick={changePassword} disabled={saving || editPassword.length < 6}>
                        Изменить
                      </Button>
                    </div>
                  </div>

                  {/* 2FA */}
                  <Separator />
                  <div>
                    <Label className="text-xs flex items-center gap-1"><Shield className="h-3 w-3" />Двухфакторная аутентификация</Label>
                    {authInfo.mfa_enabled ? (
                      <div className="mt-2 space-y-2">
                        <div className="p-2 bg-green-500/10 rounded border border-green-500/20">
                          <p className="text-xs text-green-600 font-medium">✓ 2FA активна</p>
                          <p className="text-[10px] text-muted-foreground">
                            Факторов: {authInfo.factors?.length || 0}
                          </p>
                        </div>
                        <Button
                          variant="destructive"
                          size="sm"
                          className="w-full text-xs"
                          onClick={disableMFA}
                          disabled={saving}
                        >
                          Отключить 2FA
                        </Button>
                      </div>
                    ) : (
                      <div className="mt-2 p-2 bg-muted/50 rounded">
                        <p className="text-xs text-muted-foreground">2FA не включена. Пользователь может включить её в настройках личного кабинета.</p>
                      </div>
                    )}
                  </div>
                </>
              ) : (
                <p className="text-xs text-muted-foreground text-center py-4">Не удалось загрузить данные</p>
              )}
            </TabsContent>

            {/* ── Access Tab ── */}
            <TabsContent value="access" className="space-y-4 mt-4">
              {authLoading ? (
                <div className="flex justify-center py-8">
                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary" />
                </div>
              ) : authInfo ? (
                <>
                  <div className={`p-3 rounded-lg border ${authInfo.banned ? "bg-destructive/10 border-destructive/20" : "bg-green-500/10 border-green-500/20"}`}>
                    <div className="flex items-center gap-2">
                      {authInfo.banned ? (
                        <Ban className="h-4 w-4 text-destructive" />
                      ) : (
                        <CheckCircle className="h-4 w-4 text-green-500" />
                      )}
                      <div>
                        <p className="text-sm font-medium">{authInfo.banned ? "Заблокирован" : "Активен"}</p>
                        {authInfo.banned && authInfo.banned_until && (
                          <p className="text-[10px] text-muted-foreground">До: {formatDate(authInfo.banned_until)}</p>
                        )}
                      </div>
                    </div>
                  </div>

                  {authInfo.banned ? (
                    <Button className="w-full" onClick={() => handleBan("none")} disabled={saving}>
                      <CheckCircle className="h-3 w-3 mr-1" />Разблокировать
                    </Button>
                  ) : (
                    <div className="space-y-2">
                      <Label className="text-xs">Заблокировать пользователя</Label>
                      <div className="grid grid-cols-2 gap-2">
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBan("24h")} disabled={saving}>
                          На 24 часа
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBan("7d")} disabled={saving}>
                          На 7 дней
                        </Button>
                        <Button variant="outline" size="sm" className="text-xs" onClick={() => handleBan("30d")} disabled={saving}>
                          На 30 дней
                        </Button>
                        <Button variant="destructive" size="sm" className="text-xs" onClick={() => handleBan("permanent")} disabled={saving}>
                          Навсегда
                        </Button>
                      </div>
                      <p className="text-[10px] text-muted-foreground">
                        Заблокированный пользователь не сможет войти в систему
                      </p>
                    </div>
                  )}
                </>
              ) : null}
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUserDetail;
