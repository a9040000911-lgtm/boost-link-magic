import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useParams, useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import {
  ArrowLeft, Save, RefreshCw, ExternalLink, KeyRound,
  Plus, Minus, Ban, CheckCircle, AlertTriangle, Shield
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
  const [saving, setSaving] = useState(false);

  // All editable fields — ONE form, ONE save
  const [editName, setEditName] = useState("");
  const [editEmail, setEditEmail] = useState("");
  const [editPassword, setEditPassword] = useState("");
  const [editDiscount, setEditDiscount] = useState("0");
  const [balanceAmount, setBalanceAmount] = useState("");

  // Auth info
  const [authInfo, setAuthInfo] = useState<any>(null);

  useEffect(() => {
    if (!user || !userId) return;
    loadAll();
  }, [user, userId]);

  const loadAll = async () => {
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
      setEditDiscount(String(profileRes.data.discount ?? 0));
    }
    // Auth info
    try {
      const { data } = await supabase.functions.invoke("admin-user-management", {
        body: { action: "get_user_auth", user_id: userId },
      });
      if (data && !data.error) {
        setAuthInfo(data);
        setEditEmail(data.email || "");
      }
    } catch (_) {}
    setLoading(false);
  };

  // === ONE save for profile + email + password (if changed) ===
  const saveAll = async () => {
    setSaving(true);
    try {
      // 1. Profile fields
      const { error } = await supabase.from("profiles").update({
        display_name: editName,
        discount: parseFloat(editDiscount) || 0,
        updated_at: new Date().toISOString(),
      }).eq("id", userId);
      if (error) throw error;

      // 2. Email (if changed)
      if (authInfo && editEmail && editEmail !== authInfo.email) {
        const { data, error: emailErr } = await supabase.functions.invoke("admin-user-management", {
          body: { action: "update_email", user_id: userId, email: editEmail },
        });
        if (emailErr) throw emailErr;
        if (data?.error) throw new Error(data.error);
      }

      // 3. Password (if filled)
      if (editPassword.length >= 6) {
        const { data, error: pwErr } = await supabase.functions.invoke("admin-user-management", {
          body: { action: "update_password", user_id: userId, password: editPassword },
        });
        if (pwErr) throw pwErr;
        if (data?.error) throw new Error(data.error);
        setEditPassword("");
      }

      await logAuditAction("update_user_profile", "user", userId, { display_name: editName });
      toast.success("Сохранено");
      await loadAll();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  // === Balance: instant action ===
  const adjustBalance = async (direction: "add" | "sub") => {
    const amount = parseFloat(balanceAmount);
    if (isNaN(amount) || amount <= 0) return;
    setSaving(true);
    try {
      const newBalance = direction === "add"
        ? Number(profile.balance) + amount
        : Math.max(0, Number(profile.balance) - amount);
      await supabase.from("profiles").update({ balance: newBalance, updated_at: new Date().toISOString() }).eq("id", userId);
      await supabase.from("transactions").insert({
        user_id: userId!, type: direction === "add" ? "admin_deposit" : "admin_withdraw",
        amount, balance_after: newBalance, status: "completed",
        description: direction === "add" ? "Пополнение администратором" : "Списание администратором",
      });
      await logAuditAction("update_user_balance", "user", userId, { direction, amount, new_balance: newBalance });
      toast.success(`${direction === "add" ? "+" : "−"}${amount.toFixed(2)}₽ → ${newBalance.toFixed(2)}₽`);
      setBalanceAmount("");
      await loadAll();
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
      await loadAll();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const confirmEmail = async () => {
    setSaving(true);
    try {
      await supabase.functions.invoke("admin-user-management", { body: { action: "confirm_email", user_id: userId } });
      toast.success("Email подтверждён");
      await loadAll();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const totalSpent = useMemo(() => orders.reduce((s, o) => s + Number(o.price), 0), [orders]);
  const formatDT = (d: string) => {
    if (!d) return "—";
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit", year: "2-digit" }) + " " +
      date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  if (!profile) return <div className="text-center py-12 text-muted-foreground">Пользователь не найден</div>;

  const isBanned = authInfo?.banned === true;

  return (
    <div className="flex flex-col h-full gap-4 overflow-auto">
      {/* === HEADER: Back + name + stats strip === */}
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <h1 className="text-base font-bold">{editName || "—"}</h1>
        <span className="text-xs text-muted-foreground">{authInfo?.email}</span>
        <div className="ml-auto flex items-center gap-3 text-xs">
          {isBanned && <Badge variant="destructive" className="text-[10px]"><Ban className="h-2.5 w-2.5 mr-0.5" />Бан</Badge>}
          <span className="text-muted-foreground">Баланс:</span>
          <span className="font-bold text-sm">{Number(profile.balance).toFixed(2)}₽</span>
          <span className="text-muted-foreground">Заказов:</span>
          <span className="font-bold">{orders.length}</span>
          <span className="text-muted-foreground">Потрачено:</span>
          <span className="font-bold">{totalSpent.toFixed(2)}₽</span>
          <Button variant="ghost" size="sm" className="h-6 w-6 p-0" onClick={loadAll}><RefreshCw className="h-3 w-3" /></Button>
        </div>
      </div>

      {/* === QUICK BALANCE — always visible, 1 input + 2 buttons === */}
      <div className="flex items-center gap-2 shrink-0 bg-muted/30 rounded-md px-3 py-2">
        <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">Баланс:</span>
        <Input
          type="number" value={balanceAmount} onChange={e => setBalanceAmount(e.target.value)}
          placeholder="Сумма" className="h-7 w-[120px] text-xs"
        />
        <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1" onClick={() => adjustBalance("add")} disabled={saving || !balanceAmount}>
          <Plus className="h-3 w-3" />Пополнить
        </Button>
        <Button size="sm" variant="outline" className="h-7 text-xs px-2 gap-1 text-destructive" onClick={() => adjustBalance("sub")} disabled={saving || !balanceAmount}>
          <Minus className="h-3 w-3" />Списать
        </Button>
        <Separator orientation="vertical" className="h-5 mx-1" />
        {/* Ban/unban inline */}
        {isBanned ? (
          <Button size="sm" variant="outline" className="h-7 text-xs px-2" onClick={() => handleBan("none")} disabled={saving}>
            <CheckCircle className="h-3 w-3 mr-1" />Разбан
          </Button>
        ) : (
          <>
            <span className="text-[10px] text-muted-foreground">Бан:</span>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleBan("24h")} disabled={saving}>24ч</Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleBan("7d")} disabled={saving}>7д</Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5" onClick={() => handleBan("30d")} disabled={saving}>30д</Button>
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-destructive" onClick={() => handleBan("permanent")} disabled={saving}>∞</Button>
          </>
        )}
        {authInfo && !authInfo.email_confirmed && (
          <>
            <Separator orientation="vertical" className="h-5 mx-1" />
            <Button variant="ghost" size="sm" className="h-6 text-[10px] px-1.5 text-orange-500" onClick={confirmEmail} disabled={saving}>
              <AlertTriangle className="h-2.5 w-2.5 mr-0.5" />Подтвердить email
            </Button>
          </>
        )}
      </div>

      {/* === PROFILE FORM — flat grid, ONE save === */}
      <div className="shrink-0 border rounded-md p-3">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 items-end">
          <div>
            <Label className="text-[11px] text-muted-foreground">Имя</Label>
            <Input value={editName} onChange={e => setEditName(e.target.value)} className="text-xs h-8" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Email</Label>
            <Input value={editEmail} onChange={e => setEditEmail(e.target.value)} className="text-xs h-8" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Новый пароль</Label>
            <Input type="password" value={editPassword} onChange={e => setEditPassword(e.target.value)} placeholder="Не менять" className="text-xs h-8" />
          </div>
          <div>
            <Label className="text-[11px] text-muted-foreground">Скидка (%)</Label>
            <Input type="number" value={editDiscount} onChange={e => setEditDiscount(e.target.value)} className="text-xs h-8 w-[80px]" min="0" max="100" />
          </div>
        </div>
        <div className="flex items-center gap-3 mt-3">
          <Button size="sm" className="h-8 text-xs px-4" onClick={saveAll} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />{saving ? "..." : "Сохранить"}
          </Button>
          <span className="text-[10px] text-muted-foreground">
            ID: <span className="font-mono">{profile.id.slice(0, 12)}</span> · Рег: {formatDT(profile.created_at)}
            {authInfo?.last_sign_in && <> · Вход: {formatDT(authInfo.last_sign_in)}</>}
            {authInfo?.mfa_enabled && <> · <Shield className="h-2.5 w-2.5 inline" /> 2FA</>}
          </span>
        </div>
      </div>

      {/* === ORDERS TABLE — directly, no tabs === */}
      <div className="flex-1 min-h-0 flex flex-col gap-1">
        <h2 className="text-xs font-bold shrink-0">Заказы ({orders.length})</h2>
        <div className="flex-1 min-h-0 overflow-auto border rounded-md">
          <Table>
            <TableHeader>
              <TableRow className="text-[11px]">
                <TableHead className="px-1.5">Дата</TableHead>
                <TableHead className="px-1.5">Соцсеть</TableHead>
                <TableHead className="px-1.5">Услуга</TableHead>
                <TableHead className="px-1.5">Ссылка</TableHead>
                <TableHead className="px-1.5">Кол-во</TableHead>
                <TableHead className="px-1.5">Цена</TableHead>
                <TableHead className="px-1.5">Статус</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {orders.length === 0 ? (
                <TableRow><TableCell colSpan={7} className="text-center text-xs text-muted-foreground py-6">Нет заказов</TableCell></TableRow>
              ) : orders.map(o => (
                <TableRow key={o.id} className="text-[11px]">
                  <TableCell className="px-1.5 whitespace-nowrap">{formatDT(o.created_at)}</TableCell>
                  <TableCell className="px-1.5">{o.platform && <Badge variant="outline" className="text-[9px] px-1">{o.platform}</Badge>}</TableCell>
                  <TableCell className="px-1.5 max-w-[200px] truncate">{o.service_name}</TableCell>
                  <TableCell className="px-1.5">
                    <a href={o.link} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-[10px]">
                      {o.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}<ExternalLink className="h-2 w-2 inline ml-0.5" />
                    </a>
                  </TableCell>
                  <TableCell className="px-1.5 whitespace-nowrap">{o.progress}/{o.quantity}</TableCell>
                  <TableCell className="px-1.5 whitespace-nowrap font-medium">{Number(o.price).toFixed(2)}₽</TableCell>
                  <TableCell className="px-1.5">
                    <span className={`px-1 py-0.5 rounded text-[9px] ${statusColors[o.status] || "bg-muted"}`}>{o.status}</span>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetail;
