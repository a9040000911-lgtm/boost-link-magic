import { motion } from 'framer-motion';
import { type Service } from '@/lib/smm-data';
import { Zap, TrendingUp, Package } from 'lucide-react';
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
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-foreground">{categoryName}</h3>
        <div className="flex gap-2">
          <button onClick={scrollPrev} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button onClick={scrollNext} className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:bg-primary hover:text-primary-foreground transition-colors">
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
              <div className="glass-card p-5 h-full flex flex-col gap-4 hover:shadow-md transition-all duration-300 hover:scale-[1.02]">
                <div>
                  <h4 className="font-semibold text-foreground mb-1">{service.name}</h4>
                  <p className="text-xs text-muted-foreground">{service.description}</p>
                </div>

                <div className="flex flex-col gap-2 mt-auto">
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Package className="w-3.5 h-3.5" />
                    <span>{service.minOrder} — {service.maxOrder.toLocaleString()}</span>
                  </div>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Zap className="w-3.5 h-3.5" />
                    <span>{service.speed}</span>
                  </div>
                  <div className="flex items-center gap-2 text-sm font-semibold text-primary mt-1">
                    <TrendingUp className="w-4 h-4" />
                    <span>{service.price} / шт</span>
                  </div>
                </div>

                <button className="w-full py-2.5 rounded-xl bg-primary text-primary-foreground text-sm font-medium hover:brightness-110 transition-all duration-300">
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
