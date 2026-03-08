import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import HeroInput from '@/components/HeroInput';
import CategoryCards from '@/components/CategoryCards';
import ServiceCarousel from '@/components/ServiceCarousel';
import {
  detectPlatform,
  categoriesByPlatform,
  getServicesForCategory,
  platformNames,
  type Platform,
  type Category,
} from '@/lib/smm-data';
import { ArrowLeft, Sparkles } from 'lucide-react';

const Index = () => {
  const [platform, setPlatform] = useState<Platform | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<Category | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = (url: string) => {
    setIsLoading(true);
    setError('');
    setSelectedCategory(null);

    setTimeout(() => {
      const detected = detectPlatform(url);
      if (detected) {
        setPlatform(detected);
        setError('');
      } else {
        setPlatform(null);
        setError('Платформа не определена. Поддерживаются: Instagram, YouTube, TikTok, Telegram, VK');
      }
      setIsLoading(false);
    }, 800);
  };

  const handleCategorySelect = (cat: Category) => {
    setSelectedCategory(cat);
  };

  const handleBack = () => {
    setSelectedCategory(null);
  };

  const categories = platform ? categoriesByPlatform[platform] : [];
  const services = selectedCategory ? getServicesForCategory(selectedCategory.id) : [];
  const view = selectedCategory ? 'services' : platform ? 'categories' : 'hero';

  return (
    <div className="min-h-screen flex flex-col overflow-hidden">
      {/* Hero */}
      <div className="hero-gradient flex flex-col items-center justify-center px-4 pt-24 pb-32 relative overflow-hidden">
        {/* Animated background blobs */}
        <motion.div
          className="absolute top-10 left-[10%] w-72 h-72 bg-white/20 rounded-full blur-3xl"
          animate={{ x: [0, 60, 0], y: [0, -40, 0], scale: [1, 1.2, 1] }}
          transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        />
        <motion.div
          className="absolute bottom-10 right-[10%] w-64 h-64 bg-pink-300/30 rounded-full blur-3xl"
          animate={{ x: [0, -50, 0], y: [0, 30, 0], scale: [1, 1.3, 1] }}
          transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        />
        <motion.div
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-300/20 rounded-full blur-3xl"
          animate={{ scale: [1, 1.15, 1], rotate: [0, 180, 360] }}
          transition={{ duration: 15, repeat: Infinity, ease: 'linear' }}
        />

        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6 relative z-10"
        >
          <motion.span
            className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium shadow-lg shadow-accent/20"
            whileHover={{ scale: 1.05 }}
            animate={{ y: [0, -3, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles className="w-4 h-4" />
            SMM Panel
          </motion.span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold tracking-tight mb-10 text-foreground text-center relative z-10"
        >
          Продвигайте свои соцсети
        </motion.h1>

        <div className="relative z-10 w-full">
          <HeroInput onSubmit={handleSubmit} isLoading={isLoading} />
        </div>

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm mt-6 bg-destructive/10 px-4 py-2 rounded-lg relative z-10"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content */}
      <div className="flex-1 bg-background px-4 -mt-16 relative z-10 pb-16">
        <div className="max-w-5xl mx-auto">
          <AnimatePresence>
            {platform && (
              <motion.div
                initial={{ opacity: 0, scale: 0.8, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex justify-center mb-8"
              >
                <motion.span
                  className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20 shadow-lg shadow-primary/10"
                  animate={{ y: [0, -3, 0] }}
                  transition={{ duration: 2.5, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {platformNames[platform]}
                  <motion.span
                    className="w-2.5 h-2.5 rounded-full bg-primary"
                    animate={{ scale: [1, 1.4, 1], opacity: [1, 0.6, 1] }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  />
                </motion.span>
              </motion.div>
            )}
          </AnimatePresence>

          <AnimatePresence mode="wait">
            {view === 'categories' && (
              <motion.div
                key="categories"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, x: -100 }}
                transition={{ duration: 0.4 }}
              >
                <CategoryCards categories={categories} onSelect={handleCategorySelect} selectedId={null} />
              </motion.div>
            )}

            {view === 'services' && selectedCategory && (
              <motion.div
                key="services"
                initial={{ opacity: 0, x: 100 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 100 }}
                transition={{ duration: 0.4, type: 'spring', bounce: 0.2 }}
              >
                <motion.button
                  onClick={handleBack}
                  whileHover={{ x: -4 }}
                  className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-6"
                >
                  <ArrowLeft className="w-4 h-4" />
                  Назад к категориям
                </motion.button>
                <ServiceCarousel services={services} categoryName={selectedCategory.name} />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;
