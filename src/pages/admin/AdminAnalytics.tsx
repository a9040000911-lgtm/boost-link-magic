import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Badge } from "@/components/ui/badge";
import { BarChart3, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import AnalyticsMetricCards from "@/components/admin/analytics/AnalyticsMetricCards";
import AnalyticsCharts from "@/components/admin/analytics/AnalyticsCharts";
import AnalyticsFunnel from "@/components/admin/analytics/AnalyticsFunnel";
import AnalyticsPnL from "@/components/admin/analytics/AnalyticsPnL";
import ExpensesManager from "@/components/admin/analytics/ExpensesManager";

interface MonthlyData {
  month: string;
  revenue: number;
  orders: number;
  profit: number;
  expenses: number;
}

interface MonthlyPnL {
  month: string;
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
}

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  recurring_period: string | null;
}

const AdminAnalytics = () => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [metrics, setMetrics] = useState({
    totalRevenue: 0, monthlyRevenue: 0, prevMonthRevenue: 0,
    totalOrders: 0, monthlyOrders: 0, totalUsers: 0,
    activeUsers30d: 0, avgOrderValue: 0, completionRate: 0,
    activeServices: 0, grossProfit: 0, margin: 0,
    ltv: 0, retentionRate: 0,
  });
  const [monthlyData, setMonthlyData] = useState<MonthlyData[]>([]);
  const [pnlData, setPnlData] = useState<MonthlyPnL[]>([]);
  const [funnel, setFunnel] = useState({ totalUsers: 0, usersWithDeposit: 0, usersWithOrder: 0, usersWithRepeatOrder: 0 });
  const [expenses, setExpenses] = useState<Expense[]>([]);

  useEffect(() => {
    if (user) loadAnalytics();
  }, [user]);

  const loadAnalytics = async () => {
    setLoading(true);

    const [ordersRes, profilesRes, servicesRes, transactionsRes, expensesRes] = await Promise.all([
      supabase.from("orders").select("*"),
      supabase.from("profiles").select("id, created_at"),
      supabase.from("services").select("id, is_enabled"),
      supabase.from("transactions").select("user_id, type, amount, status"),
      supabase.from("business_expenses").select("*").order("expense_date", { ascending: false }),
    ]);

    const orders = ordersRes.data || [];
    const profiles = profilesRes.data || [];
    const services = servicesRes.data || [];
    const transactions = transactionsRes.data || [];
    const expensesData = (expensesRes.data || []) as Expense[];
    setExpenses(expensesData);

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

    // Gross profit — use real cost_price when available, fall back to 70% estimate
    const totalCost = completedOrders.reduce((s, o) => {
      const cost = o.cost_price != null ? Number(o.cost_price) : Number(o.price) * 0.7;
      return s + cost;
    }, 0);
    const totalExpenses = expensesData.reduce((s, e) => s + Number(e.amount), 0);
    const grossProfit = totalRevenue - totalCost;
    const netProfit = grossProfit - totalExpenses;
    const margin = totalRevenue > 0 ? (grossProfit / totalRevenue) * 100 : 0;

    // LTV
    const usersWithOrders = new Set(completedOrders.map((o) => o.user_id));
    const ltv = usersWithOrders.size > 0 ? totalRevenue / usersWithOrders.size : 0;

    // Retention: users with >1 order / users with any order
    const orderCountByUser: Record<string, number> = {};
    completedOrders.forEach((o) => {
      orderCountByUser[o.user_id] = (orderCountByUser[o.user_id] || 0) + 1;
    });
    const repeatUsers = Object.values(orderCountByUser).filter((c) => c > 1).length;
    const retentionRate = usersWithOrders.size > 0 ? (repeatUsers / usersWithOrders.size) * 100 : 0;

    // Funnel
    const depositUserIds = new Set(
      transactions.filter((t) => t.type === "deposit" && t.status === "completed").map((t) => t.user_id)
    );

    setFunnel({
      totalUsers: profiles.length,
      usersWithDeposit: depositUserIds.size,
      usersWithOrder: usersWithOrders.size,
      usersWithRepeatOrder: repeatUsers,
    });

    setMetrics({
      totalRevenue, monthlyRevenue, prevMonthRevenue,
      totalOrders: orders.length, monthlyOrders: thisMonthOrders.length,
      totalUsers: profiles.length, activeUsers30d: activeUserIds.size,
      avgOrderValue: completedOrders.length > 0 ? totalRevenue / completedOrders.length : 0,
      completionRate: orders.length > 0 ? (completedOrders.length / orders.length) * 100 : 0,
      activeServices: services.filter((s) => s.is_enabled).length,
      grossProfit, margin, ltv, retentionRate,
    });

    // Build monthly chart data (last 12 months)
    const monthly: Record<string, { revenue: number; orders: number; cost: number; expenses: number }> = {};
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
      monthly[key] = { revenue: 0, orders: 0, cost: 0, expenses: 0 };
    }

    orders.forEach((o) => {
      const d = new Date(o.created_at);
      const key = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
      if (monthly[key]) {
        monthly[key].orders++;
        if (o.status !== "canceled" && o.status !== "refunded") {
          monthly[key].revenue += Number(o.price);
          const cost = o.cost_price != null ? Number(o.cost_price) : Number(o.price) * 0.7;
          monthly[key].cost += cost;
        }
      }
    });

    expensesData.forEach((e) => {
      const d = new Date(e.expense_date);
      const key = d.toLocaleDateString("ru-RU", { month: "short", year: "2-digit" });
      if (monthly[key]) {
        monthly[key].expenses += Number(e.amount);
      }
    });

    const chartData = Object.entries(monthly).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      orders: data.orders,
      profit: data.revenue - data.cost - data.expenses,
      expenses: data.expenses,
    }));

    setMonthlyData(chartData);

    setPnlData(Object.entries(monthly).map(([month, data]) => ({
      month,
      revenue: data.revenue,
      cost: data.cost,
      expenses: data.expenses,
      profit: data.revenue - data.cost - data.expenses,
    })));

    setLoading(false);
  };

  const formatMoney = (n: number) => n.toLocaleString("ru-RU", { minimumFractionDigits: 0, maximumFractionDigits: 0 }) + " ₽";

  const exportCSV = () => {
    const BOM = "\uFEFF";
    const header = "Месяц;Выручка;Себестоимость;Расходы;Прибыль;Маржа %\n";
    const rows = pnlData.map((m) => {
      const marginPct = m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : "0";
      return `${m.month};${m.revenue.toFixed(2)};${m.cost.toFixed(2)};${m.expenses.toFixed(2)};${m.profit.toFixed(2)};${marginPct}`;
    }).join("\n");

    const blob = new Blob([BOM + header + rows], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `pnl-report-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;
  }

  return (
    <div className="flex flex-col h-full gap-4 overflow-auto pr-4">
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <BarChart3 className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Аналитика</h1>
          <Badge variant="secondary" className="text-[9px]">Бизнес-обзор</Badge>
        </div>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={loadAnalytics}>
          <RefreshCw className="h-3 w-3 mr-1" />Обновить
        </Button>
      </div>

      <AnalyticsMetricCards metrics={metrics} formatMoney={formatMoney} />
      <AnalyticsCharts monthlyData={monthlyData} formatMoney={formatMoney} />

      <div className="grid grid-cols-2 gap-3">
        <AnalyticsFunnel funnel={funnel} />
        {user && (
          <ExpensesManager expenses={expenses} onReload={loadAnalytics} userId={user.id} />
        )}
      </div>

      <AnalyticsPnL pnlData={pnlData} formatMoney={formatMoney} onExportCSV={exportCSV} />
    </div>
  );
};

export default AdminAnalytics;
