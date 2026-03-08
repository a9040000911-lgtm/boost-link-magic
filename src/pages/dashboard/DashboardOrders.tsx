import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, MessageSquare, ExternalLink, ChevronDown, ChevronUp } from "lucide-react";

interface Order {
  id: string;
  order_number: number | null;
  service_name: string;
  platform: string | null;
  link: string;
  quantity: number;
  price: number;
  status: string;
  progress: number;
  project_id: string | null;
  created_at: string;
  updated_at: string;
}

const statusLabels: Record<string, string> = {
  pending: "Ожидание",
  processing: "В обработке",
  in_progress: "В процессе",
  completed: "Выполнен",
  partial: "Частично",
  canceled: "Отменён",
  cancelled: "Отменён",
  refunded: "Возврат",
};

const statusVariant: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
  pending: "outline",
  processing: "secondary",
  in_progress: "secondary",
  completed: "default",
  partial: "outline",
  canceled: "destructive",
  cancelled: "destructive",
  refunded: "destructive",
};

const formatDate = (d: string) => {
  const date = new Date(d);
  return date.toLocaleDateString("ru-RU") + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
};

const DashboardOrders = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");
  const [expandedId, setExpandedId] = useState<string | null>(null);

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
      if (search && !o.service_name.toLowerCase().includes(search.toLowerCase()) && !o.link.toLowerCase().includes(search.toLowerCase()) && !o.id.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [orders, search, statusFilter, platformFilter]);

  const totalSum = useMemo(() => filtered.reduce((s, o) => s + Number(o.price), 0), [filtered]);

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <h1 className="text-2xl font-bold">Заказы</h1>
        <div className="flex items-center gap-2 text-sm">
          <span className="text-muted-foreground">Найдено: <strong className="text-foreground">{filtered.length}</strong></span>
          <span className="text-muted-foreground">Сумма: <strong className="text-foreground gradient-text">{totalSum.toFixed(2)} ₽</strong></span>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="ID, услуга или ссылка..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 h-9 text-sm"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
            <Filter className="h-3.5 w-3.5 mr-1.5" />
            <SelectValue placeholder="Статус" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Все статусы</SelectItem>
            <SelectItem value="pending">Ожидание</SelectItem>
            <SelectItem value="processing">В обработке</SelectItem>
            <SelectItem value="in_progress">В процессе</SelectItem>
            <SelectItem value="completed">Выполнен</SelectItem>
            <SelectItem value="partial">Частично</SelectItem>
            <SelectItem value="canceled">Отменён</SelectItem>
            <SelectItem value="refunded">Возврат</SelectItem>
          </SelectContent>
        </Select>
        <Select value={platformFilter} onValueChange={setPlatformFilter}>
          <SelectTrigger className="w-full sm:w-[150px] h-9 text-sm">
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

      {/* Table */}
      <div className="border rounded-lg overflow-auto">
        {loading ? (
          <div className="flex justify-center py-16">
            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-12 text-muted-foreground text-sm">
            {orders.length === 0 ? "У вас пока нет заказов" : "Ничего не найдено"}
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="text-xs uppercase tracking-wider">
                <TableHead className="px-3 w-[70px]">ID</TableHead>
                <TableHead className="px-3">Информация</TableHead>
                <TableHead className="px-3 w-[90px] text-right">Цена</TableHead>
                <TableHead className="px-3 w-[100px] text-center">Статус</TableHead>
                <TableHead className="px-3 w-[50px]"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map((order) => {
                const label = statusLabels[order.status] || order.status;
                const variant = statusVariant[order.status] || "outline";
                const isExpanded = expandedId === order.id;
                const progressPct = order.quantity > 0 ? Math.min(100, Math.round((order.progress / order.quantity) * 100)) : 0;

                return (
                  <TableRow
                    key={order.id}
                    className="align-top border-b cursor-pointer hover:bg-muted/30 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order.id)}
                  >
                    <TableCell className="px-3 py-3 font-mono text-xs text-muted-foreground">
                      #{order.order_number || "—"}
                    </TableCell>
                    <TableCell className="px-3 py-3">
                      <div className="space-y-0.5 text-sm">
                        <div>
                          <span className="font-semibold">{order.service_name}</span>
                          {order.platform && (
                            <Badge variant="outline" className="ml-2 text-[10px] py-0">{order.platform}</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-1 text-xs text-muted-foreground">
                          <ExternalLink className="w-3 h-3 shrink-0" />
                          <a
                            href={order.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:underline truncate max-w-[300px]"
                            onClick={(e) => e.stopPropagation()}
                          >
                            {order.link.replace(/^https?:\/\/(www\.)?/, "").slice(0, 40)}{order.link.length > 50 ? "…" : ""}
                          </a>
                        </div>
                        <div className="text-xs text-muted-foreground">
                          <span className="font-medium text-foreground">Кол-во:</span> {order.quantity}
                          {order.progress > 0 && order.progress < order.quantity && (
                            <span className="ml-1">(выполнено: {order.progress})</span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Progress value={progressPct} className="h-1.5 flex-1 max-w-[150px]" />
                          <span className="text-[10px] text-muted-foreground">{progressPct}%</span>
                        </div>

                        {isExpanded && (
                          <div className="mt-2 pt-2 border-t border-dashed space-y-0.5 text-xs text-muted-foreground">
                            <div><span className="font-medium text-foreground">Создан:</span> {formatDate(order.created_at)}</div>
                            <div><span className="font-medium text-foreground">Обновлён:</span> {formatDate(order.updated_at)}</div>
                            <div className="pt-1">
                              <Button
                                variant="outline"
                                size="sm"
                                className="h-7 text-xs gap-1.5"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  navigate(`/dashboard/support?new=1&order_id=${order.id}`);
                                }}
                              >
                                <MessageSquare className="h-3 w-3" />
                                Создать тикет
                              </Button>
                            </div>
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-right font-semibold text-sm whitespace-nowrap">
                      {Number(order.price).toFixed(2)} ₽
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      <Badge variant={variant}>{label}</Badge>
                    </TableCell>
                    <TableCell className="px-3 py-3 text-center">
                      {isExpanded ? (
                        <ChevronUp className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <ChevronDown className="h-4 w-4 text-muted-foreground" />
                      )}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
};

export default DashboardOrders;
