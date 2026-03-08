import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { TrendingUp, TrendingDown, DollarSign, Users, ShoppingCart, Package, Percent, Target } from "lucide-react";

interface Metrics {
  totalRevenue: number;
  monthlyRevenue: number;
  prevMonthRevenue: number;
  totalOrders: number;
  monthlyOrders: number;
  totalUsers: number;
  activeUsers30d: number;
  avgOrderValue: number;
  completionRate: number;
  activeServices: number;
  grossProfit: number;
  margin: number;
  ltv: number;
  retentionRate: number;
}

interface Props {
  metrics: Metrics;
  formatMoney: (n: number) => string;
}

const AnalyticsMetricCards = ({ metrics, formatMoney }: Props) => {
  const revenueGrowth = metrics.prevMonthRevenue > 0
    ? ((metrics.monthlyRevenue - metrics.prevMonthRevenue) / metrics.prevMonthRevenue) * 100
    : metrics.monthlyRevenue > 0 ? 100 : 0;

  return (
    <div className="grid grid-cols-4 xl:grid-cols-8 gap-3 shrink-0">
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
          <p className="text-[9px] text-green-600 mt-0.5">Месяц: {formatMoney(metrics.monthlyRevenue)}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3">
          <TrendingUp className="h-4 w-4 text-emerald-500 mb-1" />
          <p className="text-lg font-bold">{formatMoney(metrics.grossProfit)}</p>
          <p className="text-[10px] text-muted-foreground">Валовая прибыль</p>
          <p className="text-[9px] text-emerald-600 mt-0.5">Маржа: {metrics.margin.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3">
          <ShoppingCart className="h-4 w-4 text-blue-500 mb-1" />
          <p className="text-lg font-bold">{metrics.totalOrders}</p>
          <p className="text-[10px] text-muted-foreground">Всего заказов</p>
          <p className="text-[9px] text-blue-600 mt-0.5">Месяц: +{metrics.monthlyOrders}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3">
          <Users className="h-4 w-4 text-purple-500 mb-1" />
          <p className="text-lg font-bold">{metrics.totalUsers}</p>
          <p className="text-[10px] text-muted-foreground">Пользователей</p>
          <p className="text-[9px] text-purple-600 mt-0.5">Активных: {metrics.activeUsers30d}</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3">
          <Target className="h-4 w-4 text-orange-500 mb-1" />
          <p className="text-lg font-bold">{formatMoney(metrics.avgOrderValue)}</p>
          <p className="text-[10px] text-muted-foreground">Средний чек</p>
          <p className="text-[9px] text-orange-600 mt-0.5">Конверсия: {metrics.completionRate.toFixed(1)}%</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3">
          <DollarSign className="h-4 w-4 text-indigo-500 mb-1" />
          <p className="text-lg font-bold">{formatMoney(metrics.ltv)}</p>
          <p className="text-[10px] text-muted-foreground">LTV (ср.)</p>
        </CardContent>
      </Card>

      <Card className="border-border/60">
        <CardContent className="p-3">
          <Percent className="h-4 w-4 text-pink-500 mb-1" />
          <p className="text-lg font-bold">{metrics.retentionRate.toFixed(1)}%</p>
          <p className="text-[10px] text-muted-foreground">Retention</p>
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
  );
};

export default AnalyticsMetricCards;
