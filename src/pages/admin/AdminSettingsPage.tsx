import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Save, RefreshCw, MessageSquare, Shield, Wallet, ShoppingCart, Clock, MessageCircle, Mail, Sparkles, Globe, Wrench } from "lucide-react";
import { toast } from "sonner";

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

  // AI Support
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

  // Catalog
  { key: "show_offer_checkbox", label: "Чекбокс Оферты", hint: "Показывать чекбокс принятия оферты при оформлении заказа", type: "boolean", group: "catalog" },
  { key: "show_policy_checkbox", label: "Чекбокс Политики", hint: "Показывать чекбокс согласия с Политикой и Правилами при оформлении заказа", type: "boolean", group: "catalog" },
  { key: "offer_default_checked", label: "Оферта включена по умолчанию", hint: "Если включено — чекбокс оферты будет отмечен при загрузке страницы", type: "boolean", group: "catalog" },
  { key: "policy_default_checked", label: "Политика включена по умолчанию", hint: "Если включено — чекбокс политики будет отмечен при загрузке страницы", type: "boolean", group: "catalog" },

  // Orders
  { key: "max_orders_per_day", label: "Лимит заказов в день", hint: "Максимальное количество заказов, которое один пользователь может сделать за сутки (0 = без ограничений)", type: "number", group: "orders" },
  { key: "min_order_amount", label: "Минимальная сумма заказа", hint: "Заказы дешевле этой суммы не будут приняты", type: "number", suffix: "₽", group: "orders" },
  { key: "default_markup_percent", label: "Наценка по умолчанию", hint: "Процент наценки, который добавляется к закупочной цене провайдера при создании новой услуги", type: "number", suffix: "%", group: "orders" },
  { key: "markup_ladder", label: "Лестница наценок (JSON)", hint: "Автоматические ступени наценки от закупочной цены. Формат: [{\"maxRate\":20,\"markup\":80},{\"maxRate\":50,\"markup\":60},{\"maxRate\":150,\"markup\":40},{\"maxRate\":500,\"markup\":30},{\"maxRate\":99999,\"markup\":20}]", type: "textarea", group: "orders" },
  { key: "min_markup_percent", label: "Минимальная наценка", hint: "Защита от продажи ниже себестоимости. Нельзя установить наценку ниже этого % (200% = цена продажи ≥ 3× закупки)", type: "number", suffix: "%", group: "orders" },

  // Finance
  { key: "min_deposit_amount", label: "Мин. сумма пополнения", hint: "Минимальная сумма, на которую пользователь может пополнить баланс", type: "number", suffix: "₽", group: "finance" },
  { key: "min_withdraw_amount", label: "Мин. сумма вывода", hint: "Минимальная сумма для запроса вывода средств", type: "number", suffix: "₽", group: "finance" },
  { key: "new_user_bonus", label: "Бонус новому пользователю", hint: "Сумма, которая автоматически начисляется на баланс при регистрации (0 = отключено)", type: "number", suffix: "₽", group: "finance" },

  // License
  { key: "license_key", label: "Лицензионный ключ", hint: "Введите лицензионный ключ один раз — он будет действовать для всего сайта. Получите ключ при покупке лицензии", type: "text", group: "license" },

  // System
  { key: "maintenance_mode", label: "Режим обслуживания", hint: "Когда включено — обычные пользователи видят заглушку «сайт временно недоступен», админы работают как обычно", type: "boolean", group: "system" },
  { key: "telegram_notifications", label: "Telegram уведомления", hint: "Отправлять ли уведомления о новых заказах и тикетах в Telegram-бот", type: "boolean", group: "system" },
  { key: "auto_confirm_email", label: "Авто-подтверждение email", hint: "Если включено — пользователи не должны подтверждать email при регистрации. Отключите для дополнительной безопасности", type: "boolean", group: "system" },

  // Plans
  { key: "plan_standard_max_orders_month", label: "Макс. заказов/мес", hint: "Лимит заказов в месяц для плана Standard (0 = без ограничений)", type: "number", group: "plan_standard" },
  { key: "plan_standard_max_order_amount", label: "Макс. сумма заказа", hint: "Максимальная сумма одного заказа (0 = без ограничений)", type: "number", suffix: "₽", group: "plan_standard" },
  { key: "plan_standard_max_projects", label: "Макс. проектов", hint: "Максимальное количество проектов (0 = без ограничений)", type: "number", group: "plan_standard" },
  { key: "plan_standard_support_priority", label: "Приоритет поддержки", hint: "normal / high / urgent", type: "text", group: "plan_standard" },
  { key: "plan_standard_bulk_orders", label: "Массовые заказы", hint: "Доступ к массовым заказам", type: "boolean", group: "plan_standard" },
  { key: "plan_pro_max_orders_month", label: "Макс. заказов/мес", hint: "Лимит заказов в месяц для плана Pro (0 = без ограничений)", type: "number", group: "plan_pro" },
  { key: "plan_pro_max_order_amount", label: "Макс. сумма заказа", hint: "Максимальная сумма одного заказа (0 = без ограничений)", type: "number", suffix: "₽", group: "plan_pro" },
  { key: "plan_pro_max_projects", label: "Макс. проектов", hint: "Максимальное количество проектов (0 = без ограничений)", type: "number", group: "plan_pro" },
  { key: "plan_pro_support_priority", label: "Приоритет поддержки", hint: "normal / high / urgent", type: "text", group: "plan_pro" },
  { key: "plan_pro_bulk_orders", label: "Массовые заказы", hint: "Доступ к массовым заказам", type: "boolean", group: "plan_pro" },
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
  { id: "ai_support", label: "ИИ-ассистент поддержки", icon: Sparkles, description: "Провайдер, режим и контекст для ИИ-помощника (веб + Telegram)" },
  { id: "support", label: "Поддержка", icon: MessageSquare, description: "Настройки тикетов и общения с клиентами" },
  { id: "catalog", label: "Каталог", icon: ShoppingCart, description: "Чекбоксы согласий и отображение при оформлении заказа" },
  { id: "orders", label: "Заказы", icon: ShoppingCart, description: "Лимиты и наценки на заказы" },
  { id: "finance", label: "Финансы", icon: Wallet, description: "Пополнения, выводы и бонусы" },
  { id: "license", label: "Лицензия", icon: Shield, description: "Глобальный лицензионный ключ для всего сайта — вводится один раз" },
  { id: "system", label: "Система", icon: Shield, description: "Технический режим и уведомления" },
  { id: "plan_standard", label: "План Standard", icon: Clock, description: "Лимиты базового плана лицензии" },
  { id: "plan_pro", label: "План Pro", icon: Clock, description: "Лимиты расширенного плана лицензии" },
  { id: "plan_enterprise", label: "План Enterprise", icon: Clock, description: "Лимиты корпоративного плана лицензии" },
];

