import { useState, useEffect, useMemo } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Package, Link2, Mail, Minus, Plus, Sparkles, Check,
  BarChart3, Zap, Clock, Timer, Snail, TrendingUp, Shield, ShieldCheck, ShieldAlert,
  HelpCircle, Info, X, AlertTriangle
} from "lucide-react";
import { Input } from "@/components/ui/input";
import PlatformIcon from "@/components/PlatformIcon";
import { useAuth } from "@/hooks/useAuth";
import { toast } from "@/hooks/use-toast";
import SiteHeader from "@/components/SiteHeader";

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
  warning_text: string | null;
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
  lifetime: { label: "Навсегда", icon: ShieldCheck, color: "PLATFORM_COLOR" },
};

const getSpeedMeta = (s: string) => speedMeta[s] || speedMeta.medium;
const getGuaranteeMeta = (g: string) => guaranteeMeta[g] || guaranteeMeta.none;

import {
  categoriesByPlatform,
  getServicesForCategory,
  platformBranding,
  platformNames,
  type Platform
} from '@/lib/smm-data';

const networkConfig = Object.keys(platformBranding).map(key => ({
  key,
  label: platformNames[key],
  icon: key.toLowerCase(),
  ...platformBranding[key]
}));

/* ─── Tariff Explainer — detailed ─── */
const TariffExplainer = ({ onClose, netConfig }: { onClose: () => void; netConfig?: typeof networkConfig[0] }) => (
  <motion.div
    initial={{ opacity: 0, y: 8 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: 8 }}
    className="absolute top-full left-0 right-0 z-50 mt-1 rounded-xl border border-border/60 bg-card shadow-xl p-4 text-xs max-h-[70vh] overflow-y-auto"
  >
    <div className="flex items-center justify-between mb-3">
      <h4 className="font-bold text-foreground text-sm">В чём разница тарифов?</h4>
      <button onClick={onClose} className="text-muted-foreground hover:text-foreground"><X className="w-4 h-4" /></button>
    </div>
    <div className="space-y-4">
      {/* Speed */}
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-green-500" /> Скорость выполнения</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
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
        <p className="text-muted-foreground leading-relaxed">
          <strong>Мгновенно</strong> — старт в течение минут. <strong>Быстро</strong> — от 10 мин до 1 часа.
          <strong> Средне</strong> — несколько часов. <strong>Постепенно</strong> — растянутый во времени процесс, имитирующий органический рост.
        </p>
      </div>

      {/* Guarantee */}
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5"><Shield className="w-3.5 h-3.5 text-emerald-500" /> Гарантия</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-1.5 mb-2">
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
        <p className="text-muted-foreground leading-relaxed">
          Гарантия означает, что при списаниях (дропе) в указанный период услуга будет восполнена бесплатно.
          <strong> Без гарантии</strong> — дешевле, но списания не компенсируются.
        </p>
      </div>

      {/* Subscriber quality */}
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">👥 Качество подписчиков</p>
        <div className="space-y-1.5">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="font-medium text-foreground">🤖 Боты / офферы</p>
            <p className="text-muted-foreground">Самый дешёвый вариант. Аккаунты массовые, без аватарок и постов. Высокий процент списаний (дроп 20-60%). Подходят для начальной «подушки» подписчиков.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="font-medium text-foreground">👤 Микс / средне качество</p>
            <p className="text-muted-foreground">Смесь реальных и офферных аккаунтов. Есть аватарки, некоторые публикации. Дроп 10-30%. Оптимальное соотношение цена/качество.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="font-medium text-foreground">💎 Живые / высокое качество</p>
            <p className="text-muted-foreground">Реальные активные пользователи. Аватарки, посты, сторис. Минимальный дроп (0-10%). Самый дорогой, но самый надёжный вариант.</p>
          </div>
        </div>
      </div>

      {/* Views */}
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">👁️ Типы просмотров</p>
        <div className="space-y-1.5">
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="font-medium text-foreground">Обычные просмотры</p>
            <p className="text-muted-foreground">Засчитываются как просмотры видео/сторис. Дёшево и быстро, но не влияют на вовлечённость и рекомендации.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="font-medium text-foreground">Удерживающие просмотры</p>
            <p className="text-muted-foreground">Зрители «смотрят» видео определённое время. Повышают удержание аудитории и помогают продвижению в алгоритмах.</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/30 border border-border/30">
            <p className="font-medium text-foreground">Живые просмотры (онлайн)</p>
            <p className="text-muted-foreground">Реальные пользователи заходят в эфир или на видео. Самый качественный, влияет на рекомендации, но дороже.</p>
          </div>
        </div>
      </div>

      {/* Drops & refills */}
      <div>
        <p className="font-semibold text-foreground mb-1 flex items-center gap-1.5">📉 Списания и рефил</p>
        <p className="text-muted-foreground leading-relaxed">
          <strong>Дроп (списания)</strong> — часть подписчиков/лайков со временем отписывается или удаляется площадкой. Это нормальный процесс.
          <strong> Рефил</strong> — автоматическое восполнение списаний в период действия гарантии. Если тариф с гарантией 30 дней — при дропе в этот период сервис бесплатно добавит новых подписчиков.
        </p>
      </div>

      <p className="text-muted-foreground leading-relaxed border-t border-border/30 pt-3">
        💡 <strong>Совет:</strong> для долгосрочного результата выбирайте тарифы с гарантией и средней/высокой скоростью.
        Для быстрого разового эффекта — дешёвые без гарантии.
      </p>
    </div>
  </motion.div>
);
/* Smart price formatter — always rounds UP, never rounds to zero.
   price < 1 → 3 decimal places (ceil), price >= 1 → 2 decimal places (ceil) */
