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
import { Sparkles, Check, ExternalLink, Mail, PartyPopper, Zap, AlertTriangle, BookOpen, ArrowRight, X, Lock, KeyRound } from 'lucide-react';
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
    <div className={`flex flex-col ${isActive ? 'h-screen overflow-hidden' : 'min-h-screen bg-background'}`}>
      {/* Hero — compact when flow/summary is active */}
      <div
        className={`flex flex-col items-center justify-center px-4 relative overflow-hidden shrink-0 transition-all duration-500 hero-gradient ${
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
            className="text-2xl md:text-3xl font-medium tracking-tight mb-10 text-white text-center relative z-10"
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
                className="h-[85vh] flex flex-col"
              >
                <div className="relative w-full h-full rounded-2xl border border-border/60 shadow-xl bg-card/95 backdrop-blur-xl flex flex-col overflow-hidden">
                  {/* Header */}
                  <div className="shrink-0 px-6 py-5 border-b border-border/60 bg-muted/30">
                    <div className="flex items-center justify-center gap-3">
                      <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary to-secondary flex items-center justify-center shadow-md">
                        <ShoppingCart className="w-6 h-6 text-white" />
                      </div>
                      <div className="text-left">
                        <h2 className="text-xl font-bold text-foreground leading-tight">Проверьте заказ перед оплатой</h2>
                        <p className="text-sm text-muted-foreground">
                          {completedOrders.length} {completedOrders.length === 1 ? 'услуга' : 'услуг'} · внимательно проверьте детали
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Scrollable order details */}
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
                    {completedOrders.map((order, i) => {
                      const price = parseFloat(order.service?.price?.replace(/[^\d.]/g, '') || '0');
                      const lineTotal = price * order.quantity;
                      return (
                        <div key={i} className="rounded-xl border border-border/60 bg-muted/20 overflow-hidden">
                          {/* Order row header */}
                          <div className="flex items-center gap-3 px-5 py-3 bg-muted/40 border-b border-border/40">
                            <span className="w-8 h-8 rounded-lg bg-primary/10 text-primary flex items-center justify-center text-sm font-bold shrink-0">
                              {i + 1}
                            </span>
                            <div className="flex-1 min-w-0">
                              <span className="text-base font-bold text-foreground block truncate">
                                {order.category?.name} → {order.service?.name}
                              </span>
                              <span className="text-sm text-muted-foreground truncate block">{order.url}</span>
                            </div>
                            <span className="text-xl font-bold text-primary shrink-0">{lineTotal.toFixed(1)}₽</span>
                          </div>

                          {/* Service details */}
                          <div className="px-5 py-4 space-y-3">
                            {order.service?.description && (
                              <div>
                                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider mb-1">Описание услуги</p>
                                <p className="text-sm text-foreground leading-relaxed">{order.service.description}</p>
                              </div>
                            )}
                            <div className="grid grid-cols-3 gap-3">
                              <div className="rounded-lg bg-muted/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-0.5">Количество</p>
                                <p className="text-lg font-bold text-foreground">{order.quantity.toLocaleString()}</p>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-0.5">Мин — Макс</p>
                                <p className="text-sm font-semibold text-foreground">
                                  {order.service?.minOrder.toLocaleString()} — {order.service?.maxOrder.toLocaleString()}
                                </p>
                              </div>
                              <div className="rounded-lg bg-muted/50 p-3 text-center">
                                <p className="text-xs text-muted-foreground mb-0.5">Скорость</p>
                                <p className="text-sm font-semibold text-foreground">{order.service?.speed || '—'}</p>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>

                  {/* Fixed bottom: total + email + buttons */}
                  <div className="shrink-0 border-t border-border/60 bg-card px-6 py-4 space-y-3">
                    {/* Total */}
                    <div className="flex items-center justify-between px-4 py-3 rounded-xl bg-primary/5 border border-primary/10">
                      <span className="text-base font-semibold text-foreground flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" /> Итого к оплате
                      </span>
                      <span className="text-2xl font-bold gradient-text">
                        {completedOrders.reduce((sum, o) => {
                          const p = parseFloat(o.service?.price?.replace(/[^\d.]/g, '') || '0');
                          return sum + p * o.quantity;
                        }, 0).toFixed(1)}₽
                      </span>
                    </div>

                    {/* Email + consent + actions */}
                    <AnimatePresence mode="wait">
                      {!loginMode ? (
                        <motion.div key="email-input" initial={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 border border-border mb-3">
                            <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                            <input
                              type="email"
                              value={email}
                              onChange={(e) => setEmail(e.target.value)}
                              placeholder="Email для регистрации"
                              className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                            />
                          </div>

                          <div className="space-y-1.5 mb-3 text-left">
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={consentPD} onChange={(e) => setConsentPD(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary shrink-0" />
                              <span className="text-xs text-muted-foreground">
                                Согласен на обработку <a href="/privacy" target="_blank" className="text-primary hover:underline">персональных данных</a> (152-ФЗ)
                              </span>
                            </label>
                            <label className="flex items-center gap-2 cursor-pointer">
                              <input type="checkbox" checked={consentOffer} onChange={(e) => setConsentOffer(e.target.checked)}
                                className="w-4 h-4 rounded border-border text-primary shrink-0" />
                              <span className="text-xs text-muted-foreground">
                                Принимаю <a href="/privacy" target="_blank" className="text-primary hover:underline">публичную оферту</a>
                              </span>
                            </label>
                          </div>

                          <div className="flex gap-3 justify-center">
                            <button
                              onClick={() => { setCompletedOrders(null); setUrls(urls.length ? urls : completedOrders!.map(o => o.url)); }}
                              className="px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-accent transition-colors"
                            >
                              ← Назад
                            </button>
                            <button onClick={handleReset} className="px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium hover:bg-accent transition-colors">
                              Новый заказ
                            </button>
                            <button
                              disabled={!email.includes('@') || !consentPD || !consentOffer || authLoading}
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
                                const { error: signInErr } = await supabase.auth.signInWithPassword({
                                  email,
                                  password: '__check_exists__',
                                });
                                if (signInErr?.message?.includes('Invalid login credentials')) {
                                  setLoginMode(true);
                                  setAuthLoading(false);
                                  return;
                                }
                                setAuthLoading(false);
                                navigate(`/auth?email=${encodeURIComponent(email)}&redirect=/dashboard/orders&pending=1`);
                              }}
                              className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-500 text-primary-foreground text-sm font-bold shadow-lg disabled:opacity-40 hover:shadow-xl transition-shadow inline-flex items-center gap-2"
                            >
                              <Sparkles className="w-4 h-4" />
                              {authLoading ? 'Загрузка...' : 'Перейти к оплате'}
                            </button>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div
                          key="login-form"
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                        >
                          <div className="rounded-xl border border-primary/20 bg-primary/5 p-4">
                            <div className="flex items-center gap-2 mb-2">
                              <Lock className="w-4 h-4 text-primary" />
                              <span className="text-sm font-semibold text-foreground">
                                Аккаунт с {email} уже существует
                              </span>
                            </div>
                            <p className="text-xs text-muted-foreground mb-3">
                              Введите пароль для входа или восстановите доступ через почту
                            </p>
                            <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-muted/50 border border-border mb-3">
                              <KeyRound className="w-4 h-4 text-muted-foreground shrink-0" />
                              <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Пароль"
                                onKeyDown={(e) => e.key === 'Enter' && password.length >= 6 && document.getElementById('btn-login')?.click()}
                                className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-sm"
                              />
                            </div>
                            <div className="flex gap-3">
                              <button
                                onClick={() => { setLoginMode(false); setPassword(''); setResetSent(false); }}
                                className="px-5 py-2.5 rounded-xl bg-muted text-foreground text-sm font-medium"
                              >
                                ← Назад
                              </button>
                              <button
                                id="btn-login"
                                disabled={password.length < 6 || authLoading}
                                onClick={async () => {
                                  setAuthLoading(true);
                                  const { error: err } = await supabase.auth.signInWithPassword({ email, password });
                                  if (err) {
                                    toast.error('Неверный пароль');
                                    setAuthLoading(false);
                                    return;
                                  }
                                  toast.success('Вход выполнен!');
                                  navigate('/dashboard/orders?pending=1');
                                }}
                                className="flex-1 px-6 py-2.5 rounded-xl bg-gradient-to-r from-primary to-rose-500 text-primary-foreground text-sm font-bold shadow-lg disabled:opacity-40 inline-flex items-center justify-center gap-2"
                              >
                                <Sparkles className="w-4 h-4" />
                                {authLoading ? 'Загрузка...' : 'Войти и оплатить'}
                              </button>
                            </div>
                            <button
                              disabled={resetSent}
                              onClick={async () => {
                                await supabase.auth.resetPasswordForEmail(email, {
                                  redirectTo: `${window.location.origin}/reset-password`,
                                });
                                setResetSent(true);
                                toast.success('Ссылка для сброса пароля отправлена на ' + email);
                              }}
                              className="mt-3 text-xs text-primary hover:underline disabled:opacity-50"
                            >
                              {resetSent ? '✓ Ссылка отправлена' : 'Забыли пароль? Восстановить →'}
                            </button>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
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
