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

    // Simulate backend detection
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
    <div className="min-h-screen flex flex-col items-center px-4 py-16 md:py-24">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center mb-12"
      >
        <h1 className="text-4xl md:text-6xl font-bold tracking-tight mb-4">
          <span className="gradient-text">SMM</span> Panel
        </h1>
        <p className="text-muted-foreground text-base md:text-lg max-w-md mx-auto">
          Вставьте ссылку — мы определим платформу и покажем доступные услуги
        </p>
      </motion.div>

      <HeroInput onSubmit={handleSubmit} isLoading={isLoading} />

      {/* Error */}
      <AnimatePresence>
        {error && (
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="text-destructive text-sm mt-6"
          >
            {error}
          </motion.p>
        )}
      </AnimatePresence>

      {/* Platform badge */}
      <AnimatePresence>
        {platform && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="mt-10 mb-8"
          >
            <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
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
            className="w-full"
          >
            <CategoryCards
              categories={categories}
              platform={platform}
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
            className="w-full mt-10"
          >
            <ServiceCarousel
              services={services}
              categoryName={selectedCategory.name}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Index;
