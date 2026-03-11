import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryCards from '@/components/CategoryCards';
import PlatformIcon from '@/components/PlatformIcon';
import ServiceCarousel from '@/components/ServiceCarousel';
import { Stepper, type StepItem } from '@/components/ui/stepper';
import {
  analyzeLink,
  detectPlatform,
  categoriesByPlatform,
  getServicesForCategory,
  getRecommendedCategoryIds,
  platformNames,
  type Platform,
  type Category,
  type Service,
  type LinkAnalysis,
} from '@/lib/smm-data';
import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Minus,
  Plus,
  Package,
  CreditCard,
  Edit3,
  Trash2,
  AlertCircle,
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

// Steps for the wizard
const WIZARD_STEPS: StepItem[] = [
  { id: 'link', label: 'Ссылка', shortLabel: '1' },
  { id: 'category', label: 'Категория', shortLabel: '2' },
  { id: 'service', label: 'Услуга', shortLabel: '3' },
  { id: 'confirm', label: 'Подтверждение', shortLabel: '4' },
];

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
  const [step, setStep] = useState<'link' | 'category' | 'service' | 'confirm'>('link');
  const [editingField, setEditingField] = useState<'quantity' | null>(null);

  const current = orders[currentIndex];
  if (!current) return null;

  const categories = categoriesByPlatform[current.platform];
  const recommendedIds = getRecommendedCategoryIds(current.analysis, categories);
  const services = current.category ? getServicesForCategory(current.category.id) : [];

  // Calculate current step index for Stepper
  const stepIndex = useMemo(() => {
    switch (step) {
      case 'link': return 0;
      case 'category': return 1;
      case 'service': return 2;
      case 'confirm': return 3;
    }
  }, [step]);

  // Parse price number from string like "0.8₽"
  const priceNum = current.service ? parseFloat(current.service.price.replace(/[^\d.]/g, '')) : 0;
  const total = priceNum * current.quantity;

  // Total for all orders
  const grandTotal = useMemo(() => {
    return orders.reduce((sum, order) => {
      if (!order.service) return sum;
      const price = parseFloat(order.service.price.replace(/[^\d.]/g, ''));
      return sum + price * order.quantity;
    }, 0);
  }, [orders]);

  const handleCategorySelect = (cat: Category) => {
    const updated = [...orders];
    updated[currentIndex] = { ...current, category: cat, service: null, quantity: 100 };
    setOrders(updated);
    setStep('service');
  };

  const handleServiceSelect = (service: Service) => {
    const qty = Math.max(service.minOrder, Math.min(current.quantity, service.maxOrder));
    const updated = [...orders];
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
    if (step === 'link') {
      setStep('category');
    } else if (step === 'category' && current.category) {
      setStep('service');
    } else if (step === 'service' && current.service) {
      setStep('confirm');
    } else if (step === 'confirm') {
      // Move to next link or complete
      if (currentIndex < orders.length - 1) {
        setCurrentIndex(currentIndex + 1);
        setStep('link');
      } else {
        onComplete(orders);
      }
    }
  };

  const handleBack = () => {
    if (step === 'category') {
      setStep('link');
    } else if (step === 'service') {
      setStep('category');
    } else if (step === 'confirm') {
      setStep('service');
    }
  };

  const handleEditOrder = (index: number) => {
    setCurrentIndex(index);
    const order = orders[index];
    if (!order.category) {
      setStep('category');
    } else if (!order.service) {
      setStep('service');
    } else {
      setStep('confirm');
    }
  };

  const handleRemoveOrder = (index: number) => {
    if (orders.length === 1) {
      onCancel();
      return;
    }
    const updated = orders.filter((_, i) => i !== index);
    setOrders(updated);
    if (currentIndex >= updated.length) {
      setCurrentIndex(updated.length - 1);
    }
  };

  const isLastLink = currentIndex === orders.length - 1;
  const canProceed = useMemo(() => {
    switch (step) {
      case 'link': return true;
      case 'category': return current.category !== null;
      case 'service': return current.service !== null;
      case 'confirm': return true;
    }
  }, [step, current.category, current.service]);

  // Platform colors for styling
  const platformColors: Record<string, { border: string; bg: string; text: string; shadow: string }> = {
    instagram: { border: 'border-pink-400/50', bg: 'bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400', text: 'text-pink-600', shadow: 'shadow-pink-500/20' },
    youtube: { border: 'border-red-400/50', bg: 'bg-red-500', text: 'text-red-600', shadow: 'shadow-red-500/20' },
    tiktok: { border: 'border-slate-600/50', bg: 'bg-gradient-to-r from-slate-800 to-slate-700', text: 'text-slate-700', shadow: 'shadow-slate-500/20' },
    telegram: { border: 'border-sky-400/50', bg: 'bg-sky-500', text: 'text-sky-600', shadow: 'shadow-sky-500/20' },
    vk: { border: 'border-blue-400/50', bg: 'bg-blue-600', text: 'text-blue-600', shadow: 'shadow-blue-500/20' },
  };
  const colors = platformColors[current.platform] || platformColors.telegram;

  return (
    <div className="h-full flex flex-col py-4">
      {/* Header with Stepper */}
      <div className="shrink-0 mb-4">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={onCancel}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
            Отмена
          </button>

          {/* Link indicators */}
          {orders.length > 1 && (
            <div className="flex items-center gap-2">
              {orders.map((order, i) => (
                <motion.div
                  key={i}
                  onClick={() => handleEditOrder(i)}
                  className={cn(
                    'w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold cursor-pointer transition-all',
                    i === currentIndex
                      ? 'bg-primary text-primary-foreground ring-2 ring-primary/30'
                      : order.service
                      ? 'bg-primary/20 text-primary hover:bg-primary/30'
                      : 'bg-muted text-muted-foreground hover:bg-muted/80'
                  )}
                >
                  {order.service ? <Check className="w-3 h-3" /> : i + 1}
                </motion.div>
              ))}
            </div>
          )}
        </div>

        {/* Stepper */}
        <Stepper
          steps={WIZARD_STEPS}
          currentStep={stepIndex}
          completedSteps={[]}
          className="mb-4"
        />

        {/* Link info card */}
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            'p-3 flex items-center gap-3 rounded-xl bg-card border-2 shadow-md',
            colors.border,
            colors.shadow
          )}
        >
          <span className={cn(
            'px-2.5 py-1 rounded-full text-white text-xs font-semibold inline-flex items-center gap-1.5',
            colors.bg
          )}>
            <PlatformIcon platform={current.platform} className="w-3.5 h-3.5" />
            {platformNames[current.platform]}
          </span>
          {current.analysis && (
            <span className={cn('px-2 py-0.5 rounded-full bg-muted text-xs font-medium', colors.text)}>
              {current.analysis.label}
              {current.analysis.username && <span className="opacity-60 ml-1">@{current.analysis.username}</span>}
            </span>
          )}
          <span className="text-sm text-foreground font-medium truncate flex-1 flex items-center gap-1.5">
            <ExternalLink className={cn('w-3.5 h-3.5 shrink-0', colors.text)} />
            {current.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 45)}
            {current.url.length > 50 ? '...' : ''}
          </span>
          <span className="text-xs text-muted-foreground shrink-0">
            {currentIndex + 1} из {orders.length}
          </span>
        </motion.div>
      </div>

      {/* Step content */}
      <div className="flex-1 min-h-0 overflow-y-auto">
        <AnimatePresence mode="wait">
          {/* Step 1: Link info (auto-proceed) */}
          {step === 'link' && (
            <motion.div
              key="step-link"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
              className="flex flex-col items-center justify-center h-full text-center"
            >
              <div className={cn('w-16 h-16 rounded-full flex items-center justify-center mb-4', colors.bg)}>
                <ExternalLink className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Ссылка определена</h3>
              <p className="text-sm text-muted-foreground mb-6 max-w-xs">
                Платформа <strong>{platformNames[current.platform]}</strong> распознана.
                {current.analysis?.label && ` Тип: ${current.analysis.label}`}
              </p>
              <button
                onClick={handleNext}
                className="px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/30 transition-shadow inline-flex items-center gap-2"
              >
                Выбрать категорию
                <ArrowRight className="w-4 h-4" />
              </button>
            </motion.div>
          )}

          {/* Step 2: Category selection */}
          {step === 'category' && (
            <motion.div
              key="step-category"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-3"
              >
                <ArrowLeft className="w-4 h-4" />
                Назад
              </button>
              <p className="text-sm text-muted-foreground mb-3 text-center">
                {recommendedIds.length > 0 ? 'Рекомендуем для этого типа ссылки' : 'Выберите категорию'}
              </p>
              <CategoryCards
                categories={categories}
                onSelect={handleCategorySelect}
                selectedId={current.category?.id ?? null}
                recommendedIds={recommendedIds}
              />
            </motion.div>
          )}

          {/* Step 3: Service & Quantity */}
          {step === 'service' && current.category && (
            <motion.div
              key="step-service"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              <button
                onClick={handleBack}
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

              {/* Quantity selector inline */}
              {current.service && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="mt-4 p-4 rounded-xl bg-card border border-primary/20"
                >
                  <div className="flex items-center justify-between mb-3">
                    <label className="text-sm font-medium text-foreground">Количество</label>
                    <span className="text-sm text-muted-foreground">
                      от {current.service.minOrder} до {current.service.maxOrder.toLocaleString()}
                    </span>
                  </div>

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

                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-xs text-muted-foreground">Цена за ед.</p>
                      <p className="font-semibold">{current.service.price}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">Итого</p>
                      <motion.p
                        key={total}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        className="text-xl font-bold text-primary"
                      >
                        {total.toFixed(1)}₽
                      </motion.p>
                    </div>
                  </div>

                  <button
                    onClick={handleNext}
                    className="w-full mt-4 px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/30 transition-shadow inline-flex items-center justify-center gap-2"
                  >
                    Подтвердить
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </motion.div>
              )}
            </motion.div>
          )}

          {/* Step 4: Confirmation */}
          {step === 'confirm' && current.service && (
            <motion.div
              key="step-confirm"
              initial={{ opacity: 0, x: 50 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -50 }}
              transition={{ duration: 0.35 }}
            >
              <button
                onClick={handleBack}
                className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
              >
                <ArrowLeft className="w-4 h-4" />
                Изменить
              </button>

              <div className="text-center mb-4">
                <h3 className="text-lg font-semibold">Проверьте заказ</h3>
                <p className="text-sm text-muted-foreground">Убедитесь, что все данные верны</p>
              </div>

              {/* Current order preview */}
              <div className={cn('p-4 rounded-xl border-2 mb-4', colors.border, 'bg-card')}>
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className={cn('px-2 py-0.5 rounded-full text-white text-xs font-medium', colors.bg)}>
                      {platformNames[current.platform]}
                    </span>
                    {current.analysis && (
                      <span className="text-xs text-muted-foreground">{current.analysis.label}</span>
                    )}
                  </div>
                  <span className="text-xs text-muted-foreground">#{currentIndex + 1}</span>
                </div>

                <p className="text-sm font-medium mb-1 truncate">{current.service.name}</p>
                <p className="text-xs text-muted-foreground mb-3 line-clamp-2">{current.service.description}</p>

                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-muted-foreground">Количество:</span>
                  <span className="font-medium">{current.quantity.toLocaleString('ru-RU')}</span>
                </div>

                <div className="flex items-center justify-between text-sm mb-3">
                  <span className="text-muted-foreground">Ссылка:</span>
                  <a
                    href={current.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-primary hover:underline flex items-center gap-1 truncate max-w-[200px]"
                  >
                    <ExternalLink className="w-3 h-3 shrink-0" />
                    {current.url.replace(/^https?:\/\/(www\.)?/, '').slice(0, 25)}...
                  </a>
                </div>

                <div className="pt-3 border-t flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Стоимость:</span>
                  <span className="text-lg font-bold text-primary">{total.toFixed(1)}₽</span>
                </div>
              </div>

              {/* All orders summary (if multiple) */}
              {orders.length > 1 && (
                <div className="mb-4">
                  <p className="text-sm font-medium mb-2">Все заказы ({orders.length})</p>
                  <div className="space-y-2 max-h-40 overflow-y-auto">
                    {orders.map((order, i) => {
                      if (!order.service) return null;
                      const orderTotal = parseFloat(order.service.price.replace(/[^\d.]/g, '')) * order.quantity;
                      return (
                        <div
                          key={i}
                          className={cn(
                            'flex items-center justify-between p-2 rounded-lg',
                            i === currentIndex ? 'bg-primary/10 border border-primary/20' : 'bg-muted/50'
                          )}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-xs text-muted-foreground">#{i + 1}</span>
                            <span className="text-sm truncate">{order.service.name}</span>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="text-sm font-medium">{orderTotal.toFixed(1)}₽</span>
                            {i !== currentIndex && (
                              <>
                                <button
                                  onClick={() => handleEditOrder(i)}
                                  className="p-1 hover:bg-muted rounded"
                                >
                                  <Edit3 className="w-3 h-3 text-muted-foreground" />
                                </button>
                                <button
                                  onClick={() => handleRemoveOrder(i)}
                                  className="p-1 hover:bg-destructive/10 rounded"
                                >
                                  <Trash2 className="w-3 h-3 text-destructive" />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  <div className="flex items-center justify-between mt-3 pt-3 border-t">
                    <span className="font-medium">Итого:</span>
                    <span className="text-xl font-bold text-primary">{grandTotal.toFixed(1)}₽</span>
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="space-y-3">
                <button
                  onClick={handleNext}
                  className="w-full px-6 py-3.5 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/30 transition-shadow inline-flex items-center justify-center gap-2"
                >
                  <CreditCard className="w-4 h-4" />
                  {isLastLink ? 'Оплатить заказ' : 'Следующая ссылка'}
                  {!isLastLink && <ArrowRight className="w-4 h-4" />}
                </button>

                {!isLastLink && (
                  <p className="text-xs text-center text-muted-foreground">
                    Осталось обработать: {orders.length - currentIndex - 1} ссылок
                  </p>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default MultiLinkFlow;
