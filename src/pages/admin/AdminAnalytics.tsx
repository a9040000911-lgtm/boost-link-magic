import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, BarChart3, RefreshCw, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from "recharts";

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
}

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0,
    monthlyRevenue: 0,
    prevMonthRevenue: 0,
    totalOrders: 0,
    monthlyOrders: 0,
    totalUsers: 0,
    activeUsers30d: 0,
    avgOrderValue: 0,
    completionRate: 0,
    activeServices: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);

    const [ordersRes, profilesRes, servicesRes] = await Promise.all([
      supabase.from("orders").select("*"),
      supabase.from("profiles").select("id, created_at"),
      supabase.from("services").select("id, is_enabled"),
    ]);

    const orders = ordersRes.data || [];
    const profiles = profilesRes.data || [];
    const services = servicesRes.data || [];

    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const prevMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();
    const thirtyDaysAgo = new Date(Date.now() - 30 * 86400000).toISOString();

    const completedOrders = orders.filter((o) => o.status === "completed");
    const thisMonthOrders = orders.filter((o) => o.created_at >= thisMonthStart);
    const prevMonthOrders = orders.filter((o) => o.created_at >= prevMonthStart && o.created_at < thisMonthStart);
    const activeUserIds = new Set(orders.filter((o) => o.created_at >= thirtyDaysAgo).map((o) => o.user_id));

    const totalRevenue = completedOrders.reduce((s, o) => s + Number(o.price), 0);
    const monthlyRevenue = thisMonthOrders.filter((o) => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0);
    const prevMonthRevenue = prevMonthOrders.filter((o) => o.status !== "canceled").reduce((s, o) => s + Number(o.price), 0);

    setMetrics({
      totalRevenue,
      monthlyRevenue,
      prevMonthRevenue,
      totalOrders: orders.length,
      monthlyOrders: thisMonthOrders.length,
      totalUsers: profiles.length,
      activeUsers30d: activeUserIds.size,
      avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      completionRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
      activeServices: services.filter((s) => s.is_enabled).length,
    });

    // Build monthly chart data (last 12 months)
    const monthly: Record<string, { revenue: number; orders: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
      monthly[key] = { revenue: 0, orders: 0 };
    }

    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
      if (monthly[key]) {
        monthly[key].orders++;
        if (o.status !== "canceled" && o.status !== "refunded") {
          monthly[key].revenue += Number(o.price);
        }
      }
    });

    setMonthlyData(Object.entries(monthly).map(([month, data]) => ({ month, ...data })));
    setLoading(false);
  };

  const formatMoney = (n: number) => n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₽";

  const revenueGrowth = metrics.prevMonthRevenue > 0
    ? ((metrics.monthlyRevenue - metrics.prevMonthRevenue) / metrics.prevMonthRevenue) * 100
    : metrics.monthlyRevenue > 0 ? 100 : 0;

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-auto">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Аналитика</h1>
          <Badge variant="secondary" className="text-[9px]">Финансовый обзор</Badge>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadAnalytics}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-5 gap-3 shrink-0">
        <Card className="border-border/60">
          <CardContent className="p-3">
            <div className="flex items-center justify-between mb-1">
              <DollarSign className="h-4 w-4 text-green-500" />
              {revenueGrowth !== 0 && (
                <Badge variant={revenueGrowth > 0 ? "default" : "destructive"} className="text-[8px] px-1 py-0 flex items-center gap-0.5">
                  {revenueGrowth > 0 ? <TrendingUp className="h-2.5 w-2.5" /> : <TrendingDown className="h-2.5 w-2.5" />}
                  {Math.abs(revenueGrowth).toFixed(0)}%
                </Badge>
              )}
            </div>
            <p className="text-lg font-bold">{formatMoney(metrics.totalRevenue)}</p>
            <p className="text-[10px] text-muted-foreground">Общая выручка</p>
            <p className="text-[9px] text-green-600 mt-0.5">Этот месяц: {formatMoney(metrics.monthlyRevenue)}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3">
            <ShoppingCart className="h-4 w-4 text-blue-500 mb-1" />
            <p className="text-lg font-bold">{metrics.totalOrders}</p>
            <p className="text-[10px] text-muted-foreground">Всего заказов</p>
            <p className="text-[9px] text-blue-600 mt-0.5">Этот месяц: +{metrics.monthlyOrders}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3">
            <Users className="h-4 w-4 text-purple-500 mb-1" />
            <p className="text-lg font-bold">{metrics.totalUsers}</p>
            <p className="text-[10px] text-muted-foreground">Пользователей</p>
            <p className="text-[9px] text-purple-600 mt-0.5">Активных (30д): {metrics.activeUsers30d}</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3">
            <TrendingUp className="h-4 w-4 text-orange-500 mb-1" />
            <p className="text-lg font-bold">{formatMoney(metrics.avgOrderValue)}</p>
            <p className="text-[10px] text-muted-foreground">Средний чек</p>
            <p className="text-[9px] text-orange-600 mt-0.5">Конверсия: {metrics.completionRate.toFixed(1)}%</p>
          </CardContent>
        </Card>

        <Card className="border-border/60">
          <CardContent className="p-3">
            <Package className="h-4 w-4 text-emerald-500 mb-1" />
            <p className="text-lg font-bold">{metrics.activeServices}</p>
            <p className="text-[10px] text-muted-foreground">Активных услуг</p>
          </CardContent>
        </Card>
      </div>

      {/* Revenue Chart */}
      <Card className="border-border/60 flex-1 min-h-[280px]">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-500" />
            Динамика выручки (12 мес.)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2 h-[220px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs>
                <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" tickFormatter={(v) => `${(v / 1000).toFixed(0)}k`} />
              <Tooltip
                contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => [formatMoney(value), "Выручка"]}
              />
              <Area type="monotone" dataKey="revenue" stroke="hsl(var(--primary))" fillOpacity={1} fill="url(#colorRevenue)" strokeWidth={2} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Orders Chart */}
      <Card className="border-border/60 shrink-0">
        <CardHeader className="p-3 pb-0">
          <CardTitle className="text-sm flex items-center gap-2">
            <ShoppingCart className="h-4 w-4 text-blue-500" />
            Заказы по месяцам
          </CardTitle>
        </CardHeader>
        <CardContent className="p-3 pt-2 h-[180px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={monthlyData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
              <XAxis dataKey="month" tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis tick={{ fontSize: 10 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{ fontSize: 11, background: "hsl(var(--card))", border: "1px solid hsl(var(--border))" }}
                formatter={(value: number) => [value, "Заказов"]}
              />
              <Bar dataKey="orders" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminAnalytics;
