import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroInput from '@/components/HeroInput';
import MultiLinkFlow from '@/components/MultiLinkFlow';
import type { LinkOrder } from '@/components/MultiLinkFlow';
import MarketingSection from '@/components/MarketingSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Footer from '@/components/Footer';
import { detectPlatform } from '@/lib/smm-data';
import { Sparkles, Check, ExternalLink, Mail, PartyPopper, Zap } from 'lucide-react';

const Index = () => {
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [completedOrders, setCompletedOrders] = useState<LinkOrder[] | null>(null);
  const [email, setEmail] = useState('');
  const [consentPD, setConsentPD] = useState(false);
  const [consentOffer, setConsentOffer] = useState(false);
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
  const isActive = showFlow || showSummary;

  return (
    <div className={`flex flex-col hero-gradient ${isActive ? 'h-screen overflow-hidden' : 'min-h-screen'}`}>
      {/* Hero — compact when flow/summary is active */}
      <div
        className={`flex flex-col items-center justify-center px-4 relative overflow-hidden shrink-0 transition-all duration-500 ${
          isActive ? 'pt-6 pb-6' : 'pt-24 pb-32'
        }`}
      >
        {!isActive && (
          <>
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
          </>
        )}

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          className={`relative z-10 ${isActive ? 'mb-2' : 'mb-6'}`}
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium shadow-lg shadow-accent/20"
            whileHover={{ scale: 1.05 }}
          >
            <Sparkles className="w-4 h-4" />
            SMM Panel
          </motion.span>
        </motion.div>

        {!isActive && (
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-3xl md:text-5xl font-bold tracking-tight mb-10 text-foreground text-center relative z-10"
          >
            Продвигайте свои соцсети
          </motion.h1>
        )}

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
              className="text-destructive text-sm mt-4 bg-destructive/10 px-4 py-2 rounded-lg relative z-10"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content — fills remaining viewport */}
      <div className="flex-1 min-h-0 px-4 relative z-10 overflow-hidden">
        <div className="h-full max-w-5xl mx-auto">
          <AnimatePresence mode="wait">
            {showFlow && (
              <motion.div
                key="flow"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="h-full"
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
                className="h-full flex items-center justify-center py-2"
              >
                <div className="relative w-full max-w-2xl max-h-full rounded-2xl border border-border/60 shadow-xl bg-card/95 backdrop-blur-xl p-4 text-center overflow-hidden flex flex-col">
                  {/* Decorative gradient blobs */}
                  <motion.div
                    className="absolute -top-10 -right-10 w-40 h-40 rounded-full bg-gradient-to-br from-pink-400/30 via-rose-400/20 to-orange-300/20 blur-2xl pointer-events-none"
                    animate={{ scale: [1, 1.3, 1], rotate: [0, 90, 0] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
                  />
                  <motion.div
                    className="absolute -bottom-8 -left-8 w-32 h-32 rounded-full bg-gradient-to-tr from-violet-400/25 via-blue-400/20 to-sky-300/15 blur-2xl pointer-events-none"
                    animate={{ scale: [1, 1.2, 1], rotate: [0, -60, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
                  />

                  {/* Floating sparkles */}
                  <motion.div className="absolute top-3 right-4 text-amber-400 pointer-events-none"
                    animate={{ y: [0, -5, 0], opacity: [0.5, 1, 0.5] }}
                    transition={{ duration: 3, repeat: Infinity }}
                  >
                    <Sparkles className="w-3 h-3" />
                  </motion.div>

                  {/* Success icon */}
                  <motion.div
                    initial={{ scale: 0, rotate: -180 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: 'spring', bounce: 0.5 }}
                    className="w-11 h-11 rounded-2xl bg-gradient-to-br from-pink-500 via-rose-500 to-orange-400 flex items-center justify-center mx-auto mb-2 shadow-lg shadow-pink-500/30 relative z-10"
                  >
                    <PartyPopper className="w-5 h-5 text-white" />
                  </motion.div>

                  <motion.h2
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-lg font-bold text-foreground mb-0.5 relative z-10"
                  >
                    🎉 Заказ сформирован!
                  </motion.h2>
                  <p className="text-xs text-muted-foreground mb-2 relative z-10">
                    {completedOrders.length} {completedOrders.length === 1 ? 'ссылка' : 'ссылок'} настроено
                  </p>

                  <div className="space-y-1.5 text-left mb-3 flex-1 min-h-0 overflow-y-auto relative z-10">
                    {completedOrders.map((order, i) => {
                      const price = parseFloat(order.service?.price?.replace(/[^\d.]/g, '') || '0');
                      const lineTotal = price * order.quantity;
                      const rowGradients = [
                        'from-pink-500/10 to-rose-500/5',
                        'from-violet-500/10 to-purple-500/5',
                        'from-sky-500/10 to-blue-500/5',
                        'from-amber-500/10 to-orange-500/5',
                      ];
                      return (
                        <motion.div
                          key={i}
                          initial={{ opacity: 0, x: -20 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ delay: i * 0.1 }}
                          whileHover={{ scale: 1.02, x: 4 }}
                          className={`flex items-center gap-3 p-3 rounded-xl bg-gradient-to-r ${rowGradients[i % rowGradients.length]} border border-border/40`}
                        >
                          <motion.span
                            animate={{ rotate: [0, 10, -10, 0] }}
                            transition={{ duration: 3, repeat: Infinity, delay: i * 0.3 }}
                            className="w-7 h-7 rounded-lg bg-gradient-to-br from-primary to-secondary text-white flex items-center justify-center text-xs font-bold shrink-0 shadow-sm"
                          >
                            {i + 1}
                          </motion.span>
                          <div className="flex-1 min-w-0">
                            <span className="text-xs text-muted-foreground truncate flex items-center gap-1">
                              <ExternalLink className="w-3 h-3 shrink-0" />
                              {order.url}
                            </span>
                            <span className="text-sm font-semibold text-foreground block">
                              {order.category?.name} → {order.service?.name}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              {order.quantity.toLocaleString()} шт × {order.service?.price} ={' '}
                              <motion.span
                                key={lineTotal}
                                initial={{ scale: 1.3 }}
                                animate={{ scale: 1 }}
                                className="font-bold text-primary"
                              >
                                {lineTotal.toFixed(1)}₽
                              </motion.span>
                            </span>
                          </div>
                        </motion.div>
                      );
                    })}
                  </div>

                  {/* Grand total */}
                  <motion.div
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="flex items-center justify-between p-3 rounded-xl bg-gradient-to-r from-primary/10 via-secondary/10 to-accent/10 border border-primary/20 mb-3 relative z-10 shrink-0"
                  >
                    <span className="text-sm font-semibold text-foreground flex items-center gap-2">
                      <Zap className="w-4 h-4 text-primary" />
                      Итого
                    </span>
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: 'spring', bounce: 0.4, delay: 0.5 }}
                      className="text-2xl font-bold gradient-text"
                    >
                      {completedOrders.reduce((sum, o) => {
                        const p = parseFloat(o.service?.price?.replace(/[^\d.]/g, '') || '0');
                        return sum + p * o.quantity;
                      }, 0).toFixed(1)}₽
                    </motion.span>
                  </motion.div>

                  {/* Email input */}
                  <div className="mb-3 relative z-10 shrink-0">
                    <label className="text-xs font-medium text-foreground block mb-1 text-left">
                      Email для регистрации
                    </label>
                    <div className="flex items-center gap-2 p-2 rounded-xl bg-muted/50 border border-border focus-within:ring-2 focus-within:ring-primary/30 transition-shadow">
                      <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                      />
                    </div>
                  </div>

                  {/* Consent checkboxes — 152-ФЗ */}
                  <div className="space-y-2 mb-3 relative z-10 shrink-0 text-left">
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentPD}
                        onChange={(e) => setConsentPD(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/30 shrink-0"
                      />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Даю согласие на обработку моих{' '}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">персональных данных</a>{' '}
                        в соответствии с 152-ФЗ
                      </span>
                    </label>
                    <label className="flex items-start gap-2 cursor-pointer group">
                      <input
                        type="checkbox"
                        checked={consentOffer}
                        onChange={(e) => setConsentOffer(e.target.checked)}
                        className="mt-0.5 w-4 h-4 rounded border-border text-primary focus:ring-primary/30 shrink-0"
                      />
                      <span className="text-xs text-muted-foreground group-hover:text-foreground transition-colors">
                        Принимаю условия{' '}
                        <a href="/privacy" target="_blank" className="text-primary hover:underline">публичной оферты</a>
                      </span>
                    </label>
                  </div>

                  <div className="flex gap-2 justify-center flex-wrap relative z-10 shrink-0">
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={() => { setCompletedOrders(null); setUrls(urls.length ? urls : completedOrders!.map(o => o.url)); }}
                      className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium"
                    >
                      ← Назад
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.96 }}
                      onClick={handleReset}
                      className="px-4 py-2 rounded-xl bg-muted text-foreground text-sm font-medium"
                    >
                      Новый заказ
                    </motion.button>
                    <motion.button
                      whileHover={{ scale: 1.08, boxShadow: '0 8px 30px -5px hsl(335 85% 56% / 0.5)' }}
                      whileTap={{ scale: 0.96 }}
                      disabled={!email.includes('@') || !consentPD || !consentOffer}
                      className="px-5 py-2 rounded-xl bg-gradient-to-r from-primary via-pink-500 to-rose-500 text-primary-foreground text-sm font-bold shadow-lg shadow-primary/25 transition-shadow disabled:opacity-40 disabled:shadow-none"
                    >
                      🚀 Оплатить
                    </motion.button>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Marketing */}
      {!showFlow && !showSummary && (
        <>
          <MarketingSection />
          <TestimonialsSection />
          <Footer />
        </>
      )}
    </div>
  );
};

export default Index;
