import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryCards from '@/components/CategoryCards';
import PlatformIcon from '@/components/PlatformIcon';
import { TelegramAlbumGuide } from '@/components/TelegramAlbumGuide';
import ServiceCarousel from '@/components/ServiceCarousel';
import {
  analyzeLink,
  detectPlatform,
  categoriesByPlatform,
  getServicesForCategory,
  getRecommendedCategoryIds,
  isConfidenceReliable,
  platformNames,
  platformBranding,
  type Platform,
  type Category,
  type Service,
  type LinkAnalysis,
} from '@/lib/smm-data';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Minus, Plus, AlertCircle, Sparkles } from 'lucide-react';
import { toast } from 'sonner';

export interface LinkOrder {
  url: string;
  platform: Platform;
  analysis: LinkAnalysis | null;
  category: Category | null;
  service: Service | null;
  quantity: number;
  slowDelivery?: boolean;
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
  const recommendedIds = getRecommendedCategoryIds(current.analysis, categories);
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
    const cappedValue = Math.max(0, Math.min(value, current.service.maxOrder));
    const updated = [...orders];
    updated[currentIndex] = { ...current, quantity: cappedValue };
    setOrders(updated);
  };

  const toggleSlowDelivery = () => {
    const updated = [...orders];
    updated[currentIndex] = { ...current, slowDelivery: !current.slowDelivery };
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

  const priceNum = current.service ? parseFloat(current.service.price.replace(/[^\d.]/g, '')) : 0;
  const total = priceNum * current.quantity;

  return (
    <div className="h-full flex flex-col py-4 overflow-visible">
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
                className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${i === currentIndex
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
          const platformColors = platformBranding[current.platform] || platformBranding.telegram;
          return (
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className={`p-4 flex items-center gap-4 rounded-xl bg-card border-2 ${platformColors.border} shadow-md ${platformColors.shadow}`}
            >
              <span className={`px-3 py-1.5 rounded-full ${platformColors.bg} text-white text-sm font-semibold inline-flex items-center gap-2`}>
                <PlatformIcon platform={current.platform} className="w-4 h-4" />
                {platformNames[current.platform]}
              </span>
              {current.analysis && (
                <span className={`px-3 py-1 rounded-full bg-muted text-sm font-medium ${platformColors.color}`}>
                  {current.analysis.label}
                  {current.analysis.username && <span className="opacity-60 ml-1">@{current.analysis.username}</span>}
                </span>
              )}
              <span className={`text-base text-foreground font-medium truncate flex-1 flex items-center gap-2`}>
                <ExternalLink className={`w-4 h-4 shrink-0 ${platformColors.color}`} />
                {current.url}
              </span>
              <span className="text-sm text-muted-foreground shrink-0">
                {currentIndex + 1} из {orders.length}
              </span>
            </motion.div>
          );
        })()}
      </div>

      <div className="flex-1 relative overflow-y-auto scrollbar-none fade-mask-y px-12 pt-6 pb-12">
        <AnimatePresence mode="wait">
          {step === 'category' && (
            <motion.div
              key={`cat-${currentIndex}`}
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              {current.platform === 'telegram' && current.analysis?.linkType === 'post' && (
                <div className="mb-4 animate-in fade-in slide-in-from-top-2">
                  <Alert className="bg-sky-50 border-sky-200 text-sky-800">
                    <AlertCircle className="h-4 w-4 stroke-sky-600" />
                    <AlertDescription className="text-xs leading-relaxed">
                      <span className="font-bold text-sky-900">Внимание!</span> В альбомах Telegram (несколько фото/видео) каждый элемент считается отдельным постом. Для равномерной накрутки рекомендуем заказать услугу на <span className="underline font-semibold">первое</span> и <span className="underline font-semibold">последнее</span> фото поста.
                      <TelegramAlbumGuide />
                    </AlertDescription>
                  </Alert>
                </div>
              )}
              <p className="text-sm text-muted-foreground mb-3 text-center">
                {isConfidenceReliable(current.analysis)
                  ? '🏷️ Выберите подходящую услугу для ссылки'
                  : '❓ Формат ссылки неоднозначный — выберите категорию вручную'}
              </p>
              <CategoryCards
                categories={isConfidenceReliable(current.analysis) && recommendedIds.length > 0
                  ? categories.filter(c => recommendedIds.includes(c.id))
                  : categories}
                onSelect={handleCategorySelect}
                selectedId={null}
                recommendedIds={recommendedIds}
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
                branding={platformBranding[current.platform]}
              />

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
                      {(() => {
                        const branding = platformBranding[current.platform];
                        return (
                          <>
                            <p className="text-xs text-muted-foreground mb-1 truncate">{current.service.name}</p>
                            <label className="text-sm font-medium text-foreground block mb-3">Количество</label>

                            <div className="flex items-center gap-3 mb-4">
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(current.quantity - (current.service?.minOrder || 50))}
                                className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:${branding?.bg || 'bg-primary'} hover:text-white transition-colors`}
                              >
                                <Minus className="w-4 h-4" />
                              </motion.button>
                              <input
                                type="number"
                                value={current.quantity}
                                onChange={(e) => handleQuantityChange(Number(e.target.value))}
                                min={0}
                                max={current.service?.maxOrder}
                                className="flex-1 text-center text-2xl font-bold bg-muted/50 rounded-xl py-2 text-foreground outline-none focus:ring-2 focus:ring-primary/30"
                              />
                              <motion.button
                                whileHover={{ scale: 1.1 }}
                                whileTap={{ scale: 0.9 }}
                                onClick={() => handleQuantityChange(current.quantity + (current.service?.minOrder || 50))}
                                className={`w-10 h-10 rounded-xl bg-muted flex items-center justify-center text-foreground hover:${branding?.bg || 'bg-primary'} hover:text-white transition-colors`}
                              >
                                <Plus className="w-4 h-4" />
                              </motion.button>
                            </div>

                            <div className="flex items-center justify-between text-sm mb-5">
                              <span className="text-muted-foreground">
                                от {current.service?.minOrder} до {current.service?.maxOrder.toLocaleString()}
                              </span>
                              <motion.span
                                key={total}
                                initial={{ scale: 1.2 }}
                                animate={{ scale: 1 }}
                                className={`text-lg font-bold ${branding?.color || 'text-primary'}`}
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
                                disabled={current.quantity < current.service.minOrder}
                                className={`flex-1 px-6 py-3 rounded-xl ${branding?.bg || 'bg-primary'} text-white font-semibold text-sm hover:shadow-lg transition-shadow inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed`}
                              >
                                {isLastLink ? 'Завершить' : 'Следующая ссылка'}
                                {isLastLink ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                              </motion.button>
                            </div>

                            {/* Min Order Suggestion */}
                            {current.service && current.quantity > 0 && current.quantity < current.service.minOrder && (
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="mt-4 p-3 rounded-xl bg-destructive/10 border border-destructive/20"
                              >
                                <div className="flex items-start gap-2">
                                  <AlertCircle className="w-4 h-4 text-destructive shrink-0 mt-0.5" />
                                  <div className="text-xs text-destructive-foreground">
                                    Минимум: <b>{current.service.minOrder}</b>.
                                    {(() => {
                                      const alt = services.find(s => s.id !== current.service?.id && s.minOrder <= current.quantity);
                                      if (alt) {
                                        return (
                                          <div className="mt-2 text-foreground">
                                            💡 Попробуйте аналог от {alt.minOrder}:
                                            <button
                                              onClick={() => handleServiceSelect(alt)}
                                              className="block mt-1 p-2 rounded-lg bg-background/50 border border-border hover:border-primary transition-colors text-left w-full"
                                            >
                                              <b>{alt.name}</b>
                                            </button>
                                          </div>
                                        );
                                      }
                                      return <p className="mt-1">Пожалуйста, увеличьте количество.</p>;
                                    })()}
                                  </div>
                                </div>
                              </motion.div>
                            )}

                            {/* Slow Delivery (Drip-feed) */}
                            {current.service && current.quantity >= (current.service.minOrder * 5) && (
                              <motion.div
                                initial={{ opacity: 0 }}
                                animate={{ opacity: 1 }}
                                className="mt-4 pt-4 border-t border-border"
                              >
                                <button
                                  onClick={toggleSlowDelivery}
                                  className={`w-full flex items-center justify-between p-3 rounded-xl border-2 transition-all ${current.slowDelivery
                                    ? `${branding?.border || 'border-primary'} bg-primary/5`
                                    : 'border-transparent bg-muted/50 hover:bg-muted'
                                    }`}
                                >
                                  <div className="flex items-center gap-3">
                                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${current.slowDelivery ? (branding?.bg || 'bg-primary') : 'bg-muted-foreground/20'}`}>
                                      <Check className={`w-4 h-4 ${current.slowDelivery ? 'text-white' : 'text-muted-foreground'}`} />
                                    </div>
                                    <div className="text-left">
                                      <div className="text-xs font-bold text-foreground">Безопасная доставка</div>
                                      <div className="text-[10px] text-muted-foreground">Растянуть заказ на 2-5 дней</div>
                                    </div>
                                  </div>
                                  <div className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${current.slowDelivery ? 'bg-green-500/10 text-green-600' : 'bg-muted-foreground/10 text-muted-foreground'}`}>
                                    {current.slowDelivery ? 'АКТИВНО' : 'ВКЛЮЧИТЬ'}
                                  </div>
                                </button>
                              </motion.div>
                            )}
                          </>
                        );
                      })()}
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
