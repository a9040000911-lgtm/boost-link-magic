import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MessageSquare } from "lucide-react";

interface Order {
  id: string;
  service_name: string;
  platform: string | null;
  link: string;
  quantity: number;
  price: number;
  status: string;
  progress: number;
  project_id: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ожидание", variant: "outline" },
  in_progress: { label: "В процессе", variant: "secondary" },
  completed: { label: "Выполнен", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
};

const DashboardOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const fetchOrders = async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false });
      setOrders((data as Order[]) || []);
      setLoading(false);
    };
    fetchOrders();
  }, [user]);

  const platforms = useMemo(() => [...new Set(orders.map((o) => o.platform).filter(Boolean))], [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (platformFilter !== "all" && o.platform !== platformFilter) return false;
      if (search && !o.service_name.toLowerCase().includes(search.toLowerCase()) && !o.link.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, search, statusFilter, platformFilter]);

  const totalSum = useMemo(() => filtered.reduce((s, o) => s + Number(o.price), 0), [filtered]);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Итого:</span>
          <span className="font-bold text-lg gradient-text">{totalSum.toFixed(2)} ₽</span>
        </div>
      </div>

      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Поиск по услуге или ссылке..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <Filter className="h-4 w-4 mr-2" />
                <SelectValue placeholder="Статус" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все статусы</SelectItem>
                <SelectItem value="pending">Ожидание</SelectItem>
                <SelectItem value="in_progress">В процессе</SelectItem>
                <SelectItem value="completed">Выполнен</SelectItem>
                <SelectItem value="cancelled">Отменён</SelectItem>
              </SelectContent>
            </Select>
            <Select value={platformFilter} onValueChange={setPlatformFilter}>
              <SelectTrigger className="w-full sm:w-[160px]">
                <SelectValue placeholder="Платформа" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Все платформы</SelectItem>
                {platforms.map((p) => (
                  <SelectItem key={p} value={p!}>{p}</SelectItem>
                ))}
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
              {orders.length === 0 ? "У вас пока нет заказов" : "Ничего не найдено"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                 <TableHeader>
                   <TableRow>
                     <TableHead>Услуга</TableHead>
                     <TableHead>Ссылка</TableHead>
                     <TableHead>Платформа</TableHead>
                     <TableHead>Кол-во</TableHead>
                     <TableHead>Цена</TableHead>
                     <TableHead>Прогресс</TableHead>
                     <TableHead>Статус</TableHead>
                     <TableHead>Дата</TableHead>
                     <TableHead className="w-10"></TableHead>
                   </TableRow>
                 </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const st = statusMap[order.status] || { label: order.status, variant: "outline" as const };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{order.service_name}</TableCell>
                        <TableCell className="max-w-[180px]">
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-xs text-primary hover:underline truncate block"
                            title={order.link}
                          >
                            {order.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 30)}{order.link.length > 40 ? "…" : ""}
                          </a>
                        </TableCell>
                        <TableCell>{order.platform || "—"}</TableCell>
                        <TableCell>{order.quantity}</TableCell>
                        <TableCell>{Number(order.price).toFixed(2)} ₽</TableCell>
                        <TableCell className="min-w-[120px]">
                          <div className="flex items-center gap-2">
                            <Progress value={order.progress} className="h-2 flex-1" />
                            <span className="text-xs text-muted-foreground">{order.progress}%</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant={st.variant}>{st.label}</Badge>
                        </TableCell>
                        <TableCell className="text-muted-foreground text-sm">
                          {new Date(order.created_at).toLocaleDateString("ru-RU")}
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7"
                            title="Создать тикет по заказу"
                            onClick={() => navigate(`/dashboard/support?new=1&order_id=${order.id}`)}
                          >
                            <MessageSquare className="h-3.5 w-3.5" />
                          </Button>
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

export default DashboardOrders;
