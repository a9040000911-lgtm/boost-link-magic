import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { Save, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import { BotPreview } from "./BotPreview";
import { BotButtonLayoutEditor } from "./BotButtonLayoutEditor";

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
  const [previewOpen, setPreviewOpen] = useState(false);

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

  return (
    <div className="space-y-4">
      <Tabs defaultValue="settings" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="settings">⚙️ Настройки</TabsTrigger>
          <TabsTrigger value="buttons">🔘 Кнопки</TabsTrigger>
          <TabsTrigger value="messages">💬 Сообщения</TabsTrigger>
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
          <BotButtonLayoutEditor buttons={buttons} setButtons={setButtons} buttonLibrary={buttonLibrary} />
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
      </Tabs>

      {/* Inline collapsible preview */}
      <Collapsible open={previewOpen} onOpenChange={setPreviewOpen}>
        <div className="flex items-center justify-between border-t pt-4">
          <CollapsibleTrigger asChild>
            <Button variant="outline" size="sm">
              {previewOpen ? <EyeOff className="h-4 w-4 mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
              {previewOpen ? "Скрыть превью" : "Показать превью"}
            </Button>
          </CollapsibleTrigger>
          <Button onClick={handleSave} disabled={saving}>
            <Save className="mr-2 h-4 w-4" /> {saving ? "Сохранение..." : "Сохранить"}
          </Button>
        </div>
        <CollapsibleContent className="mt-4">
          <BotPreview
            welcomeMessage={form.welcome_message}
            confirmMessage={form.confirm_message}
            buttons={buttons}
            buttonLibrary={buttonLibrary}
            botName={form.name}
          />
        </CollapsibleContent>
      </Collapsible>
    </div>
  );
}
