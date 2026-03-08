import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Wallet, ArrowDownCircle, ArrowUpCircle, RotateCcw, ShoppingCart, Filter, Search, Plus, CreditCard } from "lucide-react";
import { toast } from "sonner";

interface Transaction {
  id: string;
  type: string;
  amount: number;
  balance_after: number;
  status: string;
  description: string | null;
  order_id: string | null;
  created_at: string;
}

const typeMap: Record<string, { label: string; icon: typeof Wallet; color: string }> = {
  deposit: { label: "Пополнение", icon: ArrowDownCircle, color: "text-green-500" },
  charge: { label: "Списание", icon: ShoppingCart, color: "text-red-500" },
  refund: { label: "Возврат", icon: RotateCcw, color: "text-blue-500" },
  withdrawal: { label: "Вывод", icon: ArrowUpCircle, color: "text-orange-500" },
};

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ожидание", variant: "outline" },
  completed: { label: "Выполнена", variant: "default" },
  cancelled: { label: "Отменена", variant: "destructive" },
  processing: { label: "Обработка", variant: "secondary" },
};

const DashboardTransactions = () => {
  const { user } = useAuth();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [balance, setBalance] = useState(0);
  const [loading, setLoading] = useState(true);
  const [typeFilter, setTypeFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    const fetchData = async () => {
      const [txRes, profileRes] = await Promise.all([
        supabase
          .from("transactions")
          .select("*")
          .eq("user_id", user.id)
          .order("created_at", { ascending: false }),
        supabase
          .from("profiles")
          .select("balance")
          .eq("id", user.id)
          .single(),
      ]);
      setTransactions((txRes.data as Transaction[]) || []);
      setBalance(Number(profileRes.data?.balance) || 0);
      setLoading(false);
    };
    fetchData();
  }, [user]);

  const filtered = useMemo(() => {
    return transactions.filter((t) => {
      if (typeFilter !== "all" && t.type !== typeFilter) return false;
      if (statusFilter !== "all" && t.status !== statusFilter) return false;
      if (search && !(t.description || "").toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [transactions, typeFilter, statusFilter, search]);

  const stats = useMemo(() => {
    const completed = transactions.filter((t) => t.status === "completed");
    const deposits = completed.filter((t) => t.type === "deposit").reduce((s, t) => s + Number(t.amount), 0);
    const charges = completed.filter((t) => t.type === "charge").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    const refunds = completed.filter((t) => t.type === "refund").reduce((s, t) => s + Number(t.amount), 0);
    const withdrawals = completed.filter((t) => t.type === "withdrawal").reduce((s, t) => s + Math.abs(Number(t.amount)), 0);
    return { deposits, charges, refunds, withdrawals };
  }, [transactions]);

  const statCards = [
    { title: "Баланс", value: `${balance.toFixed(2)} ₽`, icon: Wallet, gradient: "card-gradient-blue" },
    { title: "Пополнения", value: `${stats.deposits.toFixed(2)} ₽`, icon: ArrowDownCircle, gradient: "card-gradient-violet" },
    { title: "Списания", value: `${stats.charges.toFixed(2)} ₽`, icon: ShoppingCart, gradient: "card-gradient-pink" },
    { title: "Возвраты", value: `${stats.refunds.toFixed(2)} ₽`, icon: RotateCcw, gradient: "card-gradient-amber" },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Транзакции</h1>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden border-border/60">
            <div className={`absolute inset-0 ${card.gradient} opacity-10`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-xs font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по описанию..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Тип" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все типы</SelectItem>
                <SelectItem value="deposit">Пополнение</SelectItem>
                <SelectItem value="charge">Списание</SelectItem>
                <SelectItem value="refund">Возврат</SelectItem>
                <SelectItem value="withdrawal">Вывод</SelectItem>
              </SelectContent>
            </Select>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидание</SelectItem>
                <SelectItem value="processing">Обработка</SelectItem>
                <SelectItem value="completed">Выполнена</SelectItem>
                <SelectItem value="cancelled">Отменена</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {transactions.length === 0 ? "У вас пока нет транзакций" : "Ничего не найдено"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Тип</TableHead>
                    <TableHead>Описание</TableHead>
                    <TableHead>Сумма</TableHead>
                    <TableHead>Баланс после</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((tx) => {
                    const t = typeMap[tx.type] || { label: tx.type, icon: Wallet, color: "text-muted-foreground" };
                    const s = statusMap[tx.status] || { label: tx.status, variant: "outline" as const };
                    const isPositive = tx.type === "deposit" || tx.type === "refund";
                    return (
                      <TableRow key={tx.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <t.icon className={`h-4 w-4 ${t.color}`} />
                            <span className="text-sm font-medium">{t.label}</span>
                          </div>
                        </TableCell>
                        <TableCell className="max-w-[200px] truncate text-muted-foreground">
                          {tx.description || "—"}
                        </TableCell>
                        <TableCell>
                          <span className={isPositive ? "text-green-500 font-medium" : "text-red-500 font-medium"}>
                            {isPositive ? "+" : "−"}{Math.abs(Number(tx.amount)).toFixed(2)} ₽
                          </span>
                        </TableCell>
                        <TableCell className="font-medium">{Number(tx.balance_after).toFixed(2)} ₽</TableCell>
                        <TableCell>
                          <Badge variant={s.variant}>{s.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(tx.created_at).toLocaleDateString("ru-RU")}{" "}
                          {new Date(tx.created_at).toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" })}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardTransactions;
