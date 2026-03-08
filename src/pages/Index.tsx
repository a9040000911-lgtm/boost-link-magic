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
    setSelectedCategory(selectedCategory?.id === cat.id ? null : cat);
  };

  const categories = platform ? categoriesByPlatform[platform] : [];
  const services = selectedCategory ? getServicesForCategory(selectedCategory.id) : [];

  return (
    <div className="min-h-screen flex flex-col">
      {/* Hero gradient area */}
      <div className="hero-gradient flex flex-col items-center justify-center px-4 pt-24 pb-32 relative">
        {/* Announcement pill */}
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-accent text-accent-foreground text-sm font-medium">
            🚀 SMM Panel
            <span className="text-xs opacity-80">→</span>
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-3xl md:text-5xl font-bold tracking-tight mb-10 text-foreground text-center"
        >
          Продвигайте свои соцсети
        </motion.h1>

        <HeroInput onSubmit={handleSubmit} isLoading={isLoading} />

        <AnimatePresence>
          {error && (
            <motion.p
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-destructive text-sm mt-6 bg-destructive/10 px-4 py-2 rounded-lg"
            >
              {error}
            </motion.p>
          )}
        </AnimatePresence>
      </div>

      {/* Content area */}
      <div className="flex-1 bg-background px-4 -mt-16 relative z-10">
        <div className="max-w-5xl mx-auto">
          {/* Platform badge */}
          <AnimatePresence>
            {platform && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.9 }}
                className="flex justify-center mb-8"
              >
                <span className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-primary/10 text-primary text-sm font-semibold border border-primary/20">
                  {platformNames[platform]}
                  <span className="w-2 h-2 rounded-full bg-primary animate-pulse" />
                </span>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Categories */}
          <AnimatePresence mode="wait">
            {platform && categories.length > 0 && (
              <motion.div
                key={platform}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <CategoryCards
                  categories={categories}
                  onSelect={handleCategorySelect}
                  selectedId={selectedCategory?.id ?? null}
                />
              </motion.div>
            )}
          </AnimatePresence>

          {/* Services */}
          <AnimatePresence mode="wait">
            {selectedCategory && services.length > 0 && (
              <motion.div
                key={selectedCategory.id}
                initial={{ opacity: 0, y: 40 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 20 }}
                className="mt-10 pb-16"
              >
                <ServiceCarousel
                  services={services}
                  categoryName={selectedCategory.name}
                />
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};

export default Index;
