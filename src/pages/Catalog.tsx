import { useState, useEffect, useMemo, useRef } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, ArrowLeft, Package, ChevronLeft, ChevronRight,
  Link2, Mail, Minus, Plus, Sparkles, Check, ShieldCheck
} from "lucide-react";
import { Input } from "@/components/ui/input";
import PlatformIcon from "@/components/PlatformIcon";
import Footer from "@/components/Footer";
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
}

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

const Catalog = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user } = useAuth();
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  // Selection state
  const [activeNetwork, setActiveNetwork] = useState<string | null>(null);
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [selectedService, setSelectedService] = useState<CatalogService | null>(null);

  // Order form — pre-fill link from query param
  const prefillLink = searchParams.get('link') || '';
  const [link, setLink] = useState(prefillLink);
  const [email, setEmail] = useState("");
  const [quantity, setQuantity] = useState(10);
  const [consentOffer, setConsentOffer] = useState(false);
  const [consentPD, setConsentPD] = useState(false);
  const [ordering, setOrdering] = useState(false);

  const carouselRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, description, price, min_quantity, max_quantity, category, network")
        .eq("is_enabled", true)
        .order("network")
        .order("category")
        .order("name");
      const items = data || [];
      setServices(items);
      setLoading(false);

      // Auto-select first available network
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

  // Available networks (only those with services)
  const availableNetworks = useMemo(
    () => networkConfig.filter((n) => services.some((s) => s.network === n.key)),
    [services]
  );

  // Categories for active network
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

  // Services for active category
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

  // When network changes, auto-select first category
  const handleNetworkChange = (net: string) => {
    setActiveNetwork(net);
    setSelectedService(null);
    const cats = [...new Set(services.filter((s) => s.network === net).map((s) => s.category))].sort();
    setActiveCategory(cats[0] || null);
  };

  // When category changes
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat);
    setSelectedService(null);
  };

  // Auto-select first service when category services load
  useEffect(() => {
    if (categoryServices.length > 0 && !categoryServices.find((s) => s.id === selectedService?.id)) {
      setSelectedService(categoryServices[0]);
      setQuantity(categoryServices[0].min_quantity || 10);
    }
  }, [categoryServices]);

  const scrollCarousel = (dir: "left" | "right") => {
    if (carouselRef.current) {
      const scrollAmount = 280;
      carouselRef.current.scrollBy({
        left: dir === "left" ? -scrollAmount : scrollAmount,
        behavior: "smooth",
      });
    }
  };

  const activeNetConfig = networkConfig.find(n => n.key === activeNetwork);
  const totalPrice = selectedService ? (selectedService.price / 1000) * quantity : 0;

  const handleOrder = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }
    if (!selectedService || !link.trim() || ordering) return;

    setOrdering(true);
    try {
      // Generate idempotency key to prevent double orders
      const idempotencyKey = `${user.id}_${selectedService.id}_${Date.now()}`;

      const { data, error } = await supabase.functions.invoke("create-order", {
        body: {
          service_id: selectedService.id,
          link: link.trim(),
          quantity,
          idempotency_key: idempotencyKey,
        },
      });

      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      if (data?.deduplicated) {
        toast({ title: "Заказ уже создан", description: "Повторный запрос проигнорирован" });
      } else {
        toast({
          title: "✅ Заказ оформлен!",
          description: `${selectedService.name} × ${quantity} — ${Number(data.price).toFixed(2)}₽`,
        });
      }

      // Reset form
      setLink("");
      setConsentOffer(false);
      setConsentPD(false);
    } catch (e: any) {
      const msg = e.message || "Ошибка при создании заказа";
      toast({ title: "Ошибка", description: msg, variant: "destructive" });
    } finally {
      setOrdering(false);
    }
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
    <div className="min-h-screen flex flex-col bg-background">
      {/* Pre-fill banner */}
      {prefillLink && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-primary/10 border-b border-primary/20 px-4 py-3"
        >
          <div className="max-w-6xl mx-auto flex items-center gap-3 text-sm">
            <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center shrink-0">
              <Link2 className="w-4 h-4 text-primary" />
            </div>
            <div className="min-w-0">
              <p className="font-medium text-foreground">Ссылка подставлена автоматически</p>
              <p className="text-xs text-muted-foreground truncate">Выберите подходящую услугу — ссылка <span className="text-primary font-medium">{prefillLink}</span> уже в форме заказа</p>
            </div>
          </div>
        </motion.div>
      )}
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }} className="border-b border-border/60 bg-card/50">
        <div className="max-w-6xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link
              to="/"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> На главную
            </Link>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Поиск услуг..."
                className="pl-9 h-9 text-sm bg-muted/40 border-border/40"
              />
            </div>
          </div>
        </div>
      </motion.div>

      {/* Platform Tabs */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.4, delay: 0.15 }} className="border-b border-border/40 bg-card/30">
        <div className="max-w-6xl mx-auto px-4">
          <div className="flex items-center gap-1 overflow-x-auto py-3 px-1 scrollbar-none">
            {availableNetworks.map((net) => (
              <button
                key={net.key}
                onClick={() => handleNetworkChange(net.key)}
                className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-medium whitespace-nowrap transition-all ${
                  activeNetwork === net.key
                    ? `${net.bg} text-white shadow-lg ${net.shadow} scale-105`
                    : "bg-muted/50 text-muted-foreground hover:bg-muted hover:text-foreground"
                }`}
              >
                <PlatformIcon platform={net.icon} className="w-4.5 h-4.5" />
                {net.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {/* Main Content */}
      <div className="flex-1">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex gap-6 min-h-[500px]">
            {/* Left Sidebar — Categories */}
            <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.5, delay: 0.2 }} className="w-64 shrink-0 hidden md:block">
              <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-3 px-2">
                Категории
              </p>
              <div className="space-y-1">
                {categories.length === 0 && (
                  <p className="text-sm text-muted-foreground/60 px-2">Нет категорий</p>
                )}
                {categories.map((cat) => {
                  const count = services.filter(
                    (s) => s.network === activeNetwork && s.category === cat
                  ).length;
                  return (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all text-left ${
                        activeCategory === cat
                          ? `bg-card ${activeNetConfig?.color || 'text-primary'} border-2 ${activeNetConfig?.border || 'border-primary/20'} shadow-sm`
                          : "text-foreground/80 hover:bg-muted/60 border border-transparent"
                      }`}
                    >
                      <span className="truncate">{cat}</span>
                      <span className={`text-[11px] shrink-0 ${activeCategory === cat ? "opacity-70" : "text-muted-foreground/50"}`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>

            {/* Right Content — Services & Order */}
            <div className="flex-1 min-w-0">
              {/* Mobile category selector */}
              <div className="md:hidden mb-4">
                <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      onClick={() => handleCategoryChange(cat)}
                      className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-colors border ${
                        activeCategory === cat
                          ? `${activeNetConfig?.bg || 'bg-primary'} text-white border-transparent`
                          : "bg-muted text-muted-foreground border-transparent"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Service Cards Carousel */}
              {categoryServices.length > 0 ? (
                <div className="relative mb-8">
                  <div className="flex items-center justify-between mb-3">
                    <h2 className="text-lg font-bold text-foreground">
                      {activeCategory}
                    </h2>
                    {categoryServices.length > 3 && (
                      <div className="flex gap-1">
                        <button
                          onClick={() => scrollCarousel("left")}
                          className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronLeft className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => scrollCarousel("right")}
                          className="w-8 h-8 rounded-full bg-muted/60 hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-colors"
                        >
                          <ChevronRight className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  <AnimatePresence mode="wait">
                    <motion.div
                      key={activeCategory}
                      ref={carouselRef}
                      initial={{ opacity: 0, x: 30 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -30 }}
                      transition={{ duration: 0.3, ease: 'easeOut' }}
                      className="flex gap-3 overflow-x-auto pb-3 pt-1 px-1 scrollbar-none snap-x snap-mandatory"
                    >
                      {categoryServices.map((service, i) => {
                        const isSelected = selectedService?.id === service.id;
                        const pricePerUnit = service.price / 1000;
                        return (
                          <motion.button
                            key={service.id}
                            initial={{ opacity: 0, y: 15 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3, delay: i * 0.06 }}
                            onClick={() => {
                              setSelectedService(service);
                              setQuantity(Math.max(service.min_quantity, 10));
                            }}
                            whileHover={{ y: -2 }}
                            whileTap={{ scale: 0.98 }}
                            className={`snap-start shrink-0 w-[220px] p-4 rounded-2xl text-left transition-all relative overflow-hidden ${
                              isSelected
                                ? `bg-card border-2 ${activeNetConfig?.border || 'border-primary'} shadow-lg ${activeNetConfig?.shadow || 'shadow-primary/10'}`
                                : "bg-card border border-border/60 hover:border-border hover:shadow-md"
                            }`}
                          >
                            {isSelected && (
                              <div className={`absolute top-2.5 right-2.5 w-5 h-5 rounded-full ${activeNetConfig?.bg || 'bg-primary'} flex items-center justify-center`}>
                                <Check className="w-3 h-3 text-white" />
                              </div>
                            )}
                            <h3 className="font-semibold text-sm text-foreground mb-2 pr-6 line-clamp-2 min-h-[2.5rem]">
                              {service.name}
                            </h3>
                            {service.description && (
                              <p className="text-xs text-muted-foreground line-clamp-3 mb-3 min-h-[3rem]">
                                {service.description}
                              </p>
                            )}
                            <div className="mt-auto">
                              <span
                                className={`inline-block px-3 py-1.5 rounded-full text-xs font-bold ${
                                  isSelected
                                    ? `${activeNetConfig?.bg || 'bg-primary'} text-white`
                                    : "bg-muted text-foreground"
                                }`}
                              >
                                {pricePerUnit.toFixed(2)} ₽/1 шт
                              </span>
                            </div>
                          </motion.button>
                        );
                      })}
                    </motion.div>
                  </AnimatePresence>
                </div>
              ) : (
                <div className="flex items-center justify-center py-20 text-muted-foreground">
                  <Package className="w-8 h-8 mr-2 opacity-40" />
                  <span>Нет услуг в этой категории</span>
                </div>
              )}

              {/* Order Form */}
              {selectedService && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-border/60 bg-card p-5 space-y-4"
                >
                  {/* Link & Email */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Ссылка на ваш контент 👇
                      </label>
                      <div className="relative">
                        <Link2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          value={link}
                          onChange={(e) => setLink(e.target.value)}
                          placeholder="https://instagram.com/..."
                          className={`pl-10 bg-muted/30 border-2 ${activeNetConfig?.border || 'border-border/40'} focus:ring-0`}
                        />
                      </div>
                    </div>
                    <div>
                      <label className="text-xs font-medium text-muted-foreground mb-1.5 block">
                        Электронная почта
                      </label>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground/50" />
                        <Input
                          type="email"
                          value={email}
                          onChange={(e) => setEmail(e.target.value)}
                          placeholder="you@email.com"
                          className="pl-10 bg-muted/30 border-border/40"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Quantity & Submit */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-end gap-4">
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-medium text-muted-foreground">Количество</label>
                        <span className="text-[10px] text-muted-foreground/60">
                          {selectedService.min_quantity.toLocaleString()} – {selectedService.max_quantity.toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center border border-border/60 rounded-xl bg-muted/20 overflow-hidden">
                        <button
                          onClick={() => setQuantity(Math.max(selectedService.min_quantity, quantity - 10))}
                          className="px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <input
                          type="number"
                          value={quantity}
                          onChange={(e) => {
                            const v = parseInt(e.target.value) || selectedService.min_quantity;
                            setQuantity(Math.min(Math.max(v, selectedService.min_quantity), selectedService.max_quantity));
                          }}
                          className="flex-1 text-center bg-transparent text-foreground font-semibold text-lg outline-none py-2 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
                        />
                        <button
                          onClick={() => setQuantity(Math.min(selectedService.max_quantity, quantity + 10))}
                          className="px-4 py-2.5 text-muted-foreground hover:text-foreground hover:bg-muted/40 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                      </div>
                    </div>

                    <button
                      onClick={handleOrder}
                      disabled={!link.trim() || !consentOffer || !consentPD || ordering}
                      className={`w-full sm:w-auto px-8 py-3 rounded-xl ${activeNetConfig?.bg || 'bg-gradient-to-r from-primary to-secondary'} text-white font-bold text-base shadow-lg ${activeNetConfig?.shadow || 'shadow-primary/20'} hover:shadow-xl transition-all disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-3`}
                    >
                      {ordering ? (
                        <span className="flex items-center gap-2">
                          <span className="animate-spin rounded-full h-4 w-4 border-2 border-white/30 border-t-white" />
                          Оформляем...
                        </span>
                      ) : (
                        <>
                          <span className="text-lg font-bold">{totalPrice.toFixed(2)} ₽</span>
                          <span className="border-l border-primary-foreground/30 pl-3">Оформить заказ</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Consents */}
                  <div className="space-y-2 pt-1">
                    <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setConsentOffer(!consentOffer)}>
                      <span className={`mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                        consentOffer
                          ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent`
                          : 'border-border bg-background'
                      }`}>
                        {consentOffer && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Нажимая кнопку, вы принимаете условия{" "}
                        <Link to="/page/offer" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Оферты</Link>
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer group" onClick={() => setConsentPD(!consentPD)}>
                      <span className={`mt-0.5 w-4 h-4 rounded shrink-0 flex items-center justify-center border transition-colors ${
                        consentPD
                          ? `${activeNetConfig?.bg || 'bg-primary'} border-transparent`
                          : 'border-border bg-background'
                      }`}>
                        {consentPD && <Check className="w-3 h-3 text-white" />}
                      </span>
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Я даю согласие на обработку персональных данных в соответствии с{" "}
                        <Link to="/page/privacy-policy" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Политикой конфиденциальности</Link>
                        {" "}и соглашаюсь с{" "}
                        <Link to="/page/terms" className={`${activeNetConfig?.color || 'text-primary'} hover:underline`}>Правилами сервиса</Link>
                      </span>
                    </label>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default Catalog;