// Tabs that group the GROUPS
const TABS = [
  { id: "general", label: "Общие", icon: Globe, groupIds: ["contacts", "system", "license"] },
  { id: "support", label: "Поддержка", icon: MessageSquare, groupIds: ["support", "telegram_support", "email_support", "ai_support"] },
  { id: "commerce", label: "Каталог и заказы", icon: ShoppingCart, groupIds: ["catalog", "orders"] },
  { id: "finance", label: "Финансы", icon: Wallet, groupIds: ["finance"] },
  { id: "plans", label: "Тарифы", icon: Clock, groupIds: ["plan_standard", "plan_pro", "plan_enterprise"] },
];

const SettingField = ({ setting, val, changed, updateVal }: { setting: SettingMeta; val: string; changed: boolean; updateVal: (key: string, val: string) => void }) => (
  <div className="space-y-1">
    <div className="flex items-center gap-2">
      <Label className={`text-xs font-medium ${changed ? "text-primary" : ""}`}>
        {setting.label}
        {changed && <span className="text-[9px] ml-1">●</span>}
      </Label>
    </div>
    <p className="text-[11px] text-muted-foreground leading-snug">{setting.hint}</p>
    {setting.type === "boolean" ? (
      <div className="flex items-center gap-2 pt-1">
        <Switch checked={val === "true"} onCheckedChange={v => updateVal(setting.key, v ? "true" : "false")} />
        <span className="text-xs text-muted-foreground">{val === "true" ? "Включено" : "Отключено"}</span>
      </div>
    ) : setting.type === "textarea" ? (
      <Textarea value={val} onChange={e => updateVal(setting.key, e.target.value)} className="text-xs min-h-[60px]" />
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

const AdminSettingsPage = () => {
  const [values, setValues] = useState<Record<string, string>>({});
  const [original, setOriginal] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("general");

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

  const changedKeys = Object.keys(values).filter(k => values[k] !== original[k]);
  const hasChanges = changedKeys.length > 0;

  const saveAll = async () => {
    setSaving(true);
    try {
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
    <div className="flex flex-col h-full gap-3">
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
            <Save className="h-3 w-3 mr-1" />{saving ? "..." : `Сохранить${hasChanges ? ` (${changedKeys.length})` : ""}`}
          </Button>
        </div>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
        <TabsList className="h-8 shrink-0 w-fit">
          {TABS.map(tab => {
            const TabIcon = tab.icon;
            const tabChanges = tab.groupIds.flatMap(gid =>
              SETTINGS_META.filter(s => s.group === gid).map(s => s.key)
            ).filter(k => values[k] !== original[k]).length;
            return (
              <TabsTrigger key={tab.id} value={tab.id} className="text-xs h-7 px-3 gap-1.5">
                <TabIcon className="h-3 w-3" />
                {tab.label}
                {tabChanges > 0 && (
                  <span className="bg-primary text-primary-foreground text-[9px] rounded-full px-1.5 min-w-[16px] text-center">{tabChanges}</span>
                )}
              </TabsTrigger>
            );
          })}
        </TabsList>

        <div className="flex-1 min-h-0 overflow-auto mt-3">
          {TABS.map(tab => (
            <TabsContent key={tab.id} value={tab.id} className="mt-0 space-y-4">
              {tab.groupIds.map(groupId => {
                const group = GROUPS.find(g => g.id === groupId);
                if (!group) return null;
                const GroupIcon = group.icon;
                const groupSettings = SETTINGS_META.filter(s => s.group === groupId);
                if (groupSettings.length === 0) return null;
                return (
                  <Card key={groupId} className="border-border/60">
                    <CardHeader className="p-4 pb-2">
                      <CardTitle className="text-sm font-bold flex items-center gap-2">
                        <GroupIcon className="h-4 w-4 text-primary" />
                        {group.label}
                        <span className="text-[11px] font-normal text-muted-foreground ml-1">— {group.description}</span>
                      </CardTitle>
                    </CardHeader>
                    <CardContent className="p-4 pt-2 space-y-4">
                      {groupSettings.map(setting => (
                        <SettingField
                          key={setting.key}
                          setting={setting}
                          val={values[setting.key] ?? ""}
                          changed={(values[setting.key] ?? "") !== (original[setting.key] ?? "")}
                          updateVal={updateVal}
                        />
                      ))}
                    </CardContent>
                  </Card>
                );
              })}
            </TabsContent>
          ))}
        </div>
      </Tabs>

      {/* Sticky save bar */}
      {hasChanges && (
        <div className="sticky bottom-0 bg-background border-t p-2 flex items-center justify-between shrink-0">
          <span className="text-xs text-muted-foreground">
            Изменено: {changedKeys.length} параметров
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
