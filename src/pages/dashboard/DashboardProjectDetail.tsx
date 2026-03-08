import { useEffect, useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft, ShoppingCart, TrendingUp, Clock, CheckCircle, Filter } from "lucide-react";

interface Order {
  id: string;
  service_name: string;
  platform: string | null;
  link: string;
  quantity: number;
  price: number;
  status: string;
  progress: number;
  created_at: string;
}

interface Project {
  id: string;
  name: string;
  description: string | null;
  url: string | null;
  created_at: string;
}

const statusMap: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  pending: { label: "Ожидание", variant: "outline" },
  in_progress: { label: "В процессе", variant: "secondary" },
  completed: { label: "Выполнен", variant: "default" },
  cancelled: { label: "Отменён", variant: "destructive" },
};

const DashboardProjectDetail = () => {
  const { projectId } = useParams<{ projectId: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [project, setProject] = useState<Project | null>(null);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [platformFilter, setPlatformFilter] = useState("all");

  useEffect(() => {
    if (!user || !projectId) return;
    const fetch = async () => {
      const [projRes, ordersRes] = await Promise.all([
        supabase.from("projects").select("*").eq("id", projectId).eq("user_id", user.id).single(),
        supabase.from("orders").select("*").eq("project_id", projectId).eq("user_id", user.id).order("created_at", { ascending: false }),
      ]);
      if (projRes.data) setProject(projRes.data as Project);
      setOrders((ordersRes.data as Order[]) || []);
      setLoading(false);
    };
    fetch();
  }, [user, projectId]);

  const platforms = useMemo(() => [...new Set(orders.map((o) => o.platform).filter(Boolean))], [orders]);

  const filtered = useMemo(() => {
    return orders.filter((o) => {
      if (statusFilter !== "all" && o.status !== statusFilter) return false;
      if (platformFilter !== "all" && o.platform !== platformFilter) return false;
      return true;
    });
  }, [orders, statusFilter, platformFilter]);

  const stats = useMemo(() => {
    const totalSpent = orders.reduce((s, o) => s + Number(o.price), 0);
    const completed = orders.filter((o) => o.status === "completed").length;
    const pending = orders.filter((o) => o.status === "pending" || o.status === "in_progress").length;
    return { total: orders.length, totalSpent, completed, pending };
  }, [orders]);

  const filteredSum = useMemo(() => filtered.reduce((s, o) => s + Number(o.price), 0), [filtered]);

  if (loading) {
    return (
      <div className="flex justify-center py-12">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  if (!project) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Проект не найден</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/dashboard/projects")}>
          <ArrowLeft className="h-4 w-4 mr-2" /> Назад к проектам
        </Button>
      </div>
    );
  }

  const statCards = [
    { title: "Всего заказов", value: stats.total, icon: ShoppingCart, gradient: "card-gradient-pink" },
    { title: "Потрачено", value: `${stats.totalSpent.toFixed(2)} ₽`, icon: TrendingUp, gradient: "card-gradient-blue" },
    { title: "Выполнено", value: stats.completed, icon: CheckCircle, gradient: "card-gradient-violet" },
    { title: "В процессе", value: stats.pending, icon: Clock, gradient: "card-gradient-amber" },
  ];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/dashboard/projects")}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div>
          <h1 className="text-2xl font-bold">{project.name}</h1>
          {project.description && <p className="text-sm text-muted-foreground">{project.description}</p>}
        </div>
      </div>

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

      {/* Platform breakdown */}
      {platforms.length > 0 && (
        <Card className="border-border/60">
          <CardHeader className="pb-3">
            <CardTitle className="text-base">Траты по платформам</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {platforms.map((p) => {
                const platformOrders = orders.filter((o) => o.platform === p);
                const sum = platformOrders.reduce((s, o) => s + Number(o.price), 0);
                return (
                  <div key={p} className="rounded-lg border border-border/60 p-3">
                    <p className="text-sm font-medium capitalize">{p}</p>
                    <p className="text-lg font-bold gradient-text">{sum.toFixed(2)} ₽</p>
                    <p className="text-xs text-muted-foreground">{platformOrders.length} заказов</p>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Orders table */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <CardTitle className="text-base">Заказы проекта</CardTitle>
            <div className="flex items-center gap-2 text-sm">
              <span className="text-muted-foreground">Итого:</span>
              <span className="font-bold gradient-text">{filteredSum.toFixed(2)} ₽</span>
            </div>
          </div>
          <div className="flex flex-col sm:flex-row gap-3 mt-2">
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
            {platforms.length > 1 && (
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
            )}
          </div>
        </CardHeader>
        <CardContent>
          {filtered.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {orders.length === 0 ? "В этом проекте пока нет заказов" : "Ничего не найдено"}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Услуга</TableHead>
                    <TableHead>Платформа</TableHead>
                    <TableHead>Кол-во</TableHead>
                    <TableHead>Цена</TableHead>
                    <TableHead>Прогресс</TableHead>
                    <TableHead>Статус</TableHead>
                    <TableHead>Дата</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filtered.map((order) => {
                    const st = statusMap[order.status] || { label: order.status, variant: "outline" as const };
                    return (
                      <TableRow key={order.id}>
                        <TableCell className="font-medium max-w-[200px] truncate">{order.service_name}</TableCell>
                        <TableCell className="capitalize">{order.platform || "—"}</TableCell>
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

export default DashboardProjectDetail;
