import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw, ExternalLink } from "lucide-react";

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
  deposit: "Пополнение баланса",
  purchase: "Списание средств",
  refund: "Возврат средств",
  admin_deposit: "Начисление (админ)",
  admin_withdraw: "Списание (админ)",
};

const typeColors: Record<string, string> = {
  deposit: "bg-green-500/20 text-green-700 border-green-500/30",
  purchase: "bg-orange-500/20 text-orange-700 border-orange-500/30",
  refund: "bg-blue-500/20 text-blue-700 border-blue-500/30",
  admin_deposit: "bg-emerald-500/20 text-emerald-700 border-emerald-500/30",
  admin_withdraw: "bg-red-500/20 text-red-700 border-red-500/30",
};

const statusLabels: Record<string, string> = {
  completed: "Выполнено",
  pending: "Ожидает",
  failed: "Ошибка",
};

const statusColors: Record<string, string> = {
  completed: "bg-green-500/20 text-green-700 border-green-500/30",
  pending: "bg-yellow-500/20 text-yellow-700 border-yellow-500/30",
  failed: "bg-red-500/20 text-red-700 border-red-500/30",
};

const AdminTransactions = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");

  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});

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
      .limit(500);
    setTransactions((data || []) as Transaction[]);
    setLoading(false);
  };

  useEffect(() => {
    if (transactions.length === 0) return;
    const userIds = [...new Set(transactions.map((t) => t.user_id))];
    supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", userIds)
      .then(({ data }) => {
        const map: Record<string, string> = {};
        data?.forEach((p) => { map[p.id] = p.display_name || p.id.slice(0, 8); });
        setProfilesMap(map);
      });
  }, [transactions]);

  const types = useMemo(() => [...new Set(transactions.map((t) => t.type))].sort(), [transactions]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search) {
        const s = search.toLowerCase();
        const userName = profilesMap[t.user_id] || "";
        if (
          !t.id.toLowerCase().includes(s) &&
          !t.user_id.toLowerCase().includes(s) &&
          !(t.order_id || "").toLowerCase().includes(s) &&
          !(t.description || "").toLowerCase().includes(s) &&
          !userName.toLowerCase().includes(s)
        ) return false;
      }
      return true;
    });
  }, [transactions, search, typeFilter, statusFilter, profilesMap]);

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { year: "numeric", month: "2-digit", day: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit", second: "2-digit" });
  };

  const totalSum = useMemo(() => filtered.reduce((s, t) => s + Number(t.amount), 0), [filtered]);

  return (
    <div className="flex flex-col h-full gap-3">
      <div className="flex items-center justify-between shrink-0">
        <h1 className="text-lg font-bold tracking-tight">СПИСОК ТРАНЗАКЦИЙ</h1>
        <Button size="sm" variant="outline" className="h-8 text-xs" onClick={loadData}>
          <RefreshCw className="h-3.5 w-3.5 mr-1.5" />Обновить
        </Button>
      </div>

      {/* Filters */}
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
          <SelectTrigger className="w-[130px] h-8 text-xs"><SelectValue placeholder="Статус" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="completed">Выполнено</SelectItem>
            <SelectItem value="pending">Ожидает</SelectItem>
            <SelectItem value="failed">Ошибка</SelectItem>
          </SelectContent>
        </Select>
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
                <TableHead className="px-3 w-[100px]">Статус</TableHead>
                <TableHead className="px-3 w-[160px]">Дата</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={9} className="text-center py-12 text-muted-foreground text-sm">
                    Транзакции не найдены
                  </TableCell>
                </TableRow>
              ) : filtered.map((t, idx) => (
                <TableRow key={t.id} className="text-xs">
                  <TableCell className="px-3 py-2.5 text-muted-foreground">{idx + 1}</TableCell>
                  <TableCell className="px-3 py-2.5 font-mono text-[10px] text-muted-foreground max-w-[160px]">
                    <span className="block truncate">{t.id}</span>
                  </TableCell>
                  <TableCell className="px-3 py-2.5">
                    <button
                      className="text-primary hover:underline font-medium"
                      onClick={() => navigate(`/admin/users/${t.user_id}`)}
                    >
                      {profilesMap[t.user_id] || t.user_id.slice(0, 8)}
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
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default AdminTransactions;
