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
    <div className={`flex flex-col ${isActive ? 'h-screen overflow-hidden bg-gradient-to-b from-background via-muted/60 to-background' : 'min-h-screen bg-background'}`}>
      {/* Hero — compact when flow/summary is active */}
      <div
        className={`flex flex-col items-center justify-center px-4 relative overflow-hidden shrink-0 transition-all duration-500 ${
          isActive ? 'pt-6 pb-6' : 'pt-24 pb-32 hero-gradient'
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
                className="h-full flex items-center justify-center"
              >
                <div className="relative w-full max-w-2xl rounded-2xl border border-border/60 shadow-xl bg-card/95 backdrop-blur-xl px-4 py-3 text-center">
                  {/* Header — inline */}
                  <div className="flex items-center justify-center gap-2 mb-2 relative z-10">
                    <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-pink-500 to-orange-400 flex items-center justify-center shadow-md">
                      <PartyPopper className="w-4 h-4 text-white" />
                    </div>
                    <div className="text-left">
                      <h2 className="text-sm font-bold text-foreground leading-tight">🎉 Заказ сформирован!</h2>
                      <p className="text-[10px] text-muted-foreground">{completedOrders.length} {completedOrders.length === 1 ? 'ссылка' : 'ссылок'}</p>
                    </div>
                  </div>

                  {/* Order rows — compact */}
                  <div className="space-y-1 text-left mb-2 relative z-10">
                    {completedOrders.map((order, i) => {
                      const price = parseFloat(order.service?.price?.replace(/[^\d.]/g, '') || '0');
                      const lineTotal = price * order.quantity;
                      return (
                        <div key={i} className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/40">
                          <span className="w-5 h-5 rounded bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold shrink-0">
                            {i + 1}
                          </span>
                          <div className="flex-1 min-w-0 flex items-center justify-between gap-2">
                            <div className="min-w-0">
                              <span className="text-xs font-medium text-foreground block truncate">
                                {order.category?.name} → {order.service?.name}
                              </span>
                              <span className="text-[10px] text-muted-foreground truncate block">{order.url}</span>
                            </div>
                            <span className="text-xs font-bold text-primary shrink-0">{lineTotal.toFixed(1)}₽</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Total — inline */}
                  <div className="flex items-center justify-between px-3 py-2 rounded-lg bg-primary/5 border border-primary/10 mb-2 relative z-10">
                    <span className="text-xs font-semibold text-foreground flex items-center gap-1">
                      <Zap className="w-3 h-3 text-primary" /> Итого
                    </span>
                    <span className="text-lg font-bold gradient-text">
                      {completedOrders.reduce((sum, o) => {
                        const p = parseFloat(o.service?.price?.replace(/[^\d.]/g, '') || '0');
                        return sum + p * o.quantity;
                      }, 0).toFixed(1)}₽
                    </span>
                  </div>

                  {/* Email — compact */}
                  <div className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg bg-muted/50 border border-border mb-2 relative z-10">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <input
                      type="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      placeholder="Email для регистрации"
                      className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-xs"
                    />
                  </div>

                  {/* Consent — single line each */}
                  <div className="space-y-1 mb-2 relative z-10 text-left">
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={consentPD} onChange={(e) => setConsentPD(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border text-primary shrink-0" />
                      <span className="text-[10px] text-muted-foreground">
                        Согласен на обработку <a href="/privacy" target="_blank" className="text-primary hover:underline">персональных данных</a> (152-ФЗ)
                      </span>
                    </label>
                    <label className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={consentOffer} onChange={(e) => setConsentOffer(e.target.checked)}
                        className="w-3.5 h-3.5 rounded border-border text-primary shrink-0" />
                      <span className="text-[10px] text-muted-foreground">
                        Принимаю <a href="/privacy" target="_blank" className="text-primary hover:underline">публичную оферту</a>
                      </span>
                    </label>
                  </div>

                  {/* Buttons */}
                  <div className="flex gap-2 justify-center relative z-10">
                    <button
                      onClick={() => { setCompletedOrders(null); setUrls(urls.length ? urls : completedOrders!.map(o => o.url)); }}
                      className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium"
                    >
                      ← Назад
                    </button>
                    <button onClick={handleReset} className="px-3 py-1.5 rounded-lg bg-muted text-foreground text-xs font-medium">
                      Новый заказ
                    </button>
                    <button
                      disabled={!email.includes('@') || !consentPD || !consentOffer}
                      className="px-4 py-1.5 rounded-lg bg-gradient-to-r from-primary to-rose-500 text-primary-foreground text-xs font-bold shadow-md disabled:opacity-40"
                    >
                      🚀 Оплатить
                    </button>
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
