import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote, ChevronLeft, ChevronRight } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';
import PlatformIcon from './PlatformIcon';

const avatarGradients = [
  'from-pink-500 to-rose-400 shadow-pink-500/20',
  'from-violet-500 to-purple-400 shadow-violet-500/20',
  'from-sky-500 to-blue-400 shadow-sky-500/20',
  'from-amber-500 to-orange-400 shadow-amber-500/20',
  'from-emerald-500 to-teal-400 shadow-emerald-500/20',
];

const TestimonialsSection = () => {
  const { content } = useSiteContent();
  const reviews = content?.reviews || [];
  const [current, setCurrent] = useState(0);
  const [visibleCount, setVisibleCount] = useState(3);

  useEffect(() => {
    const handleResize = () => {
      setVisibleCount(window.innerWidth < 768 ? 1 : 3);
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  useEffect(() => {
    if (reviews.length <= visibleCount) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % (reviews.length - visibleCount + 1));
    }, 6000);
    return () => clearInterval(timer);
  }, [reviews.length, visibleCount]);

  if (reviews.length === 0) return null;

  const handlePrev = () => {
    setCurrent((prev) => (prev - 1 + (reviews.length - visibleCount + 1)) % (reviews.length - visibleCount + 1));
  };

  const handleNext = () => {
    setCurrent((prev) => (prev + 1) % (reviews.length - visibleCount + 1));
  };

  return (
    <section id="testimonials" className="py-24 relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-[100px] -translate-y-1/2" />
      <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-secondary/5 rounded-full blur-[100px] translate-y-1/2" />

      <div className="max-w-7xl mx-auto relative z-10">
        <div className="text-center mb-16 px-4">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4"
          >
            <Star className="w-3 h-3 fill-primary" />
            Доверие клиентов
          </motion.div>
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.1 }}
            className="text-3xl md:text-5xl font-black text-foreground mb-4 tracking-tight"
          >
            Что говорят о нас
          </motion.h2>
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: 0.2 }}
            className="text-muted-foreground text-lg max-w-2xl mx-auto"
          >
            Тысячи клиентов уже оценили качество и скорость нашей работы. Присоединяйтесь и вы!
          </motion.p>
        </div>

        <div className="relative group px-4">
          <div className="overflow-visible cursor-grab active:cursor-grabbing">
            <motion.div
              className={`grid transition-all duration-500 gap-6`}
              style={{
                gridTemplateColumns: `repeat(${reviews.length}, minmax(${100 / visibleCount}%, 1fr))`,
                transform: `translateX(-${current * (100 / visibleCount)}%)`,
                display: 'flex',
              }}
            >
              {reviews.map((t, i) => (
                <div
                  key={i}
                  className="w-full shrink-0 px-2"
                  style={{ width: `${100 / visibleCount}%` }}
                >
                  <motion.div
                    whileHover={{ y: -8, scale: 1.02 }}
                    className="h-full glass-card p-8 flex flex-col relative border-2 border-white/40 shadow-xl"
                  >
                    <Quote className="w-10 h-10 text-primary/5 absolute top-6 right-6" />

                    <div className="flex gap-0.5 mb-4">
                      {Array.from({ length: 5 }).map((_, starI) => (
                        <Star
                          key={starI}
                          className={`w-4 h-4 ${starI < t.rating ? 'fill-amber-400 text-amber-400' : 'text-muted/40'}`}
                        />
                      ))}
                    </div>

                    <p className="text-foreground text-sm md:text-base leading-relaxed mb-8 flex-1 italic">
                      «{t.message}»
                    </p>

                    <div className="flex items-center gap-4 mt-auto pt-6 border-t border-border/40">
                      <div
                        className={`w-12 h-12 rounded-2xl bg-gradient-to-br ${avatarGradients[i % avatarGradients.length]} flex items-center justify-center text-white font-black text-lg shadow-lg rotate-3`}
                      >
                        {(t.name || 'A')[0].toUpperCase()}
                      </div>
                      <div className="flex-1">
                        <p className="font-bold text-foreground text-sm">{t.name || 'Пользователь'}</p>
                        <div className="flex items-center gap-1.5 text-[10px] text-muted-foreground font-bold uppercase tracking-widest mt-0.5">
                          <PlatformIcon platform={t.platform as any} className="w-3 h-3 grayscale opacity-60" />
                          {t.platform}
                        </div>
                      </div>
                    </div>
                  </motion.div>
                </div>
              ))}
            </motion.div>
          </div>

          {/* Navigation */}
          {reviews.length > visibleCount && (
            <>
              <button
                onClick={handlePrev}
                className="absolute left-0 top-1/2 -translate-y-1/2 -translate-x-4 md:-translate-x-8 w-12 h-12 rounded-full glass-card border-none flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-xl opacity-0 group-hover:opacity-100 z-20 active:scale-90"
              >
                <ChevronLeft className="w-6 h-6" />
              </button>
              <button
                onClick={handleNext}
                className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-4 md:translate-x-8 w-12 h-12 rounded-full glass-card border-none flex items-center justify-center text-muted-foreground hover:text-primary transition-all shadow-xl opacity-0 group-hover:opacity-100 z-20 active:scale-90"
              >
                <ChevronRight className="w-6 h-6" />
              </button>
            </>
          )}
        </div>

        {reviews.length > visibleCount && (
          <div className="flex justify-center gap-3 mt-12">
            {Array.from({ length: reviews.length - visibleCount + 1 }).map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2 h-2 rounded-full transition-all duration-500 ${i === current
                  ? 'w-10 bg-primary shadow-lg shadow-primary/20'
                  : 'bg-muted-foreground/20 hover:bg-muted-foreground/40'
                  }`}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default TestimonialsSection;
