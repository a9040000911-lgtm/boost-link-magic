import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate } from 'react-router-dom';
import HeroInput from '@/components/HeroInput';
import MultiLinkFlow from '@/components/MultiLinkFlow';
import type { LinkOrder } from '@/components/MultiLinkFlow';
import MarketingSection from '@/components/MarketingSection';
import TestimonialsSection from '@/components/TestimonialsSection';
import Footer from '@/components/Footer';
import SiteHeader from '@/components/SiteHeader';
import { detectPlatformWithDb, platformNames, platformBranding, type DbLinkPattern, type DbPlatform, type Platform } from '@/lib/smm-data';
import { supabase } from '@/integrations/supabase/client';
import { useSiteContent } from '@/hooks/useSiteContent';
import { Sparkles, Check, ExternalLink, Mail, PartyPopper, Zap, AlertTriangle, BookOpen, ArrowRight, X, Lock, KeyRound, ShoppingCart, ArrowLeft, RefreshCw, ShieldCheck, Fingerprint } from 'lucide-react';
import { toast } from 'sonner';

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
  const [loginMode, setLoginMode] = useState(false);
  const [password, setPassword] = useState('');
  const [authLoading, setAuthLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [detectedEmail, setDetectedEmail] = useState<string | null>(null);

  const validateEmail = (email: string) => {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  };

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
    } catch { }
  };

  const handleSubmit = (inputUrls: string[]) => {
    setIsLoading(true);
    setError('');
    setUnrecognizedUrls([]);
    setCompletedOrders(null);
    setDetectedEmail(null);

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

      // Check if any of the invalid/unrecognized items look like an email
      if (valid.length === 0 && invalid.length === 1) {
        const potentialEmail = invalid[0].toLowerCase().trim();
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (emailRegex.test(potentialEmail)) {
          setDetectedEmail(potentialEmail);
          setError(''); // Clear generic error if we found a specific "email" case
        }
      }
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
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="flex flex-col min-h-screen bg-background scrollbar-none overflow-x-hidden"
    >
      <SiteHeader />

      {/* Main content wrapper to push footer down */}
      <main className="flex-1 flex flex-col">
        {/* Hero */}
        <div
          className={`flex flex-col items-center justify-center px-4 relative overflow-hidden shrink-0 transition-all duration-500 hero-gradient 
            ${isActive ? 'pt-28 pb-12 min-h-[140px]' : 'pt-48 pb-24 min-h-[450px]'}`}
        >

          <AnimatePresence>
            {!isActive && (
              <motion.div
                key="hero-decor"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.5 }}
                className="absolute inset-0 z-0 pointer-events-none"
              >
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

                {/* Elegant Decor Elements */}
                <div className="absolute inset-0 z-0 opacity-20 pointer-events-none">
                  <div className="absolute top-[20%] right-[15%] w-32 h-32 border border-white/10 rounded-3xl rotate-12 backdrop-blur-sm" />
                  <div className="absolute bottom-[25%] left-[12%] w-24 h-24 border border-primary/20 rounded-full rotate-45 backdrop-blur-[2px]" />
                  <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10" />
                </div>

                <motion.div
                  className="absolute top-0 left-0 w-full h-full z-0 opacity-[0.03] pointer-events-none"
                  style={{ backgroundImage: 'radial-gradient(circle at 1px 1px, white 1px, transparent 0)', backgroundSize: '40px 40px' }}
                />
              </motion.div>
            )}
          </AnimatePresence>

          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className={`relative z-10 ${isActive ? 'mb-2' : 'mb-6'}`}
          >
            <motion.div
              className={`inline-flex items-center gap-1 font-extrabold tracking-tight select-none ${isActive ? 'text-5xl md:text-6xl lg:text-7xl' : 'text-6xl md:text-7xl lg:text-8xl'}`}
              whileHover={{ scale: 1.05 }}
            >
              {(siteContent?.heroTitle || "COOLLIKE").split("").map((letter, i) => (
                <motion.span
                  key={i}
                  className="inline-block"
                  style={{
                    color: "white",
                    textShadow: `
                    0 1px 0 rgba(255,255,255,0.4),
                    0 2px 0 rgba(200,200,200,0.3),
                    0 3px 0 rgba(180,180,180,0.2),
                    0 4px 0 rgba(160,160,160,0.15),
                    0 5px 0 rgba(140,140,140,0.1),
                    0 6px 1px rgba(0,0,0,0.06),
                    0 0 10px rgba(255,255,255,0.15),
                    0 3px 15px rgba(0,0,0,0.2),
                    0 6px 25px rgba(0,0,0,0.15)
                  `,
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
              className="text-2xl md:text-3xl font-medium tracking-tight mb-8 text-white text-center relative z-10"
            >
              {siteContent?.heroSubtitle || 'Продвигайте свои соцсети'}
            </motion.h1>
          )}

          {!showFlow && !showSummary && (
            <div className="relative z-10 w-full">
              <HeroInput onSubmit={handleSubmit} isLoading={isLoading} />
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.5 }}
                className="flex justify-center mt-4"
              >
                <button
                  onClick={() => navigate('/catalog')}
                  className="text-sm text-white/60 hover:text-white transition-colors underline underline-offset-4 decoration-white/30 hover:decoration-white/60"
                >
                  Или выберите услугу в каталоге →
                </button>
              </motion.div>
            </div>
          )}

          {/* Detected Email UI */}
          <AnimatePresence>
            {detectedEmail && !showFlow && (
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="relative z-10 w-full max-w-2xl mx-auto mt-4"
              >
                <div className="rounded-2xl border-2 border-white/30 bg-background/95 backdrop-blur-xl p-6 md:p-8 shadow-2xl shadow-black/20">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-12 h-12 rounded-xl bg-primary/15 flex items-center justify-center shrink-0">
                      <Mail className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="text-base md:text-lg font-bold text-foreground mb-1.5 flex items-center gap-2">
                        Это ваша почта?
                        <span className="px-2 py-0.5 rounded-full bg-primary/10 text-primary text-[10px] uppercase tracking-wider">Обнаружен Email</span>
                      </h3>
                      <p className="text-sm text-muted-foreground leading-relaxed">
                        Вы вставили <code className="text-foreground font-mono bg-muted px-1.5 py-0.5 rounded">{detectedEmail}</code> вместо ссылки на соцсеть.
                        Как вы хотите продолжить?
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                    <button
                      onClick={() => {
                        setEmail(detectedEmail);
                        setDetectedEmail(null);
                        toast.success(
                          <div className="flex flex-col gap-1">
                            <span className="font-bold">Почта сохранена!</span>
                            <span className="text-xs opacity-80">Теперь вставьте ссылку на пост для накрутки.</span>
                          </div>,
                          { duration: 5000, icon: <Check className="w-4 h-4 text-green-500" /> }
                        );
                      }}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-primary/20 bg-primary/5 hover:bg-primary/10 transition-colors group text-center"
                    >
                      <Sparkles className="w-5 h-5 text-primary mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-foreground">Запомнить для заказа</span>
                      <span className="text-[10px] text-muted-foreground">Применим при оплате</span>
                    </button>

                    <button
                      onClick={() => navigate(`/auth?email=${encodeURIComponent(detectedEmail)}`)}
                      className="flex flex-col items-center justify-center p-4 rounded-xl border border-border bg-muted hover:bg-accent transition-colors group text-center"
                    >
                      <Lock className="w-5 h-5 text-muted-foreground mb-2 group-hover:scale-110 transition-transform" />
                      <span className="text-sm font-bold text-foreground">Войти в кабинет</span>
                      <span className="text-[10px] text-muted-foreground">Быстрый переход к входу</span>
                    </button>
                  </div>

                  <button
                    onClick={() => { setDetectedEmail(null); setUrls([]); }}
                    className="w-full py-3 rounded-xl border border-border bg-background text-muted-foreground text-xs font-medium hover:text-foreground hover:bg-muted transition-colors flex items-center justify-center gap-2"
                  >
                    <RefreshCw className="w-3.5 h-3.5" />
                    Попробовать другую ссылку
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

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

        <div className={`${isActive ? 'flex-1 min-h-[60vh]' : 'h-0 overflow-hidden'} px-4 relative z-10`}>
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
                  className="min-h-0 flex-1 flex flex-col mb-4 scrollbar-none"
                >
                  <div className="relative w-full flex-1 rounded-2xl border border-border/60 shadow-xl bg-card/95 backdrop-blur-xl flex flex-col overflow-hidden max-w-2xl mx-auto">
                    {/* Header */}
                    <div className="shrink-0 px-6 py-5 border-b border-border/60 bg-muted/30">
                      <div className="flex items-center justify-center gap-3">
                        <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                          <ShoppingCart className="w-6 h-6 text-white" />
                        </div>
                        <div className="text-left">
                          <h2 className="text-xl font-bold text-foreground leading-tight">Проверьте заказ</h2>
                          <p className="text-sm text-muted-foreground">
                            {completedOrders.length} {completedOrders.length === 1 ? 'услуга' : 'услуг'} · детали ниже
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Content - Scrollable */}
                    <div className="flex-1 overflow-y-auto scrollbar-none p-4 sm:p-6 space-y-4">
                      {completedOrders.map((order, i) => {
                        const price = parseFloat(order.service?.price?.replace(/[^\d.]/g, '') || '0');
                        const lineTotal = price * order.quantity;
                        const branding = platformBranding[order.platform];
                        return (
                          <div key={i} className={`rounded-xl border ${branding?.border || 'border-border/60'} ${branding?.lightBg || 'bg-muted/20'} overflow-hidden shadow-sm`}>
                            <div className={`flex items-center gap-3 px-5 py-3 ${branding?.lightBg || 'bg-muted/40'} border-b ${branding?.border || 'border-border/40'}`}>
                              <span className={`w-6 h-6 rounded-lg ${branding?.bg || 'bg-primary'} text-white flex items-center justify-center text-xs font-black shrink-0 shadow-sm`}>
                                {i + 1}
                              </span>
                              <div className="flex-1 min-w-0">
                                <span className="text-sm font-bold text-foreground block truncate">
                                  {order.category?.name} → {order.service?.name}
                                </span>
                                <span className="text-xs text-muted-foreground truncate block opacity-70">{order.url}</span>
                              </div>
                              <span className={`text-lg font-black ${branding?.color || 'text-primary'} shrink-0`}>{lineTotal.toFixed(1)}₽</span>
                            </div>
                            <div className="px-4 py-2 flex gap-4 text-xs text-muted-foreground">
                              <span>Кол-во: <b className="text-foreground">{order.quantity.toLocaleString()}</b></span>
                              <span>Скорость: <b className="text-foreground">{order.service?.speed || '—'}</b></span>
                            </div>
                          </div>
                        );
                      })}
                    </div>

                    {/* Fixed bottom: total + email + buttons */}
                    <div className="shrink-0 border-t border-border/60 bg-card px-6 py-5 pb-6 space-y-4">
                      {(() => {
                        const firstPlatform = completedOrders?.[0]?.platform;
                        const branding = firstPlatform ? platformBranding[firstPlatform] : null;
                        return (
                          <div className={`flex items-center justify-between px-4 py-3 rounded-xl ${branding?.bg || 'bg-gradient-to-r from-primary to-rose-500'} shadow-lg border ${branding?.border || 'border-white/20'}`}>
                            <span className="text-sm font-bold text-white flex items-center gap-2">
                              <Zap className="w-5 h-5 font-bold" /> Итого
                            </span>
                            <span className="text-xl font-black text-white">
                              {completedOrders.reduce((sum, o) => {
                                const p = parseFloat(o.service?.price?.replace(/[^\d.]/g, '') || '0');
                                return sum + p * o.quantity;
                              }, 0).toFixed(1)}₽
                            </span>
                          </div>
                        );
                      })()}

                      <div className="space-y-4">
                        <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-muted/50 border border-border">
                          <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                          <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder="Ваш Email"
                            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                          />
                        </div>

                        <div className="space-y-1 text-left">
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={consentPD} onChange={(e) => setConsentPD(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border text-primary shrink-0 transition-transform group-hover:scale-110" />
                            <span className="text-[10px] text-muted-foreground">Согласен на <a href="/privacy" target="_blank" className="text-primary hover:underline">обработку данных</a></span>
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer group">
                            <input type="checkbox" checked={consentOffer} onChange={(e) => setConsentOffer(e.target.checked)}
                              className="w-3.5 h-3.5 rounded border-border text-primary shrink-0 transition-transform group-hover:scale-110" />
                            <span className="text-[10px] text-muted-foreground">Принимаю <a href="/privacy" target="_blank" className="text-primary hover:underline">публичную оферту</a></span>
                          </label>
                        </div>

                        <div className="flex flex-wrap gap-2">
                          <button
                            onClick={() => { setCompletedOrders(null); setUrls(urls.length ? urls : completedOrders!.map(o => o.url)); }}
                            className="flex-1 px-4 py-2.5 rounded-xl bg-muted text-foreground text-xs font-bold hover:bg-accent transition-all active:scale-95"
                          >
                            Назад
                          </button>
                          <button
                            disabled={!validateEmail(email) || !consentPD || !consentOffer || authLoading}
                            onClick={async () => {
                              if (!completedOrders) return;
                              setAuthLoading(true);
                              sessionStorage.setItem('pending_order', JSON.stringify({
                                orders: completedOrders.map(o => ({
                                  url: o.url,
                                  platform: o.platform,
                                  categoryName: o.category?.name,
                                  serviceName: o.service?.name,
                                  serviceId: o.service?.id,
                                  quantity: o.quantity,
                                  price: o.service?.price,
                                })),
                                email,
                              }));
                              navigate(`/auth?onboarding=true&email=${encodeURIComponent(email)}&redirect=/dashboard/orders&pending=1`);
                              setAuthLoading(false);
                            }}
                            className={`flex-[2] px-6 py-2.5 rounded-xl ${platformBranding[completedOrders?.[0]?.platform || 'telegram']?.bg || 'bg-primary'} text-white text-sm font-bold shadow-lg disabled:opacity-40 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2`}
                          >
                            <Sparkles className="w-4 h-4" />
                            {authLoading ? 'Загрузка...' : 'Оплатить'}
                          </button>
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

      </main>

      {/* Persistent Footer or conditional lower content */}
      <AnimatePresence>
        {!isActive ? (
          <motion.div
            key="home-lower-content"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(10px)' }}
            transition={{ duration: 0.4, ease: 'easeInOut' }}
          >
            <MarketingSection />
            <TestimonialsSection />
            <Footer />
          </motion.div>
        ) : (
          <div className="mt-auto">
            <Footer />
          </div>
        )}
      </AnimatePresence>
    </motion.div >
  );
};

export default Index;
