import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { AlertTriangle, Ban, Wallet, MessageSquare, ShieldAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";

const forbiddenTopics = [
  "Взрывчатые вещества и материалы, кроме пиротехники",
  "Дистанционная продажа запрещенных товаров",
  "Медицинские услуги по абортам",
  "Наркотики и психотропные вещества",
  "Оружие всех видов",
  "Рецептурные лекарства",
  "Вредоносный контент, направленный на мошенничество",
  "Поддельные документы и идентификационные средства",
  "Порнография",
  "Финансовые пирамиды",
  "Казино, азартные игры, покер и ставки на спорт",
  "Взлом сайтов, почты и личных страниц",
  "Спам-услуги",
  "Проституция, эскорт-услуги и интимные сервисы",
  "Анаболические стероиды и подобные препараты",
  "Контент, призывающий к насилию или противоправным действиям",
  "Политические и военные материалы",
  "Треш видео, 18+ материалы",
  "Коучинг",
  "Астрология, эзотерика, магия, религия, колдовство, оккультизм, мистика, таро, гадания, нумерология, регрессии в прошлые жизни, астральные путешествия, осознанные сны, ченнелинг, рейки, биоэнергетика, духовные практики, духовные гуру и наставники, славянское ведовство, родовые обряды, гомеопатия, лечение по фотографии, энергетическое очищение, диагностика ауры, конспирология, теории заговора, лженаука, секты, культовые практики и прочее",
];

const DashboardRules = () => {
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <ShieldAlert className="h-6 w-6 text-destructive" />
        Запрещённые темы
      </h1>

      {/* Withdrawal policy */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Wallet className="h-4 w-4 text-primary" />
            Вывод средств
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground leading-relaxed">
            Вывод средств осуществляется <span className="text-foreground font-medium">только через техническую поддержку</span>. Для оформления вывода создайте тикет в разделе «Поддержка».
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className="rounded-lg border border-border/60 p-3 bg-muted/30">
              <p className="text-xs font-semibold text-foreground mb-1">Без комиссии</p>
              <p className="text-xs text-muted-foreground">Если мы не смогли выполнить ваш заказ — возврат средств производится полностью, без удержания комиссии.</p>
            </div>
            <div className="rounded-lg border border-border/60 p-3 bg-muted/30">
              <p className="text-xs font-semibold text-foreground mb-1">С комиссией</p>
              <p className="text-xs text-muted-foreground">Если вы решили вывести средства без объективной причины — администрация может применить комиссию за вывод.</p>
            </div>
          </div>
          <Button
            variant="outline"
            size="sm"
            className="gap-2"
            onClick={() => navigate("/dashboard/support?new=1")}
          >
            <MessageSquare className="h-3.5 w-3.5" />
            Создать тикет на вывод
          </Button>
        </CardContent>
      </Card>

      {/* Forbidden categories */}
      <Card className="border-border/60">
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Ban className="h-4 w-4 text-destructive" />
            Запрещённые категории контента
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
            При размещении заказов на нашем сервисе учитываются местные законодательные запреты и внутренняя политика. Заказы по следующим тематикам <span className="text-destructive font-medium">запрещены</span> и будут отклонены без возврата средств:
          </p>
          <div className="space-y-1.5">
            {forbiddenTopics.map((topic, i) => (
              <div
                key={i}
                className="flex items-start gap-2 py-1.5 px-3 rounded-md bg-destructive/5 border border-destructive/10"
              >
                <AlertTriangle className="h-3.5 w-3.5 text-destructive shrink-0 mt-0.5" />
                <span className="text-xs text-foreground leading-relaxed">{topic}</span>
              </div>
            ))}
          </div>
          <div className="mt-4 p-3 rounded-lg bg-muted/50 border border-border/60">
            <p className="text-[11px] text-muted-foreground">
              <span className="font-semibold text-foreground">Важно:</span> Администрация оставляет за собой право отклонить заказ и заблокировать аккаунт при выявлении нарушений. В случае сомнений обратитесь в поддержку до размещения заказа.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DashboardRules;
