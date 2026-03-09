import { motion } from 'framer-motion';
import { type Service, type PlatformBranding } from '@/lib/smm-data';
import { Zap, TrendingUp, Package, Star, ShoppingCart } from 'lucide-react';
import useEmblaCarousel from 'embla-carousel-react';
import { useCallback } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';

interface ServiceCarouselProps {
  services: Service[];
  categoryName: string;
  onServiceSelect?: (service: Service) => void;
  selectedServiceId?: string | null;
  branding?: PlatformBranding;
}

const ServiceCarousel = ({
  services,
  categoryName,
  onServiceSelect,
  selectedServiceId,
  branding
}: ServiceCarouselProps) => {
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

      <div className="overflow-visible py-4 -my-4" ref={emblaRef}>
        <div className="flex gap-4 px-1">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 50, scale: 0.9 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.5, delay: i * 0.12, type: 'spring', bounce: 0.3 }}
              whileHover={{ y: -10, scale: 1.06, rotate: i % 2 === 0 ? 1.5 : -1.5, filter: 'brightness(1.05) saturate(1.2)' }}
              className="min-w-[220px] max-w-[240px] flex-shrink-0 cursor-pointer"
              onClick={() => onServiceSelect?.(service)}
            >
              <div className={`relative overflow-hidden rounded-2xl p-6 h-full flex flex-col gap-4 transition-all duration-300 bg-card border-2 shadow-lg group ${selectedServiceId === service.id
                  ? `ring-2 ${branding?.ring || 'ring-primary'} ${branding?.border || 'border-primary/40'} ${branding?.shadow || 'shadow-primary/20'}`
                  : `border-border/80 hover:${branding?.border || 'border-primary/30'} hover:${branding?.shadow || 'shadow-xl'}`
                }`}>
                {/* Shimmer */}
                <motion.div
                  className={`absolute inset-0 bg-gradient-to-r from-transparent ${branding?.bg ? 'via-white/20' : 'via-primary/8'} to-transparent -skew-x-12`}
                  animate={{ x: ['-200%', '300%'] }}
                  transition={{ duration: 4, repeat: Infinity, repeatDelay: 3, ease: 'easeInOut', delay: i * 0.5 }}
                />

                {/* Price highlight */}
                <motion.div
                  className={`absolute top-4 right-4 px-3 py-1.5 rounded-full ${branding?.bg || 'bg-primary'} text-white text-sm font-bold shadow-md shadow-black/10`}
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
                  <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                    <Package className="w-4 h-4 text-secondary" />
                    <span>{service.minOrder} — {service.maxOrder.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-sm text-foreground/70">
                    <Zap className="w-4 h-4 text-accent" />
                    <span>{service.speed}</span>
                  </div>
                  <div className="flex items-center gap-2.5 text-base font-bold mt-1 ${branding?.color || 'text-primary'}">
                    <TrendingUp className="w-4 h-4" />
                    <span>{service.price} / шт</span>
                  </div>
                </div>

                <motion.button
                  whileHover={{ scale: 1.04 }}
                  whileTap={{ scale: 0.96 }}
                  className={`relative z-10 w-full py-3 rounded-xl ${branding?.bg || 'bg-gradient-to-r from-primary to-pink-500'} text-white text-sm font-semibold flex items-center justify-center gap-2 shadow-lg transition-shadow duration-300`}
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
