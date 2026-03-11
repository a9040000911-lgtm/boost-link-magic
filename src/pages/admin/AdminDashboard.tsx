import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useNavigate } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  BarChart3, ShoppingCart, Users, XCircle, TrendingUp, RefreshCw,
  AlertTriangle, MessageSquare, Package, Server, Clock, Zap,
  TrendingDown, Activity, DollarSign
} from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const statusColors: Record<string, string> = {
  pending: "bg-yellow-500/20 text-yellow-600",
  processing: "bg-blue-500/20 text-blue-600",
  in_progress: "bg-blue-500/20 text-blue-600",
  completed: "bg-green-500/20 text-green-600",
  partial: "bg-orange-500/20 text-orange-600",
  canceled: "bg-red-500/20 text-red-600",
  refunded: "bg-purple-500/20 text-purple-600",
};

interface Metrics {
  totalOrders: number;
  completedOrders: number;
  canceledOrders: number;
  pendingOrders: number;
  totalRevenue: number;
  totalRefunds: number;
  activeUsers: number;
  totalUsers: number;
  todayOrders: number;
  todayRevenue: number;
  yesterdayOrders: number;
  yesterdayRevenue: number;
  openTickets: number;
  totalTickets: number;
  activeServices: number;
  totalServices: number;
  activeProviders: number;
  totalProviders: number;
  weekOrders: number;
  weekRevenue: number;
}

interface DailyStats {
  date: string;
  orders: number;
  revenue: number;
}

interface MetricCardProps {
  icon: React.ReactNode;
  value: string | number;
  label: string;
  sub?: React.ReactNode;
  onClick: () => void;
  trend?: "up" | "down" | "neutral";
}

