import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Settings, Save, RefreshCw, MessageSquare, Shield, Wallet, ShoppingCart, Bell, Clock, MessageCircle, Mail, Sparkles } from "lucide-react";
import { toast } from "sonner";

// ===== CONFIG: all settings metadata in one place =====
// type: "number" | "text" | "textarea" | "boolean"
interface SettingMeta {
  key: string;
  label: string;
  hint: string;
  type: "number" | "text" | "textarea" | "boolean";
  suffix?: string;
  group: string;
}

const SETTINGS_META: SettingMeta[] = [
  // Contacts
  { key: "contact_email", label: "Email для связи", hint: "Публичный email, отображается на странице контактов и в футере", type: "text", group: "contacts" },
  { key: "contact_work_hours", label: "Часы работы", hint: "Например: 9:00 — 21:00 МСК", type: "text", group: "contacts" },
  { key: "contact_work_days", label: "Рабочие дни", hint: "Например: Пн — Вс", type: "text", group: "contacts" },

  // Telegram Support Bot
  { key: "support_bot_token", label: "Токен бота поддержки", hint: "Токен отдельного Telegram-бота для приёма обращений (получите у @BotFather). Оставьте пустым чтобы использовать основной бот", type: "text", group: "telegram_support" },
  { key: "support_bot_welcome", label: "Приветствие бота", hint: "Сообщение которое бот отправит при команде /start", type: "textarea", group: "telegram_support" },
  { key: "support_bot_confirm", label: "Подтверждение получения", hint: "Сообщение после получения сообщения от клиента", type: "textarea", group: "telegram_support" },

  // Email Support
  { key: "support_email_address", label: "Email поддержки", hint: "Адрес на который клиенты пишут обращения (например support@example.com)", type: "text", group: "email_support" },
  { key: "support_smtp_host", label: "SMTP сервер", hint: "Адрес SMTP-сервера для отправки ответов (например smtp.gmail.com)", type: "text", group: "email_support" },
  { key: "support_smtp_port", label: "SMTP порт", hint: "Порт SMTP (обычно 587 для TLS или 465 для SSL)", type: "number", group: "email_support" },
  { key: "support_smtp_user", label: "SMTP логин", hint: "Логин для авторизации на SMTP-сервере", type: "text", group: "email_support" },
  { key: "support_smtp_password", label: "SMTP пароль", hint: "Пароль для SMTP (хранится безопасно в настройках)", type: "text", group: "email_support" },
  { key: "support_email_from_name", label: "Имя отправителя", hint: "Имя которое увидит клиент в письме (например 'CoolLike Support')", type: "text", group: "email_support" },

  // AI Support — Provider
  { key: "support_ai_enabled", label: "ИИ-подсказки включены", hint: "Включить ИИ-помощника для операторов поддержки", type: "boolean", group: "ai_support" },
  { key: "support_ai_provider", label: "Провайдер ИИ", hint: "lovable — встроенный Lovable AI (без доп. ключей). gemini — Google Gemini с ручным ключом. openclaw — OpenClaw. custom — любой OpenAI-совместимый endpoint", type: "text", group: "ai_support" },
  { key: "support_ai_mode", label: "Режим работы", hint: "suggest — только подсказки оператору. auto — бот сам отвечает если уверен, иначе передаёт оператору. off — выключено", type: "text", group: "ai_support" },
  { key: "support_ai_model", label: "Модель ИИ", hint: "Для lovable: google/gemini-2.5-flash, openai/gpt-5-mini. Для gemini: gemini-2.5-flash. Для custom: любая модель endpoint'а", type: "text", group: "ai_support" },
  { key: "support_ai_system_prompt", label: "Системный промпт", hint: "Инструкция для ИИ — как генерировать ответы и подсказки", type: "textarea", group: "ai_support" },
  { key: "support_ai_auto_confidence", label: "Порог уверенности (auto)", hint: "Минимальная уверенность (0.0-1.0) для автоответа бота. Если ниже — передаёт оператору", type: "text", group: "ai_support" },
  { key: "support_ai_custom_endpoint", label: "Custom endpoint URL", hint: "URL OpenAI-совместимого API (для провайдеров custom/openclaw). Пример: https://api.openclaw.ai/v1/chat/completions", type: "text", group: "ai_support" },
  { key: "support_ai_custom_key_env", label: "Имя секрета API-ключа", hint: "Название секрета в Cloud secrets, где хранится API-ключ кастомного провайдера (например OPENCLAW_API_KEY, GEMINI_API_KEY)", type: "text", group: "ai_support" },
  { key: "support_ai_use_faq", label: "Использовать FAQ как контекст", hint: "ИИ будет учитывать опубликованные FAQ при генерации ответов", type: "boolean", group: "ai_support" },
  { key: "support_ai_use_templates", label: "Использовать шаблоны как контекст", hint: "ИИ будет учитывать шаблоны ответов при генерации", type: "boolean", group: "ai_support" },

  // Support
  { key: "ticket_auto_close_hours", label: "Автозакрытие тикетов", hint: "Через сколько часов тикет закроется автоматически после ответа поддержки, если клиент не отвечает", type: "number", suffix: "ч", group: "support" },
  { key: "ticket_reopen_window_hours", label: "Окно переоткрытия", hint: "Сколько часов после закрытия клиент может заново открыть тикет, не создавая новый", type: "number", suffix: "ч", group: "support" },
  { key: "support_welcome_message", label: "Приветственное сообщение", hint: "Текст, который клиент видит при создании нового обращения в поддержку", type: "textarea", group: "support" },
  { key: "support_staff_rules", label: "Правила для сотрудников", hint: "Правила и инструкции для операторов поддержки. Отображаются в чате поддержки", type: "textarea", group: "support" },

  // Orders
  { key: "max_orders_per_day", label: "Лимит заказов в день", hint: "Максимальное количество заказов, которое один пользователь может сделать за сутки (0 = без ограничений)", type: "number", group: "orders" },
  { key: "min_order_amount", label: "Минимальная сумма заказа", hint: "Заказы дешевле этой суммы не будут приняты", type: "number", suffix: "₽", group: "orders" },
  { key: "default_markup_percent", label: "Наценка по умолчанию", hint: "Процент наценки, который добавляется к закупочной цене провайдера при создании новой услуги", type: "number", suffix: "%", group: "orders" },

  // Finance
  { key: "min_deposit_amount", label: "Мин. сумма пополнения", hint: "Минимальная сумма, на которую пользователь может пополнить баланс", type: "number", suffix: "₽", group: "finance" },
  { key: "min_withdraw_amount", label: "Мин. сумма вывода", hint: "Минимальная сумма для запроса вывода средств", type: "number", suffix: "₽", group: "finance" },
  { key: "new_user_bonus", label: "Бонус новому пользователю", hint: "Сумма, которая автоматически начисляется на баланс при регистрации (0 = отключено)", type: "number", suffix: "₽", group: "finance" },

  // System
  { key: "maintenance_mode", label: "Режим обслуживания", hint: "Когда включено — обычные пользователи видят заглушку «сайт временно недоступен», админы работают как обычно", type: "boolean", group: "system" },
  { key: "telegram_notifications", label: "Telegram уведомления", hint: "Отправлять ли уведомления о новых заказах и тикетах в Telegram-бот", type: "boolean", group: "system" },
  { key: "auto_confirm_email", label: "Авто-подтверждение email", hint: "Если включено — пользователи не должны подтверждать email при регистрации. Отключите для дополнительной безопасности", type: "boolean", group: "system" },

  // Plan: Standard
  { key: "plan_standard_max_orders_month", label: "Макс. заказов/мес", hint: "Лимит заказов в месяц для плана Standard (0 = без ограничений)", type: "number", group: "plan_standard" },
  { key: "plan_standard_max_order_amount", label: "Макс. сумма заказа", hint: "Максимальная сумма одного заказа (0 = без ограничений)", type: "number", suffix: "₽", group: "plan_standard" },
  { key: "plan_standard_max_projects", label: "Макс. проектов", hint: "Максимальное количество проектов (0 = без ограничений)", type: "number", group: "plan_standard" },
  { key: "plan_standard_support_priority", label: "Приоритет поддержки", hint: "normal / high / urgent", type: "text", group: "plan_standard" },
  { key: "plan_standard_bulk_orders", label: "Массовые заказы", hint: "Доступ к массовым заказам", type: "boolean", group: "plan_standard" },

  // Plan: Pro
  { key: "plan_pro_max_orders_month", label: "Макс. заказов/мес", hint: "Лимит заказов в месяц для плана Pro (0 = без ограничений)", type: "number", group: "plan_pro" },
  { key: "plan_pro_max_order_amount", label: "Макс. сумма заказа", hint: "Максимальная сумма одного заказа (0 = без ограничений)", type: "number", suffix: "₽", group: "plan_pro" },
  { key: "plan_pro_max_projects", label: "Макс. проектов", hint: "Максимальное количество проектов (0 = без ограничений)", type: "number", group: "plan_pro" },
  { key: "plan_pro_support_priority", label: "Приоритет поддержки", hint: "normal / high / urgent", type: "text", group: "plan_pro" },
  { key: "plan_pro_bulk_orders", label: "Массовые заказы", hint: "Доступ к массовым заказам", type: "boolean", group: "plan_pro" },

  // Plan: Enterprise
  { key: "plan_enterprise_max_orders_month", label: "Макс. заказов/мес", hint: "Лимит заказов в месяц для плана Enterprise (0 = без ограничений)", type: "number", group: "plan_enterprise" },
  { key: "plan_enterprise_max_order_amount", label: "Макс. сумма заказа", hint: "Максимальная сумма одного заказа (0 = без ограничений)", type: "number", suffix: "₽", group: "plan_enterprise" },
  { key: "plan_enterprise_max_projects", label: "Макс. проектов", hint: "Максимальное количество проектов (0 = без ограничений)", type: "number", group: "plan_enterprise" },
  { key: "plan_enterprise_support_priority", label: "Приоритет поддержки", hint: "normal / high / urgent", type: "text", group: "plan_enterprise" },
  { key: "plan_enterprise_bulk_orders", label: "Массовые заказы", hint: "Доступ к массовым заказам", type: "boolean", group: "plan_enterprise" },
];

