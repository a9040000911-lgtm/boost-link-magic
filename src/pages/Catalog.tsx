import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Package, Link2, Mail, Minus, Plus, Sparkles, Check,
  BarChart3, Zap, Clock, Timer, Snail, TrendingUp, Shield, ShieldCheck, ShieldAlert,
  HelpCircle, Info, X
} from "lucide-react";
import { Input } from "@/components/ui/input";
import PlatformIcon from "@/components/PlatformIcon";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";

interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  min_quantity: number;
  max_quantity: number;
  category: string;
  network: string;
  speed: string;
  guarantee: string;
}

/* ─── Speed & Guarantee display helpers ─── */
const speedMeta: Record<string, { label: string; icon: typeof Zap; color: string }> = {
  instant: { label: "Мгновенно", icon: Zap, color: "text-green-500" },
  fast: { label: "Быстро", icon: TrendingUp, color: "text-emerald-500" },
  medium: { label: "Средне", icon: Clock, color: "text-amber-500" },
  slow: { label: "Медленно", icon: Timer, color: "text-orange-500" },
  gradual: { label: "Постепенно", icon: Snail, color: "text-blue-500" },
};

const guaranteeMeta: Record<string, { label: string; icon: typeof Shield; color: string }> = {
  none: { label: "Без гарантии", icon: ShieldAlert, color: "text-muted-foreground" },
  "7d": { label: "7 дней", icon: Shield, color: "text-blue-500" },
  "30d": { label: "30 дней", icon: ShieldCheck, color: "text-emerald-500" },
  "60d": { label: "60 дней", icon: ShieldCheck, color: "text-green-500" },
  lifetime: { label: "Навсегда", icon: ShieldCheck, color: "text-primary" },
};

const getSpeedMeta = (s: string) => speedMeta[s] || speedMeta.medium;
const getGuaranteeMeta = (g: string) => guaranteeMeta[g] || guaranteeMeta.none;

const networkConfig: { key: string; label: string; icon: string; color: string; bg: string; border: string; shadow: string }[] = [
  { key: "Instagram", label: "Instagram", icon: "instagram", color: "text-pink-500", bg: "bg-gradient-to-r from-pink-500 to-purple-500", border: "border-pink-400", shadow: "shadow-pink-500/25" },
  { key: "YouTube", label: "YouTube", icon: "youtube", color: "text-red-500", bg: "bg-red-500", border: "border-red-400", shadow: "shadow-red-500/25" },
  { key: "TikTok", label: "TikTok", icon: "tiktok", color: "text-foreground", bg: "bg-foreground", border: "border-foreground/60", shadow: "shadow-foreground/20" },
  { key: "Telegram", label: "Telegram", icon: "telegram", color: "text-sky-500", bg: "bg-sky-500", border: "border-sky-400", shadow: "shadow-sky-500/25" },
  { key: "VK", label: "ВКонтакте", icon: "vk", color: "text-blue-500", bg: "bg-blue-500", border: "border-blue-400", shadow: "shadow-blue-500/25" },
  { key: "Twitter", label: "Twitter / X", icon: "twitter", color: "text-foreground", bg: "bg-foreground", border: "border-foreground/60", shadow: "shadow-foreground/20" },
  { key: "Facebook", label: "Facebook", icon: "facebook", color: "text-blue-600", bg: "bg-blue-600", border: "border-blue-500", shadow: "shadow-blue-600/25" },
  { key: "Twitch", label: "Twitch", icon: "twitch", color: "text-purple-500", bg: "bg-purple-500", border: "border-purple-400", shadow: "shadow-purple-500/25" },
  { key: "Odnoklassniki", label: "Одноклассники", icon: "odnoklassniki", color: "text-orange-500", bg: "bg-orange-500", border: "border-orange-400", shadow: "shadow-orange-500/25" },
  { key: "Likee", label: "Likee", icon: "likee", color: "text-rose-500", bg: "bg-gradient-to-r from-rose-500 to-pink-400", border: "border-rose-400", shadow: "shadow-rose-500/25" },
  { key: "Dzen", label: "Дзен", icon: "dzen", color: "text-yellow-500", bg: "bg-yellow-500", border: "border-yellow-400", shadow: "shadow-yellow-500/25" },
  { key: "MAX", label: "MAX", icon: "max", color: "text-indigo-500", bg: "bg-indigo-500", border: "border-indigo-400", shadow: "shadow-indigo-500/25" },
  { key: "Spotify", label: "Spotify", icon: "spotify", color: "text-green-500", bg: "bg-green-500", border: "border-green-400", shadow: "shadow-green-500/25" },
  { key: "Traffic", label: "Трафик", icon: "globe", color: "text-emerald-500", bg: "bg-emerald-500", border: "border-emerald-400", shadow: "shadow-emerald-500/25" },
];

