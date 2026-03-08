import { motion } from 'framer-motion';
import { type Service } from '@/lib/smm-data';
import { Zap, TrendingUp, Package, Star } from 'lucide-react';
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
          <button onClick={scrollPrev} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={scrollNext} className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-all duration-200 hover:scale-110">
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      <div className="overflow-hidden" ref={emblaRef}>
        <div className="flex gap-4">
          {services.map((service, i) => (
            <motion.div
              key={service.id}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              className="min-w-[280px] max-w-[300px] flex-shrink-0"
            >
              <div className="glass-card p-6 h-full flex flex-col gap-4 hover:shadow-lg transition-all duration-300 hover:scale-[1.03] hover:border-primary/30">
                <div>
                  <h4 className="font-bold text-foreground mb-1.5 text-lg">{service.name}</h4>
                  <p className="text-sm text-muted-foreground">{service.description}</p>
                </div>

                <div className="flex flex-col gap-2.5 mt-auto">
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

                <button className="w-full py-3 rounded-xl bg-primary text-primary-foreground text-sm font-semibold hover:brightness-110 hover:shadow-lg hover:shadow-primary/25 transition-all duration-300">
                  Заказать
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </motion.div>
  );
};

export default ServiceCarousel;
