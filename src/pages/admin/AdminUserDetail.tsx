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
import { ArrowLeft, User, ExternalLink, Search } from "lucide-react";

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
    setLoading(false);
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
      <div className="flex items-center gap-3 shrink-0">
        <Button variant="ghost" size="sm" className="h-7 w-7 p-0" onClick={() => navigate("/admin/users")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <User className="h-4 w-4 text-primary" />
        <h1 className="text-base font-bold">{profile.display_name || "Без имени"}</h1>
        <span className="text-[10px] text-muted-foreground font-mono">{profile.id}</span>
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
                  <TableHead className="px-1">ID пров.</TableHead>
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
                    <TableCell className="px-1 font-mono text-[10px]">{o.provider_order_id || "—"}</TableCell>
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
                    <TableCell className={`px-1 font-medium ${t.type === "deposit" ? "text-green-600" : "text-red-500"}`}>
                      {t.type === "deposit" ? "+" : "−"}{Number(t.amount).toFixed(2)}₽
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
  );
};

export default AdminUserDetail;
