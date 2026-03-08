import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { FileSpreadsheet } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Download } from "lucide-react";

interface MonthlyPnL {
  month: string;
  revenue: number;
  cost: number;
  expenses: number;
  profit: number;
}

interface Props {
  pnlData: MonthlyPnL[];
  formatMoney: (n: number) => string;
  onExportCSV: () => void;
}

const AnalyticsPnL = ({ pnlData, formatMoney, onExportCSV }: Props) => {
  const totals = pnlData.reduce(
    (acc, m) => ({
      revenue: acc.revenue + m.revenue,
      cost: acc.cost + m.cost,
      expenses: acc.expenses + m.expenses,
      profit: acc.profit + m.profit,
    }),
    { revenue: 0, cost: 0, expenses: 0, profit: 0 }
  );

  return (
    <Card className="border-border/60">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <FileSpreadsheet className="h-4 w-4 text-primary" />
          P&L отчёт (12 мес.)
        </CardTitle>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={onExportCSV}>
          <Download className="h-3 w-3 mr-1" />CSV
        </Button>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="overflow-x-auto">
          <table className="w-full text-[10px]">
            <thead>
              <tr className="border-b border-border/60">
                <th className="text-left py-1 font-semibold text-muted-foreground">Месяц</th>
                <th className="text-right py-1 font-semibold text-muted-foreground">Выручка</th>
                <th className="text-right py-1 font-semibold text-muted-foreground">Себестоимость</th>
                <th className="text-right py-1 font-semibold text-muted-foreground">Расходы</th>
                <th className="text-right py-1 font-semibold text-muted-foreground">Прибыль</th>
                <th className="text-right py-1 font-semibold text-muted-foreground">Маржа</th>
              </tr>
            </thead>
            <tbody>
              {pnlData.map((m) => {
                const marginPct = m.revenue > 0 ? ((m.profit / m.revenue) * 100).toFixed(1) : "0";
                return (
                  <tr key={m.month} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-1 font-medium">{m.month}</td>
                    <td className="text-right py-1">{formatMoney(m.revenue)}</td>
                    <td className="text-right py-1 text-muted-foreground">{formatMoney(m.cost)}</td>
                    <td className="text-right py-1 text-muted-foreground">{formatMoney(m.expenses)}</td>
                    <td className={`text-right py-1 font-medium ${m.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                      {formatMoney(m.profit)}
                    </td>
                    <td className="text-right py-1">
                      <Badge variant={Number(marginPct) >= 0 ? "default" : "destructive"} className="text-[8px] px-1 py-0">
                        {marginPct}%
                      </Badge>
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-border font-bold">
                <td className="py-1">Итого</td>
                <td className="text-right py-1">{formatMoney(totals.revenue)}</td>
                <td className="text-right py-1">{formatMoney(totals.cost)}</td>
                <td className="text-right py-1">{formatMoney(totals.expenses)}</td>
                <td className={`text-right py-1 ${totals.profit >= 0 ? "text-green-600" : "text-destructive"}`}>
                  {formatMoney(totals.profit)}
                </td>
                <td className="text-right py-1">
                  <Badge variant={totals.revenue > 0 && totals.profit >= 0 ? "default" : "destructive"} className="text-[8px] px-1 py-0">
                    {totals.revenue > 0 ? ((totals.profit / totals.revenue) * 100).toFixed(1) : "0"}%
                  </Badge>
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsPnL;
