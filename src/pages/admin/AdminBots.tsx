import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Bot, Power, PowerOff, Pencil, Trash2, Copy, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { BotEditor } from "@/components/admin/bots/BotEditor";
import { BotTemplateGallery } from "@/components/admin/bots/BotTemplateGallery";

interface TelegramBot {
  id: string;
  name: string;
  token: string;
  bot_type: string;
  is_enabled: boolean;
  welcome_message: string;
  confirm_message: string;
  description: string | null;
  webhook_url: string | null;
  webhook_active: boolean;
  buttons: any[];
  settings: Record<string, any>;
  template_id: string | null;
  created_at: string;
}

export default function AdminBots() {
  const [bots, setBots] = useState<TelegramBot[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingBot, setEditingBot] = useState<TelegramBot | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showCreateFlow, setShowCreateFlow] = useState(false);

  const fetchBots = async () => {
    const { data } = await supabase.from("telegram_bots").select("*").order("created_at");
    setBots((data as any[]) || []);
    setLoading(false);
  };

  useEffect(() => { fetchBots(); }, []);

  const createBot = async (templateData?: any) => {
    const newBot = {
      name: templateData?.name || "Новый бот",
      bot_type: templateData?.bot_type || "support",
      welcome_message: templateData?.welcome_message || "👋 Добро пожаловать!",
      confirm_message: templateData?.confirm_message || "✅ Сообщение получено!",
      buttons: templateData?.buttons || [],
      settings: templateData?.settings || {},
      template_id: templateData?.id || null,
      description: templateData?.description || null,
    };
    const { data, error } = await supabase.from("telegram_bots").insert(newBot as any).select().single();
    if (error) { toast.error("Ошибка создания бота"); return; }
    toast.success("Бот создан!");
    setShowCreateFlow(false);
    setEditingBot(data as any);
    setShowEditor(true);
    fetchBots();
  };

  const deleteBot = async (id: string) => {
    await supabase.from("telegram_bots").delete().eq("id", id);
    toast.success("Бот удалён");
    fetchBots();
  };

  const toggleBot = async (bot: TelegramBot) => {
    await supabase.from("telegram_bots").update({ is_enabled: !bot.is_enabled } as any).eq("id", bot.id);
    toast.success(bot.is_enabled ? "Бот выключен" : "Бот включён");
    fetchBots();
  };

  const duplicateBot = async (bot: TelegramBot) => {
    const { id, created_at, ...rest } = bot;
    await supabase.from("telegram_bots").insert({ ...rest, name: `${bot.name} (копия)`, is_enabled: false, token: "" } as any);
    toast.success("Бот скопирован");
    fetchBots();
  };

  const typeLabels: Record<string, string> = { support: "Поддержка", orders: "Заказы", custom: "Кастомный" };
  const typeColors: Record<string, string> = { support: "bg-blue-500/10 text-blue-600", orders: "bg-green-500/10 text-green-600", custom: "bg-purple-500/10 text-purple-600" };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Telegram-боты</h1>
          <p className="text-sm text-muted-foreground">Управление ботами поддержки и заказов</p>
        </div>
        <Button onClick={() => setShowCreateFlow(true)}>
          <Plus className="mr-2 h-4 w-4" /> Новый бот
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12 text-muted-foreground">Загрузка...</div>
      ) : bots.length === 0 ? (
        <Card className="border-dashed">
          <CardContent className="flex flex-col items-center justify-center py-16 gap-4">
            <Bot className="h-12 w-12 text-muted-foreground/40" />
            <div className="text-center">
              <h3 className="font-semibold text-lg">Нет ботов</h3>
              <p className="text-sm text-muted-foreground mt-1">Создайте бота с нуля или выберите из шаблонов</p>
            </div>
            <Button onClick={() => setShowCreateFlow(true)}>
              <Plus className="mr-2 h-4 w-4" /> Создать бота
            </Button>
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {bots.map((bot) => (
            <Card key={bot.id} className={`transition-all ${!bot.is_enabled ? "opacity-60" : ""}`}>
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <Bot className="h-5 w-5 text-primary" />
                    <CardTitle className="text-base">{bot.name}</CardTitle>
                  </div>
                  <div className="flex items-center gap-1">
                    <Badge variant="outline" className={typeColors[bot.bot_type]}>{typeLabels[bot.bot_type]}</Badge>
                    {bot.is_enabled ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-200">Активен</Badge>
                    ) : (
                      <Badge variant="secondary">Выключен</Badge>
                    )}
                  </div>
                </div>
                {bot.description && <CardDescription className="mt-1">{bot.description}</CardDescription>}
              </CardHeader>
              <CardContent className="pt-0">
                <div className="text-xs text-muted-foreground space-y-1 mb-3">
                  <div>Кнопок: {(bot.buttons as any[])?.length || 0}</div>
                  <div>Токен: {bot.token ? "••••" + bot.token.slice(-4) : "не задан"}</div>
                </div>
                <div className="flex gap-1.5 flex-wrap">
                  <Button size="sm" variant="outline" onClick={() => { setEditingBot(bot); setShowEditor(true); }}>
                    <Pencil className="h-3.5 w-3.5 mr-1" /> Редактировать
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => toggleBot(bot)}>
                    {bot.is_enabled ? <PowerOff className="h-3.5 w-3.5" /> : <Power className="h-3.5 w-3.5" />}
                  </Button>
                  <Button size="sm" variant="ghost" onClick={() => duplicateBot(bot)}>
                    <Copy className="h-3.5 w-3.5" />
                  </Button>
                  <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteBot(bot.id)}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Bot Editor Dialog */}
      <Dialog open={showEditor} onOpenChange={(o) => { setShowEditor(o); if (!o) fetchBots(); }}>
        <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingBot?.name || "Редактор бота"}</DialogTitle>
          </DialogHeader>
          {editingBot && <BotEditor bot={editingBot} onSave={() => { setShowEditor(false); fetchBots(); }} />}
        </DialogContent>
      </Dialog>

      {/* Create Flow Dialog — shows templates + blank option */}
      <Dialog open={showCreateFlow} onOpenChange={setShowCreateFlow}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Создать бота</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <Card className="border-dashed cursor-pointer hover:border-primary/50 transition-colors" onClick={() => createBot()}>
              <CardContent className="flex items-center gap-3 py-4">
                <div className="h-10 w-10 rounded-lg bg-muted flex items-center justify-center">
                  <Plus className="h-5 w-5 text-muted-foreground" />
                </div>
                <div>
                  <p className="font-medium text-sm">Пустой бот</p>
                  <p className="text-xs text-muted-foreground">Создать бота с нуля без шаблона</p>
                </div>
              </CardContent>
            </Card>
            <div>
              <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-primary" /> Или выберите шаблон
              </h3>
              <BotTemplateGallery onSelect={(t) => createBot(t)} />
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
