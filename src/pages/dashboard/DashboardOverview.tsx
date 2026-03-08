import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useLicense } from "@/components/LicenseGate";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ShoppingCart, FolderKanban, TrendingUp, Clock, Shield } from "lucide-react";

const DashboardOverview = () => {
  const { user } = useAuth();
  const { plan, limits, isLicensed } = useLicense();
  const [stats, setStats] = useState({ orders: 0, projects: 0, totalSpent: 0, pending: 0, monthlyOrders: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const monthStart = new Date();
      monthStart.setDate(1);
      monthStart.setHours(0, 0, 0, 0);

      const [ordersRes, projectsRes, monthlyRes] = await Promise.all([
        supabase.from("orders").select("price, status").eq("user_id", user.id),
        supabase.from("projects").select("id").eq("user_id", user.id),
        supabase.from("orders").select("id", { count: "exact", head: true }).gte("created_at", monthStart.toISOString()),
      ]);

      const orders = ordersRes.data || [];
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.price), 0);
      const pending = orders.filter((o) => o.status === "pending" || o.status === "in_progress").length;

      setStats({
        orders: orders.length,
        projects: projectsRes.data?.length || 0,
        totalSpent,
        pending,
        monthlyOrders: monthlyRes.count || 0,
      });
    };
    fetchStats();
  }, [user]);

  const cards = [
    { title: "Всего заказов", value: stats.orders, icon: ShoppingCart, gradient: "card-gradient-pink" },
    { title: "Проектов", value: stats.projects, icon: FolderKanban, gradient: "card-gradient-violet" },
    { title: "Потрачено", value: `${stats.totalSpent.toFixed(2)} ₽`, icon: TrendingUp, gradient: "card-gradient-blue" },
    { title: "В процессе", value: stats.pending, icon: Clock, gradient: "card-gradient-amber" },
  ];

  const orderUsagePercent = limits.maxOrdersPerMonth > 0
    ? Math.min(100, Math.round((stats.monthlyOrders / limits.maxOrdersPerMonth) * 100))
    : 0;

  const projectUsagePercent = limits.maxProjectsCount > 0
    ? Math.min(100, Math.round((stats.projects / limits.maxProjectsCount) * 100))
    : 0;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">Обзор</h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {cards.map((card) => (
          <Card key={card.title} className="relative overflow-hidden border-border/60">
            <div className={`absolute inset-0 ${card.gradient} opacity-10`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{card.title}</CardTitle>
              <card.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{card.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      {isLicensed && (
        <Card className="border-border/60">
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Shield className="h-4 w-4" />
              Лицензия
            </CardTitle>
            <Badge variant={plan === "enterprise" ? "default" : plan === "pro" ? "secondary" : "outline"}>
              {limits.label}
            </Badge>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Заказов в этом месяце</span>
                  <span className="font-medium">
                    {stats.monthlyOrders}
                    {limits.maxOrdersPerMonth > 0 ? ` / ${limits.maxOrdersPerMonth}` : " / ∞"}
                  </span>
                </div>
                {limits.maxOrdersPerMonth > 0 && (
                  <Progress value={orderUsagePercent} className="h-2" />
                )}
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Проектов</span>
                  <span className="font-medium">
                    {stats.projects}
                    {limits.maxProjectsCount > 0 ? ` / ${limits.maxProjectsCount}` : " / ∞"}
                  </span>
                </div>
                {limits.maxProjectsCount > 0 && (
                  <Progress value={projectUsagePercent} className="h-2" />
                )}
              </div>
            </div>
            <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
              <span>Макс. сумма заказа: {limits.maxOrderAmount > 0 ? `${limits.maxOrderAmount} ₽` : "∞"}</span>
              <span>Приоритет поддержки: {limits.supportPriority === "urgent" ? "срочный" : limits.supportPriority === "high" ? "высокий" : "обычный"}</span>
              {limits.canUseBulkOrders && <span>✓ Массовые заказы</span>}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default DashboardOverview;
