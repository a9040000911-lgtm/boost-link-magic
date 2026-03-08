import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Trash2, Plus, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface CleanupRule {
  id: string;
  field: string;
  match_value: string;
  replace_value: string;
  is_enabled: boolean;
  created_at: string;
}

const FIELDS = [
  { value: "network", label: "Платформа (network)" },
  { value: "category", label: "Категория (category)" },
  { value: "name", label: "Название (name)" },
];

export const CleanupRulesDialog = () => {
  const [open, setOpen] = useState(false);
  const [rules, setRules] = useState<CleanupRule[]>([]);
  const [newRule, setNewRule] = useState({ field: "network", match_value: "", replace_value: "" });

  const load = async () => {
    const { data } = await supabase
      .from("provider_cleanup_rules" as any)
      .select("*")
      .order("created_at");
    if (data) setRules(data as any);
  };

  useEffect(() => {
    if (open) load();
  }, [open]);

  const addRule = async () => {
    if (!newRule.match_value || !newRule.replace_value) {
      toast.error("Заполните оба значения");
      return;
    }
    const { error } = await supabase
      .from("provider_cleanup_rules" as any)
      .insert(newRule as any);
    if (error) {
      toast.error(error.message);
      return;
    }
    toast.success("Правило добавлено");
    setNewRule({ field: "network", match_value: "", replace_value: "" });
    await load();
  };

  const toggleRule = async (rule: CleanupRule) => {
    await supabase
      .from("provider_cleanup_rules" as any)
      .update({ is_enabled: !rule.is_enabled } as any)
      .eq("id", rule.id);
    await load();
  };

  const deleteRule = async (id: string) => {
    await supabase
      .from("provider_cleanup_rules" as any)
      .delete()
      .eq("id", id);
    toast.success("Правило удалено");
    await load();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-7 text-xs">
          <Sparkles className="h-3 w-3 mr-1" />Очистка
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-sm">Правила очистки при синхронизации</DialogTitle>
        </DialogHeader>
        <p className="text-[11px] text-muted-foreground -mt-2">
          При импорте услуг от провайдера, если значение поля содержит «совпадение», оно будет заменено на «замена».
        </p>

        {/* Add new rule */}
        <div className="flex items-end gap-2">
          <div className="w-[140px]">
            <label className="text-[10px] text-muted-foreground">Поле</label>
            <Select value={newRule.field} onValueChange={(v) => setNewRule(r => ({ ...r, field: v }))}>
              <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
              <SelectContent>
                {FIELDS.map(f => <SelectItem key={f.value} value={f.value} className="text-xs">{f.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground">Совпадение</label>
            <Input
              placeholder="👀"
              value={newRule.match_value}
              onChange={(e) => setNewRule(r => ({ ...r, match_value: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <div className="flex-1">
            <label className="text-[10px] text-muted-foreground">Замена</label>
            <Input
              placeholder="Telegram"
              value={newRule.replace_value}
              onChange={(e) => setNewRule(r => ({ ...r, replace_value: e.target.value }))}
              className="h-8 text-xs"
            />
          </div>
          <Button size="sm" className="h-8 text-xs" onClick={addRule}>
            <Plus className="h-3 w-3 mr-1" />Добавить
          </Button>
        </div>

        {/* Rules table */}
        <div className="border rounded-md max-h-[300px] overflow-auto">
          <Table>
            <TableHeader>
              <TableRow className="text-[10px]">
                <TableHead className="px-2">Поле</TableHead>
                <TableHead className="px-2">Совпадение</TableHead>
                <TableHead className="px-2">→</TableHead>
                <TableHead className="px-2">Замена</TableHead>
                <TableHead className="px-2 w-16">Вкл.</TableHead>
                <TableHead className="px-2 w-10"></TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rules.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center text-xs text-muted-foreground py-6">
                    Нет правил. Добавьте первое правило выше.
                  </TableCell>
                </TableRow>
              )}
              {rules.map((rule) => (
                <TableRow key={rule.id} className="text-[11px]">
                  <TableCell className="px-2">
                    <span className="font-mono text-[10px] bg-muted px-1 rounded">
                      {FIELDS.find(f => f.value === rule.field)?.label || rule.field}
                    </span>
                  </TableCell>
                  <TableCell className="px-2 font-mono">{rule.match_value}</TableCell>
                  <TableCell className="px-2 text-muted-foreground">→</TableCell>
                  <TableCell className="px-2 font-mono font-bold">{rule.replace_value}</TableCell>
                  <TableCell className="px-2">
                    <Switch checked={rule.is_enabled} onCheckedChange={() => toggleRule(rule)} className="scale-[0.6]" />
                  </TableCell>
                  <TableCell className="px-2">
                    <Button size="sm" variant="ghost" className="h-6 w-6 p-0" onClick={() => deleteRule(rule.id)}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      </DialogContent>
    </Dialog>
  );
};
