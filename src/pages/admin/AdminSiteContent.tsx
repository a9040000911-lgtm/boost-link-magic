import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Plus, Trash2, Save, GripVertical, Type, BarChart3, Sparkles, Megaphone, Globe } from "lucide-react";
import { toast } from "sonner";
import { SITE_KEYS, DEFAULTS } from "@/hooks/useSiteContent";

const GRADIENTS = [
  { value: "card-gradient-amber", label: "Оранжевый" },
  { value: "card-gradient-blue", label: "Синий" },
  { value: "card-gradient-violet", label: "Фиолетовый" },
  { value: "card-gradient-pink", label: "Розовый" },
];

const ICONS = ["Brain", "Shield", "Clock", "MousePointerClick", "Sparkles", "Zap"];

export default function AdminSiteContent() {
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Parsed arrays
  const [stats, setStats] = useState<{ value: string; label: string }[]>([]);
  const [features, setFeatures] = useState<{ icon: string; title: string; description: string; gradient: string }[]>([]);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    setLoading(true);
    const { data } = await supabase.from("app_settings").select("key, value").in("key", SITE_KEYS);
    const s: Record<string, string> = { ...DEFAULTS };
    (data || []).forEach((r: any) => { if (r.value) s[r.key] = r.value; });
    setSettings(s);

    try { setStats(JSON.parse(s.site_stats)); } catch { setStats([]); }
    try { setFeatures(JSON.parse(s.site_features)); } catch { setFeatures([]); }

    setLoading(false);
  }

  function updateSetting(key: string, value: string) {
    setSettings(prev => ({ ...prev, [key]: value }));
  }

  async function saveAll() {
    setSaving(true);
    const now = new Date().toISOString();

    // Serialize arrays back
    const toSave = {
      ...settings,
      site_stats: JSON.stringify(stats),
      site_features: JSON.stringify(features),
    };

    for (const key of SITE_KEYS) {
      const value = toSave[key] || DEFAULTS[key];
      await supabase.from("app_settings").upsert(
        { key, value, updated_at: now },
        { onConflict: "key" }
      );
    }

    toast.success("Контент сайта сохранён");
    setSaving(false);
  }

  if (loading) return <div className="text-center py-12 text-muted-foreground">Загрузка...</div>;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <Globe className="h-6 w-6 text-primary" /> Контент сайта
        </h1>
        <Button onClick={saveAll} disabled={saving}>
          <Save className="h-4 w-4 mr-2" />
          {saving ? "Сохранение..." : "Сохранить всё"}
        </Button>
      </div>

      <Tabs defaultValue="hero">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="hero" className="flex items-center gap-1 text-xs">
            <Type className="h-3.5 w-3.5" /> Hero
          </TabsTrigger>
          <TabsTrigger value="stats" className="flex items-center gap-1 text-xs">
            <BarChart3 className="h-3.5 w-3.5" /> Статистика
          </TabsTrigger>
          <TabsTrigger value="features" className="flex items-center gap-1 text-xs">
            <Sparkles className="h-3.5 w-3.5" /> Преимущества
          </TabsTrigger>
          <TabsTrigger value="footer" className="flex items-center gap-1 text-xs">
            <Megaphone className="h-3.5 w-3.5" /> Футер и CTA
          </TabsTrigger>
        </TabsList>

        {/* Hero */}
        <TabsContent value="hero" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Главный экран (Hero)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Заголовок (название бренда)</label>
                <Input
                  value={settings.site_hero_title || ""}
                  onChange={e => updateSetting("site_hero_title", e.target.value)}
                  placeholder="COOLLIKE"
                  className="text-lg font-bold"
                />
                <p className="text-[10px] text-muted-foreground mt-1">Каждая буква анимируется отдельно. Рекомендуется 4-10 символов.</p>
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Подзаголовок</label>
                <Input
                  value={settings.site_hero_subtitle || ""}
                  onChange={e => updateSetting("site_hero_subtitle", e.target.value)}
                  placeholder="Продвигайте свои соцсети"
                />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Stats */}
        <TabsContent value="stats" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Блок статистики</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {stats.map((s, i) => (
                <div key={i} className="flex gap-2 items-center">
                  <GripVertical className="h-4 w-4 text-muted-foreground/40 shrink-0" />
                  <Input
                    value={s.value}
                    onChange={e => {
                      const next = [...stats];
                      next[i] = { ...next[i], value: e.target.value };
                      setStats(next);
                    }}
                    placeholder="5K+"
                    className="w-24 h-8 text-xs font-bold"
                  />
                  <Input
                    value={s.label}
                    onChange={e => {
                      const next = [...stats];
                      next[i] = { ...next[i], label: e.target.value };
                      setStats(next);
                    }}
                    placeholder="Заказов выполнено"
                    className="flex-1 h-8 text-xs"
                  />
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setStats(stats.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3 w-3 text-destructive" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" className="text-xs" onClick={() => setStats([...stats, { value: "", label: "" }])}>
                <Plus className="h-3 w-3 mr-1" /> Добавить
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Features */}
        <TabsContent value="features" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Заголовок секции</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <Input
                value={settings.site_features_title || ""}
                onChange={e => updateSetting("site_features_title", e.target.value)}
                placeholder="Почему выбирают нас"
                className="h-8 text-xs"
              />
              <Textarea
                value={settings.site_features_subtitle || ""}
                onChange={e => updateSetting("site_features_subtitle", e.target.value)}
                placeholder="Описание секции"
                rows={2}
                className="text-xs"
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Карточки преимуществ ({features.length})</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {features.map((f, i) => (
                <div key={i} className="border rounded-lg p-3 space-y-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold text-muted-foreground w-5">{i + 1}</span>
                    <Input
                      value={f.title}
                      onChange={e => {
                        const next = [...features];
                        next[i] = { ...next[i], title: e.target.value };
                        setFeatures(next);
                      }}
                      placeholder="Заголовок"
                      className="flex-1 h-7 text-xs font-semibold"
                    />
                    <select
                      value={f.icon}
                      onChange={e => {
                        const next = [...features];
                        next[i] = { ...next[i], icon: e.target.value };
                        setFeatures(next);
                      }}
                      className="h-7 text-[10px] bg-muted rounded px-2 border-none"
                    >
                      {ICONS.map(ic => <option key={ic} value={ic}>{ic}</option>)}
                    </select>
                    <select
                      value={f.gradient}
                      onChange={e => {
                        const next = [...features];
                        next[i] = { ...next[i], gradient: e.target.value };
                        setFeatures(next);
                      }}
                      className="h-7 text-[10px] bg-muted rounded px-2 border-none"
                    >
                      {GRADIENTS.map(g => <option key={g.value} value={g.value}>{g.label}</option>)}
                    </select>
                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setFeatures(features.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3 w-3 text-destructive" />
                    </Button>
                  </div>
                  <Textarea
                    value={f.description}
                    onChange={e => {
                      const next = [...features];
                      next[i] = { ...next[i], description: e.target.value };
                      setFeatures(next);
                    }}
                    placeholder="Описание"
                    rows={2}
                    className="text-xs"
                  />
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                className="text-xs"
                onClick={() => setFeatures([...features, { icon: "Sparkles", title: "", description: "", gradient: "card-gradient-blue" }])}
              >
                <Plus className="h-3 w-3 mr-1" /> Добавить карточку
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Footer & CTA */}
        <TabsContent value="footer" className="space-y-3 mt-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Блок CTA (призыв к действию)</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Заголовок</label>
                <Input value={settings.site_cta_title || ""} onChange={e => updateSetting("site_cta_title", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Текст</label>
                <Textarea value={settings.site_cta_text || ""} onChange={e => updateSetting("site_cta_text", e.target.value)} rows={2} className="text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Текст кнопки</label>
                <Input value={settings.site_cta_button || ""} onChange={e => updateSetting("site_cta_button", e.target.value)} className="h-8 text-xs" />
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Футер</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Название бренда</label>
                <Input value={settings.site_brand_name || ""} onChange={e => updateSetting("site_brand_name", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Слоган</label>
                <Input value={settings.site_brand_tagline || ""} onChange={e => updateSetting("site_brand_tagline", e.target.value)} className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Telegram</label>
                <Input value={settings.site_social_telegram || ""} onChange={e => updateSetting("site_social_telegram", e.target.value)} placeholder="https://t.me/..." className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">WhatsApp</label>
                <Input value={settings.site_social_whatsapp || ""} onChange={e => updateSetting("site_social_whatsapp", e.target.value)} placeholder="https://wa.me/..." className="h-8 text-xs" />
              </div>
              <div>
                <label className="text-xs font-medium text-muted-foreground mb-1 block">Дисклеймер (внизу)</label>
                <Textarea value={settings.site_footer_disclaimer || ""} onChange={e => updateSetting("site_footer_disclaimer", e.target.value)} rows={2} className="text-xs" />
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
