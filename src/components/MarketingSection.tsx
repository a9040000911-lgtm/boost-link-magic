import { motion } from 'framer-motion';
import { Shield, Zap, Clock, Users, Star, Headphones } from 'lucide-react';

const stats = [
  { value: '10M+', label: 'Заказов выполнено' },
  { value: '50K+', label: 'Довольных клиентов' },
  { value: '99.8%', label: 'Успешных заказов' },
  { value: '24/7', label: 'Поддержка' },
];

const features = [
  {
    icon: Zap,
    title: 'Мгновенный старт',
    description: 'Заказы начинают выполняться в течение нескольких минут после оплаты',
    gradient: 'card-gradient-amber',
  },
  {
    icon: Shield,
    title: 'Безопасно для аккаунта',
    description: 'Используем только проверенные методы продвижения без риска блокировки',
    gradient: 'card-gradient-blue',
  },
  {
    icon: Clock,
    title: 'Гарантия и возврат',
    description: '30 дней гарантии на все услуги. Полный возврат если что-то пойдёт не так',
    gradient: 'card-gradient-violet',
  },
  {
    icon: Users,
    title: 'Реальные пользователи',
    description: 'Живые аккаунты с аватарками и активностью — никаких ботов',
    gradient: 'card-gradient-pink',
  },
  {
    icon: Star,
    title: 'Премиум качество',
    description: 'Высокое удержание и минимальный процент отписок благодаря качественным аккаунтам',
    gradient: 'card-gradient-blue',
  },
  {
    icon: Headphones,
    title: 'Личный менеджер',
    description: 'Персональная поддержка для оптовых заказов и индивидуальных решений',
    gradient: 'card-gradient-amber',
  },
];

const MarketingSection = () => {
  return (
    <section className="py-20 px-4 bg-background">
      <div className="max-w-5xl mx-auto">
        {/* Stats */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-50px' }}
          transition={{ duration: 0.5 }}
          className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-20"
        >
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, scale: 0.9 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ scale: 1.05, y: -4 }}
              className="text-center glass-card p-6"
            >
              <motion.span
                className="block text-3xl md:text-4xl font-bold gradient-text mb-1"
                animate={{ scale: [1, 1.03, 1] }}
                transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut', delay: i * 0.5 }}
              >
                {stat.value}
              </motion.span>
              <span className="text-xs text-muted-foreground font-medium">{stat.label}</span>
            </motion.div>
          ))}
        </motion.div>

        {/* Section title */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="text-center mb-12"
        >
          <h2 className="text-2xl md:text-4xl font-bold text-foreground mb-3">
            Почему выбирают <span className="gradient-text">нас</span>
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            Мы — лидер рынка SMM-услуг с 2020 года. Тысячи блогеров и бизнесов доверяют нам продвижение
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 40 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: '-30px' }}
                transition={{ duration: 0.5, delay: i * 0.1, type: 'spring', bounce: 0.3 }}
                whileHover={{ scale: 1.05, rotate: i % 2 === 0 ? 1 : -1, filter: 'brightness(1.15) saturate(1.2)' }}
                className={`${feature.gradient} rounded-2xl p-6 relative overflow-hidden cursor-default`}
                style={{ boxShadow: '0 8px 30px -8px rgba(0,0,0,0.2)' }}
              >
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '300%'] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut', delay: i * 0.7 }}
                />

                <motion.div
                  className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 relative z-10"
                  animate={{ rotate: [0, 5, -5, 0] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: i * 0.4 }}
                >
                  <Icon className="w-5 h-5 text-white" strokeWidth={2} />
                </motion.div>

                <h3 className="text-base font-bold text-white mb-2 relative z-10">{feature.title}</h3>
                <p className="text-xs text-white/80 leading-relaxed relative z-10">{feature.description}</p>
              </motion.div>
            );
          })}
        </div>

        {/* Trust banner */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.5 }}
          className="mt-20 text-center glass-card p-10"
        >
          <motion.div
            animate={{ y: [0, -4, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <h3 className="text-xl md:text-2xl font-bold text-foreground mb-3">
              Начните продвижение прямо сейчас
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              Вставьте ссылку на ваш профиль или пост выше — мы автоматически определим платформу и предложим лучшие услуги
            </p>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3 rounded-xl bg-primary text-primary-foreground font-semibold text-sm hover:shadow-lg hover:shadow-primary/30 transition-shadow"
            >
              Попробовать бесплатно ↑
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketingSection;
