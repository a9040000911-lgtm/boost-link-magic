import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Search, RefreshCw, CheckCircle } from "lucide-react";
import { toast } from "sonner";
import { useTableControls } from "@/hooks/useTableControls";
import { TablePagination } from "@/components/admin/TablePagination";

interface Transaction {
  id: string;
  user_id: string;
  type: string;
  amount: number;
  balance_after: number;
  status: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

const typeLabels: Record<string, string> = {
  deposit: "Пополнение",
  purchase: "Списание",
  charge: "Списание",
  refund: "Возврат",
  withdrawal: "Вывод",
  admin_deposit: "Начисление (админ)",
  admin_withdraw: "Списание (админ)",
};

const typeColors: Record<string, string> = {
  deposit: "bg-green-500/20 text-green-700 border-green-500/30",
  purchase: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  charge: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  refund: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  withdrawal: "bg-amber-500/20 text-amber-700 border-amber-500/30",
  admin_deposit: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  admin_withdraw: "bg-red-500/20 text-red-700 border-red-500/30",
  awaiting_payment: "bg-purple-500/20 text-purple-700 border-purple-500/30",
};

const statusLabels: Record<string, string> = {
  completed: "Выполнено",
  pending: "Ожидает",
  awaiting_payment: "Ожидает оплаты",
  failed: "Ошибка",
  cancelled: "Отменена",
  processing: "Обработка",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-700 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  awaiting_payment: "bg-purple-500/20 text-purple-700 border-purple-500/30",
  failed: "bg-red-500/20 text-red-700 border-red-500/30",
  cancelled: "bg-gray-500/20 text-gray-700 border-gray-500/30",
  processing: "bg-blue-500/20 text-blue-700 border-blue-500/30",
};

const AdminTransactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [amountMin, setAmountMin] = useState("");
  const [amountMax, setAmountMax] = useState("");

  const [emailMap, setEmailMap] = useState<Record<string, string>>({});
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

  // Manual confirmation
  const [confirmTx, setConfirmTx] = useState<Transaction | null>(null);
  const [confirming, setConfirming] = useState(false);

  useEffect(() => {
    if (!user) return;
    loadData();
  }, [user]);

  const loadData = async () => {
    setLoading(true);
    const { data } = await supabase
      .from("transactions")
      .select("*")
      .order("created_at", { ascending: false })
      .limit(1000);
    setTransactions((data || []) as Transaction[]);
    setLoading(false);
  };

  // Fetch emails and names for user_ids
  useEffect(() => {
    if (transactions.length === 0) return;
    const userIds = [...new Set(transactions.map((t) => t.user_id))];

    // Fetch profiles for names
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((p) => { map[p.id] = p.display_name || ""; });
        setProfilesMap(map);
      });

