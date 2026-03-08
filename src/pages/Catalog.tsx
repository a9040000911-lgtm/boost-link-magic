import { useState, useEffect, useMemo } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { motion, AnimatePresence } from "framer-motion";
import { Search, Filter, X, ArrowLeft, Package, ChevronDown, Sparkles } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import PlatformIcon from "@/components/PlatformIcon";
import Footer from "@/components/Footer";

interface CatalogService {
  id: string;
  name: string;
  description: string | null;
  price: number;
  min_quantity: number;
  max_quantity: number;
  category: string;
  network: string;
  is_enabled: boolean;
}

const networkLabels: Record<string, string> = {
  Instagram: "Instagram",
  YouTube: "YouTube",
  TikTok: "TikTok",
  Telegram: "Telegram",
  VK: "ВКонтакте",
  Twitter: "Twitter",
  Facebook: "Facebook",
  Spotify: "Spotify",
  Other: "Другое",
};

const networkOrder = ["Instagram", "YouTube", "TikTok", "Telegram", "VK", "Twitter", "Facebook", "Spotify", "Other"];

const Catalog = () => {
  const [services, setServices] = useState<CatalogService[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedNetwork, setSelectedNetwork] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [expandedNetworks, setExpandedNetworks] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchServices = async () => {
      const { data } = await supabase
        .from("services")
        .select("id, name, description, price, min_quantity, max_quantity, category, network, is_enabled")
        .eq("is_enabled", true)
        .order("network")
        .order("category")
        .order("name");
      setServices(data || []);
      setLoading(false);
      // Expand all networks by default
      if (data) {
        setExpandedNetworks(new Set(data.map((s) => s.network)));
      }
    };
    fetchServices();
  }, []);

  // Derive unique networks and categories
  const networks = useMemo(() => {
    const nets = [...new Set(services.map((s) => s.network))];
    return nets.sort((a, b) => {
      const ai = networkOrder.indexOf(a);
      const bi = networkOrder.indexOf(b);
      return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
    });
  }, [services]);

  const categories = useMemo(() => {
    let filtered = services;
    if (selectedNetwork) filtered = filtered.filter((s) => s.network === selectedNetwork);
    return [...new Set(filtered.map((s) => s.category))].sort();
  }, [services, selectedNetwork]);

  // Filter services
  const filtered = useMemo(() => {
    let result = services;
    if (selectedNetwork) result = result.filter((s) => s.network === selectedNetwork);
    if (selectedCategory) result = result.filter((s) => s.category === selectedCategory);
    if (search.trim()) {
      const q = search.toLowerCase().trim();
      result = result.filter(
        (s) =>
          s.name.toLowerCase().includes(q) ||
          s.id.toLowerCase().includes(q) ||
          (s.description && s.description.toLowerCase().includes(q)) ||
          s.category.toLowerCase().includes(q) ||
          s.network.toLowerCase().includes(q)
      );
    }
    return result;
  }, [services, selectedNetwork, selectedCategory, search]);

  // Group filtered services by network → category
  const grouped = useMemo(() => {
    const map = new Map<string, Map<string, CatalogService[]>>();
    for (const s of filtered) {
      if (!map.has(s.network)) map.set(s.network, new Map());
      const catMap = map.get(s.network)!;
      if (!catMap.has(s.category)) catMap.set(s.category, []);
      catMap.get(s.category)!.push(s);
    }
    // Sort networks
    const sorted = new Map(
      [...map.entries()].sort(([a], [b]) => {
        const ai = networkOrder.indexOf(a);
        const bi = networkOrder.indexOf(b);
        return (ai === -1 ? 99 : ai) - (bi === -1 ? 99 : bi);
      })
    );
    return sorted;
  }, [filtered]);

  const toggleNetwork = (net: string) => {
    setExpandedNetworks((prev) => {
      const next = new Set(prev);
      if (next.has(net)) next.delete(net);
      else next.add(net);
      return next;
    });
  };

  const clearFilters = () => {
    setSelectedNetwork(null);
    setSelectedCategory(null);
    setSearch("");
  };

  const hasFilters = !!selectedNetwork || !!selectedCategory || !!search.trim();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <div className="bg-gradient-to-b from-muted/80 to-background border-b border-border/60">
        <div className="max-w-6xl mx-auto px-4 py-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground mb-4 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" /> На главную
          </Link>

          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-lg">
              <Package className="w-5 h-5 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl md:text-3xl font-bold text-foreground">Каталог услуг</h1>
              <p className="text-sm text-muted-foreground">{services.length} услуг доступно</p>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="sticky top-0 z-30 bg-background/95 backdrop-blur-md border-b border-border/40">
        <div className="max-w-6xl mx-auto px-4 py-3">
          {/* Search */}
          <div className="relative mb-3">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Поиск по названию, ID, описанию..."
              className="pl-10 bg-muted/50 border-border/60"
            />
            {search && (
              <button
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Network pills */}
          <div className="flex flex-wrap gap-2 items-center">
            <Filter className="w-4 h-4 text-muted-foreground shrink-0" />
            <button
              onClick={() => { setSelectedNetwork(null); setSelectedCategory(null); }}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                !selectedNetwork
                  ? "bg-primary text-primary-foreground shadow-md"
                  : "bg-muted text-muted-foreground hover:bg-muted/80"
              }`}
            >
              Все
            </button>
            {networks.map((net) => (
              <button
                key={net}
                onClick={() => {
                  setSelectedNetwork(selectedNetwork === net ? null : net);
                  setSelectedCategory(null);
                }}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-colors ${
                  selectedNetwork === net
                    ? "bg-primary text-primary-foreground shadow-md"
                    : "bg-muted text-muted-foreground hover:bg-muted/80"
                }`}
              >
                <PlatformIcon platform={net.toLowerCase()} className="w-3.5 h-3.5" />
                {networkLabels[net] || net}
              </button>
            ))}

            {hasFilters && (
              <button
                onClick={clearFilters}
                className="ml-auto text-xs text-destructive hover:text-destructive/80 flex items-center gap-1"
              >
                <X className="w-3 h-3" /> Сбросить
              </button>
            )}
          </div>

          {/* Category pills (when network selected) */}
          {selectedNetwork && categories.length > 1 && (
            <div className="flex flex-wrap gap-1.5 mt-2 pl-6">
              <button
                onClick={() => setSelectedCategory(null)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                  !selectedCategory
                    ? "bg-secondary text-secondary-foreground"
                    : "bg-muted/60 text-muted-foreground hover:bg-muted"
                }`}
              >
                Все категории
              </button>
              {categories.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(selectedCategory === cat ? null : cat)}
                  className={`px-2.5 py-1 rounded-full text-[11px] font-medium transition-colors ${
                    selectedCategory === cat
                      ? "bg-secondary text-secondary-foreground"
                      : "bg-muted/60 text-muted-foreground hover:bg-muted"
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 max-w-6xl mx-auto w-full px-4 py-6">
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="animate-pulse text-muted-foreground">Загрузка каталога...</div>
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <Package className="w-12 h-12 text-muted-foreground/40 mx-auto mb-3" />
            <p className="text-muted-foreground font-medium">Ничего не найдено</p>
            <p className="text-sm text-muted-foreground/60 mt-1">Попробуйте изменить фильтры или поисковый запрос</p>
            {hasFilters && (
              <button onClick={clearFilters} className="mt-3 text-sm text-primary hover:underline">
                Сбросить все фильтры
              </button>
            )}
          </div>
        ) : (
          <div className="space-y-6">
            {/* Stats bar */}
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>
                Найдено: <strong className="text-foreground">{filtered.length}</strong> услуг
                {selectedNetwork && <> в <strong className="text-foreground">{networkLabels[selectedNetwork] || selectedNetwork}</strong></>}
              </span>
            </div>

            {/* Grouped content */}
            {[...grouped.entries()].map(([network, catMap]) => (
              <motion.div
                key={network}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-xl border border-border/60 overflow-hidden bg-card/50"
              >
                {/* Network header */}
                <button
                  onClick={() => toggleNetwork(network)}
                  className="w-full flex items-center gap-3 px-4 py-3 bg-muted/30 hover:bg-muted/50 transition-colors"
                >
                  <PlatformIcon platform={network.toLowerCase()} className="w-5 h-5" />
                  <span className="font-semibold text-foreground">{networkLabels[network] || network}</span>
                  <Badge variant="secondary" className="text-[10px] ml-1">
                    {[...catMap.values()].reduce((sum, arr) => sum + arr.length, 0)}
                  </Badge>
                  <ChevronDown
                    className={`w-4 h-4 text-muted-foreground ml-auto transition-transform ${
                      expandedNetworks.has(network) ? "rotate-180" : ""
                    }`}
                  />
                </button>

                <AnimatePresence>
                  {expandedNetworks.has(network) && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      {[...catMap.entries()].map(([category, items]) => (
                        <div key={category} className="border-t border-border/30">
                          <div className="px-4 py-2 bg-muted/10">
                            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                              {category}
                            </span>
                            <span className="text-[10px] text-muted-foreground/60 ml-2">({items.length})</span>
                          </div>

                          <div className="divide-y divide-border/20">
                            {items.map((service, idx) => (
                              <motion.div
                                key={service.id}
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                transition={{ delay: idx * 0.02 }}
                                className="px-4 py-3 hover:bg-muted/20 transition-colors group"
                              >
                                <div className="flex items-start justify-between gap-4">
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2 mb-0.5">
                                      <span className="font-medium text-sm text-foreground">{service.name}</span>
                                    </div>
                                    {service.description && (
                                      <p className="text-xs text-muted-foreground line-clamp-2 mb-1">
                                        {service.description}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-3 text-[11px] text-muted-foreground/70">
                                      <span>ID: {service.id.slice(0, 8)}</span>
                                      <span>Мин: {service.min_quantity.toLocaleString()}</span>
                                      <span>Макс: {service.max_quantity.toLocaleString()}</span>
                                    </div>
                                  </div>
                                  <div className="text-right shrink-0">
                                    <span className="text-sm font-bold text-primary">
                                      {service.price.toFixed(2)} ₽
                                    </span>
                                    <p className="text-[10px] text-muted-foreground/60">за 1000</p>
                                  </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <Footer />
    </div>
  );
};

export default Catalog;