/* ─── Tariff Explainer ─── */
const TariffExplainer = ({ onClose, netConfig }: { onClose: () => void; netConfig?: typeof networkConfig[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/60 bg-card shadow-xl p-4 text-xs"
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-bold text-foreground text-sm">В чём разница тарифов?</h4>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    </div>
    <div className="space-y-3">
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-green-500" /> Скорость выполнения</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {Object.entries(speedMeta).map(([key, m]) => {
            const Icon = m.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40">
                <Icon className={`w-3 h-3 ${m.color}`} />
                <span className="text-muted-foreground">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Гарантия</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5">
          {Object.entries(guaranteeMeta).map(([key, m]) => {
            const Icon = m.icon;
            return (
              <div key={key} className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-muted/40">
                <Icon className={`w-3 h-3 ${m.color}`} />
                <span className="text-muted-foreground">{m.label}</span>
              </div>
            );
          })}
        </div>
      </div>
      <p className="text-muted-foreground leading-relaxed">
        Тарифы отличаются <strong>скоростью</strong> выполнения и <strong>гарантией</strong> на списания.
        Более дорогие — быстрее стартуют и дольше гарантируют сохранение результата.
        Дешёвые тарифы выполняются постепенно и могут не иметь гарантии восполнения.
      </p>
    </div>
  </motion.div>
);

const Catalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);
  const [compareMode, setCompareMode] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);

  const prefillLink = searchParams.get('link') || '';
  const [link, setLink] = useState(prefillLink);
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [consentOffer, setConsentOffer] = useState(false);
  const [consentPD, setConsentPD] = useState(false);
  const [ordering, setOrdering] = useState(false);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, description, price, min_quantity, max_quantity, category, network, speed, guarantee")
        .eq("is_enabled", true)
        .order("network")
        .order("category")
        .order("name");
      const items = (data || []) as CatalogService[];
      setServices(items);
      setLoading(false);

      if (items.length > 0) {
        const firstNet = networkConfig.find((n) => items.some((s) => s.network === n.key));
        if (firstNet) {
          setActiveNetwork(firstNet.key);
          const cats = [...new Set(items.filter((s) => s.network === firstNet.key).map((s) => s.category))];
          if (cats.length > 0) setActiveCategory(cats[0]);
        }
      }
    };
    fetchServices();
  }, []);

  const availableNetworks = useMemo(
    () => networkConfig.filter((n) => services.some((s) => s.network === n.key)),
    [services]
  );

  const categories = useMemo(() => {
    if (!activeNetwork) return [];
    let filtered = services.filter((s) => s.network === activeNetwork);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.category.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    return [...new Set(filtered.map((s) => s.category))].sort();
  }, [services, activeNetwork, search]);

  const categoryServices = useMemo(() => {
    if (!activeNetwork || !activeCategory) return [];
    let filtered = services.filter((s) => s.network === activeNetwork && s.category === activeCategory);
    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.description?.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q)
      );
    }
    return filtered;
  }, [services, activeNetwork, activeCategory, search]);

  const handleNetworkChange = (net: string) => {
    setActiveNetwork(net);
    setSelectedService(null);
    const cats = [...new Set(services.filter((s) => s.network === net).map((s) => s.category))].sort();
    setActiveCategory(cats[0] || null);
  };

  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSelectedService(null);
  };

  useEffect(() => {
    if (categoryServices.length > 0 && !categoryServices.find((s) => s.id === selectedService?.id)) {
      setSelectedService(categoryServices[0]);
      setQuantity(categoryServices[0].min_quantity || 10);
    }
  }, [categoryServices]);

  const activeNetConfig = networkConfig.find(n => n.key === activeNetwork);
  const totalPrice = selectedService ? (selectedService.price / 1000) * quantity : 0;
  const minPrice = categoryServices.length > 0 ? Math.min(...categoryServices.map(s => s.price)) : 0;

  const handleOrder = async () => {
    if (!user) { navigate("/auth"); return; }
    if (!selectedService || !link.trim() || ordering) return;

    setOrdering(true);
    try {
      const idempotencyKey = `${user.id}_${selectedService.id}_${Date.now()}`;
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: { service_id: selectedService.id, link: link.trim(), quantity, idempotency_key: idempotencyKey },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);
      if (data?.deduplicated) {
        toast({ title: "Заказ уже создан", description: "Повторный запрос проигнорирован" });
      } else {
        toast({ title: "✅ Заказ оформлен!", description: `${selectedService.name} × ${quantity} — ${Number(data.price).toFixed(2)}₽` });
      }
      setLink(""); setConsentOffer(false); setConsentPD(false);
    } catch (e: any) {
      toast({ title: "Ошибка", description: e.message || "Ошибка при создании заказа", variant: "destructive" });
    } finally { setOrdering(false); }
  };

  const selectService = (service: CatalogService) => {
    setSelectedService(service);
    setQuantity(Math.max(service.min_quantity, 10));
  };

  /* ─── Speed/Guarantee badges (reusable) ─── */
  const SpeedBadge = ({ speed, compact = false }: { speed: string; compact?: boolean }) => {
    const m = getSpeedMeta(speed);
    const Icon = m.icon;
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11px]'} ${m.color}`}>
        <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {!compact && m.label}
      </span>
    );
  };

  const GuaranteeBadge = ({ guarantee, compact = false }: { guarantee: string; compact?: boolean }) => {
    const m = getGuaranteeMeta(guarantee);
    const Icon = m.icon;
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11px]'} ${m.color}`}>
        <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {!compact && m.label}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="animate-pulse text-muted-foreground flex items-center gap-2">
          <Package className="w-5 h-5" /> Загрузка каталога...
        </div>
      </div>
    );
  }

  return (
    <div className="h-screen flex flex-col bg-background overflow-hidden">
      {/* Pre-fill banner */}
      {prefillLink && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className="bg-primary/10 border-b border-primary/20 px-4 py-2 shrink-0">
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Link2 className="w-3.5 h-3.5 text-primary" />
            </div>
            <p className="text-xs text-muted-foreground truncate">Ссылка <span className="text-primary font-medium">{prefillLink}</span> подставлена</p>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <div className="border-b border-border/60 bg-card/50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center justify-between">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">На главную</span>
            </Link>
            <div className="relative w-48 sm:w-56">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Поиск..." className="pl-9 h-8 text-sm bg-muted/40 border-border/40" />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Icons */}
      <div className="border-b border-border/40 bg-muted/20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-wrap gap-1.5 justify-center items-center">
            {availableNetworks.map((net) => {
              const isActive = activeNetwork === net.key;
              return (
                <button
                  key={net.key}
                  onClick={() => handleNetworkChange(net.key)}
                  className={`relative transition-all duration-200 ${
                    isActive
                      ? `inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl ${net.bg} text-white shadow-lg ${net.shadow} scale-105`
                      : "w-9 h-9 rounded-xl bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-border hover:shadow-sm hover:scale-105"
                  }`}
                  title={net.label}
                >
                  <PlatformIcon platform={net.icon} className="w-4 h-4" />
                  {isActive && <span className="text-xs font-semibold hidden sm:inline">{net.label}</span>}
                </button>
              );
            })}
          </div>
        </div>
      </div>

      {/* Main Content — fills remaining height, with bottom padding for mobile form */}
      <div className="flex-1 min-h-0 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4 py-2 h-full">
          <div className="flex gap-4 h-full">

            {/* Left Sidebar — Categories (desktop only) */}
            <div className="w-44 shrink-0 hidden md:flex flex-col overflow-y-auto">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider mb-2 px-2">Категории</p>
              <div className="space-y-0.5">
                {categories.length === 0 && <p className="text-xs text-muted-foreground/60 px-2">Нет категорий</p>}
                {categories.map((cat) => {
                  const count = services.filter((s) => s.network === activeNetwork && s.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full flex items-center justify-between gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left ${
                        activeCategory === cat
                          ? `bg-card ${activeNetConfig?.color || 'text-primary'} border ${activeNetConfig?.border || 'border-primary/20'} shadow-sm`
                          : "text-foreground/80 hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className={`text-[10px] shrink-0 ${activeCategory === cat ? "opacity-70" : "text-muted-foreground/50"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center — Service List */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* Mobile category pills */}
              <div className="md:hidden mb-2 shrink-0">
                <div className="flex gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-2.5 py-1 rounded-full text-[11px] font-medium whitespace-nowrap transition-colors border ${
                        activeCategory === cat
                          ? `${activeNetConfig?.bg || 'bg-primary'} text-white border-transparent`
                          : "bg-muted text-muted-foreground border-transparent"
                      }`}
                    >{cat}</button>
                  ))}
                </div>
              </div>

              {/* Header row */}
              <div className="flex items-center justify-between mb-2 shrink-0 relative">
                <h2 className="text-sm font-bold text-foreground">{activeCategory}</h2>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => setShowExplainer(!showExplainer)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      showExplainer
                        ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Чем отличаются?</span>
                  </button>
                  <button
                    onClick={() => setCompareMode(!compareMode)}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${
                      compareMode
                        ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                        : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                    }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Сравнить</span>
                  </button>
                </div>

                {/* Explainer popup */}
                <AnimatePresence>
                  {showExplainer && <TariffExplainer onClose={() => setShowExplainer(false)} netConfig={activeNetConfig} />}
                </AnimatePresence>
              </div>

              {/* Service list — scrollable, with bottom padding on mobile for sticky form */}
              <div className="flex-1 min-h-0 overflow-y-auto pr-1 pb-2 md:pb-0">
                {categoryServices.length > 0 ? (
                  <AnimatePresence mode="wait">
                    <motion.div
                      key={`${activeCategory}-${compareMode}`}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      transition={{ duration: 0.2 }}
                    >
                      {compareMode ? (
                        /* ─── Compare Table ─── */
                        <div className="rounded-xl border border-border/60 overflow-hidden">
                          <table className="w-full text-xs">
                            <thead>
                              <tr className="bg-muted/40 border-b border-border/40">
                                <th className="text-left px-3 py-2 font-semibold text-muted-foreground">Услуга</th>
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-20">Цена/шт</th>
                                <th className="text-center px-2 py-2 font-semibold text-muted-foreground w-20 hidden sm:table-cell">Скорость</th>
                                <th className="text-center px-2 py-2 font-semibold text-muted-foreground w-20 hidden sm:table-cell">Гарантия</th>
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-14 hidden lg:table-cell">Мин</th>
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-14 hidden lg:table-cell">Макс</th>
                              </tr>
                            </thead>
                            <tbody>
                              {categoryServices.map((service) => {
                                const isSelected = selectedService?.id === service.id;
                                const isPopular = service.price === minPrice && categoryServices.length > 1;
                                const pricePerUnit = service.price / 1000;
                                return (
                                  <tr
                                    key={service.id}
                                    onClick={() => selectService(service)}
                                    className={`cursor-pointer transition-colors border-b border-border/20 last:border-0 ${
                                      isSelected
                                        ? `bg-primary/5 ${activeNetConfig?.color || 'text-primary'}`
                                        : isPopular ? 'bg-primary/[0.03] hover:bg-primary/5' : 'hover:bg-muted/40'
                                    }`}
                                  >
                                    <td className="px-3 py-2 font-medium text-foreground">
                                      <div className="flex items-center gap-1.5">
                                        {isSelected && (
                                          <span className={`w-4 h-4 rounded-full ${activeNetConfig?.bg || 'bg-primary'} flex items-center justify-center shrink-0`}>
                                            <Check className="w-2.5 h-2.5 text-white" />
                                          </span>
                                        )}
                                        {isPopular && !isSelected && <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeNetConfig?.color || 'text-primary'}`} />}
                                        <span className="line-clamp-1">{service.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                                      <span className={isPopular ? (activeNetConfig?.color || 'text-primary') : ''}>
                                        {pricePerUnit.toFixed(2)} ₽
                                      </span>
                                    </td>
                                    <td className="px-2 py-2 text-center hidden sm:table-cell"><SpeedBadge speed={service.speed} /></td>
                                    <td className="px-2 py-2 text-center hidden sm:table-cell"><GuaranteeBadge guarantee={service.guarantee} /></td>
                                    <td className="px-3 py-2 text-right text-muted-foreground hidden lg:table-cell">{service.min_quantity.toLocaleString()}</td>
                                    <td className="px-3 py-2 text-right text-muted-foreground hidden lg:table-cell">{service.max_quantity.toLocaleString()}</td>
                                  </tr>
                                );
                              })}
                            </tbody>
                          </table>
                        </div>
                      ) : (
                        /* ─── Square Cards Grid ─── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryServices.map((service, i) => {
                            const isSelected = selectedService?.id === service.id;
                            const pricePerUnit = service.price / 1000;
                            const isPopular = service.price === minPrice && categoryServices.length > 1;
                            return (
                              <motion.button
                                key={service.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: i * 0.04 }}
                                onClick={() => selectService(service)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative p-4 rounded-2xl text-left transition-all flex flex-col aspect-square ${
                                  isSelected
                                    ? `bg-card border-2 ${activeNetConfig?.border || 'border-primary'} shadow-lg ${activeNetConfig?.shadow || 'shadow-primary/10'}`
                                    : isPopular
                                      ? 'bg-gradient-to-br from-primary/5 to-accent/10 border-2 border-primary/30 hover:border-primary/50 hover:shadow-md'
                                      : 'bg-card border border-border/50 hover:border-border hover:shadow-md'
                                }`}
                              >
                                {/* Badges top-right */}
                                {isPopular && !isSelected && (
                                  <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full bg-primary/15 text-primary text-[10px] font-bold flex items-center gap-1">
                                    <Sparkles className="w-3 h-3" /> Хит
                                  </div>
                                )}
                                {isSelected && (
                                  <div className={`absolute top-3 right-3 w-5 h-5 rounded-full ${activeNetConfig?.bg || 'bg-primary'} flex items-center justify-center`}>
                                    <Check className="w-3 h-3 text-white" />
                                  </div>
                                )}

                                {/* Title */}
                                <h3 className="font-bold text-sm text-foreground mb-2 pr-8 line-clamp-2">{service.name}</h3>

                                {/* Description — prominent */}
                                {service.description && (
                                  <p className="text-xs text-muted-foreground leading-relaxed line-clamp-3 mb-3">
                                    {service.description}
                                  </p>
                                )}

                                {/* Speed & Guarantee */}
                                <div className="flex items-center gap-2 mb-2">
                                  <SpeedBadge speed={service.speed} />
                                  <span className="text-muted-foreground/30">·</span>
                                  <GuaranteeBadge guarantee={service.guarantee} />
                                </div>

                                {/* Requirements — prominent */}
                                <div className="flex flex-wrap gap-1.5 mb-3">
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${activeNetConfig?.color || 'text-primary'} bg-primary/10`}>
                                    от {service.min_quantity.toLocaleString()} шт
                                  </span>
                                  <span className={`inline-flex items-center px-2.5 py-1 rounded-lg text-[11px] font-semibold ${activeNetConfig?.color || 'text-primary'} bg-primary/10`}>
                                    до {service.max_quantity.toLocaleString()} шт
                                  </span>
                                </div>

                                {/* Price — bottom */}
                                <div className="mt-auto">
                                  <span className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                                    isSelected || isPopular
                                      ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                                      : 'bg-muted text-foreground'
                                  }`}>
                                    {pricePerUnit.toFixed(2)} ₽ / шт
                                  </span>
                                </div>
                              </motion.button>
                            );
                          })}
                        </div>
                      )}
                    </motion.div>
                  </AnimatePresence>
                ) : (
                  <div className="flex items-center justify-center py-12 text-muted-foreground">
                    <Package className="w-6 h-6 mr-2 opacity-40" />
                    <span className="text-sm">Нет услуг в этой категории</span>
                  </div>
                )}
              </div>
            </div>

            {/* Right Panel — Order Form (desktop only) */}
            <div className="w-80 shrink-0 hidden md:block">
              <div className="sticky top-0 h-full">
                {selectedService ? (
                  <motion.div
                    key={selectedService.id}
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ duration: 0.2 }}
                    className={`rounded-2xl border-2 ${activeNetConfig?.border || 'border-border/60'} bg-card p-4 space-y-3 h-full flex flex-col`}
                  >
                    {/* Selected service info */}
                    <div className="shrink-0">
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">Выбрано</p>
                      <h3 className="text-sm font-bold text-foreground line-clamp-2">{selectedService.name}</h3>
                      <p className={`text-lg font-bold mt-1 ${activeNetConfig?.color || 'text-primary'}`}>
                        {(selectedService.price / 1000).toFixed(2)} ₽ <span className="text-xs font-normal text-muted-foreground">/ шт</span>
                      </p>
                      {/* Speed & Guarantee */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <SpeedBadge speed={selectedService.speed} />
                        <GuaranteeBadge guarantee={selectedService.guarantee} />
                      </div>
                      {/* Description in order form */}
                      {selectedService.description && (
                        <p className="text-xs text-muted-foreground leading-relaxed mt-2 p-2 rounded-lg bg-muted/30 border border-border/30">
                          {selectedService.description}
                        </p>
                      )}
                      {/* Requirements reminder */}
                      <div className="flex gap-2 mt-2">
                        <span className={`text-[10px] font-medium ${activeNetConfig?.color || 'text-primary'} bg-primary/10 px-2 py-0.5 rounded-md`}>
                          от {selectedService.min_quantity.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-medium ${activeNetConfig?.color || 'text-primary'} bg-primary/10 px-2 py-0.5 rounded-md`}>
                          до {selectedService.max_quantity.toLocaleString()}
                        </span>
                      </div>
                    </div>

                    {/* Link */}
                    <div className="shrink-0">
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Ссылка на контент</label>
                      <div className="relative">
                        <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                        <Input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." className={`pl-8 h-9 text-sm bg-muted/30 border ${activeNetConfig?.border || 'border-border/40'} focus:ring-0`} />
                      </div>
                    </div>

                    {/* Email */}
                    <div className="shrink-0">
                      <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email</label>
                      <div className="relative">
                        <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                        <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@email.com" className="pl-8 h-9 text-sm bg-muted/30 border-border/40" />
                      </div>
                    </div>

                    {/* Quantity */}
                    <div className="shrink-0">
                      <div className="flex items-center justify-between mb-1">
                        <label className="text-[11px] font-medium text-muted-foreground">Количество</label>
                        <span className="text-[10px] text-muted-foreground/60">{selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()}</span>
                      </div>
                      <div className="flex items-center border border-border/60 rounded-lg bg-muted/20 overflow-hidden">
                        <button onClick={() => setQuantity(Math.max(selectedService.min_quantity, quantity - 10))} className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                          <Minus className="w-3.5 h-3.5" />
                        </button>
                        <input
                          type="number" value={quantity}
                          onChange={(e) => { const v = parseInt(e.target.value) || selectedService.min_quantity; setQuantity(Math.min(Math.max(v, selectedService.min_quantity), selectedService.max_quantity)); }}
                          className="flex-1 text-center bg-transparent text-foreground font-semibold text-sm outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button onClick={() => setQuantity(Math.min(selectedService.max_quantity, quantity + 10))} className="px-3 py-2 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors">
                          <Plus className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>

                    <div className="flex-1" />

                    {/* Consents */}
                    <div className="space-y-1.5 shrink-0">
                      <label className="flex items-start gap-1.5 cursor-pointer group" onClick={() => setConsentOffer(!consentOffer)}>
                        <span className={`mt-0.5 w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentOffer ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                          {consentOffer && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                          Принимаю условия <Link to="/page/offer" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Оферты</Link>
                        </span>
                      </label>
                      <label className="flex items-start gap-1.5 cursor-pointer group" onClick={() => setConsentPD(!consentPD)}>
                        <span className={`mt-0.5 w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentPD ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                          {consentPD && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                          Согласен с <Link to="/page/privacy-policy" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Политикой</Link> и <Link to="/page/terms" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Правилами</Link>
                        </span>
                      </label>
                    </div>

                    {/* Submit */}
                    <button
                      onClick={handleOrder}
                      disabled={!link.trim() || !consentOffer || !consentPD || ordering}
                      className={`w-full py-3 rounded-xl ${activeNetConfig?.bg || 'bg-gradient-to-r from-primary to-secondary'} text-white font-bold text-sm shadow-lg ${activeNetConfig?.shadow || 'shadow-primary/20'} hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0`}
                    >
                      {ordering ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          Оформляем...
                        </span>
                      ) : (
                        <>
                          <span className="font-bold">{totalPrice.toFixed(2)} ₽</span>
                          <span className="border-l border-white/30 pl-2">Оформить</span>
                        </>
                      )}
                    </button>
                  </motion.div>
                ) : (
                  <div className="rounded-2xl border border-dashed border-border/40 bg-muted/10 flex items-center justify-center h-full">
                    <p className="text-xs text-muted-foreground/50">Выберите услугу</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ─── Mobile sticky order form ─── */}
      {/* Uses bottom-14 to stay above widget bar (56px) */}
      <AnimatePresence>
        {selectedService && (
          <motion.div
            initial={{ y: 100 }}
            animate={{ y: 0 }}
            exit={{ y: 100 }}
            className="md:hidden fixed bottom-14 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-md shadow-[0_-4px_20px_rgba(0,0,0,0.15)]"
          >
            <div className="px-3 pt-3 pb-2 space-y-2">
              {/* Selected service mini-info */}
              <div className="flex items-center justify-between">
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-foreground line-clamp-1">{selectedService.name}</p>
                  <div className="flex items-center gap-2 mt-0.5">
                    <SpeedBadge speed={selectedService.speed} compact />
                    <GuaranteeBadge guarantee={selectedService.guarantee} compact />
                  </div>
                </div>
                <span className={`text-sm font-bold ${activeNetConfig?.color || 'text-primary'}`}>
                  {(selectedService.price / 1000).toFixed(2)} ₽/шт
                </span>
              </div>

              {/* Link + Quantity row */}
              <div className="flex items-center gap-2">
                <div className="relative flex-1">
                  <Link2 className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                  <Input
                    value={link} onChange={(e) => setLink(e.target.value)}
                    placeholder="Ссылка на контент"
                    className={`pl-8 h-9 text-sm bg-muted/30 border ${activeNetConfig?.border || 'border-border/40'}`}
                  />
                </div>
                <div className="flex items-center border border-border/60 rounded-lg bg-muted/20 overflow-hidden shrink-0">
                  <button onClick={() => setQuantity(Math.max(selectedService.min_quantity, quantity - 10))} className="px-2 py-2">
                    <Minus className="w-3 h-3 text-muted-foreground" />
                  </button>
                  <input
                    type="number" value={quantity}
                    onChange={(e) => { const v = parseInt(e.target.value) || selectedService.min_quantity; setQuantity(Math.min(Math.max(v, selectedService.min_quantity), selectedService.max_quantity)); }}
                    className="w-12 text-center bg-transparent text-foreground font-semibold text-xs outline-none [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                  />
                  <button onClick={() => setQuantity(Math.min(selectedService.max_quantity, quantity + 10))} className="px-2 py-2">
                    <Plus className="w-3 h-3 text-muted-foreground" />
                  </button>
                </div>
              </div>

              {/* Consents + Button */}
              <div className="flex items-center gap-3">
                <div className="flex items-center gap-2 shrink-0">
                  <label className="flex items-center gap-1 cursor-pointer" onClick={() => setConsentOffer(!consentOffer)}>
                    <span className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentOffer ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                      {consentOffer && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Оферта</span>
                  </label>
                  <label className="flex items-center gap-1 cursor-pointer" onClick={() => setConsentPD(!consentPD)}>
                    <span className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentPD ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                      {consentPD && <Check className="w-2.5 h-2.5 text-white" />}
                    </span>
                    <span className="text-[10px] text-muted-foreground">Политика</span>
                  </label>
                </div>
                <button
                  onClick={handleOrder}
                  disabled={!link.trim() || !consentOffer || !consentPD || ordering}
                  className={`flex-1 py-2.5 rounded-xl ${activeNetConfig?.bg || 'bg-primary'} text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2`}
                >
                  {ordering ? 'Оформляем...' : `${totalPrice.toFixed(2)} ₽ — Заказать`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Catalog;