    // Fetch emails via edge function
    supabase.functions.invoke("admin-user-management", {
      body: { action: "list_users_auth", user_id: "bulk", user_ids: userIds },
    }).then(({ data }) => {
      if (data && typeof data === "object" && !data.error) {
        const map: Record<string, string> = {};
        Object.entries(data).forEach(([id, info]: [string, any]) => {
          map[id] = info?.email || "";
        });
        setEmailMap(map);
      }
    }).catch(() => {});
  }, [transactions]);

  const types = useMemo(() => [...new Set(transactions.map((t) => t.type))].sort(), [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;

      // Date filter
      if (dateFrom) {
        const from = new Date(dateFrom);
        if (new Date(t.created_at) < from) return false;
      }
      if (dateTo) {
        const to = new Date(dateTo + "T23:59:59");
        if (new Date(t.created_at) > to) return false;
      }

      // Amount filter
      const amt = Math.abs(Number(t.amount));
      if (amountMin && amt < Number(amountMin)) return false;
      if (amountMax && amt > Number(amountMax)) return false;

      if (search) {
        const s = search.toLowerCase();
        const email = emailMap[t.user_id] || "";
        const name = profilesMap[t.user_id] || "";
        if (
          !t.id.toLowerCase().includes(s) &&
          !t.user_id.toLowerCase().includes(s) &&
          !(t.order_id || "").toLowerCase().includes(s) &&
          !(t.description || "").toLowerCase().includes(s) &&
          !email.toLowerCase().includes(s) &&
          !name.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, dateFrom, dateTo, amountMin, amountMax, emailMap, profilesMap]);

  const pagination = useTableControls({ data: filtered, pageSize: 50 });

  useEffect(() => { pagination.resetPage(); }, [search, typeFilter, statusFilter, dateFrom, dateTo, amountMin, amountMax]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const totalSum = useMemo(() => filtered.reduce((s, t) => s + Number(t.amount), 0), [filtered]);

  const handleConfirmPayment = async () => {
    if (!confirmTx) return;
    setConfirming(true);
    try {
      const { error } = await supabase
        .from("transactions")
        .update({ status: "completed" })
        .eq("id", confirmTx.id);
      if (error) throw error;

      // Credit user balance
      const { error: creditError } = await supabase.rpc("credit_balance", {
        p_user_id: confirmTx.user_id,
        p_amount: Math.abs(Number(confirmTx.amount)),
      });
      if (creditError) throw creditError;

      toast.success("Оплата подтверждена, баланс зачислен");
      setConfirmTx(null);
      await loadData();
    } catch (e: any) {
      toast.error("Ошибка: " + e.message);
    }
    setConfirming(false);
  };

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold tracking-tight">СПИСОК ТРАНЗАКЦИЙ</h1>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={loadData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Обновить
        </Button>
      </div>

      {/* Filters row 1 */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
          <Input
            placeholder="UUID, email, ID заказа, описание..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-8 h-8 w-[300px] text-xs"
          />
        </div>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-[160px] h-8 text-xs"><SelectValue placeholder="Тип" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все типы</SelectItem>
            {types.map((t) => <SelectItem key={t} value={t}>{typeLabels[t] || t}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[150px] h-8 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="completed">Выполнено</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="awaiting_payment">Ожидает оплаты</SelectItem>
            <SelectItem value="processing">Обработка</SelectItem>
            <SelectItem value="failed">Ошибка</SelectItem>
            <SelectItem value="cancelled">Отменена</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Filters row 2: date + amount */}
      <div className="flex items-center gap-2 shrink-0 flex-wrap">
        <div className="flex items-center gap-1.5">
          <Label className="text-[11px] text-muted-foreground whitespace-nowrap">Дата с</Label>
          <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} className="h-8 w-[140px] text-xs" />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-[11px] text-muted-foreground whitespace-nowrap">по</Label>
          <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} className="h-8 w-[140px] text-xs" />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-[11px] text-muted-foreground whitespace-nowrap">Сумма от</Label>
          <Input type="number" placeholder="0" value={amountMin} onChange={(e) => setAmountMin(e.target.value)} className="h-8 w-[90px] text-xs" />
        </div>
        <div className="flex items-center gap-1.5">
          <Label className="text-[11px] text-muted-foreground whitespace-nowrap">до</Label>
          <Input type="number" placeholder="∞" value={amountMax} onChange={(e) => setAmountMax(e.target.value)} className="h-8 w-[90px] text-xs" />
        </div>
        {(dateFrom || dateTo || amountMin || amountMax) && (
          <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setDateFrom(""); setDateTo(""); setAmountMin(""); setAmountMax(""); }}>
            Сбросить
          </Button>
        )}
        <span className="text-xs text-muted-foreground ml-auto">
          Найдено: {filtered.length} | Сумма: <span className={`font-medium ${totalSum >= 0 ? "text-green-600" : "text-destructive"}`}>{totalSum >= 0 ? "+" : ""}{totalSum.toFixed(2)}₽</span>
        </span>
      </div>

      {/* Table */}
      <div className="flex-1 min-h-0 overflow-auto border rounded-lg">
        {loading ? (
          <div className="flex justify-center py-16"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wider">
                <TableHead className="px-3 w-[50px]">№</TableHead>
                <TableHead className="px-3">UUID</TableHead>
                <TableHead className="px-3">Пользователь</TableHead>
                <TableHead className="px-3 w-[80px]">ID заказа</TableHead>
                <TableHead className="px-3 w-[90px] text-right">Сумма</TableHead>
                <TableHead className="px-3">Описание</TableHead>
                <TableHead className="px-3 w-[140px]">Тип</TableHead>
                <TableHead className="px-3 w-[120px]">Статус</TableHead>
                <TableHead className="px-3 w-[160px]">Дата</TableHead>
                <TableHead className="px-3 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {pagination.paginated.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={10} className="text-center py-12 text-muted-foreground text-sm">
                    Транзакции не найдены
                  </TableCell>
                </TableRow>
              ) : pagination.paginated.map((t, idx) => {
                const canConfirm = t.status === "pending" || t.status === "awaiting_payment";
                return (
                  <TableRow key={t.id} className="text-xs">
                    <TableCell className="px-3 py-2.5 text-muted-foreground">{pagination.from + idx}</TableCell>
                    <TableCell className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground max-w-[160px]">
                      <span className="block truncate">{t.id}</span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <button
                        className="text-primary hover:underline font-medium"
                        onClick={() => navigate(`/admin/users/${t.user_id}`)}
                      >
                        {emailMap[t.user_id] || profilesMap[t.user_id] || t.user_id.slice(0, 8)}
                      </button>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground">
                      {t.order_id ? t.order_id.slice(0, 8) : "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2.5 text-right font-medium whitespace-nowrap">
                      <span className={Number(t.amount) >= 0 ? "text-green-600" : "text-destructive"}>
                        {Number(t.amount) >= 0 ? "+" : ""}{Number(t.amount).toFixed(2)}
                      </span>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 max-w-[200px] truncate text-muted-foreground">
                      {t.description || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${typeColors[t.type] || ""}`}>
                        {typeLabels[t.type] || t.type}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      <Badge variant="outline" className={`text-[10px] px-1.5 py-0.5 ${statusColors[t.status] || ""}`}>
                        {statusLabels[t.status] || t.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="px-3 py-2.5 whitespace-nowrap text-muted-foreground">
                      {formatDate(t.created_at)}
                    </TableCell>
                    <TableCell className="px-3 py-2.5">
                      {canConfirm && t.type === "deposit" && (
                        <Button
                          variant="outline"
                          size="icon"
                          className="h-6 w-6"
                          title="Подтвердить оплату"
                          onClick={() => setConfirmTx(t)}
                        >
                          <CheckCircle className="h-3.5 w-3.5 text-green-600" />
                        </Button>
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>

      <TablePagination {...pagination} />

      {/* Manual confirmation dialog */}
      <Dialog open={!!confirmTx} onOpenChange={(open) => { if (!open) setConfirmTx(null); }}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Подтвердить оплату вручную</DialogTitle>
          </DialogHeader>
          {confirmTx && (
            <div className="space-y-2 text-xs">
              <p><strong>Пользователь:</strong> {emailMap[confirmTx.user_id] || confirmTx.user_id.slice(0, 8)}</p>
              <p><strong>Сумма:</strong> {Math.abs(Number(confirmTx.amount)).toFixed(2)} ₽</p>
              <p><strong>Статус:</strong> {statusLabels[confirmTx.status] || confirmTx.status}</p>
              <p className="text-muted-foreground">
                После подтверждения статус станет «Выполнено» и баланс пользователя будет пополнен.
              </p>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" size="sm" className="text-xs" onClick={() => setConfirmTx(null)}>Отмена</Button>
            <Button size="sm" className="text-xs" onClick={handleConfirmPayment} disabled={confirming}>
              {confirming ? "Подтверждение..." : "Подтвердить оплату"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminTransactions;
