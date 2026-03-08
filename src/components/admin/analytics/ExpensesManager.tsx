import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Plus, Trash2, Wallet } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const CATEGORIES = [
  { value: "hosting", label: "Хостинг" },
  { value: "api_providers", label: "API Провайдеры" },
  { value: "advertising", label: "Реклама" },
  { value: "salary", label: "Зарплаты" },
  { value: "software", label: "Софт/Лицензии" },
  { value: "taxes", label: "Налоги" },
  { value: "other", label: "Прочее" },
];

interface Expense {
  id: string;
  category: string;
  description: string;
  amount: number;
  expense_date: string;
  is_recurring: boolean;
  recurring_period: string | null;
}

interface Props {
  expenses: Expense[];
  onReload: () => void;
  userId: string;
}

const ExpensesManager = ({ expenses, onReload, userId }: Props) => {
  const [adding, setAdding] = useState(false);
  const [form, setForm] = useState({
    category: "other",
    description: "",
    amount: "",
    expense_date: new Date().toISOString().split("T")[0],
    is_recurring: false,
    recurring_period: null as string | null,
  });

  const handleAdd = async () => {
    if (!form.description || !form.amount) {
      toast.error("Заполните описание и сумму");
      return;
    }
    const { error } = await supabase.from("business_expenses").insert({
      category: form.category,
      description: form.description,
      amount: Number(form.amount),
      expense_date: form.expense_date,
      is_recurring: form.is_recurring,
      recurring_period: form.recurring_period,
      created_by: userId,
    });
    if (error) {
      toast.error("Ошибка: " + error.message);
    } else {
      toast.success("Расход добавлен");
      setAdding(false);
      setForm({ category: "other", description: "", amount: "", expense_date: new Date().toISOString().split("T")[0], is_recurring: false, recurring_period: null });
      onReload();
    }
  };

  const handleDelete = async (id: string) => {
    const { error } = await supabase.from("business_expenses").delete().eq("id", id);
    if (error) toast.error(error.message);
    else {
      toast.success("Удалено");
      onReload();
    }
  };

  const totalExpenses = expenses.reduce((s, e) => s + Number(e.amount), 0);
  const formatMoney = (n: number) => n.toLocaleString("ru-RU", { minimumFractionDigits: 0 }) + " ₽";
  const getCatLabel = (v: string) => CATEGORIES.find((c) => c.value === v)?.label || v;

  return (
    <Card className="border-border/60">
      <CardHeader className="p-3 pb-0 flex flex-row items-center justify-between">
        <CardTitle className="text-sm flex items-center gap-2">
          <Wallet className="h-4 w-4 text-destructive" />
          Расходы бизнеса
          <Badge variant="secondary" className="text-[9px]">{formatMoney(totalExpenses)}</Badge>
        </CardTitle>
        <Button size="sm" variant="outline" className="h-7 text-xs" onClick={() => setAdding(!adding)}>
          <Plus className="h-3 w-3 mr-1" />{adding ? "Отмена" : "Добавить"}
        </Button>
      </CardHeader>
      <CardContent className="p-3 pt-2">
        {adding && (
          <div className="grid grid-cols-5 gap-2 mb-3 p-2 rounded bg-muted/50 border border-border/60">
            <Select value={form.category} onValueChange={(v) => setForm({ ...form, category: v })}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {CATEGORIES.map((c) => (
                  <SelectItem key={c.value} value={c.value} className="text-xs">{c.label}</SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Input
              placeholder="Описание"
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              type="number"
              placeholder="Сумма ₽"
              value={form.amount}
              onChange={(e) => setForm({ ...form, amount: e.target.value })}
              className="h-8 text-xs"
            />
            <Input
              type="date"
              value={form.expense_date}
              onChange={(e) => setForm({ ...form, expense_date: e.target.value })}
              className="h-8 text-xs"
            />
            <Button size="sm" className="h-8 text-xs" onClick={handleAdd}>Сохранить</Button>
          </div>
        )}

        {expenses.length === 0 ? (
          <p className="text-xs text-muted-foreground text-center py-4">Нет записей о расходах</p>
        ) : (
          <div className="max-h-[200px] overflow-auto">
            <table className="w-full text-[10px]">
              <thead>
                <tr className="border-b border-border/60">
                  <th className="text-left py-1 font-semibold text-muted-foreground">Дата</th>
                  <th className="text-left py-1 font-semibold text-muted-foreground">Категория</th>
                  <th className="text-left py-1 font-semibold text-muted-foreground">Описание</th>
                  <th className="text-right py-1 font-semibold text-muted-foreground">Сумма</th>
                  <th className="w-6"></th>
                </tr>
              </thead>
              <tbody>
                {expenses.map((e) => (
                  <tr key={e.id} className="border-b border-border/30 hover:bg-muted/30">
                    <td className="py-1">{new Date(e.expense_date).toLocaleDateString("ru-RU")}</td>
                    <td className="py-1">
                      <Badge variant="outline" className="text-[8px] px-1 py-0">{getCatLabel(e.category)}</Badge>
                    </td>
                    <td className="py-1">{e.description}</td>
                    <td className="text-right py-1 font-medium text-destructive">{formatMoney(Number(e.amount))}</td>
                    <td>
                      <button onClick={() => handleDelete(e.id)} className="text-muted-foreground hover:text-destructive">
                        <Trash2 className="h-3 w-3" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ExpensesManager;