const GROUPS = [
  { id: "contacts", label: "Контакты", icon: Mail, description: "Публичный email и часы работы поддержки" },
  { id: "telegram_support", label: "Telegram-бот поддержки", icon: MessageCircle, description: "Отдельный бот для приёма обращений через Telegram" },
  { id: "email_support", label: "Email поддержки", icon: Mail, description: "Настройки почты для приёма и отправки обращений" },
  { id: "ai_support", label: "ИИ-подсказки", icon: Sparkles, description: "Настройки ИИ-помощника для операторов поддержки (Lovable AI)" },
  { id: "support", label: "Поддержка", icon: MessageSquare, description: "Настройки тикетов и общения с клиентами" },
  { id: "orders", label: "Заказы", icon: ShoppingCart, description: "Лимиты и наценки на заказы" },
  { id: "finance", label: "Финансы", icon: Wallet, description: "Пополнения, выводы и бонусы" },
  { id: "system", label: "Система", icon: Shield, description: "Технический режим и уведомления" },
  { id: "plan_standard", label: "План Standard", icon: Clock, description: "Лимиты базового плана лицензии" },
  { id: "plan_pro", label: "План Pro", icon: Clock, description: "Лимиты расширенного плана лицензии" },
  { id: "plan_enterprise", label: "План Enterprise", icon: Clock, description: "Лимиты корпоративного плана лицензии" },
];