const MetricCard = ({ icon, value, label, sub, onClick, trend }: MetricCardProps) => (
  <Card
    className="border-border/60 cursor-pointer hover:border-primary/40 hover:shadow-md transition-all group"
    onClick={onClick}
  >
    <CardContent className="p-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          {icon}
          {trend === "up" && <TrendingUp className="h-2.5 w-2.5 text-green-500" />}
          {trend === "down" && <TrendingDown className="h-2.5 w-2.5 text-red-500" />}
        </div>
        {sub}
      </div>
      <p className="text-lg font-bold mt-1 group-hover:text-primary transition-colors">{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </CardContent>
  </Card>
);

const MiniChart = ({ data, color = "hsl(var(--primary))" }: { data: DailyStats[]; color?: string }) => (
  <div className="h-[60px] w-full">
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <defs>
          <linearGradient id="miniGradient" x1="0" y1="0" x2="0" y2="1">
            <stop offset="5%" stopColor={color} stopOpacity={0.3} />
            <stop offset="95%" stopColor={color} stopOpacity={0} />
          </linearGradient>
        </defs>
        <Tooltip
          contentStyle={{ fontSize: 10, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", padding: "4px 8px" }}
          formatter={(value: number, name: string) => [name === "revenue" ? `${value.toFixed(0)}₽` : value, name === "revenue" ? "Выручка" : "Заказы"]}
          labelFormatter={(label) => new Date(label).toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" })}
        />
        <Area
          type="monotone"
          dataKey="revenue"
          stroke={color}
          fillOpacity={1}
          fill="url(#miniGradient)"
          strokeWidth={1.5}
        />
      </AreaChart>
    </ResponsiveContainer>
  </div>
);

const AdminDashboard = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [metrics, setMetrics] = useState<Metrics | null>(null);
  const [topUsers, setTopUsers] = useState<any[]>([]);
  const [topServices, setTopServices] = useState<any[]>([]);
  const [canceledOrders, setCanceledOrders] = useState<any[]>([]);
  const [recentAudit, setRecentAudit] = useState<any[]>([]);
  const [profilesMap, setProfilesMap] = useState<Record<string, string>>({});
  const [dailyStats, setDailyStats] = useState<DailyStats[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    loadDashboard();
  }, [user]);

  const loadDashboard = async () => {
    setLoading(true);

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);
    const weekAgo = new Date(today);
    weekAgo.setDate(weekAgo.getDate() - 7);

    const [ordersRes, profilesRes, txRes, auditRes, ticketsRes, servicesRes, providersRes] = await Promise.all([
      supabase.from("orders").select("*"),
      supabase.from("profiles").select("*"),
      supabase.from("transactions").select("*"),
      supabase.from("admin_audit_logs").select("*").order("created_at", { ascending: false }).limit(20),
      supabase.from("support_tickets").select("id, status"),
      supabase.from("services").select("id, name, is_enabled"),
      supabase.from("providers").select("id, is_enabled"),
    ]);

    const orders = ordersRes.data || [];
    const profiles = profilesRes.data || [];
    const transactions = txRes.data || [];
    const tickets = ticketsRes.data || [];
    const services = servicesRes.data || [];
    const providers = providersRes.data || [];

    const pMap: Record<string, string> = {};
    profiles.forEach((p) => { pMap[p.id] = p.display_name || p.id.slice(0, 8); });
    setProfilesMap(pMap);

    const todayISO = today.toISOString();
    const yesterdayISO = yesterday.toISOString();
    const weekAgoISO = weekAgo.toISOString();

    const todayOrders = orders.filter((o) => o.created_at >= todayISO);
    const yesterdayOrders = orders.filter((o) => o.created_at >= yesterdayISO && o.created_at < todayISO);
    const weekOrders = orders.filter((o) => o.created_at >= weekAgoISO);
    const canceledList = orders.filter((o) => o.status === "canceled" || o.status === "refunded");
    const refundedTx = transactions.filter((t) => t.type === "refund");

    // Calculate daily stats for last 7 days
    const dailyData: DailyStats[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date(today);
      date.setDate(date.getDate() - i);
      const dayStart = date.toISOString();
      date.setDate(date.getDate() + 1);
      const dayEnd = date.toISOString();

      const dayOrders = orders.filter((o) => o.created_at >= dayStart && o.created_at < dayEnd);
      dailyData.push({
        date: dayStart,
        orders: dayOrders.length,
        revenue: dayOrders.filter((o) => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0),
      });
    }
    setDailyStats(dailyData);

    // Top services
    const serviceStats: Record<string, { count: number; revenue: number; name: string }> = {};
    orders.forEach((o) => {
      if (!serviceStats[o.service_name]) {
        serviceStats[o.service_name] = { count: 0, revenue: 0, name: o.service_name };
      }
      serviceStats[o.service_name].count++;
      serviceStats[o.service_name].revenue += Number(o.price);
    });
    setTopServices(
      Object.values(serviceStats)
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, 5)
    );

    setMetrics({
      totalOrders: orders.length,
      completedOrders: orders.filter((o) => o.status === "completed").length,
      canceledOrders: canceledList.length,
      pendingOrders: orders.filter((o) => o.status === "pending" || o.status === "processing").length,
      totalRevenue: orders.filter((o) => o.status !== "canceled" && o.status !== "refunded").reduce((s, o) => s + Number(o.price), 0),
      totalRefunds: refundedTx.reduce((s, t) => s + Number(t.amount), 0),
      activeUsers: [...new Set(orders.filter((o) => o.created_at >= new Date(Date.now() - 30 * 86400000).toISOString()).map((o) => o.user_id))].length,
      totalUsers: profiles.length,
      todayOrders: todayOrders.length,
      todayRevenue: todayOrders.filter((o) => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0),
      yesterdayOrders: yesterdayOrders.length,
      yesterdayRevenue: yesterdayOrders.filter((o) => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0),
      openTickets: tickets.filter((t) => t.status === "open" || t.status === "waiting").length,
      totalTickets: tickets.length,
      activeServices: services.filter((s) => s.is_enabled).length,
      totalServices: services.length,
      activeProviders: providers.filter((p) => p.is_enabled).length,
      totalProviders: providers.length,
      weekOrders: weekOrders.length,
      weekRevenue: weekOrders.filter((o) => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0),
    });

    // Top users
    const userOrderCount: Record<string, { count: number; spent: number }> = {};
    orders.forEach((o) => {
      if (!userOrderCount[o.user_id]) userOrderCount[o.user_id] = { count: 0, spent: 0 };
      userOrderCount[o.user_id].count++;
      userOrderCount[o.user_id].spent += Number(o.price);
    });
    setTopUsers(
      Object.entries(userOrderCount)
        .sort(([, a], [, b]) => b.count - a.count)
        .slice(0, 10)
        .map(([userId, data]) => ({ userId, ...data }))
    );

    setCanceledOrders(canceledList.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()).slice(0, 20));
    setRecentAudit((auditRes.data || []) as any[]);
    setLoading(false);
  };

  const formatDate = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString("ru-RU", { day: "2-digit", month: "2-digit" }) + " " + date.toLocaleTimeString("ru-RU", { hour: "2-digit", minute: "2-digit" });
  };

  const formatMoney = (n: number) => n.toLocaleString("ru-RU", { minimumFractionDigits: 2, maximumFractionDigits: 2 }) + "₽";

  // Calculate trend
  const getTrend = (today: number, yesterday: number): "up" | "down" | "neutral" => {
    if (yesterday === 0) return today > 0 ? "up" : "neutral";
    const change = ((today - yesterday) / yesterday) * 100;
    if (change > 5) return "up";
    if (change < -5) return "down";
    return "neutral";
  };

  // Alerts
  const alerts = useMemo(() => {
    if (!metrics) return [];
    const items: { type: "warning" | "error" | "info"; message: string; action?: () => void }[] = [];

    if (metrics.pendingOrders > 10) {
      items.push({ type: "warning", message: `${metrics.pendingOrders} заказов ожидают обработки`, action: () => navigate("/admin/orders") });
    }
    if (metrics.openTickets > 5) {
      items.push({ type: "error", message: `${metrics.openTickets} открытых тикетов требуют внимания`, action: () => navigate("/admin/support") });
    }
    if (metrics.activeProviders === 0) {
      items.push({ type: "error", message: "Нет активных провайдеров!", action: () => navigate("/admin/providers") });
    }
    if (metrics.todayOrders === 0 && new Date().getHours() > 10) {
      items.push({ type: "info", message: "Сегодня ещё нет заказов" });
    }
    return items;
  }, [metrics, navigate]);

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-3 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Дашборд</h1>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadDashboard}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      {/* Alerts */}
      {alerts.length > 0 && (
        <div className="flex flex-wrap gap-2 shrink-0">
          {alerts.map((alert, i) => (
            <button
              key={i}
              onClick={alert.action}
              className={`inline-flex items-center gap-1.5 px-2 py-1 rounded-md text-xs font-medium cursor-pointer hover:opacity-80 transition-opacity ${
                alert.type === "error" ? "bg-red-500/20 text-red-600" :
                alert.type === "warning" ? "bg-yellow-500/20 text-yellow-600" :
                "bg-blue-500/20 text-blue-600"
              }`}
            >
              {alert.type === "error" ? <XCircle className="h-3 w-3" /> :
               alert.type === "warning" ? <AlertTriangle className="h-3 w-3" /> :
               <Activity className="h-3 w-3" />}
              {alert.message}
            </button>
          ))}
        </div>
      )}

      {/* Metric cards - 2 rows */}
      {metrics && (
        <div className="flex flex-col gap-2 shrink-0">
          <div className="grid grid-cols-4 gap-2">
            <MetricCard
              icon={<ShoppingCart className="h-3.5 w-3.5 text-primary" />}
              value={metrics.totalOrders}
              label="Всего заказов"
              sub={<span className="text-[9px] text-muted-foreground">сегодня +{metrics.todayOrders}</span>}
              onClick={() => navigate("/admin/orders")}
              trend={getTrend(metrics.todayOrders, metrics.yesterdayOrders)}
            />
            <MetricCard
              icon={<TrendingUp className="h-3.5 w-3.5 text-green-500" />}
              value={formatMoney(metrics.totalRevenue)}
              label="Выручка"
              sub={<span className="text-[9px] text-green-500">+{formatMoney(metrics.todayRevenue)}</span>}
              onClick={() => navigate("/admin/analytics")}
              trend={getTrend(metrics.todayRevenue, metrics.yesterdayRevenue)}
            />
            <MetricCard
              icon={<Users className="h-3.5 w-3.5 text-blue-500" />}
              value={metrics.totalUsers}
              label="Пользователей"
              sub={<span className="text-[9px] text-blue-500">{metrics.activeUsers} акт. (30д)</span>}
              onClick={() => navigate("/admin/users")}
            />
            <MetricCard
              icon={<AlertTriangle className="h-3.5 w-3.5 text-yellow-500" />}
              value={metrics.pendingOrders}
              label="В ожидании"
              onClick={() => navigate("/admin/orders")}
            />
          </div>
          <div className="grid grid-cols-4 gap-2">
            <MetricCard
              icon={<XCircle className="h-3.5 w-3.5 text-red-500" />}
              value={metrics.canceledOrders}
              label="Отмены/возвраты"
              sub={metrics.totalRefunds > 0 ? <span className="text-[9px] text-red-500">−{formatMoney(metrics.totalRefunds)}</span> : undefined}
              onClick={() => navigate("/admin/orders")}
            />
            <MetricCard
              icon={<MessageSquare className="h-3.5 w-3.5 text-orange-500" />}
              value={metrics.openTickets}
              label="Открытые тикеты"
              sub={<span className="text-[9px] text-muted-foreground">всего {metrics.totalTickets}</span>}
              onClick={() => navigate("/admin/support")}
            />
            <MetricCard
              icon={<Package className="h-3.5 w-3.5 text-purple-500" />}
              value={`${metrics.activeServices}/${metrics.totalServices}`}
              label="Активные услуги"
              onClick={() => navigate("/admin/services")}
            />
            <MetricCard
              icon={<Server className="h-3.5 w-3.5 text-emerald-500" />}
              value={`${metrics.activeProviders}/${metrics.totalProviders}`}
              label="Провайдеры"
              onClick={() => navigate("/admin/providers")}
            />
          </div>
        </div>
      )}

      {/* Chart row */}
      <div className="grid grid-cols-3 gap-3 shrink-0">
        <Card className="border-border/60 col-span-2">
          <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold flex items-center gap-1">
              <Activity className="h-3 w-3 text-primary" />
              Выручка за 7 дней
            </h2>
            <div className="flex items-center gap-2 text-[10px] text-muted-foreground">
              <span>{metrics?.weekOrders || 0} заказов</span>
              <span className="font-semibold text-foreground">{formatMoney(metrics?.weekRevenue || 0)}</span>
            </div>
          </div>
          <CardContent className="p-2">
            <MiniChart data={dailyStats} />
          </CardContent>
        </Card>

        {/* Top services */}
        <Card className="border-border/60">
          <div className="p-2 border-b bg-muted/30 flex items-center justify-between">
            <h2 className="text-xs font-bold flex items-center gap-1">
              <Zap className="h-3 w-3 text-yellow-500" />
              Топ услуги
            </h2>
          </div>
          <CardContent className="p-2">
            <div className="space-y-1.5">
              {topServices.slice(0, 5).map((s, i) => (
                <div key={i} className="flex items-center justify-between text-[10px]">
                  <span className="truncate max-w-[120px] text-muted-foreground">
                    {i + 1}. {s.name}
                  </span>
                  <span className="font-medium">{formatMoney(s.revenue)}</span>
                </div>
              ))}
              {topServices.length === 0 && (
                <p className="text-[10px] text-muted-foreground text-center py-2">Нет данных</p>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Two columns: top users + canceled orders */}
      <div className="grid grid-cols-2 gap-3 flex-1 min-h-0">
        <div className="flex flex-col border rounded-md overflow-hidden">
          <div className="p-2 border-b bg-muted/30 shrink-0 flex items-center justify-between">
            <h2 className="text-xs font-bold flex items-center gap-1"><Users className="h-3 w-3" />Топ пользователей</h2>
            <Button variant="ghost" size="sm" className="h-5 text-[9px]" onClick={() => navigate("/admin/users")}>
              Все →
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead className="px-1">#</TableHead>
                  <TableHead className="px-1">Пользователь</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Заказов</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Потрачено</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {topUsers.map((u, i) => (
                  <TableRow key={u.userId} className="text-[11px] cursor-pointer hover:bg-muted/50" onClick={() => navigate(`/admin/users/${u.userId}`)}>
                    <TableCell className="px-1 font-medium">{i + 1}</TableCell>
                    <TableCell className="px-1 text-primary">{profilesMap[u.userId] || u.userId.slice(0, 8)}</TableCell>
                    <TableCell className="px-1 font-medium">{u.count}</TableCell>
                    <TableCell className="px-1 whitespace-nowrap">{formatMoney(u.spent)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>

        <div className="flex flex-col border rounded-md overflow-hidden">
          <div className="p-2 border-b bg-muted/30 shrink-0 flex items-center justify-between">
            <h2 className="text-xs font-bold flex items-center gap-1"><XCircle className="h-3 w-3 text-red-500" />Отмены и возвраты</h2>
            <Button variant="ghost" size="sm" className="h-5 text-[9px]" onClick={() => navigate("/admin/orders")}>
              Все →
            </Button>
          </div>
          <div className="flex-1 overflow-auto">
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead className="px-1">Дата</TableHead>
                  <TableHead className="px-1">Клиент</TableHead>
                  <TableHead className="px-1">Услуга</TableHead>
                  <TableHead className="px-1 whitespace-nowrap">Сумма</TableHead>
                  <TableHead className="px-1">Статус</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {canceledOrders.map((o) => (
                  <TableRow key={o.id} className="text-[11px] cursor-pointer hover:bg-muted/50" onClick={() => navigate("/admin/orders")}>
                    <TableCell className="px-1 whitespace-nowrap">{formatDate(o.created_at)}</TableCell>
                    <TableCell className="px-1">
                      <button className="text-primary hover:underline" onClick={(e) => { e.stopPropagation(); navigate(`/admin/users/${o.user_id}`); }}>
                        {profilesMap[o.user_id] || o.user_id.slice(0, 6)}
                      </button>
                    </TableCell>
                    <TableCell className="px-1 max-w-[120px] truncate">{o.service_name}</TableCell>
                    <TableCell className="px-1 whitespace-nowrap">{formatMoney(Number(o.price))}</TableCell>
                    <TableCell className="px-1">
                      <span className={`px-1 py-0.5 rounded text-[9px] ${statusColors[o.status] || "bg-muted"}`}>{o.status}</span>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </div>
      </div>

      {/* Audit log */}
      <div className="border rounded-md overflow-hidden shrink-0 max-h-[200px] flex flex-col">
        <div className="p-2 border-b bg-muted/30 shrink-0">
          <h2 className="text-xs font-bold flex items-center gap-1"><Clock className="h-3 w-3" />Последние действия сотрудников</h2>
        </div>
        <div className="flex-1 overflow-auto">
          {recentAudit.length === 0 ? (
            <p className="text-xs text-muted-foreground p-3 text-center">Нет записей</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow className="text-[10px]">
                  <TableHead className="px-1">Время</TableHead>
                  <TableHead className="px-1">Сотрудник</TableHead>
                  <TableHead className="px-1">Действие</TableHead>
                  <TableHead className="px-1">Объект</TableHead>
                  <TableHead className="px-1">Детали</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {recentAudit.map((log) => (
                  <TableRow key={log.id} className="text-[11px]">
                    <TableCell className="px-1 whitespace-nowrap">{formatDate(log.created_at)}</TableCell>
                    <TableCell className="px-1">
                      <button className="text-primary hover:underline" onClick={() => navigate(`/admin/users/${log.actor_id}`)}>
                        {profilesMap[log.actor_id] || log.actor_id?.slice(0, 8)}
                      </button>
                    </TableCell>
                    <TableCell className="px-1"><Badge variant="outline" className="text-[9px]">{log.action}</Badge></TableCell>
                    <TableCell className="px-1 text-muted-foreground">{log.target_type} {log.target_id?.slice(0, 8)}</TableCell>
                    <TableCell className="px-1 text-muted-foreground max-w-[200px] truncate">{JSON.stringify(log.details)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
