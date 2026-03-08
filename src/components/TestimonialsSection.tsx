import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Star, Quote } from 'lucide-react';

const testimonials = [
  {
    name: 'Алексей К.',
    role: 'Блогер, Instagram',
    text: 'За неделю набрал 5000 подписчиков. Качество отличное — живые профили, без ботов. Рекомендую!',
    rating: 5,
    avatar: 'А',
  },
  {
    name: 'Мария С.',
    role: 'SMM-менеджер',
    text: 'Использую для клиентов уже 3 месяца. Быстрая доставка, адекватные цены и поддержка на высоте.',
    rating: 5,
    avatar: 'М',
  },
  {
    name: 'Дмитрий В.',
    role: 'Владелец Telegram-канала',
    text: 'Канал вырос с 200 до 10 000 подписчиков за месяц. Охваты выросли в 5 раз. Супер сервис!',
    rating: 5,
    avatar: 'Д',
  },
  {
    name: 'Екатерина Л.',
    role: 'TikTok-креатор',
    text: 'Просмотры на видео стабильно растут. Заказываю регулярно — всё приходит вовремя и без сбоев.',
    rating: 4,
    avatar: 'Е',
  },
  {
    name: 'Игорь П.',
    role: 'Предприниматель',
    text: 'Продвигал группу ВК для бизнеса. Результат превзошёл ожидания — заявки пошли уже через 3 дня.',
    rating: 5,
    avatar: 'И',
  },
];

const avatarGradients = [
  'from-pink-500 to-rose-400',
  'from-violet-500 to-purple-400',
  'from-sky-500 to-blue-400',
  'from-amber-500 to-orange-400',
  'from-emerald-500 to-teal-400',
];

const TestimonialsSection = () => {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrent((prev) => (prev + 1) % testimonials.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const t = testimonials[current];

  return (
    <section className="py-16 px-4 bg-muted/30">
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
                "{t.text}"
              </p>

              <div className="flex items-center justify-center gap-3">
                <div
                  className={`w-10 h-10 rounded-full bg-gradient-to-br ${avatarGradients[current % avatarGradients.length]} flex items-center justify-center text-white font-bold text-sm`}
                >
                  {t.avatar}
                </div>
                <div className="text-left">
                  <p className="text-sm font-semibold text-foreground">{t.name}</p>
                  <p className="text-xs text-muted-foreground">{t.role}</p>
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

        {/* Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {testimonials.map((_, i) => (
            <button
              key={i}
              onClick={() => setCurrent(i)}
              className={`w-2.5 h-2.5 rounded-full transition-all duration-300 ${
                i === current
                  ? 'bg-primary w-6'
                  : 'bg-muted-foreground/30 hover:bg-muted-foreground/50'
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
