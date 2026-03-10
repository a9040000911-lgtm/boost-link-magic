import { motion } from 'framer-motion';
import { Shield, Zap, Clock, Brain, Sparkles, MousePointerClick, type LucideIcon } from 'lucide-react';
import { useSiteContent } from '@/hooks/useSiteContent';

const ICON_MAP: Record<string, LucideIcon> = {
  Brain, Shield, Clock, MousePointerClick, Sparkles, Zap,
};

const MarketingSection = () => {
  const { content, loading } = useSiteContent();

  if (loading || !content) return null;

  const { stats, features, featuresTitle, featuresSubtitle, ctaTitle, ctaText, ctaButton } = content;

  return (
    <section className="pt-24 pb-20 px-4 bg-background">
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
            {featuresTitle}
          </h2>
          <p className="text-muted-foreground max-w-lg mx-auto">
            {featuresSubtitle}
          </p>
        </motion.div>

        {/* Features grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, i) => {
            const Icon = ICON_MAP[feature.icon] || Sparkles;
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
              {ctaTitle}
            </h3>
            <p className="text-muted-foreground text-sm max-w-md mx-auto mb-6">
              {ctaText}
            </p>
            <motion.button
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.96 }}
              onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
              className="px-8 py-3 rounded-xl bg-gradient-to-r from-primary to-secondary text-primary-foreground font-semibold text-sm shadow-lg shadow-primary/40 hover:shadow-xl hover:shadow-primary/50 transition-all"
            >
              {ctaButton}
            </motion.button>
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
};

export default MarketingSection;
