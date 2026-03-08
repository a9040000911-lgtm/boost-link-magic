import { motion } from 'framer-motion';
import { type Service } from '@/lib/smm-data';
import { Zap, TrendingUp, Package, Star, ShoppingCart } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceCarouselProps {
  services: Service[];
  categoryName: string;
}

const ServiceCarousel = ({ services, categoryName }: ServiceCarouselProps) => {
  const [emblaRef, emblaApi] = useEmblaCarousel({
    align: 'start',
    containScroll: 'trimSnaps',
    slidesToScroll: 1,
  });

  const scrollPrev = useCallback(() => emblaApi?.scrollPrev(), [emblaApi]);
  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="w-full max-w-4xl mx-auto"
    >
      <div className="flex items-center justify-between mb-5">
        <div className="flex items-center gap-2">
          <Star className="w-5 h-5 text-primary" />
          <h3 className="text-xl font-bold text-foreground">{categoryName}</h3>
        </div>
        <div className="flex gap-2">
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={scrollPrev} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </motion.button>
          <motion.button whileHover={{ scale: 1.15 }} whileTap={{ scale: 0.9 }} onClick={scrollNext} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ChevronRight className="w-4 h-4" />
          </motion.button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.12, type: 'spring', bounce: 0.3 }}
              whileHover={{ y: -8, scale: 1.04 }}
              className="min-w-[280px] max-w-[300px] flex-shrink-0"
            >
              <div className="relative overflow-hidden glass-card p-6 h-full flex flex-col gap-4 transition-shadow duration-300 hover:shadow-xl hover:shadow-primary/10 group">
                {/* Shimmer */}
                <motion.div
                  className="absolute inset-0 bg-gradient-to-r from-transparent via-primary/5 to-transparent -skew-x-12"
                  animate={{ x: ['-200%', '300%'] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut', delay: i * 0.5 }}
                />

                {/* Price highlight */}
                <motion.div
                  className="absolute top-4 right-4 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-bold"
                  animate={{ scale: [1, 1.08, 1] }}
                  transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
                >
                  {service.price}
                </motion.div>

                <div className="relative z-10">
                  <h4 className="font-bold text-foreground mb-1.5 text-lg pr-16">{service.name}</h4>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>

                <div className="flex flex-col gap-2.5 mt-auto relative z-10">
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Package className="w-4 h-4 text-secondary" />
                    <span>{service.minOrder} — {service.maxOrder.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-muted-foreground">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>{service.speed}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-bold text-primary mt-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{service.price} / шт</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className="relative z-10 w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold flex items-center justify-center gap-2 hover:shadow-lg hover:shadow-primary/30 transition-shadow duration-300"
                >
                  <motion.span
                    animate={{ x: [0, 3, 0] }}
                    transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
                  >
                    <ShoppingCart className="w-4 h-4" />
                  </motion.span>
                  Заказать сейчас
                </motion.button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCarousel;
