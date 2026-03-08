import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "sonner";
import { Crown, Trophy, Gift, Users, Sword, Copy, Loader2, Lock, Check, Sparkles } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface LoyaltyTier {
  id: string; name: string; min_spend: number; discount_percent: number; icon: string; color: string;
}
interface Achievement {
  id: string; name: string; description: string; icon: string; badge_color: string;
  condition_type: string; condition_value: number; reward_type: string; reward_value: number;
}
interface WheelPrize {
  id: string; label: string; prize_type: string; prize_value: number; probability: number; color: string;
}

export default function DashboardBonuses() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [tiers, setTiers] = useState<LoyaltyTier[]>([]);
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [earnedIds, setEarnedIds] = useState<Set<string>>(new Set());
  const [prizes, setPrizes] = useState<WheelPrize[]>([]);
  const [settings, setSettings] = useState<Record<string, string>>({});
  const [monthlySpend, setMonthlySpend] = useState(0);
  const [ordersCount, setOrdersCount] = useState(0);
  const [referralCode, setReferralCode] = useState("");
  const [referralCount, setReferralCount] = useState(0);
  const [spartanSlot, setSpartanSlot] = useState<number | null>(null);
  const [spartanCount, setSpartanCount] = useState(0);
  const [spinning, setSpinning] = useState(false);
  const [spinResult, setSpinResult] = useState<string | null>(null);
  const [spinsToday, setSpinsToday] = useState(0);
  const [wheelRotation, setWheelRotation] = useState(0);

  useEffect(() => {
    if (user) load();
  }, [user]);

  async function load() {
    setLoading(true);
    const keys = [
      "marketing_referral_enabled", "marketing_referral_bonus_referrer", "marketing_referral_bonus_referred",
      "marketing_wheel_enabled", "marketing_wheel_spins_per_day",
      "marketing_spartan_enabled", "marketing_spartan_max_slots", "marketing_spartan_discount",
      "marketing_loyalty_enabled", "marketing_loyalty_period_days",
    ];

    const [tiersRes, achRes, prizesRes, settingsRes, earnedRes, spartanMeRes, spartanCountRes, refCodeRes, refCountRes] = await Promise.all([
      supabase.from("loyalty_tiers").select("*").eq("is_enabled", true).order("min_spend"),
      supabase.from("achievements").select("*").eq("is_enabled", true).order("sort_order"),
      supabase.from("fortune_wheel_prizes").select("*").eq("is_enabled", true).order("sort_order"),
      supabase.from("app_settings").select("*").in("key", keys),
      supabase.from("user_achievements").select("achievement_id").eq("user_id", user!.id),
      supabase.from("spartan_members").select("slot_number").eq("user_id", user!.id).maybeSingle(),
      supabase.rpc("get_spartan_count"),
      supabase.from("referral_codes").select("*").eq("user_id", user!.id).maybeSingle(),
      supabase.from("referral_completions").select("id", { count: "exact", head: true }).eq("referrer_id", user!.id),
    ]);

    if (tiersRes.data) setTiers(tiersRes.data as LoyaltyTier[]);
    if (achRes.data) setAchievements(achRes.data as Achievement[]);
    if (prizesRes.data) setPrizes(prizesRes.data as WheelPrize[]);
    if (earnedRes.data) setEarnedIds(new Set(earnedRes.data.map((e: any) => e.achievement_id)));
    if (spartanMeRes.data) setSpartanSlot(spartanMeRes.data.slot_number);
    if (spartanCountRes.count !== null) setSpartanCount(spartanCountRes.count);
    if (refCodeRes.data) setReferralCode(refCodeRes.data.code);
    if (refCountRes.count !== null) setReferralCount(refCountRes.count);

    const s: Record<string, string> = {};
    settingsRes.data?.forEach((r: any) => { s[r.key] = r.value; });
    setSettings(s);

    // Monthly spend
    const periodDays = +(s.marketing_loyalty_period_days || "30");
    const since = new Date();
    since.setDate(since.getDate() - periodDays);
    const { data: orders } = await supabase.from("orders").select("price").eq("user_id", user!.id).gte("created_at", since.toISOString()).in("status", ["completed", "in_progress", "pending"]);
    const spend = orders?.reduce((sum, o: any) => sum + +o.price, 0) || 0;
    setMonthlySpend(spend);

    const { count: oc } = await supabase.from("orders").select("id", { count: "exact", head: true }).eq("user_id", user!.id);
    setOrdersCount(oc || 0);

    // Spins today
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const { count: sc } = await supabase.from("user_spins").select("id", { count: "exact", head: true }).eq("user_id", user!.id).gte("spun_at", today.toISOString());
    setSpinsToday(sc || 0);

    setLoading(false);
  }

  // Current tier
  const currentTier = tiers.filter(t => monthlySpend >= t.min_spend).pop();
  const nextTier = tiers.find(t => monthlySpend < t.min_spend);

  // Generate referral code
  async function generateReferralCode() {
    const code = user!.id.slice(0, 8).toUpperCase();
    const { error } = await supabase.from("referral_codes").insert({ user_id: user!.id, code });
    if (error) {
      toast.error("Ошибка создания кода");
    } else {
      setReferralCode(code);
      toast.success("Реферальный код создан!");
    }
  }

  // Spin wheel
  async function spin() {
    if (spinning) return;
    const maxSpins = +(settings.marketing_wheel_spins_per_day || "1");
    if (spinsToday >= maxSpins) {
      toast.error("Спины на сегодня исчерпаны");
      return;
    }

    setSpinning(true);
    setSpinResult(null);

    // Weighted random
    const total = prizes.reduce((s, p) => s + p.probability, 0);
    let rand = Math.random() * total;
    let winner = prizes[0];
    for (const p of prizes) {
      rand -= p.probability;
      if (rand <= 0) { winner = p; break; }
    }

    // Animate
    const prizeIndex = prizes.indexOf(winner);
    const segAngle = 360 / prizes.length;
    const targetAngle = 360 * 5 + (360 - (prizeIndex * segAngle + segAngle / 2));
    setWheelRotation(targetAngle);

    // Save spin
    await supabase.from("user_spins").insert({
      user_id: user!.id,
      prize_id: winner.id,
      prize_label: winner.label,
      prize_value: winner.prize_value,
    });

    setTimeout(() => {
      setSpinning(false);
      setSpinResult(winner.label);
      setSpinsToday((prev) => prev + 1);

      if (winner.prize_type === "balance" && winner.prize_value > 0) {
        toast.success(`🎉 Вы выиграли ${winner.prize_value} ₽ на баланс!`);
      } else if (winner.prize_type === "discount_percent") {
        toast.success(`🎉 Вы выиграли скидку ${winner.prize_value}%!`);
      } else if (winner.prize_type === "nothing") {
        toast.info("В следующий раз повезёт больше!");
      } else {
        toast.success(`🎉 ${winner.label}`);
      }
    }, 4000);
  }

  // Join spartans
  async function joinSpartans() {
    const maxSlots = +(settings.marketing_spartan_max_slots || "300");
    if (spartanCount >= maxSlots) {
      toast.error("Все места заняты!");
      return;
    }
    const { error } = await supabase.from("spartan_members").insert({
      user_id: user!.id,
      slot_number: spartanCount + 1,
      discount_percent: +(settings.marketing_spartan_discount || "20"),
    });
    if (error) {
      if (error.code === "23505") toast.info("Вы уже в программе!");
      else toast.error("Ошибка: " + error.message);
    } else {
      setSpartanSlot(spartanCount + 1);
      setSpartanCount((p) => p + 1);
      toast.success(`🎉 Вы спартанец #${spartanCount + 1}! Пожизненная скидка ${settings.marketing_spartan_discount}%`);
    }
  }

  if (loading) return <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>;

  const maxSpins = +(settings.marketing_wheel_spins_per_day || "1");
  const maxSlots = +(settings.marketing_spartan_max_slots || "300");

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold flex items-center gap-2"><Sparkles className="h-6 w-6 text-primary" /> Бонусы и награды</h1>
        <p className="text-sm text-muted-foreground">Зарабатывайте скидки, выполняйте задания, крутите колесо</p>
      </div>

      {/* Loyalty */}
      {settings.marketing_loyalty_enabled === "true" && tiers.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Crown className="h-4 w-4 text-amber-500" /> Ваш уровень лояльности</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center gap-3 mb-4">
              {currentTier ? (
                <div className="flex items-center gap-2">
                  <span className="text-3xl">{currentTier.icon}</span>
                  <div>
                    <p className="font-bold" style={{ color: currentTier.color }}>{currentTier.name}</p>
                    <p className="text-xs text-muted-foreground">Скидка {currentTier.discount_percent}% на все заказы</p>
                  </div>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Совершите первую покупку для получения уровня</p>
              )}
            </div>

            {nextTier && (
              <div className="space-y-2">
                <div className="flex justify-between text-xs">
                  <span>Потрачено: {monthlySpend.toLocaleString()} ₽</span>
                  <span>До «{nextTier.name}»: {(nextTier.min_spend - monthlySpend).toLocaleString()} ₽</span>
                </div>
                <Progress value={(monthlySpend / nextTier.min_spend) * 100} className="h-2" />
              </div>
            )}

            <div className="flex gap-2 mt-4 overflow-x-auto pb-2">
              {tiers.map((t) => {
                const active = currentTier?.id === t.id;
                return (
                  <div key={t.id} className={`flex-shrink-0 p-3 rounded-xl text-center min-w-[100px] border-2 transition-all ${active ? "scale-105 shadow-lg" : "opacity-60"}`} style={{ borderColor: t.color, background: `${t.color}10` }}>
                    <div className="text-xl">{t.icon}</div>
                    <div className="text-[10px] font-bold" style={{ color: t.color }}>{t.name}</div>
                    <Badge variant="secondary" className="text-[9px] mt-1">−{t.discount_percent}%</Badge>
                  </div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Achievements */}
      {achievements.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Trophy className="h-4 w-4 text-purple-500" /> Ачивки</CardTitle>
            <CardDescription>Выполняйте задания — получайте награды</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {achievements.map((ach) => {
                const earned = earnedIds.has(ach.id);
                return (
                  <motion.div
                    key={ach.id}
                    whileHover={{ scale: 1.03 }}
                    className={`p-3 rounded-xl border-2 text-center transition-all ${earned ? "shadow-md" : "opacity-50 grayscale"}`}
                    style={{ borderColor: earned ? ach.badge_color : "transparent", background: earned ? `${ach.badge_color}10` : undefined }}
                  >
                    <div className="text-2xl mb-1">{ach.icon}</div>
                    <p className="text-xs font-bold">{ach.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5">{ach.description}</p>
                    {earned ? (
                      <Badge className="mt-2 text-[9px]" style={{ background: ach.badge_color }}><Check className="h-2.5 w-2.5 mr-0.5" /> Получена</Badge>
                    ) : (
                      <Badge variant="outline" className="mt-2 text-[9px]"><Lock className="h-2.5 w-2.5 mr-0.5" /> {CONDITION_LABELS[ach.condition_type]}: {ach.condition_value}</Badge>
                    )}
                  </motion.div>
                );
              })}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Fortune Wheel */}
      {settings.marketing_wheel_enabled === "true" && prizes.length > 0 && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Gift className="h-4 w-4 text-blue-500" /> Колесо фортуны</CardTitle>
            <CardDescription>Спинов сегодня: {spinsToday} / {maxSpins}</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col items-center gap-4">
            <div className="relative">
              <svg width="260" height="260" viewBox="0 0 260 260" className="transition-transform" style={{ transform: `rotate(${wheelRotation}deg)`, transitionDuration: spinning ? "4s" : "0s", transitionTimingFunction: "cubic-bezier(0.17, 0.67, 0.12, 0.99)" }}>
                {prizes.map((p, i) => {
                  const segAngle = (2 * Math.PI) / prizes.length;
                  const startAngle = i * segAngle - Math.PI / 2;
                  const endAngle = startAngle + segAngle;
                  const cx = 130, cy = 130, r = 120;
                  const x1 = cx + r * Math.cos(startAngle);
                  const y1 = cy + r * Math.sin(startAngle);
                  const x2 = cx + r * Math.cos(endAngle);
                  const y2 = cy + r * Math.sin(endAngle);
                  const large = segAngle > Math.PI ? 1 : 0;
                  const midAngle = startAngle + segAngle / 2;
                  const lx = cx + r * 0.6 * Math.cos(midAngle);
                  const ly = cy + r * 0.6 * Math.sin(midAngle);
                  return (
                    <g key={i}>
                      <path d={`M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`} fill={p.color} stroke="white" strokeWidth={2} />
                      <text x={lx} y={ly} textAnchor="middle" dominantBaseline="middle" fill="white" fontSize="9" fontWeight="bold" transform={`rotate(${(midAngle * 180) / Math.PI}, ${lx}, ${ly})`}>{p.label.slice(0, 12)}</text>
                    </g>
                  );
                })}
                <circle cx={130} cy={130} r={18} fill="white" stroke="#e5e7eb" strokeWidth={2} />
              </svg>
              <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1">
                <div className="w-0 h-0 border-l-[8px] border-l-transparent border-r-[8px] border-r-transparent border-t-[14px] border-t-red-500" />
              </div>
            </div>

            <AnimatePresence>
              {spinResult && (
                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="text-center">
                  <p className="text-lg font-bold">🎉 {spinResult}</p>
                </motion.div>
              )}
            </AnimatePresence>

            <Button onClick={spin} disabled={spinning || spinsToday >= maxSpins} size="lg" className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
              {spinning ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Gift className="h-4 w-4 mr-2" />}
              {spinsToday >= maxSpins ? "Завтра будет новый спин" : "Крутить!"}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Referral */}
      {settings.marketing_referral_enabled === "true" && (
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2"><Users className="h-4 w-4 text-green-500" /> Реферальная программа</CardTitle>
            <CardDescription>Приглашайте друзей — получайте бонусы</CardDescription>
          </CardHeader>
          <CardContent>
            {referralCode ? (
              <div className="space-y-3">
                <div className="flex items-center gap-2">
                  <code className="flex-1 p-2 rounded bg-muted text-sm font-mono">
                    {window.location.origin}/auth?ref={referralCode}
                  </code>
                  <Button variant="outline" size="icon" onClick={() => { navigator.clipboard.writeText(`${window.location.origin}/auth?ref=${referralCode}`); toast.success("Скопировано!"); }}>
                    <Copy className="h-4 w-4" />
                  </Button>
                </div>
                <div className="flex gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold">{referralCount}</p>
                    <p className="text-[10px] text-muted-foreground">Приглашено</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold">{settings.marketing_referral_bonus_referrer || "100"} ₽</p>
                    <p className="text-[10px] text-muted-foreground">За каждого друга</p>
                  </div>
                </div>
              </div>
            ) : (
              <Button onClick={generateReferralCode}>Получить реферальную ссылку</Button>
            )}
          </CardContent>
        </Card>
      )}

      {/* 300 Spartans */}
      {settings.marketing_spartan_enabled === "true" && (
        <Card className="border-amber-500/30 bg-gradient-to-br from-amber-500/5 to-red-500/5">
          <CardHeader className="pb-3">
            <CardTitle className="text-base flex items-center gap-2">
              <Sword className="h-4 w-4 text-amber-500" /> Программа «300 Спартанцев»
            </CardTitle>
            <CardDescription>
              Первые {maxSlots} клиентов получают пожизненную скидку {settings.marketing_spartan_discount}%
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between text-sm">
                <span>Занято мест</span>
                <span className="font-mono font-bold">{spartanCount} / {maxSlots}</span>
              </div>
              <div className="w-full h-3 bg-muted rounded-full overflow-hidden">
                <motion.div
                  className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full"
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.min(100, (spartanCount / maxSlots) * 100)}%` }}
                  transition={{ duration: 1 }}
                />
              </div>

              {spartanSlot ? (
                <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 text-center">
                  <p className="text-sm font-bold text-amber-600">⚔️ Вы — Спартанец #{spartanSlot}</p>
                  <p className="text-xs text-muted-foreground">Пожизненная скидка {settings.marketing_spartan_discount}% применяется автоматически</p>
                </div>
              ) : spartanCount < maxSlots ? (
                <Button onClick={joinSpartans} className="w-full bg-gradient-to-r from-amber-500 to-red-500 text-white">
                  <Sword className="h-4 w-4 mr-2" /> Стать Спартанцем — скидка {settings.marketing_spartan_discount}% навсегда
                </Button>
              ) : (
                <p className="text-center text-sm text-muted-foreground">Все места заняты 😢</p>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

const CONDITION_LABELS: Record<string, string> = {
  orders_count: "Заказов",
  total_spend: "Потратить ₽",
  first_order: "Первый заказ",
  review_left: "Отзыв",
  referral_count: "Друзей",
  days_registered: "Дней",
};
