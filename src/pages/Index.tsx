import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeroInput from '@/components/HeroInput';
import MultiLinkFlow from '@/components/MultiLinkFlow';
import type { LinkOrder } from '@/components/MultiLinkFlow';
import MarketingSection from '@/components/MarketingSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Footer from '@/components/Footer';
import { detectPlatformWithDb, type DbLinkPattern, type DbPlatform } from '@/lib/smm-data';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Sparkles, Check, ExternalLink, Mail, PartyPopper, Zap, AlertTriangle, BookOpen, ArrowRight, X } from 'lucide-react';

const Index = () => {
  const { content: siteContent } = useSiteContent();
  const navigate = useNavigate();
  const [urls, setUrls] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [unrecognizedUrls, setUnrecognizedUrls] = useState<string[]>([]);
  const [completedOrders, setCompletedOrders] = useState<LinkOrder[] | null>(null);
  const [email, setEmail] = useState('');
  const [consentPD, setConsentPD] = useState(false);
  const [consentOffer, setConsentOffer] = useState(false);
  const [dbPatterns, setDbPatterns] = useState<DbLinkPattern[]>([]);
  const [dbPlatforms, setDbPlatforms] = useState<DbPlatform[]>([]);

  // Load DB patterns + platforms once on mount
  useEffect(() => {
    Promise.all([
      supabase.from('link_patterns').select('*').eq('is_enabled', true).order('sort_order'),
      supabase.from('platforms').select('*').eq('is_enabled', true).order('sort_order'),
    ]).then(([{ data: pats }, { data: plats }]) => {
      if (pats) setDbPatterns(pats as unknown as DbLinkPattern[]);
      if (plats) setDbPlatforms(plats as unknown as DbPlatform[]);
    });
  }, []);

  const logUnrecognizedLinks = async (badUrls: string[]) => {
    const inserts = badUrls.map(url => ({ url, user_agent: navigator.userAgent }));
    await supabase.from('unrecognized_links' as any).insert(inserts);
    try {
      await supabase.functions.invoke('telegram-bot', {
        body: {
          action: 'notify',
          text: `⚠️ <b>Нераспознанные ссылки</b>\n\n${badUrls.map(u => `• ${u}`).join('\n')}\n\n<i>Проверьте анализатор ссылок</i>`,
          parse_mode: 'HTML',
        },
      });
    } catch {}
  };

  const handleSubmit = (inputUrls: string[]) => {
    setIsLoading(true);
    setError('');
    setUnrecognizedUrls([]);
    setCompletedOrders(null);

    setTimeout(() => {
      const valid = inputUrls.filter((u) => detectPlatformWithDb(u, dbPatterns, dbPlatforms) !== null);
      const invalid = inputUrls.filter((u) => detectPlatformWithDb(u, dbPatterns, dbPlatforms) === null);

      if (valid.length === 0 && invalid.length > 0) {
        // All unrecognized
        setError('Не удалось определить платформу');
        setUnrecognizedUrls(invalid);
        setUrls([]);
        logUnrecognizedLinks(invalid);
      } else if (valid.length > 0 && invalid.length > 0) {
        // Mixed: start flow with valid, show warning for invalid
        setUrls(valid);
        setUnrecognizedUrls(invalid);
        logUnrecognizedLinks(invalid);
      } else {
        // All valid
        setUrls(valid);
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
    setUnrecognizedUrls([]);
  };

  const handleReset = () => {
    setCompletedOrders(null);
    setUrls([]);
    setError('');
    setUnrecognizedUrls([]);
  };

  const handleDismissUnrecognized = (urlToRemove: string) => {
    setUnrecognizedUrls(prev => prev.filter(u => u !== urlToRemove));
  };

  const showFlow = urls.length > 0;
  const showSummary = completedOrders !== null;
  const isActive = showFlow || showSummary;
  // Show unrecognized banner when there are unrecognized urls (both standalone & alongside flow)
  const showUnrecognizedBanner = unrecognizedUrls.length > 0;

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
          <motion.div
            className="inline-flex items-center gap-1 text-6xl md:text-7xl lg:text-8xl font-extrabold tracking-tight select-none"
            whileHover={{ scale: 1.05 }}
          >
            {(siteContent?.heroTitle || "COOLLIKE").split("").map((letter, i) => (
              <motion.span
                key={i}
                className="inline-block text-white"
                style={{
                  WebkitTextStroke: "1px rgba(255,255,255,0.7)",
                  textShadow: "0 0 20px rgba(168,85,247,0.5), 0 4px 12px rgba(0,0,0,0.3)",
                  filter: "drop-shadow(0 2px 6px rgba(168,85,247,0.4))",
                  animationDelay: `${i * 0.15}s`,
                }}
                initial={{ opacity: 0, y: -20, rotate: -10 }}
                animate={{
                  opacity: 1,
                  y: [0, -4, 0],
                  rotate: [0, i % 2 === 0 ? 2 : -2, 0],
                }}
                transition={{
                  opacity: { duration: 0.4, delay: i * 0.08 },
                  y: { duration: 2, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" },
                  rotate: { duration: 2.5, repeat: Infinity, delay: i * 0.15, ease: "easeInOut" },
                }}
              >
                {letter}
              </motion.span>
            ))}
          </motion.div>
        </motion.div>

        {!isActive && (
          <motion.h1
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-2xl md:text-3xl font-medium tracking-tight mb-10 text-white text-center relative z-10"
          >
            {siteContent?.heroSubtitle || 'Продвигайте свои соцсети'}
          </motion.h1>
        )}

        {!showFlow && !showSummary && (
          <div className="relative z-10 w-full">
            <HeroInput onSubmit={handleSubmit} isLoading={isLoading} />
          </div>
        )}

        {/* Error: ALL links unrecognized (no flow started) */}
        <AnimatePresence>
          {error && !showFlow && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="relative z-10 w-full max-w-2xl mx-auto mt-4"
            >
              <div className="rounded-2xl border-2 border-white/30 bg-background/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/20">
                <div className="flex items-start gap-4 mb-5">
                  <div className="w-12 h-12 rounded-xl bg-destructive/15 flex items-center justify-center shrink-0">
                    <AlertTriangle className="w-6 h-6 text-destructive" />
                  </div>
                  <div>
                    <h3 className="text-base md:text-lg font-bold text-foreground mb-1.5">{error}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      Возможно, формат ссылки новый или платформа пока не поддерживается автоматически. 
                      Вы можете выбрать услугу вручную в каталоге — ваша ссылка будет подставлена автоматически.
                    </p>
                  </div>
                </div>
                {unrecognizedUrls.length > 0 && (
                  <div className="space-y-1.5 mb-5">
                    {unrecognizedUrls.map((u, i) => (
                      <div key={i} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-muted text-sm text-muted-foreground">
                        <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                        <span className="truncate flex-1">{u}</span>
                        <button
                          onClick={() => navigate(`/catalog?link=${encodeURIComponent(u)}`)}
                          className="text-xs text-primary font-medium hover:underline shrink-0"
                        >
                          В каталог →
                        </button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex flex-col sm:flex-row gap-3">
                  <button
                    onClick={() => {
                      const links = unrecognizedUrls.map(u => encodeURIComponent(u)).join(',');
                      navigate(`/catalog?link=${links}`);
                    }}
                    className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl bg-primary text-primary-foreground text-base font-bold shadow-lg hover:opacity-90 transition-opacity"
                  >
                    <BookOpen className="w-5 h-5" />
                    Перейти в каталог
                    <ArrowRight className="w-5 h-5" />
                  </button>
                  <button
                    onClick={() => { setError(''); setUnrecognizedUrls([]); }}
                    className="px-6 py-3.5 rounded-xl border border-border bg-muted text-foreground text-sm font-medium hover:bg-accent transition-colors"
                  >
                    Попробовать другую ссылку
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Unrecognized links banner — shown alongside flow when some links were split out */}
      <AnimatePresence>
        {showUnrecognizedBanner && showFlow && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="px-4 relative z-20"
          >
            <div className="max-w-5xl mx-auto mb-3">
              <div className="rounded-xl border border-accent bg-accent/30 backdrop-blur-sm p-4">
                <div className="flex items-center gap-2 mb-2">
                  <AlertTriangle className="w-4 h-4 text-destructive" />
                  <span className="text-sm font-semibold text-foreground">
                    {unrecognizedUrls.length} {unrecognizedUrls.length === 1 ? 'ссылка не распознана' : 'ссылок не распознано'}
                  </span>
                </div>
                <div className="space-y-1.5 mb-3">
                  {unrecognizedUrls.map((u, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-background/60 text-xs text-muted-foreground">
                      <ExternalLink className="w-3 h-3 shrink-0" />
                      <span className="truncate flex-1">{u}</span>
                      <button
                        onClick={() => navigate(`/catalog?link=${encodeURIComponent(u)}`)}
                        className="text-xs text-primary font-medium hover:underline shrink-0"
                      >
                        В каталог
                      </button>
                      <button onClick={() => handleDismissUnrecognized(u)} className="text-muted-foreground hover:text-foreground shrink-0">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
                <button
                  onClick={() => {
                    const links = unrecognizedUrls.map(u => encodeURIComponent(u)).join(',');
                    navigate(`/catalog?link=${links}`);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-primary text-primary-foreground text-xs font-bold hover:opacity-90 transition-opacity"
                >
                  <BookOpen className="w-3.5 h-3.5" />
                  Все в каталог
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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