const fmtPrice = (v: number): string => {
  if (v <= 0) return "0.00";
  if (v >= 1) {
    const ceiled = Math.ceil(v * 100) / 100;
    return ceiled.toFixed(2);
  }
  // price < 1: 3 decimals, ceil, minimum 0.001
  const ceiled = Math.ceil(v * 1000) / 1000;
  return Math.max(ceiled, 0.001).toFixed(3);
};

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
  const [compareServices, setCompareServices] = useState<CatalogService[]>([]);
  const [showCompareModal, setShowCompareModal] = useState(false);
  const [showExplainer, setShowExplainer] = useState(false);
  const [warningAccepted, setWarningAccepted] = useState<Record<string, boolean>>({});
  const [showWarning, setShowWarning] = useState(false);
  const [showGuideline, setShowGuideline] = useState(false);
  const [currentGuideline, setCurrentGuideline] = useState<{ content: string } | null>(null);
  const [dismissedGuidelines, setDismissedGuidelines] = useState<Set<string>>(new Set());

  const prefillLink = searchParams.get('link') || '';
  const [link, setLink] = useState(prefillLink);
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [consentOffer, setConsentOffer] = useState(false);
  const [consentPD, setConsentPD] = useState(false);
  const [ordering, setOrdering] = useState(false);

  // Settings for checkboxes
  const [checkboxSettings, setCheckboxSettings] = useState({
    show_offer_checkbox: true,
    show_policy_checkbox: true,
    offer_default_checked: false,
    policy_default_checked: false,
  });

  // Load checkbox settings
  useEffect(() => {
    const loadCheckboxSettings = async () => {
      const { data } = await supabase
        .from("app_settings")
        .select("key, value")
        .in("key", ["show_offer_checkbox", "show_policy_checkbox", "offer_default_checked", "policy_default_checked"]);

      if (data) {
        const settings: Record<string, boolean> = {};
        data.forEach((r: any) => {
          settings[r.key] = r.value === "true";
        });
        setCheckboxSettings(prev => ({
          show_offer_checkbox: settings.show_offer_checkbox ?? true,
          show_policy_checkbox: settings.show_policy_checkbox ?? true,
          offer_default_checked: settings.offer_default_checked ?? false,
          policy_default_checked: settings.policy_default_checked ?? false,
        }));
        // Apply defaults
        if (settings.offer_default_checked) setConsentOffer(true);
        if (settings.policy_default_checked) setConsentPD(true);
      }
    };
    loadCheckboxSettings();
  }, []);

  // Auto-fill email from user session
  useEffect(() => {
    if (user?.email && !email) {
      setEmail(user.email);
    }
  }, [user, email]);

  // Restore pending order after silent login
  useEffect(() => {
    const isRestoring = searchParams.get("restoring_order") === "true";
    if (isRestoring && user) {
      const stored = localStorage.getItem("pending_order");
      if (stored) {
        try {
          const pending = JSON.parse(stored);
          // Only restore if it's the same email or recently created (within 1 hour)
          if (pending.email === user.email && (Date.now() - pending.timestamp < 3600000)) {
            setLink(pending.link);
            setQuantity(pending.quantity);

            // Automatically trigger order creation
            handleCreateOrderAfterLogin(pending.link, pending.quantity, pending.serviceId);
          }
          localStorage.removeItem("pending_order");
        } catch (e) {
          console.error("Failed to restore pending order", e);
        }
      }
    }
  }, [user, searchParams, services]);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, description, price, min_quantity, max_quantity, category, network, speed, guarantee, warning_text")
        .eq("is_enabled", true)
        .order("network")
        .order("category")
      const items = (data || []).map((s: any) => {
        let net = s.network?.toLowerCase() || 'default';
        if (net === 'odnoklassniki') net = 'ok';
        return { ...s, network: net };
      }) as CatalogService[];

      setServices(items);
      setLoading(false);

      if (items.length > 0) {
        // Find the first network that has branding config
        const firstNet = networkConfig.find((n) => items.some((s) => s.network === n.key));
        if (firstNet) {
          setActiveNetwork(firstNet.key);
          const cats = [...new Set(items.filter((s) => s.network === firstNet.key).map((s) => s.category))];
          if (cats.length > 0) setActiveCategory(cats[0]);
        } else if (items.length > 0) {
          // Fallback if no matching branding found
          const fallbackNet = items[0].network;
          setActiveNetwork(fallbackNet);
          const cats = [...new Set(items.filter((s) => s.network === fallbackNet).map((s) => s.category))];
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
    if (!selectedService || !link.trim() || ordering) return;

    if (!user) {
      if (!email.trim() || !email.includes('@')) {
        toast({ title: "Требуется Email", description: "Пожалуйста, введите корректный email для связи по заказу", variant: "destructive" });
        return;
      }

      // Guest flow: Silent Onboarding
      const pendingOrder = {
        serviceId: selectedService.id,
        link: link.trim(),
        quantity,
        email: email.trim(),
        timestamp: Date.now()
      };
      localStorage.setItem("pending_order", JSON.stringify(pendingOrder));

      toast({ title: "Создаем кабинет", description: "Почти готово! Мы создаем ваш личный кабинет для управления заказом." });
      navigate(`/auth?onboarding=true&email=${encodeURIComponent(email)}`);
      return;
    }

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
        toast({ title: "Заказ принят", description: "Мы начали работу над вашим заказом" });
        setLink("");
      }
    } catch (error: any) {
      toast({ title: "Ошибка", description: error.message, variant: "destructive" });
    } finally {
      setOrdering(false);
      // If order was created successfully, we should probably redirect or show a bigger success
      // Let's assume the toast is enough for now, but ensure it's prominent
    }
  };

  const handleCreateOrderAfterLogin = async (link: string, quantity: number, serviceId: string) => {
    setOrdering(true);
    try {
      const { data, error } = await supabase.functions.invoke("create-order", {
        body: { service_id: serviceId, link, quantity },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      toast({
        title: "✨ Заказ успешно создан!",
        description: `Номер вашего заказа: ${data.order_id || 'в обработке'}. Теперь он отобразится в вашем кабинете.`,
        duration: 10000
      });
      navigate('/dashboard/orders');
    } catch (error: any) {
      toast({ title: "Ошибка создания заказа", description: error.message, variant: "destructive" });
    } finally {
      setOrdering(false);
    }
  };

  const selectService = (service: CatalogService) => {
    setSelectedService(service);
    setQuantity(Math.max(service.min_quantity, 10));

    if (compareMode) {
      toggleCompareService(service);
      return;
    }

    // Show warning if service has one and user hasn't accepted it yet
    if (service.warning_text && !warningAccepted[service.id]) {
      setShowWarning(true);
    }
  };

  const toggleCompareService = (service: CatalogService) => {
    setCompareServices(prev => {
      const isAlreadyIn = prev.some(s => s.id === service.id);
      if (isAlreadyIn) {
        return prev.filter(s => s.id !== service.id);
      }
      if (prev.length >= 4) {
        toast({ title: "Лимит сравнения", description: "Можно сравнивать до 4 услуг одновременно", variant: "destructive" });
        return prev;
      }
      return [...prev, service];
    });
  };

  const acceptWarning = () => {
    if (selectedService) {
      setWarningAccepted(prev => ({ ...prev, [selectedService.id]: true }));
    }
    setShowWarning(false);
  };

  useEffect(() => {
    const fetchGuideline = async () => {
      if (!activeNetwork || !activeCategory) return;

      const guidelineKey = `${activeNetwork}-${activeCategory}`;
      if (dismissedGuidelines.has(guidelineKey)) return;

      const { data, error } = await supabase
        .from('category_guidelines' as any)
        .select('content')
        .eq('platform', activeNetwork)
        .eq('category', activeCategory)
        .maybeSingle();

      if (data && !error) {
        setCurrentGuideline(data as { content: string });
        setShowGuideline(true);
      }
    };

    fetchGuideline();
  }, [activeNetwork, activeCategory, dismissedGuidelines]);

  const dismissGuideline = () => {
    if (activeNetwork && activeCategory) {
      setDismissedGuidelines(prev => new Set(prev).add(`${activeNetwork}-${activeCategory}`));
    }
    setShowGuideline(false);
  };

  /* ─── Speed/Guarantee badges (reusable) ─── */
  const SpeedBadge = ({ speed, compact = false }: { speed: string; compact?: boolean }) => {
    const m = getSpeedMeta(speed);
    const Icon = m.icon;
    const netConfig = activeNetConfig;
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11px]'} ${netConfig ? netConfig.color : m.color}`}>
        <Icon className={compact ? "w-2.5 h-2.5" : "w-3 h-3"} />
        {!compact && m.label}
      </span>
    );
  };

  const GuaranteeBadge = ({ guarantee, compact = false }: { guarantee: string; compact?: boolean }) => {
    const m = getGuaranteeMeta(guarantee);
    const Icon = m.icon;
    const netConfig = activeNetConfig;
    const colorClass = m.color === "PLATFORM_COLOR" ? (netConfig?.color || "text-primary") : m.color;
    return (
      <span className={`inline-flex items-center gap-1 ${compact ? 'text-[10px]' : 'text-[11px]'} ${colorClass}`}>
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
    <div className="min-h-screen flex flex-col bg-background scrollbar-none pt-16 overflow-x-hidden">
      <SiteHeader />
      {/* Pre-fill banner */}
      {prefillLink && (
        <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} className={`${activeNetConfig?.lightBg || 'bg-primary/10'} border-b ${activeNetConfig?.border || 'border-primary/20'} px-4 py-2 shrink-0`}>
          <div className="max-w-7xl mx-auto flex items-center gap-3 text-sm">
            <div className={`w-7 h-7 rounded-lg ${activeNetConfig?.lightBg || 'bg-primary/20'} flex items-center justify-center shrink-0`}>
              <Link2 className={`w-3.5 h-3.5 ${activeNetConfig?.color || 'text-primary'}`} />
            </div>
            <p className="text-xs text-muted-foreground truncate">Ссылка <span className={`${activeNetConfig?.color || 'text-primary'} font-medium`}>{prefillLink}</span> подставлена</p>
          </div>
        </motion.div>
      )}

      {/* Header — compact */}
      <div className="border-b border-border/60 bg-card/50 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <Link to="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors shrink-0">
              <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">На главную</span>
            </Link>
            <div className="relative flex-1 max-w-xl">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск по названию, описанию или категории..."
                className="pl-9 h-10 text-sm bg-muted/30 border-border/50 rounded-xl focus:bg-card focus:border-primary/50 transition-all"
              />
            </div>
          </div>
        </div>
      </div>

      {/* Platform Icons — centered wrap */}
      <div className="border-b border-border/40 bg-muted/20 shrink-0">
        <div className="max-w-7xl mx-auto px-4 py-2">
          <div className="flex flex-wrap gap-2 justify-center items-center">
            {availableNetworks.map((net) => {
              const isActive = activeNetwork === net.key;
              return (
                <button
                  key={net.key}
                  onClick={() => handleNetworkChange(net.key)}
                  className={`transition-all duration-300 ${isActive
                    ? `inline-flex items-center gap-2 px-4 py-2 rounded-xl ${net.bg} text-white shadow-md scale-105`
                    : "w-10 h-10 rounded-xl bg-card border border-border/40 flex items-center justify-center text-muted-foreground hover:text-foreground"
                    }`}
                  title={net.label}
                >
                  <PlatformIcon platform={net.icon} className={isActive ? "w-6 h-6" : "w-5 h-5"} />
                  {isActive && (
                    <span className="text-xs font-bold whitespace-nowrap">
                      {net.label}
                    </span>
                  )}
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
            <div className="w-48 shrink-0 hidden md:flex flex-col overflow-y-auto scrollbar-none">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">Категории</p>
              <div className="space-y-0.5">
                {categories.length === 0 && <p className="text-sm text-muted-foreground/60 px-2">Нет категорий</p>}
                {categories.map((cat) => {
                  const count = services.filter((s) => s.network === activeNetwork && s.category === cat).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full flex items-center justify-between gap-1 px-3 py-2 rounded-lg text-sm font-medium transition-all text-left ${activeCategory === cat
                        ? `bg-card ${activeNetConfig?.color || 'text-primary'} border ${activeNetConfig?.border || 'border-primary/20'} shadow-sm`
                        : "text-foreground/80 hover:bg-muted/60 border border-transparent"
                        }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className={`text-xs shrink-0 ${activeCategory === cat ? "opacity-70" : "text-muted-foreground/50"}`}>{count}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Center — Service List */}
            <div className="flex-1 min-w-0 flex flex-col min-h-0">
              {/* Mobile category pills — centered wrap */}
              <div className="md:hidden mb-2 shrink-0">
                <div className="flex flex-wrap gap-1.5 justify-center scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-full text-[11px] font-bold whitespace-nowrap transition-all border ${activeCategory === cat
                        ? `${activeNetConfig?.bg || 'bg-primary'} text-white border-transparent shadow-sm`
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
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${showExplainer
                      ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Чем отличаются?</span>
                  </button>
                  <button
                    onClick={() => {
                      if (compareServices.length > 0) {
                        setShowCompareModal(true);
                      } else {
                        setCompareMode(!compareMode);
                      }
                    }}
                    className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[11px] font-medium transition-colors ${compareMode || compareServices.length > 0
                      ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                      : 'bg-muted/60 text-muted-foreground hover:text-foreground hover:bg-muted'
                      }`}
                  >
                    <BarChart3 className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">
                      {compareServices.length > 0 ? `Сравнить (${compareServices.length})` : "Сравнить"}
                    </span>
                  </button>
                  {(compareMode || compareServices.length > 0) && (
                    <button
                      onClick={() => {
                        setCompareMode(false);
                        setCompareServices([]);
                      }}
                      className="p-1.5 rounded-lg bg-muted/60 text-muted-foreground hover:text-destructive transition-colors"
                      title="Выйти из режима сравнения"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Explainer popup */}
                <AnimatePresence>
                  {showExplainer && <TariffExplainer onClose={() => setShowExplainer(false)} netConfig={activeNetConfig} />}
                </AnimatePresence>
              </div>

              {/* Service list — scrollable, with bottom padding on mobile for sticky form */}
              <div className={`flex-1 min-h-0 overflow-y-auto scrollbar-none md:pb-0 ${selectedService ? 'pb-52' : 'pb-2'}`}>
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
                                <th className="text-right px-3 py-2 font-semibold text-muted-foreground w-28">Цена / 1000</th>
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
                                return (
                                  <tr
                                    key={service.id}
                                    onClick={() => selectService(service)}
                                    className={`cursor-pointer transition-colors border-b border-border/20 last:border-0 ${isSelected && !compareMode
                                      ? `bg-primary/5 ${activeNetConfig?.color || 'text-primary'}`
                                      : isPopular ? 'bg-primary/[0.03] hover:bg-primary/5' : 'hover:bg-muted/40'
                                      } ${compareServices.some(s => s.id === service.id) ? 'bg-primary/10' : ''}`}
                                  >
                                    <td className="px-3 py-2 font-medium text-foreground">
                                      <div className="flex items-center gap-1.5">
                                        {compareMode ? (
                                          <div className={`w-4 h-4 rounded border flex items-center justify-center transition-colors ${compareServices.some(s => s.id === service.id) ? (activeNetConfig?.bg || 'bg-primary') : 'border-border bg-background'}`}>
                                            {compareServices.some(s => s.id === service.id) && <Check className="w-2.5 h-2.5 text-white" />}
                                          </div>
                                        ) : isSelected && (
                                          <span className={`w-4 h-4 rounded-full ${activeNetConfig?.bg || 'bg-primary'} flex items-center justify-center shrink-0`}>
                                            <Check className="w-2.5 h-2.5 text-white" />
                                          </span>
                                        )}
                                        {isPopular && !isSelected && !compareMode && <Sparkles className={`w-3.5 h-3.5 shrink-0 ${activeNetConfig?.color || 'text-primary'}`} />}
                                        <span className="line-clamp-1">{service.name}</span>
                                      </div>
                                    </td>
                                    <td className="px-3 py-2 text-right font-bold whitespace-nowrap">
                                      <span className={isPopular ? (activeNetConfig?.color || 'text-primary') : ''}>
                                        {fmtPrice(service.price)} ₽
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
                        /* ─── Adaptive Cards Grid ─── */
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                          {categoryServices.map((service, i) => {
                            const isSelected = selectedService?.id === service.id;
                            const isPopular = service.price === minPrice && categoryServices.length > 1;
                            return (
                              <motion.button
                                key={service.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.25, ease: "easeOut", delay: i * 0.03 }}
                                onClick={() => selectService(service)}
                                whileHover={{ y: -2 }}
                                whileTap={{ scale: 0.98 }}
                                className={`relative p-5 rounded-2xl text-left transition-all flex flex-col min-h-[220px] ${isSelected
                                  ? `bg-card border-2 ${activeNetConfig?.border || 'border-primary'} shadow-lg ${activeNetConfig?.shadow || 'shadow-primary/10'}`
                                  : isPopular
                                    ? 'bg-gradient-to-br from-primary/5 to-accent/10 border-2 border-primary/30 hover:border-primary/50 hover:shadow-md'
                                    : 'bg-card border border-border/50 hover:border-border hover:shadow-md'
                                  }`}
                              >
                                {/* Badges top-right */}
                                {isPopular && !isSelected && !compareMode && (
                                  <div className={`absolute top-3 right-3 px-2.5 py-1 rounded-full ${activeNetConfig?.lightBg || 'bg-primary/15'} ${activeNetConfig?.color || 'text-primary'} text-xs font-bold flex items-center gap-1`}>
                                    <Sparkles className="w-3.5 h-3.5" /> Хит
                                  </div>
                                )}
                                {compareMode ? (
                                  <div className={`absolute top-3 right-3 w-6 h-6 rounded border flex items-center justify-center transition-colors ${compareServices.some(s => s.id === service.id) ? (activeNetConfig?.bg || 'bg-primary') : 'border-border bg-card'}`}>
                                    {compareServices.some(s => s.id === service.id) && <Check className="w-4 h-4 text-white" />}
                                  </div>
                                ) : isSelected && (
                                  <div className={`absolute top-3 right-3 w-6 h-6 rounded-full ${activeNetConfig?.bg || 'bg-primary'} flex items-center justify-center`}>
                                    <Check className="w-3.5 h-3.5 text-white" />
                                  </div>
                                )}

                                {/* Title */}
                                <h3 className="font-bold text-base text-foreground mb-2 pr-8">{service.name}</h3>

                                {/* Description — adaptive, no line clamp */}
                                {service.description && (
                                  <p className="text-sm text-muted-foreground leading-relaxed mb-3">
                                    {service.description}
                                  </p>
                                )}

                                {/* Speed & Guarantee */}
                                <div className="flex items-center gap-2.5 mb-3">
                                  <SpeedBadge speed={service.speed} />
                                  <span className="text-muted-foreground/30">·</span>
                                  <GuaranteeBadge guarantee={service.guarantee} />
                                </div>

                                {/* Requirements — prominent */}
                                <div className="flex flex-wrap gap-2 mb-3">
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${activeNetConfig?.color || 'text-primary'} ${activeNetConfig?.lightBg || 'bg-primary/10'}`}>
                                    от {service.min_quantity.toLocaleString()} шт
                                  </span>
                                  <span className={`inline-flex items-center px-3 py-1.5 rounded-lg text-xs font-semibold ${activeNetConfig?.color || 'text-primary'} ${activeNetConfig?.lightBg || 'bg-primary/10'}`}>
                                    до {service.max_quantity.toLocaleString()} шт
                                  </span>
                                </div>

                                {/* Price — bottom */}
                                <div className="mt-auto">
                                  <span className={`inline-block px-4 py-2 rounded-full text-sm font-bold ${isSelected || isPopular
                                    ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                                    : 'bg-muted text-foreground'
                                    }`}>
                                    {fmtPrice(service.price)} ₽ / 1000 шт
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
                        {fmtPrice(selectedService.price)} ₽ <span className="text-xs font-normal text-muted-foreground">/ 1000 шт</span>
                      </p>
                      {/* Speed & Guarantee */}
                      <div className="flex items-center gap-3 mt-1.5">
                        <SpeedBadge speed={selectedService.speed} />
                        <GuaranteeBadge guarantee={selectedService.guarantee} />
                      </div>
                      {/* Description in order form */}
                      {selectedService.description && (
                        <p className={`text-xs text-muted-foreground leading-relaxed mt-2 p-2 rounded-lg ${activeNetConfig?.lightBg || 'bg-muted/30'} border ${activeNetConfig?.border?.replace('border-', 'border-') || 'border-border/30'} opacity-80`}>
                          {selectedService.description}
                        </p>
                      )}
                      {/* Requirements reminder */}
                      <div className="flex gap-2 mt-2">
                        <span className={`text-[10px] font-medium ${activeNetConfig?.color || 'text-primary'} ${activeNetConfig?.lightBg || 'bg-primary/10'} px-2 py-0.5 rounded-md`}>
                          от {selectedService.min_quantity.toLocaleString()}
                        </span>
                        <span className={`text-[10px] font-medium ${activeNetConfig?.color || 'text-primary'} ${activeNetConfig?.lightBg || 'bg-primary/10'} px-2 py-0.5 rounded-md`}>
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

                    {/* Email - Hidden for logged-in users to reduce friction */}
                    {!user && (
                      <div className="shrink-0">
                        <label className="text-[11px] font-medium text-muted-foreground mb-1 block">Email</label>
                        <div className="relative">
                          <Mail className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-muted-foreground/50" />
                          <Input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="you@email.com"
                            className={`pl-8 h-9 text-sm bg-muted/30 border ${activeNetConfig?.border || 'border-border/40'}`}
                          />
                        </div>
                        <p className="text-[9px] text-muted-foreground mt-1">Используется для уведомлений о статусе заказа</p>
                      </div>
                    )}

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
                    {(checkboxSettings.show_offer_checkbox || checkboxSettings.show_policy_checkbox) && (
                      <div className="space-y-1.5 shrink-0">
                        {checkboxSettings.show_offer_checkbox && (
                          <label className="flex items-start gap-1.5 cursor-pointer group" onClick={() => setConsentOffer(!consentOffer)}>
                            <span className={`mt-0.5 w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentOffer ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                              {consentOffer && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                              Принимаю условия <Link to="/page/offer" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Оферты</Link>
                            </span>
                          </label>
                        )}
                        {checkboxSettings.show_policy_checkbox && (
                          <label className="flex items-start gap-1.5 cursor-pointer group" onClick={() => setConsentPD(!consentPD)}>
                            <span className={`mt-0.5 w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentPD ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                              {consentPD && <Check className="w-2.5 h-2.5 text-white" />}
                            </span>
                            <span className="text-[10px] text-muted-foreground group-hover:text-foreground transition-colors leading-tight">
                              Согласен с <Link to="/page/privacy-policy" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Политикой</Link> и <Link to="/page/terms" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Правилами</Link>
                            </span>
                          </label>
                        )}
                      </div>
                    )}

                    {/* Submit */}
                    <button
                      onClick={handleOrder}
                      disabled={!link.trim() || (checkboxSettings.show_offer_checkbox && !consentOffer) || (checkboxSettings.show_policy_checkbox && !consentPD) || ordering}
                      className={`w-full py-3 rounded-xl ${activeNetConfig?.bg || 'bg-gradient-to-r from-primary to-secondary'} text-white font-bold text-sm shadow-lg ${activeNetConfig?.shadow || 'shadow-primary/20'} hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-40 disabled:scale-100 disabled:cursor-not-allowed flex items-center justify-center gap-2 shrink-0 group`}
                    >
                      {ordering ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          Оформляем...
                        </span>
                      ) : (
                        <>
                          <span className="font-bold">{fmtPrice(totalPrice)} ₽</span>
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
            className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t border-border/60 bg-card/95 backdrop-blur-md shadow-[0_-8px_30px_rgba(0,0,0,0.15)] pb-safe"
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
                  {fmtPrice(selectedService.price)} ₽/1000
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
                {(checkboxSettings.show_offer_checkbox || checkboxSettings.show_policy_checkbox) && (
                  <div className="flex items-center gap-2 shrink-0">
                    {checkboxSettings.show_offer_checkbox && (
                      <label className="flex items-center gap-1 cursor-pointer" onClick={() => setConsentOffer(!consentOffer)}>
                        <span className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentOffer ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                          {consentOffer && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Оферта</span>
                      </label>
                    )}
                    {checkboxSettings.show_policy_checkbox && (
                      <label className="flex items-center gap-1 cursor-pointer" onClick={() => setConsentPD(!consentPD)}>
                        <span className={`w-3.5 h-3.5 rounded shrink-0 flex items-center justify-center border transition-colors ${consentPD ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent` : 'border-border bg-background'}`}>
                          {consentPD && <Check className="w-2.5 h-2.5 text-white" />}
                        </span>
                        <span className="text-[10px] text-muted-foreground">Политика</span>
                      </label>
                    )}
                  </div>
                )}
                <button
                  onClick={handleOrder}
                  disabled={!link.trim() || (checkboxSettings.show_offer_checkbox && !consentOffer) || (checkboxSettings.show_policy_checkbox && !consentPD) || ordering}
                  className={`flex-1 py-2.5 rounded-xl ${activeNetConfig?.bg || 'bg-primary'} text-white font-bold text-sm disabled:opacity-40 flex items-center justify-center gap-2`}
                >
                  {ordering ? 'Оформляем...' : `${fmtPrice(totalPrice)} ₽ — Заказать`}
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Comparison Modal ─── */}
      <AnimatePresence>
        {showCompareModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={() => setShowCompareModal(false)}
          >
            <motion.div
              initial={{ scale: 0.95, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className="bg-card border border-border/60 rounded-3xl shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh]"
            >
              <div className="p-6 border-b border-border/40 flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl ${activeNetConfig?.bg || 'bg-primary'} flex items-center justify-center text-white`}>
                    <BarChart3 className="w-5 h-5" />
                  </div>
                  <div>
                    <h3 className="text-lg font-bold">Сравнение услуг</h3>
                    <p className="text-xs text-muted-foreground">Выбрано {compareServices.length} из 4</p>
                  </div>
                </div>
                <button onClick={() => setShowCompareModal(false)} className="p-2 rounded-full hover:bg-muted text-muted-foreground transition-colors">
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="flex-1 overflow-x-auto p-6 scrollbar-none">
                <div className="flex gap-4 min-w-[800px] h-full">
                  {compareServices.map((service) => (
                    <div key={service.id} className="flex-1 min-w-[200px] flex flex-col rounded-2xl border border-border/40 bg-muted/10 p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase ${networkConfig.find(n => n.key === service.network)?.bg || 'bg-primary'} text-white`}>
                          {service.network}
                        </div>
                        <button
                          onClick={() => toggleCompareService(service)}
                          className="text-muted-foreground hover:text-destructive transition-colors"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>

                      <h4 className="font-bold text-sm mb-2 line-clamp-2 min-h-[40px]">{service.name}</h4>

                      <div className="space-y-4 flex-1">
                        <div className="p-3 rounded-xl bg-card border border-border/30">
                          <p className="text-[10px] text-muted-foreground font-medium uppercase mb-0.5">Цена за 1000</p>
                          <p className={`text-xl font-bold ${activeNetConfig?.color || 'text-primary'}`}>{fmtPrice(service.price)} ₽</p>
                        </div>

                        <div className="grid grid-cols-1 gap-2">
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">Скорость</span>
                            <SpeedBadge speed={service.speed} />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">Гарантия</span>
                            <GuaranteeBadge guarantee={service.guarantee} />
                          </div>
                        </div>

                        <div className="space-y-1">
                          <span className="text-[10px] text-muted-foreground font-medium uppercase">Объем</span>
                          <p className="text-xs font-medium">{service.min_quantity.toLocaleString()} – {service.max_quantity.toLocaleString()} шт</p>
                        </div>

                        {service.description && (
                          <div className="space-y-1">
                            <span className="text-[10px] text-muted-foreground font-medium uppercase">Описание</span>
                            <p className="text-[11px] text-muted-foreground leading-relaxed line-clamp-4">{service.description}</p>
                          </div>
                        )}
                      </div>

                      <button
                        onClick={() => {
                          setSelectedService(service);
                          setQuantity(service.min_quantity);
                          setShowCompareModal(false);
                          setCompareMode(false);
                        }}
                        className={`mt-6 w-full py-2.5 rounded-xl ${activeNetConfig?.bg || 'bg-primary'} text-white text-xs font-bold shadow-md hover:shadow-lg transition-all`}
                      >
                        Выбрать
                      </button>
                    </div>
                  ))}
                  {compareServices.length < 4 && (
                    <div className="flex-1 min-w-[200px] flex flex-col items-center justify-center rounded-2xl border-2 border-dashed border-border/30 bg-muted/5 p-5">
                      <div className="p-3 rounded-full bg-muted/40 mb-3">
                        <Plus className="w-6 h-6 text-muted-foreground/40" />
                      </div>
                      <p className="text-xs text-muted-foreground/60 text-center">Добавьте еще услуги<br />для сравнения</p>
                      <button
                        onClick={() => setShowCompareModal(false)}
                        className="mt-4 text-xs font-bold text-primary hover:underline"
                      >
                        В каталог
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Category Guideline Modal ─── */}
      <AnimatePresence>
        {showGuideline && currentGuideline && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[110] flex items-center justify-center p-4 bg-black/60 backdrop-blur-md"
            onClick={dismissGuideline}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative max-w-lg w-full rounded-3xl bg-card border border-border/40 p-8 shadow-2xl overflow-hidden`}
            >
              {/* Background gradient hint */}
              <div className={`absolute -top-24 -right-24 w-48 h-48 rounded-full blur-3xl opacity-20 ${activeNetConfig?.bg || 'bg-primary'}`} />

              <div className="relative z-10">
                <div className="flex items-center gap-4 mb-6">
                  <div className={`w-12 h-12 rounded-2xl ${activeNetConfig?.bg || 'bg-primary/10'} border ${activeNetConfig?.border || 'border-primary/20'} flex items-center justify-center`}>
                    <Info className={`w-6 h-6 ${activeNetConfig?.color || 'text-primary'}`} />
                  </div>
                  <div>
                    <h3 className="text-xl font-bold">Правила оформления</h3>
                    <p className="text-sm text-muted-foreground">Пожалуйста, прочтите перед заказом</p>
                  </div>
                </div>

                <div className="prose prose-sm prose-invert max-w-none mb-8">
                  <div className="text-muted-foreground space-y-4 whitespace-pre-line leading-relaxed border-l-2 border-primary/30 pl-4 py-1">
                    {currentGuideline.content}
                  </div>
                </div>

                <button
                  onClick={dismissGuideline}
                  className={`w-full py-4 rounded-2xl ${activeNetConfig?.bg || 'bg-primary'} text-white font-bold text-sm shadow-xl ${activeNetConfig?.shadow || 'shadow-primary/20'} hover:scale-[1.02] active:scale-[0.98] transition-all`}
                >
                  Я ознакомлен(а)
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Warning Modal ─── */}
      <AnimatePresence>
        {showWarning && selectedService?.warning_text && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowWarning(false)}
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              onClick={(e) => e.stopPropagation()}
              className={`relative max-w-md w-full rounded-2xl ${activeNetConfig?.bg || 'bg-primary'} p-6 shadow-2xl text-white`}
            >
              <div className="flex items-start gap-3 mb-4">
                <AlertTriangle className="w-7 h-7 shrink-0 mt-0.5" />
                <h3 className="text-lg font-bold">Внимание!</h3>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-line opacity-95 mb-6">
                {selectedService.warning_text}
              </p>
              <button
                onClick={acceptWarning}
                className="w-full py-3 rounded-xl bg-white/20 hover:bg-white/30 border border-white/30 text-white font-bold text-sm transition-colors"
              >
                Принять
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Catalog;
