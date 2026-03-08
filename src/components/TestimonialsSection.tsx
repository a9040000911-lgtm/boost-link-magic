import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';

interface Review {
  id: string;
  name: string;
  rating: number;
  message: string;
}

const avatarGradients = [
  'from-pink-500 to-rose-400',
  'from-violet-500 to-purple-400',
  'from-sky-500 to-blue-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
];

const TestimonialsSection = () => {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [current, setCurrent] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from('reviews')
      .select('id, name, rating, message')
      .eq('is_approved', true)
      .order('created_at', { ascending: false })
      .limit(10)
      .then(({ data }) => {
        setReviews(data || []);
        setLoading(false);
      });
  }, []);

  useEffect(() => {
    if (reviews.length <= 1) return;
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % reviews.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [reviews.length]);

  if (loading || reviews.length === 0) return null;

  const t = reviews[current];

  return (
    <motion.section
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.6 }}
      className="py-16 px-4 bg-muted/60"
    >
      <div className="max-w-3xl mx-auto text-center">
        <motion.h2
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-2xl md:text-3xl font-bold text-foreground mb-10"
        >
          Отзывы наших клиентов
        </motion.h2>

        <div className="relative min-h-[220px] flex items-center justify-center">
          <AnimatePresence mode="wait">
            <motion.div
              key={current}
              initial={{ opacity: 0, y: 30, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -30, scale: 0.95 }}
              transition={{ duration: 0.5, ease: 'easeInOut' }}
              className="glass-card p-8 w-full relative"
            >
              <Quote className="w-8 h-8 text-primary/20 absolute top-4 left-4" />

              <p className="text-foreground text-lg leading-relaxed mb-6 relative z-10">
                "{t.message}"
              </p>

              <div className="flex items-center justify-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradients[current % avatarGradients.length]} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {(t.name || 'A')[0].toUpperCase()}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{t.name || 'Пользователь'}</p>
                </div>
                <div className="flex gap-0.5 ml-3">
                  {Array.from({ length: t.rating }).map((_, i) => (
                    <Star key={i} className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>
        </div>

        {reviews.length > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            {reviews.map((_, i) => (
              <button
                key={i}
                onClick={() => setCurrent(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                  i === current
                    ? 'w-6 bg-gradient-to-r from-primary to-secondary'
                    : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </motion.section>
  );
};

export default TestimonialsSection;
