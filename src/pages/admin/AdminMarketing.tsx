import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Plus, Trash2, Crown, Trophy, Gift, Users, Target, Sword, Save, Loader2 } from "lucide-react";

// ─── Types ───
interface LoyaltyTier {
  id?: string;
  name: string;
  min_spend: number;
  discount_percent: number;
  icon: string;
  color: string;
  sort_order: number;
  is_enabled: boolean;
}

interface Achievement {
  id?: string;
  name: string;
  description: string;
  icon: string;
  badge_color: string;
  condition_type: string;
  condition_value: number;
  reward_type: string;
  reward_value: number;
  is_enabled: boolean;
  sort_order: number;
}

interface WheelPrize {
  id?: string;
  label: string;
  prize_type: string;
  prize_value: number;
  probability: number;
  color: string;
  is_enabled: boolean;
  sort_order: number;
}

const CONDITION_TYPES: Record<string, string> = {
  orders_count: "Количество заказов",
  total_spend: "Сумма трат (₽)",
  first_order: "Первый заказ",
  review_left: "Оставил отзыв",
  referral_count: "Приглашено друзей",
  days_registered: "Дней с регистрации",
};

const REWARD_TYPES: Record<string, string> = {
  balance: "Бонус на баланс (₽)",
  discount_percent: "Скидка (%)",
  free_spin: "Бесплатный спин колеса",
};

const PRIZE_TYPES: Record<string, string> = {
  discount_percent: "Скидка на заказ (%)",
  balance: "Бонус на баланс (₽)",
  nothing: "Без приза",
  double_points: "Двойные бонусы (24ч)",
};

// ─── Marketing settings via app_settings ───
const MARKETING_KEYS = [
  "marketing_referral_enabled",
  "marketing_referral_bonus_referrer",
  "marketing_referral_bonus_referred",
  "marketing_wheel_enabled",
  "marketing_wheel_spins_per_day",
  "marketing_spartan_enabled",
  "marketing_spartan_max_slots",
  "marketing_spartan_discount",
  "marketing_loyalty_enabled",
  "marketing_loyalty_period_days",
];

const MARKETING_DEFAULTS: Record<string, string> = {
  marketing_referral_enabled: "true",
  marketing_referral_bonus_referrer: "100",
  marketing_referral_bonus_referred: "50",
  marketing_wheel_enabled: "true",
  marketing_wheel_spins_per_day: "1",
  marketing_spartan_enabled: "true",
  marketing_spartan_max_slots: "300",
  marketing_spartan_discount: "20",
  marketing_loyalty_enabled: "true",
  marketing_loyalty_period_days: "30",
};