const AdminSettingsPage = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => { load(); }, []);

  const load = async () => {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key, value");
    const map: Record<string, string> = {};
    (data || []).forEach((r: any) => { map[r.key] = r.value; });
    setValues(map);
    setOriginal(map);
    setLoading(false);
  };

  const hasChanges = Object.keys(values).some(k => values[k] !== original[k]);

  const saveAll = async () => {
    setSaving(true);
    try {
      const changedKeys = Object.keys(values).filter(k => values[k] !== original[k]);
      for (const key of changedKeys) {
        const { error } = await supabase.from("app_settings")
          .upsert({ key, value: values[key], updated_at: new Date().toISOString() }, { onConflict: "key" });
        if (error) throw error;
      }
      toast.success(`Сохранено (${changedKeys.length} параметров)`);
      await load();
    } catch (e: any) { toast.error(e.message); }
    setSaving(false);
  };

  const updateVal = (key: string, val: string) => {
    setValues(prev => ({ ...prev, [key]: val }));
  };

  if (loading) return <div className="flex justify-center py-12"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary" /></div>;

  return (
    <div className="flex flex-col h-full gap-3 overflow-auto">
      {/* Header */}
      <div className="flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2">
          <Settings className="h-4 w-4 text-primary" />
          <h1 className="text-base font-bold">Настройки</h1>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-7 text-xs" onClick={load}>
            <RefreshCw className="h-3 w-3 mr-1" />Сбросить
          </Button>
          <Button size="sm" className="h-7 text-xs" onClick={saveAll} disabled={saving || !hasChanges}>
            <Save className="h-3 w-3 mr-1" />{saving ? "..." : `Сохранить${hasChanges ? ` (${Object.keys(values).filter(k => values[k] !== original[k]).length})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Settings groups */}
      <div className="space-y-4">
        {GROUPS.map(group => {
          const GroupIcon = group.icon;
          const groupSettings = SETTINGS_META.filter(s => s.group === group.id);
          return (
            <Card key={group.id} className="border-border/60">
              <CardHeader className="p-4 pb-2">
                <CardTitle className="text-sm font-bold flex items-center gap-2">
                  <GroupIcon className="h-4 w-4 text-primary" />
                  {group.label}
                  <span className="text-[11px] font-normal text-muted-foreground ml-1">— {group.description}</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 pt-2 space-y-4">
                {groupSettings.map(setting => {
                  const val = values[setting.key] ?? "";
                  const changed = val !== (original[setting.key] ?? "");
                  return (
                    <div key={setting.key} className="space-y-1">
                      <div className="flex items-center gap-2">
                        <Label className={`text-xs font-medium ${changed ? "text-primary" : ""}`}>
                          {setting.label}
                          {changed && <span className="text-[9px] ml-1">●</span>}
                        </Label>
                      </div>
                      <p className="text-[11px] text-muted-foreground leading-snug">{setting.hint}</p>

                      {setting.type === "boolean" ? (
                        <div className="flex items-center gap-2 pt-1">
                          <Switch
                            checked={val === "true"}
                            onCheckedChange={v => updateVal(setting.key, v ? "true" : "false")}
                          />
                          <span className="text-xs text-muted-foreground">{val === "true" ? "Включено" : "Отключено"}</span>
                        </div>
                      ) : setting.type === "textarea" ? (
                        <Textarea
                          value={val}
                          onChange={e => updateVal(setting.key, e.target.value)}
                          className="text-xs min-h-[60px]"
                        />
                      ) : (
                        <div className="flex items-center gap-1.5">
                          <Input
                            type={setting.type === "number" ? "number" : "text"}
                            value={val}
                            onChange={e => updateVal(setting.key, e.target.value)}
                            className="text-xs h-8 w-[200px]"
                          />
                          {setting.suffix && <span className="text-xs text-muted-foreground">{setting.suffix}</span>}
                        </div>
                      )}
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Sticky save bar when changes exist */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-background border-t p-2 flex items-center justify-between -mx-3 -mb-3 px-3">
          <span className="text-xs text-muted-foreground">
            Изменено: {Object.keys(values).filter(k => values[k] !== original[k]).length} параметров
          </span>
          <Button size="sm" className="h-8 text-xs px-4" onClick={saveAll} disabled={saving}>
            <Save className="h-3 w-3 mr-1" />{saving ? "Сохранение..." : "Сохранить все изменения"}
          </Button>
        </div>
      )}
    </div>
  );
};

export default AdminSettingsPage;
