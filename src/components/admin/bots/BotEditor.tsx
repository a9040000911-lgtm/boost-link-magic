import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Save, Plus, Trash2, GripVertical, Eye } from "lucide-react";
import { toast } from "sonner";
import { BotPreview } from "./BotPreview";

interface BotButton {
  id: string;
  row: number;
}

interface ButtonDef {
  id: string;
  label: string;
  icon: string;
  action_type: string;
  action_value: string;
  category: string;
  description: string;
}

interface Props {
  bot: any;
  onSave: () => void;
}

export function BotEditor({ bot, onSave }: Props) {
  const [form, setForm] = useState({
    name: bot.name || "",
    token: bot.token || "",
    bot_type: bot.bot_type || "support",
    welcome_message: bot.welcome_message || "",
    confirm_message: bot.confirm_message || "",
    description: bot.description || "",
    is_enabled: bot.is_enabled || false,
  });
  const [buttons, setButtons] = useState<BotButton[]>(bot.buttons || []);
  const [buttonLibrary, setButtonLibrary] = useState<ButtonDef[]>([]);
  const [saving, setSaving] = useState(false);
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    supabase.from("bot_button_library").select("*").order("category").then(({ data }) => {
      setButtonLibrary((data as any[]) || []);
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    const { error } = await supabase.from("telegram_bots").update({
      name: form.name,
      token: form.token,
      bot_type: form.bot_type,
      welcome_message: form.welcome_message,
      confirm_message: form.confirm_message,
      description: form.description,
      is_enabled: form.is_enabled,
      buttons: buttons as any,
      updated_at: new Date().toISOString(),
    } as any).eq("id", bot.id);
    setSaving(false);
    if (error) { toast.error("Ошибка сохранения"); return; }
    toast.success("Бот сохранён!");
    onSave();
  };

  const addButton = (btnId: string) => {
    const maxRow = buttons.length > 0 ? Math.max(...buttons.map(b => b.row)) : -1;
    const lastRowCount = buttons.filter(b => b.row === maxRow).length;
    const row = lastRowCount >= 2 ? maxRow + 1 : (maxRow >= 0 ? maxRow : 0);
    setButtons([...buttons, { id: btnId, row }]);
  };

  const removeButton = (idx: number) => {
    setButtons(buttons.filter((_, i) => i !== idx));
  };

  const getButtonDef = (id: string) => buttonLibrary.find(b => b.id === id);

  const groupedButtons = buttons.reduce<Record<number, (BotButton & { idx: number })[]>>((acc, btn, idx) => {
    if (!acc[btn.row]) acc[btn.row] = [];
    acc[btn.row].push({ ...btn, idx });
    return acc;
  }, {});

  const categoryLabels: Record<string, string> = {
    navigation: "🧭 Навигация",
    support: "🎧 Поддержка",
    orders: "🛒 Заказы",
    account: "👤 Аккаунт",
    general: "⚙️ Общее",
  };

  const groupedLibrary = buttonLibrary.reduce<Record<string, ButtonDef[]>>((acc, btn) => {
    if (!acc[btn.category]) acc[btn.category] = [];
    acc[btn.category].push(btn);
    return acc;
  }, {});

  return (
    <Tabs defaultValue="settings" className="space-y-4">
      <TabsList className="grid w-full grid-cols-4">
        <TabsTrigger value="settings">⚙️ Настройки</TabsTrigger>
        <TabsTrigger value="buttons">🔘 Кнопки</TabsTrigger>
        <TabsTrigger value="messages">💬 Сообщения</TabsTrigger>
        <TabsTrigger value="preview">👁 Превью</TabsTrigger>
      </TabsList>

      <TabsContent value="settings" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>Название бота</Label>
            <Input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} placeholder="Мой бот" />
          </div>
          <div className="space-y-2">
            <Label>Тип бота</Label>
            <Select value={form.bot_type} onValueChange={v => setForm({ ...form, bot_type: v })}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="support">🎧 Поддержка</SelectItem>
                <SelectItem value="orders">🛒 Заказы</SelectItem>
                <SelectItem value="custom">🔧 Кастомный</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Токен бота (от @BotFather)</Label>
            <Input value={form.token} onChange={e => setForm({ ...form, token: e.target.value })} placeholder="123456:ABC-DEF..." type="password" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Описание</Label>
            <Input value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} placeholder="Краткое описание бота" />
          </div>
          <div className="flex items-center gap-3">
            <Switch checked={form.is_enabled} onCheckedChange={v => setForm({ ...form, is_enabled: v })} />
            <Label>Бот активен</Label>
          </div>
        </div>
      </TabsContent>

      <TabsContent value="buttons" className="space-y-4">
        <div className="grid gap-4 md:grid-cols-2">
          {/* Current buttons layout */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Текущие кнопки ({buttons.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {Object.keys(groupedButtons).sort((a, b) => +a - +b).map(rowStr => {
                const row = +rowStr;
                return (
                  <div key={row} className="flex gap-2 items-center p-2 rounded-md bg-muted/50">
                    <span className="text-xs text-muted-foreground w-6">R{row + 1}</span>
                    {groupedButtons[row].map(btn => {
                      const def = getButtonDef(btn.id);
                      return (
                        <div key={btn.idx} className="flex items-center gap-1 bg-background border rounded-md px-2 py-1 text-xs">
                          <GripVertical className="h-3 w-3 text-muted-foreground" />
                          <span>{def?.icon || "?"} {def?.label || btn.id}</span>
                          <button onClick={() => removeButton(btn.idx)} className="text-destructive hover:text-destructive/80 ml-1">
                            <Trash2 className="h-3 w-3" />
                          </button>
                        </div>
                      );
                    })}
                  </div>
                );
              })}
              {buttons.length === 0 && <p className="text-sm text-muted-foreground text-center py-4">Добавьте кнопки из библиотеки →</p>}
            </CardContent>
          </Card>

          {/* Button library */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Библиотека кнопок</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 max-h-[400px] overflow-y-auto">
              {Object.entries(groupedLibrary).map(([cat, btns]) => (
                <div key={cat}>
                  <p className="text-xs font-medium text-muted-foreground mb-1">{categoryLabels[cat] || cat}</p>
                  <div className="flex flex-wrap gap-1.5">
                    {btns.map(btn => {
                      const isAdded = buttons.some(b => b.id === btn.id);
                      return (
                        <Button
                          key={btn.id}
                          size="sm"
                          variant={isAdded ? "secondary" : "outline"}
                          className="text-xs h-7"
                          onClick={() => !isAdded && addButton(btn.id)}
                          disabled={isAdded}
                          title={btn.description}
                        >
                          {btn.icon} {btn.label.replace(btn.icon, "").trim()}
                        </Button>
                      );
                    })}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </TabsContent>

      <TabsContent value="messages" className="space-y-4">
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Приветственное сообщение (при /start)</Label>
            <Textarea value={form.welcome_message} onChange={e => setForm({ ...form, welcome_message: e.target.value })} rows={5} placeholder="Приветствие бота..." />
          </div>
          <div className="space-y-2">
            <Label>Подтверждение получения сообщения</Label>
            <Textarea value={form.confirm_message} onChange={e => setForm({ ...form, confirm_message: e.target.value })} rows={3} placeholder="Сообщение после получения..." />
          </div>
        </div>
      </TabsContent>

      <TabsContent value="preview">
        <BotPreview
          welcomeMessage={form.welcome_message}
          confirmMessage={form.confirm_message}
          buttons={buttons}
          buttonLibrary={buttonLibrary}
          botName={form.name}
        />
      </TabsContent>

      <div className="flex justify-end pt-4 border-t">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="mr-2 h-4 w-4" /> {saving ? "Сохранение..." : "Сохранить"}
        </Button>
      </div>
    </Tabs>
  );
}
