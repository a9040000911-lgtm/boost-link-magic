import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroInput from '@/components/HeroInput';
import MultiLinkFlow from '@/components/MultiLinkFlow';
import type { LinkOrder } from '@/components/MultiLinkFlow';
import MarketingSection from '@/components/MarketingSection';
import { detectPlatform } from '@/lib/smm-data';
import { Sparkles, Check, ExternalLink } from 'lucide-react';

const Index = () => {
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrders, setCompletedOrders] = useState<LinkOrder[] | null>(null);

  const handleSubmit = (inputUrls: string[]) => {
    setIsLoading(true);
    setError('');
    setCompletedOrders(null);

    setTimeout(() => {
      const valid = inputUrls.filter((u) => detectPlatform(u) !== null);
      if (valid.length === 0) {
        setError('Ни одна платформа не определена. Поддерживаются: Instagram, YouTube, TikTok, Telegram, VK');
        setUrls([]);
      } else {
        setUrls(valid);
        if (valid.length < inputUrls.length) {
          setError(`${inputUrls.length - valid.length} ссылок не распознано и пропущено`);
        }
      }
      setIsLoading(false);
    }, 800);
  };

  const handleComplete = (orders: LinkOrder[]) => {
    setCompletedOrders(orders);
    setUrls([]);
  };

  const handleCancel = () => {
    setUrls([]);
    setError('');
  };

  const handleReset = () => {
    setCompletedOrders(null);
    setUrls([]);
    setError('');
  };

  const showFlow = urls.length > 0;
  const showSummary = completedOrders !== null;

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Hero */}
      <div className="hero-gradient flex flex-col items-center justify-center px-4 pt-24 pb-32 relative overflow-hidden">
        <motion.div
          className="absolute top-10 left-[10%] w-72 h-72 bg-primary/10 rounded-full blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-[10%] w-64 h-64 bg-primary/20 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-secondary/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 relative z-10"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium shadow-lg shadow-accent/20"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4" />
            SMM Panel
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold tracking-tight mb-10 text-foreground text-center relative z-10"
        >
          Продвигайте свои соцсети
        </motion.h1>

        {!showFlow && !showSummary && (
          <div className="relative z-10 w-full">
            <HeroInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm mt-6 bg-destructive/10 px-4 py-2 rounded-lg relative z-10"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background px-4 -mt-16 relative z-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {showFlow && (
              <motion.div
                key="flow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
              >
                <MultiLinkFlow
                  urls={urls}
                  onComplete={handleComplete}
                  onCancel={handleCancel}
                />
              </motion.div>
            )}

            {showSummary && completedOrders && (
              <motion.div
                key="summary"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="max-w-2xl mx-auto"
              >
                <div className="glass-card p-8 text-center mb-6">
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4"
                  >
                    <Check className="w-8 h-8 text-primary" />
                  </motion.div>
                  <h2 className="text-xl font-bold text-foreground mb-2">Заказ сформирован!</h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    {completedOrders.length} {completedOrders.length === 1 ? 'ссылка' : 'ссылок'} настроено
                  </p>

                  <div className="space-y-3 text-left mb-8">
                    {completedOrders.map((order, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.1 }}
                        className="flex items-center gap-3 p-3 rounded-xl bg-muted/50"
                      >
                        <span className="w-7 h-7 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold shrink-0">
                          {i + 1}
                        </span>
                        <div className="flex-1 min-w-0">
                          <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                            <ExternalLink className="w-3 h-3 shrink-0" />
                            {order.url}
                          </span>
                          <span className="text-sm font-medium text-foreground block">
                            {order.category?.name} → {order.service?.name} ({order.service?.price}/шт)
                          </span>
                        </div>
                      </motion.div>
                    ))}
                  </div>

                  <div className="flex gap-3 justify-center">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleReset}
                      className="px-6 py-3 rounded-xl bg-muted text-foreground text-sm font-medium"
                    >
                      Новый заказ
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      className="px-6 py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:shadow-lg hover:shadow-primary/30 transition-shadow"
                    >
                      Оплатить
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Marketing */}
      {!showFlow && !showSummary && <MarketingSection />}
    </div>
  );
};

export default Index;
