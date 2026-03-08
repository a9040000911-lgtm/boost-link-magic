import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ShoppingCart, FolderKanban, TrendingUp, Clock } from "lucide-react";

const DashboardOverview = () => {
  const { user } = useAuth();
  const [stats, setStats] = useState({ orders: 0, projects: 0, totalSpent: 0, pending: 0 });

  useEffect(() => {
    if (!user) return;
    const fetchStats = async () => {
      const [ordersRes, projectsRes] = await Promise.all([
        supabase.from("orders").select("price, status").eq("user_id", user.id),
        supabase.from("projects").select("id").eq("user_id", user.id),
      ]);

      const orders = ordersRes.data || [];
      const totalSpent = orders.reduce((sum, o) => sum + Number(o.price), 0);
      const pending = orders.filter((o) => o.status === "pending" || o.status === "in_progress").length;

      setStats({
        orders: orders.length,
        projects: projectsRes.data?.length || 0,
        totalSpent,
        pending,
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
    </div>
  );
};

export default DashboardOverview;