export default function AdminMarketing() {
  const [tab, setTab] = useState("loyalty");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // Data
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [spartanCount, setSpartanCount] = useState(0);

  useEffect(() => {
    load();
  }, []);

  async function load() {
    setLoading(true);
    const [tiersRes, achievementsRes, prizesRes, settingsRes, spartanRes] = await Promise.all([
      supabase.from("loyalty_tiers").select("*").order("sort_order"),
      supabase.from("achievements").select("*").order("sort_order"),
      supabase.from("fortune_wheel_prizes").select("*").order("sort_order"),
      supabase.from("app_settings").select("*").in("key", MARKETING_KEYS),
      supabase.rpc("get_spartan_count"),
    ]);

    if (tiersRes.data) setTiers(tiersRes.data as LoyaltyTier[]);
    if (achievementsRes.data) setAchievements(achievementsRes.data as Achievement[]);
    if (prizesRes.data) setPrizes(prizesRes.data as WheelPrize[]);
    if (spartanRes.data !== null) setSpartanCount(spartanRes.data);

    const s = { ...MARKETING_DEFAULTS };
    settingsRes.data?.forEach((r: any) => { s[r.key] = r.value; });
    setSettings(s);
    setLoading(false);
  }

  function updateSetting(key: string, value: string) {
    setSettings((prev) => ({ ...prev, [key]: value }));
  }

  // ─── Save all ───
  async function saveAll() {
    setSaving(true);
    try {
      // Save settings
      for (const key of MARKETING_KEYS) {
        await supabase.from("app_settings").upsert({ key, value: settings[key] || MARKETING_DEFAULTS[key] }, { onConflict: "key" });
      }

      // Save tiers
      const existingTiers = tiers.filter((t) => t.id);
      const newTiers = tiers.filter((t) => !t.id);
      for (const t of existingTiers) {
        await supabase.from("loyalty_tiers").update({ name: t.name, min_spend: t.min_spend, discount_percent: t.discount_percent, icon: t.icon, color: t.color, sort_order: t.sort_order, is_enabled: t.is_enabled }).eq("id", t.id!);
      }
      for (const t of newTiers) {
        await supabase.from("loyalty_tiers").insert({ name: t.name, min_spend: t.min_spend, discount_percent: t.discount_percent, icon: t.icon, color: t.color, sort_order: t.sort_order, is_enabled: t.is_enabled });
      }

      // Save achievements
      const existingAch = achievements.filter((a) => a.id);
      const newAch = achievements.filter((a) => !a.id);
      for (const a of existingAch) {
        await supabase.from("achievements").update({ name: a.name, description: a.description, icon: a.icon, badge_color: a.badge_color, condition_type: a.condition_type, condition_value: a.condition_value, reward_type: a.reward_type, reward_value: a.reward_value, is_enabled: a.is_enabled, sort_order: a.sort_order }).eq("id", a.id!);
      }
      for (const a of newAch) {
        await supabase.from("achievements").insert({ name: a.name, description: a.description, icon: a.icon, badge_color: a.badge_color, condition_type: a.condition_type, condition_value: a.condition_value, reward_type: a.reward_type, reward_value: a.reward_value, is_enabled: a.is_enabled, sort_order: a.sort_order });
      }

      // Save prizes
      const existingPrizes = prizes.filter((p) => p.id);
      const newPrizes = prizes.filter((p) => !p.id);
      for (const p of existingPrizes) {
        await supabase.from("fortune_wheel_prizes").update({ label: p.label, prize_type: p.prize_type, prize_value: p.prize_value, probability: p.probability, color: p.color, is_enabled: p.is_enabled, sort_order: p.sort_order }).eq("id", p.id!);
      }
      for (const p of newPrizes) {
        await supabase.from("fortune_wheel_prizes").insert({ label: p.label, prize_type: p.prize_type, prize_value: p.prize_value, probability: p.probability, color: p.color, is_enabled: p.is_enabled, sort_order: p.sort_order });
      }

      toast.success("Маркетинг сохранён");
      load();
    } catch (e: any) {
      toast.error("Ошибка сохранения: " + e.message);
    } finally {
      setSaving(false);
    }
  }

  async function deleteTier(id: string) {
    await supabase.from("loyalty_tiers").delete().eq("id", id);
    setTiers((prev) => prev.filter((t) => t.id !== id));
  }

  async function deleteAchievement(id: string) {
    await supabase.from("achievements").delete().eq("id", id);
    setAchievements((prev) => prev.filter((a) => a.id !== id));
  }

  async function deletePrize(id: string) {
    await supabase.from("fortune_wheel_prizes").delete().eq("id", id);
    setPrizes((prev) => prev.filter((p) => p.id !== id));
  }

  if (loading) {
    return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;
  }

  const totalProbability = prizes.reduce((s, p) => s + p.probability, 0);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Маркетинг</h1>
          <p className="text-sm text-muted-foreground">Скидки, ачивки, геймификация и воронки</p>
        </div>
        <Button onClick={saveAll} disabled={saving}>
          {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Save className="h-4 w-4 mr-2" />}
          Сохранить всё
        </Button>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="grid grid-cols-5 w-full">
          <TabsTrigger value="loyalty" className="text-xs gap-1"><Crown className="h-3.5 w-3.5" /> Лояльность</TabsTrigger>
          <TabsTrigger value="achievements" className="text-xs gap-1"><Trophy className="h-3.5 w-3.5" /> Ачивки</TabsTrigger>
          <TabsTrigger value="wheel" className="text-xs gap-1"><Gift className="h-3.5 w-3.5" /> Колесо</TabsTrigger>
          <TabsTrigger value="referral" className="text-xs gap-1"><Users className="h-3.5 w-3.5" /> Рефералы</TabsTrigger>
          <TabsTrigger value="spartan" className="text-xs gap-1"><Sword className="h-3.5 w-3.5" /> 300 Спартанцев</TabsTrigger>
        </TabsList>

        {/* ─── Loyalty Tiers ─── */}
        <TabsContent value="loyalty" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Накопительные скидки</CardTitle>
                  <CardDescription>Чем больше тратит клиент за период — тем выше скидка</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Период (дней)</Label>
                    <Input className="w-16 h-8 text-xs" type="number" value={settings.marketing_loyalty_period_days} onChange={(e) => updateSetting("marketing_loyalty_period_days", e.target.value)} />
                  </div>
                  <Switch checked={settings.marketing_loyalty_enabled === "true"} onCheckedChange={(v) => updateSetting("marketing_loyalty_enabled", v ? "true" : "false")} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {tiers.map((tier, i) => (
                <div key={tier.id || `new-${i}`} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                  <Input className="w-10 h-8 text-center text-xs" value={tier.icon} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], icon: e.target.value }; setTiers(n); }} placeholder="🔥" />
                  <Input className="flex-1 h-8 text-xs" value={tier.name} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], name: e.target.value }; setTiers(n); }} placeholder="Название уровня" />
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">от</span>
                    <Input className="w-20 h-8 text-xs" type="number" value={tier.min_spend} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], min_spend: +e.target.value }; setTiers(n); }} />
                    <span className="text-[10px] text-muted-foreground">₽</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">→</span>
                    <Input className="w-16 h-8 text-xs" type="number" value={tier.discount_percent} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], discount_percent: +e.target.value }; setTiers(n); }} />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                  <input type="color" value={tier.color} onChange={(e) => { const n = [...tiers]; n[i] = { ...n[i], color: e.target.value }; setTiers(n); }} className="w-8 h-8 rounded cursor-pointer border-0" />
                  <Switch checked={tier.is_enabled} onCheckedChange={(v) => { const n = [...tiers]; n[i] = { ...n[i], is_enabled: v }; setTiers(n); }} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => tier.id ? deleteTier(tier.id) : setTiers(tiers.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setTiers([...tiers, { name: "", min_spend: 0, discount_percent: 0, icon: "⭐", color: "#FFD700", sort_order: tiers.length, is_enabled: true }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Добавить уровень
              </Button>
            </CardContent>
          </Card>

          {/* Preview */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm">Предпросмотр лестницы</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-2 overflow-x-auto pb-2">
                {tiers.filter(t => t.is_enabled).sort((a, b) => a.min_spend - b.min_spend).map((t, i) => (
                  <div key={i} className="flex-shrink-0 p-3 rounded-xl text-center min-w-[120px] border-2" style={{ borderColor: t.color, background: `${t.color}10` }}>
                    <div className="text-2xl mb-1">{t.icon}</div>
                    <div className="text-xs font-bold" style={{ color: t.color }}>{t.name}</div>
                    <div className="text-[10px] text-muted-foreground mt-1">от {t.min_spend.toLocaleString()} ₽</div>
                    <Badge variant="secondary" className="mt-1 text-[10px]">−{t.discount_percent}%</Badge>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Achievements ─── */}
        <TabsContent value="achievements" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Система ачивок</CardTitle>
                  <CardDescription>Награды за действия — мотивация к активности</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              {achievements.map((ach, i) => (
                <div key={ach.id || `new-${i}`} className="p-3 rounded-lg border bg-muted/30 space-y-2">
                  <div className="flex items-center gap-2">
                    <Input className="w-10 h-8 text-center text-xs" value={ach.icon} onChange={(e) => { const n = [...achievements]; n[i] = { ...n[i], icon: e.target.value }; setAchievements(n); }} />
                    <Input className="flex-1 h-8 text-xs" value={ach.name} onChange={(e) => { const n = [...achievements]; n[i] = { ...n[i], name: e.target.value }; setAchievements(n); }} placeholder="Название" />
                    <input type="color" value={ach.badge_color} onChange={(e) => { const n = [...achievements]; n[i] = { ...n[i], badge_color: e.target.value }; setAchievements(n); }} className="w-8 h-8 rounded cursor-pointer border-0" />
                    <Switch checked={ach.is_enabled} onCheckedChange={(v) => { const n = [...achievements]; n[i] = { ...n[i], is_enabled: v }; setAchievements(n); }} />
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => ach.id ? deleteAchievement(ach.id) : setAchievements(achievements.filter((_, j) => j !== i))}>
                      <Trash2 className="h-3.5 w-3.5" />
                    </Button>
                  </div>
                  <Input className="h-8 text-xs" value={ach.description} onChange={(e) => { const n = [...achievements]; n[i] = { ...n[i], description: e.target.value }; setAchievements(n); }} placeholder="Описание для пользователя" />
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <Label className="text-[10px]">Условие</Label>
                      <Select value={ach.condition_type} onValueChange={(v) => { const n = [...achievements]; n[i] = { ...n[i], condition_type: v }; setAchievements(n); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(CONDITION_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="text-[10px]">Значение</Label>
                      <Input className="h-8 text-xs" type="number" value={ach.condition_value} onChange={(e) => { const n = [...achievements]; n[i] = { ...n[i], condition_value: +e.target.value }; setAchievements(n); }} />
                    </div>
                    <div className="flex-1">
                      <Label className="text-[10px]">Награда</Label>
                      <Select value={ach.reward_type} onValueChange={(v) => { const n = [...achievements]; n[i] = { ...n[i], reward_type: v }; setAchievements(n); }}>
                        <SelectTrigger className="h-8 text-xs"><SelectValue /></SelectTrigger>
                        <SelectContent>
                          {Object.entries(REWARD_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="w-24">
                      <Label className="text-[10px]">Размер</Label>
                      <Input className="h-8 text-xs" type="number" value={ach.reward_value} onChange={(e) => { const n = [...achievements]; n[i] = { ...n[i], reward_value: +e.target.value }; setAchievements(n); }} />
                    </div>
                  </div>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setAchievements([...achievements, { name: "", description: "", icon: "🏆", badge_color: "#8B5CF6", condition_type: "orders_count", condition_value: 1, reward_type: "balance", reward_value: 50, is_enabled: true, sort_order: achievements.length }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Добавить ачивку
              </Button>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── Fortune Wheel ─── */}
        <TabsContent value="wheel" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Колесо фортуны</CardTitle>
                  <CardDescription>Ежедневный спин — случайный приз</CardDescription>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <Label className="text-xs">Спинов/день</Label>
                    <Input className="w-14 h-8 text-xs" type="number" value={settings.marketing_wheel_spins_per_day} onChange={(e) => updateSetting("marketing_wheel_spins_per_day", e.target.value)} />
                  </div>
                  <Switch checked={settings.marketing_wheel_enabled === "true"} onCheckedChange={(v) => updateSetting("marketing_wheel_enabled", v ? "true" : "false")} />
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {totalProbability !== 100 && prizes.length > 0 && (
                <div className="text-xs text-destructive bg-destructive/10 rounded-lg px-3 py-2">
                  ⚠️ Сумма вероятностей: {totalProbability}% (должна быть 100%)
                </div>
              )}
              {prizes.map((prize, i) => (
                <div key={prize.id || `new-${i}`} className="flex items-center gap-2 p-2 rounded-lg border bg-muted/30">
                  <input type="color" value={prize.color} onChange={(e) => { const n = [...prizes]; n[i] = { ...n[i], color: e.target.value }; setPrizes(n); }} className="w-8 h-8 rounded cursor-pointer border-0" />
                  <Input className="flex-1 h-8 text-xs" value={prize.label} onChange={(e) => { const n = [...prizes]; n[i] = { ...n[i], label: e.target.value }; setPrizes(n); }} placeholder="Текст сегмента" />
                  <Select value={prize.prize_type} onValueChange={(v) => { const n = [...prizes]; n[i] = { ...n[i], prize_type: v }; setPrizes(n); }}>
                    <SelectTrigger className="w-40 h-8 text-xs"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {Object.entries(PRIZE_TYPES).map(([k, v]) => <SelectItem key={k} value={k}>{v}</SelectItem>)}
                    </SelectContent>
                  </Select>
                  <Input className="w-16 h-8 text-xs" type="number" value={prize.prize_value} onChange={(e) => { const n = [...prizes]; n[i] = { ...n[i], prize_value: +e.target.value }; setPrizes(n); }} placeholder="Размер" />
                  <div className="flex items-center gap-1">
                    <Input className="w-14 h-8 text-xs" type="number" value={prize.probability} onChange={(e) => { const n = [...prizes]; n[i] = { ...n[i], probability: +e.target.value }; setPrizes(n); }} />
                    <span className="text-[10px] text-muted-foreground">%</span>
                  </div>
                  <Switch checked={prize.is_enabled} onCheckedChange={(v) => { const n = [...prizes]; n[i] = { ...n[i], is_enabled: v }; setPrizes(n); }} />
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive" onClick={() => prize.id ? deletePrize(prize.id) : setPrizes(prizes.filter((_, j) => j !== i))}>
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              ))}
              <Button variant="outline" size="sm" onClick={() => setPrizes([...prizes, { label: "", prize_type: "discount_percent", prize_value: 5, probability: 10, color: "#3B82F6", is_enabled: true, sort_order: prizes.length }])}>
                <Plus className="h-3.5 w-3.5 mr-1" /> Добавить сегмент
              </Button>
            </CardContent>
          </Card>

          {/* Wheel preview */}
          {prizes.filter(p => p.is_enabled).length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm">Предпросмотр колеса</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex justify-center">
                  <WheelPreview prizes={prizes.filter(p => p.is_enabled)} />
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* ─── Referral ─── */}
        <TabsContent value="referral" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base">Реферальная программа</CardTitle>
                  <CardDescription>Приведи друга — оба получите бонус при первом пополнении</CardDescription>
                </div>
                <Switch checked={settings.marketing_referral_enabled === "true"} onCheckedChange={(v) => updateSetting("marketing_referral_enabled", v ? "true" : "false")} />
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Бонус пригласившему (₽)</Label>
                  <Input type="number" value={settings.marketing_referral_bonus_referrer} onChange={(e) => updateSetting("marketing_referral_bonus_referrer", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Зачисляется при первом пополнении друга</p>
                </div>
                <div>
                  <Label className="text-xs">Бонус приглашённому (₽)</Label>
                  <Input type="number" value={settings.marketing_referral_bonus_referred} onChange={(e) => updateSetting("marketing_referral_bonus_referred", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Зачисляется при регистрации по ссылке</p>
                </div>
              </div>
              <div className="mt-4 p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-1">Как работает:</p>
                <ol className="text-[10px] text-muted-foreground space-y-1 list-decimal pl-3">
                  <li>Пользователь получает уникальную реферальную ссылку в разделе «Бонусы»</li>
                  <li>Друг регистрируется по ссылке и получает {settings.marketing_referral_bonus_referred} ₽ на баланс</li>
                  <li>При первом пополнении друга, пригласивший получает {settings.marketing_referral_bonus_referrer} ₽</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ─── 300 Spartans ─── */}
        <TabsContent value="spartan" className="space-y-4">
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-base flex items-center gap-2">
                    <Sword className="h-5 w-5 text-amber-500" />
                    Программа «300 Спартанцев»
                  </CardTitle>
                  <CardDescription>Первые клиенты получают пожизненную скидку — создаёт ажиотаж и срочность</CardDescription>
                </div>
                <Switch checked={settings.marketing_spartan_enabled === "true"} onCheckedChange={(v) => updateSetting("marketing_spartan_enabled", v ? "true" : "false")} />
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs">Макс. мест</Label>
                  <Input type="number" value={settings.marketing_spartan_max_slots} onChange={(e) => updateSetting("marketing_spartan_max_slots", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Сколько человек могут попасть в программу</p>
                </div>
                <div>
                  <Label className="text-xs">Пожизненная скидка (%)</Label>
                  <Input type="number" value={settings.marketing_spartan_discount} onChange={(e) => updateSetting("marketing_spartan_discount", e.target.value)} />
                  <p className="text-[10px] text-muted-foreground mt-1">Применяется ко всем заказам навсегда</p>
                </div>
              </div>

              {/* Progress */}
              <div className="p-4 rounded-xl bg-gradient-to-r from-amber-500/10 to-red-500/10 border border-amber-500/20">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-bold">Занято мест</span>
                  <span className="text-sm font-mono">{spartanCount} / {settings.marketing_spartan_max_slots}</span>
                </div>
                <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-amber-500 to-red-500 transition-all rounded-full"
                    style={{ width: `${Math.min(100, (spartanCount / +settings.marketing_spartan_max_slots) * 100)}%` }}
                  />
                </div>
                <p className="text-[10px] text-muted-foreground mt-2">
                  Осталось {Math.max(0, +settings.marketing_spartan_max_slots - spartanCount)} мест. Пользователи видят прогресс-бар в реальном времени.
                </p>
              </div>

              <div className="p-3 bg-muted/50 rounded-lg">
                <p className="text-xs font-medium mb-1">Маркетинговая механика:</p>
                <ul className="text-[10px] text-muted-foreground space-y-1 list-disc pl-3">
                  <li>Создаёт эффект <strong>дефицита</strong> — ограниченное количество мест</li>
                  <li>Прогресс-бар с обратным отсчётом усиливает <strong>срочность</strong></li>
                  <li>Пожизненная скидка — мощный <strong>якорь удержания</strong></li>
                  <li>Пользователь может присоединиться при первом пополнении баланса</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

// ─── Wheel Preview SVG ───
function WheelPreview({ prizes }: { prizes: WheelPrize[] }) {
  const total = prizes.reduce((s, p) => s + p.probability, 0);
  const size = 200;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;

  let currentAngle = -Math.PI / 2;
  const segments = prizes.map((p) => {
    const angle = (p.probability / (total || 1)) * Math.PI * 2;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;

    const x1 = cx + r * Math.cos(startAngle);
    const y1 = cy + r * Math.sin(startAngle);
    const x2 = cx + r * Math.cos(endAngle);
    const y2 = cy + r * Math.sin(endAngle);
    const largeArc = angle > Math.PI ? 1 : 0;

    const midAngle = startAngle + angle / 2;
    const labelR = r * 0.65;
    const lx = cx + labelR * Math.cos(midAngle);
    const ly = cy + labelR * Math.sin(midAngle);

    return { ...p, x1, y1, x2, y2, largeArc, lx, ly, midAngle };
  });

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      {segments.map((seg, i) => (
        <g key={i}>
          <path
            d={`M ${cx} ${cy} L ${seg.x1} ${seg.y1} A ${r} ${r} 0 ${seg.largeArc} 1 ${seg.x2} ${seg.y2} Z`}
            fill={seg.color}
            stroke="white"
            strokeWidth={2}
          />
          <text
            x={seg.lx}
            y={seg.ly}
            textAnchor="middle"
            dominantBaseline="middle"
            fill="white"
            fontSize="8"
            fontWeight="bold"
            transform={`rotate(${(seg.midAngle * 180) / Math.PI}, ${seg.lx}, ${seg.ly})`}
          >
            {seg.label.slice(0, 10)}
          </text>
        </g>
      ))}
      <circle cx={cx} cy={cy} r={15} fill="white" stroke="#e5e7eb" strokeWidth={2} />
      <polygon points={`${cx},${cy - r - 8} ${cx - 6},${cy - r + 4} ${cx + 6},${cy - r + 4}`} fill="#EF4444" />
    </svg>
  );
}
