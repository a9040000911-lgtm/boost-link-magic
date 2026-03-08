import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import CategoryCards from '@/components/CategoryCards';
import ServiceCarousel from '@/components/ServiceCarousel';
import {
  detectPlatform,
  categoriesByPlatform,
  getServicesForCategory,
  platformNames,
  type Platform,
  type Category,
  type Service,
} from '@/lib/smm-data';
import { ArrowLeft, ArrowRight, Check, ExternalLink, Minus, Plus } from 'lucide-react';

export interface LinkOrder {
  url: string;
  platform: Platform;
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
        const platform = detectPlatform(url);
        return platform ? { url, platform, category: null, service: null, quantity: 100 } : null;
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
  const canProceed = current.service !== null;

  // Parse price number from string like "0.8₽"
  const priceNum = current.service ? parseFloat(current.service.price.replace(/[^\d.]/g, '')) : 0;
  const total = priceNum * current.quantity;

  return (
    <div className="w-full max-w-5xl mx-auto">
      {/* Progress */}
      <div className="flex items-center justify-between mb-6">
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
              className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-colors ${
                i === currentIndex
                  ? 'bg-primary text-primary-foreground'
                  : i < currentIndex || order.service
                  ? 'bg-primary/20 text-primary'
                  : 'bg-muted text-muted-foreground'
              }`}
              animate={i === currentIndex ? { scale: [1, 1.1, 1] } : {}}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {i < currentIndex || order.service ? (
                <Check className="w-3.5 h-3.5" />
              ) : (
                i + 1
              )}
            </motion.div>
          ))}
        </div>
      </div>

      {/* Current link info */}
      <motion.div
        key={currentIndex}
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="glass-card p-4 mb-6 flex items-center gap-3"
      >
        <motion.span
          className="px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold border border-primary/20"
          animate={{ scale: [1, 1.05, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          {platformNames[current.platform]}
        </motion.span>
        <span className="text-sm text-muted-foreground truncate flex-1 flex items-center gap-1.5">
          <ExternalLink className="w-3.5 h-3.5 shrink-0" />
          {current.url}
        </span>
        <span className="text-xs text-muted-foreground shrink-0">
          {currentIndex + 1} из {orders.length}
        </span>
      </motion.div>

      {/* Steps */}
      <AnimatePresence mode="wait">
        {step === 'category' && (
          <motion.div
            key={`cat-${currentIndex}`}
            initial={{ opacity: 0, x: 50 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -50 }}
            transition={{ duration: 0.35 }}
          >
            <p className="text-sm text-muted-foreground mb-4 text-center">Выберите категорию</p>
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
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
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
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleNext}
                      className="w-full px-6 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/30 transition-shadow inline-flex items-center justify-center gap-2"
                    >
                      {isLastLink ? 'Завершить' : 'Следующая ссылка'}
                      {isLastLink ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
                    </motion.button>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Next button */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex justify-center mt-6"
            >
              <motion.button
                whileHover={{ scale: canProceed ? 1.05 : 1 }}
                whileTap={{ scale: canProceed ? 0.96 : 1 }}
                onClick={handleNext}
                disabled={!canProceed}
                className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm disabled:opacity-30 hover:shadow-lg hover:shadow-primary/30 transition-shadow inline-flex items-center gap-2"
              >
                {isLastLink ? 'Завершить' : 'Следующая ссылка'}
                {isLastLink ? <Check className="w-4 h-4" /> : <ArrowRight className="w-4 h-4" />}
              </motion.button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default MultiLinkFlow;
