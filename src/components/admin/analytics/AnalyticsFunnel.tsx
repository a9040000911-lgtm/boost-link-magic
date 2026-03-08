import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight } from "lucide-react";

interface FunnelData {
  totalUsers: number;
  usersWithDeposit: number;
  usersWithOrder: number;
  usersWithRepeatOrder: number;
}

interface Props {
  funnel: FunnelData;
}

const AnalyticsFunnel = ({ funnel }: Props) => {
  const steps = [
    { label: "Регистрация", value: funnel.totalUsers, color: "bg-blue-500" },
    { label: "Пополнение", value: funnel.usersWithDeposit, color: "bg-purple-500" },
    { label: "1-й заказ", value: funnel.usersWithOrder, color: "bg-orange-500" },
    { label: "Повторный", value: funnel.usersWithRepeatOrder, color: "bg-green-500" },
  ];

  return (
    <Card className="border-border/60">
      <CardHeader className="p-3 pb-0">
        <CardTitle className="text-sm">Воронка конверсии</CardTitle>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        <div className="flex items-center gap-2">
          {steps.map((step, i) => {
            const pct = funnel.totalUsers > 0 ? ((step.value / funnel.totalUsers) * 100).toFixed(1) : "0";
            return (
              <div key={step.label} className="flex items-center gap-2 flex-1">
                <div className="flex-1 text-center">
                  <div className={`${step.color} text-white rounded px-2 py-1.5 text-xs font-bold`}>
                    {step.value}
                  </div>
                  <p className="text-[9px] text-muted-foreground mt-1">{step.label}</p>
                  <p className="text-[8px] text-muted-foreground">{pct}%</p>
                </div>
                {i < steps.length - 1 && <ArrowRight className="h-3 w-3 text-muted-foreground shrink-0" />}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsFunnel;
