import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryCards from '@/components/CategoryCards';
import PlatformIcon from '@/components/PlatformIcon';
import ServiceCarousel from '@/components/ServiceCarousel';
import {
  analyzeLink,
  detectPlatform,
  categoriesByPlatform,
  getServicesForCategory,
  platformNames,
  type Platform,
  type Category,
  type Service,
  type LinkAnalysis,
} from '@/lib/smm-data';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Minus, Plus } from 'lucide-react';

export interface LinkOrder {
  url: string;
  platform: Platform;
  analysis: LinkAnalysis | null;
  category: Category | null;
  service: Service | null;
  quantity: number;
}

interface MultiLinkFlowProps {
  urls: string[];
  onComplete: (orders: LinkOrder[]) => void;
  onCancel: () => void;
}

const MultiLinkFlow = ({ urls, onComplete, onCancel }: MultiLinkFlowProps) => {
  const [orders, setOrders] = useState<LinkOrder[]>(() =>
    urls
      .map((url) => {
        const analysis = analyzeLink(url);
        const platform = analysis?.platform ?? detectPlatform(url);
        return platform ? { url, platform, analysis, category: null, service: null, quantity: 100 } : null;
      })
      .filter(Boolean) as LinkOrder[]
  );

  const [currentIndex, setCurrentIndex] = useState(0);
  const [step, setStep] = useState<'category' | 'service'>('category');

  const current = orders[currentIndex];
  if (!current) return null;

  const categories = categoriesByPlatform[current.platform];
  const services = current.category ? getServicesForCategory(current.category.id) : [];

  const handleCategorySelect = (cat: Category) => {
    const updated = [...orders];
    updated[currentIndex] = { ...current, category: cat, service: null, quantity: 100 };
    setOrders(updated);
    setStep('service');
  };

  const handleServiceSelect = (service: Service) => {
    const updated = [...orders];
    const qty = Math.max(service.minOrder, Math.min(current.quantity, service.maxOrder));
    updated[currentIndex] = { ...current, service, quantity: qty };
    setOrders(updated);
  };

  const handleQuantityChange = (value: number) => {
    if (!current.service) return;
    const clamped = Math.max(current.service.minOrder, Math.min(value, current.service.maxOrder));
    const updated = [...orders];
    updated[currentIndex] = { ...current, quantity: clamped };
    setOrders(updated);
  };

  const handleNext = () => {
    if (currentIndex < orders.length - 1) {
      setCurrentIndex(currentIndex + 1);
      setStep('category');
    } else {
      onComplete(orders);
    }
  };

  const handleBackToCategories = () => {
    const updated = [...orders];
    updated[currentIndex] = { ...current, category: null, service: null };
    setOrders(updated);
    setStep('category');
  };

  const isLastLink = currentIndex === orders.length - 1;

  // Parse price number from string like "0.8₽"
  const priceNum = current.service ? parseFloat(current.service.price.replace(/[^\d.]/g, '')) : 0;
  const total = priceNum * current.quantity;

  return (
    <div className="h-full flex flex-col py-4">
      {/* Progress + link info — compact header */}
      <div className="shrink-0 mb-3">
        <div className="flex items-center justify-between mb-3">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Назад
          </button>

          <div className="flex items-center gap-2">
            {orders.map((order, i) => (
              <motion.div
                key={i}
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                  i === currentIndex
                    ? 'bg-primary text-primary-foreground'
                    : i < currentIndex || order.service
                    ? 'bg-primary/20 text-primary'
                    : 'bg-muted text-muted-foreground'
                }`}
              >
                {i < currentIndex || order.service ? (
                  <Check className="w-3 h-3" />
                ) : (
                  i + 1
                )}
              </motion.div>
            ))}
          </div>
        </div>

        {(() => {
          const platformColors: Record<string, { border: string; bg: string; text: string; shadow: string }> = {
            instagram: { border: 'border-pink-400/50', bg: 'bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400', text: 'text-pink-600', shadow: 'shadow-pink-500/20' },
            youtube: { border: 'border-red-400/50', bg: 'bg-red-500', text: 'text-red-600', shadow: 'shadow-red-500/20' },
            tiktok: { border: 'border-slate-600/50', bg: 'bg-gradient-to-r from-slate-800 to-slate-700', text: 'text-slate-700', shadow: 'shadow-slate-500/20' },
            telegram: { border: 'border-sky-400/50', bg: 'bg-sky-500', text: 'text-sky-600', shadow: 'shadow-sky-500/20' },
            vk: { border: 'border-blue-400/50', bg: 'bg-blue-600', text: 'text-blue-600', shadow: 'shadow-blue-500/20' },
          };
          const colors = platformColors[current.platform] || platformColors.telegram;
          return (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-3 flex items-center gap-3 rounded-xl bg-card border-2 ${colors.border} shadow-md ${colors.shadow}`}
            >
              <span className={`px-2.5 py-1 rounded-full ${colors.bg} text-white text-xs font-semibold inline-flex items-center gap-1.5`}>
                <PlatformIcon platform={current.platform} className="w-3.5 h-3.5" />
                {platformNames[current.platform]}
              </span>
              {current.analysis && (
                <span className={`px-2 py-0.5 rounded-full bg-muted text-xs font-medium ${colors.text}`}>
                  {current.analysis.label}
                  {current.analysis.username && <span className="opacity-60 ml-1">@{current.analysis.username}</span>}
                </span>
              )}
              <span className={`text-sm text-foreground font-medium truncate flex-1 flex items-center gap-1.5`}>
                <ExternalLink className={`w-3.5 h-3.5 shrink-0 ${colors.text}`} />
                {current.url}
              </span>
              <span className="text-xs text-muted-foreground shrink-0">
                {currentIndex + 1} из {orders.length}
              </span>
            </motion.div>
          );
        })()}
      </div>

      {/* Steps — fills remaining space */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {step === 'category' && (
            <motion.div
              key={`cat-${currentIndex}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              <p className="text-sm text-muted-foreground mb-3 text-center">Выберите категорию</p>
              <CategoryCards
                categories={categories}
                onSelect={handleCategorySelect}
                selectedId={null}
              />
            </motion.div>
          )}

          {step === 'service' && current.category && (
            <motion.div
              key={`svc-${currentIndex}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              <button
                onClick={handleBackToCategories}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Другая категория
              </button>

              <ServiceCarousel
                services={services}
                categoryName={current.category.name}
                onServiceSelect={handleServiceSelect}
                selectedServiceId={current.service?.id ?? null}
              />

              {/* Quantity input — fixed overlay */}
              <AnimatePresence>
                {current.service && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm"
                  >
                    <motion.div
                      initial={{ opacity: 0, scale: 0.9, y: 20 }}
                      animate={{ opacity: 1, scale: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.9, y: 10 }}
                      className="glass-card p-6 w-full max-w-md mx-4"
                    >
                      <p className="text-xs text-muted-foreground mb-1 truncate">{current.service.name}</p>
                      <label className="text-sm font-medium text-foreground block mb-3">
                        Количество
                      </label>
                      <div className="flex items-center gap-3 mb-4">
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleQuantityChange(current.quantity - (current.service?.minOrder || 50))}
                          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </motion.button>
                        <input
                          type="number"
                          value={current.quantity}
                          onChange={(e) => handleQuantityChange(Number(e.target.value))}
                          min={current.service.minOrder}
                          max={current.service.maxOrder}
                          className="flex-1 text-center text-2xl font-bold bg-muted/50 rounded-xl py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                        />
                        <motion.button
                          whileHover={{ scale: 1.1 }}
                          whileTap={{ scale: 0.9 }}
                          onClick={() => handleQuantityChange(current.quantity + (current.service?.minOrder || 50))}
                          className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:bg-primary hover:text-primary-foreground transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </motion.button>
                      </div>
                      <div className="flex items-center justify-between text-sm mb-5">
                        <span className="text-muted-foreground">
                          от {current.service.minOrder} до {current.service.maxOrder.toLocaleString()}
                        </span>
                        <motion.span
                          key={total}
                          initial={{ scale: 1.2 }}
                          animate={{ scale: 1 }}
                          className="text-lg font-bold text-primary"
                        >
                          {total.toFixed(1)}₽
                        </motion.span>
                      </div>
                      <div className="flex gap-3">
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={() => {
                            const updated = [...orders];
                            updated[currentIndex] = { ...current, service: null };
                            setOrders(updated);
                          }}
                          className="px-5 py-3 rounded-xl bg-muted text-foreground text-sm font-medium"
                        >
                          ← Назад
                        </motion.button>
                        <motion.button
                          whileHover={{ scale: 1.05 }}
                          whileTap={{ scale: 0.96 }}
                          onClick={handleNext}
                          className="flex-1 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/30 transition-shadow inline-flex items-center justify-center gap-2"
                        >
                          {isLastLink ? 'Завершить' : 'Следующая ссылка'}
                          {isLastLink ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                        </motion.button>
                      </div>
                    </motion.div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiLinkFlow;
