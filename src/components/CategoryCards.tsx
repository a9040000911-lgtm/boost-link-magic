import { motion } from 'framer-motion';
import { type Category } from '@/lib/smm-data';
import {
  Heart, Users, Eye, MessageCircle, Play, Bell,
  ThumbsUp, Share2, Flame, UserPlus, Megaphone, ChevronRight, Sparkles
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface CategoryCardsProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  selectedId: string | null;
  recommendedIds?: string[];
}

const iconMap: Record<string, LucideIcon> = {
  heart: Heart, users: Users, eye: Eye, 'message-circle': MessageCircle,
  play: Play, bell: Bell, 'thumbs-up': ThumbsUp, 'share-2': Share2,
  flame: Flame, 'user-plus': UserPlus, megaphone: Megaphone,
};

const gradientClasses = [
  'card-gradient-pink',
  'card-gradient-violet',
  'card-gradient-blue',
  'card-gradient-amber',
];

const CategoryCards = ({ categories, onSelect, recommendedIds = [] }: CategoryCardsProps) => {
  // Sort: recommended first
  const sorted = [...categories].sort((a, b) => {
    const aRec = recommendedIds.includes(a.id) ? 0 : 1;
    const bRec = recommendedIds.includes(b.id) ? 0 : 1;
    return aRec - bRec;
  });
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-5 w-full mx-auto">
      {sorted.map((cat, i) => {
        const Icon = iconMap[cat.icon] || Heart;
        const isRecommended = recommendedIds.includes(cat.id);
        return (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.12, type: 'spring', bounce: 0.35 }}
            whileHover={{ scale: 1.07, rotate: i % 2 === 0 ? 2 : -2, y: -8, filter: 'brightness(1.2) saturate(1.3)' }}
            whileTap={{ scale: 0.96, rotate: 0 }}
            onClick={() => onSelect(cat)}
            className={`relative overflow-hidden rounded-2xl p-6 text-left cursor-pointer group transition-[filter] duration-300 ${gradientClasses[i % gradientClasses.length]} ${isRecommended ? 'ring-2 ring-white/60 ring-offset-2 ring-offset-background' : ''}`}
            style={{ boxShadow: isRecommended ? '0 10px 40px -5px rgba(0,0,0,0.35)' : '0 10px 40px -10px rgba(0,0,0,0.25)' }}
          >
            {/* Animated background blobs */}
            <motion.div
              className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full -translate-y-14 translate-x-14"
              animate={{ scale: [1, 1.3, 1], rotate: [0, 45, 0] }}
              transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
            />
            <motion.div
              className="absolute bottom-0 left-0 w-28 h-28 bg-white/5 rounded-full translate-y-12 -translate-x-12"
              animate={{ scale: [1, 1.2, 1], rotate: [0, -30, 0] }}
              transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
            />

            {/* Shimmer overlay */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-transparent via-white/15 to-transparent -skew-x-12"
              animate={{ x: ['-150%', '250%'] }}
              transition={{ duration: 3, repeat: Infinity, repeatDelay: 2, ease: 'easeInOut' }}
            />

            {/* Badge */}
            <motion.div
              className="flex items-center gap-1.5 mb-3 relative z-10"
              animate={{ y: [0, -2, 0] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            >
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/20 backdrop-blur-sm text-white text-[10px] font-semibold">
                <Sparkles className="w-2.5 h-2.5" />
                {isRecommended ? '✨ Рекомендуем' : cat.highlight}
              </span>
            </motion.div>

            {/* Icon */}
            <motion.div
              className="w-10 h-10 rounded-lg bg-white/20 backdrop-blur-sm flex items-center justify-center mb-3 relative z-10"
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.3 }}
              whileHover={{ rotate: [0, -10, 10, 0], scale: 1.2, transition: { duration: 0.5 } }}
            >
              <Icon className="w-5 h-5 text-white" strokeWidth={2} />
            </motion.div>

            {/* Content */}
            <h3 className="text-base font-bold text-white mb-1 relative z-10">{cat.name}</h3>
            <p className="text-xs text-white/80 leading-relaxed mb-3 relative z-10 line-clamp-2">{cat.description}</p>

            {/* CTA footer */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs text-white/60 font-medium">
                {cat.serviceCount} услуг
              </span>
              <motion.span
                className="flex items-center gap-1.5 text-xs font-semibold text-white bg-white/20 backdrop-blur-sm px-3 py-1.5 rounded-full"
                animate={{ x: [0, 4, 0] }}
                transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
              >
                Выбрать
                <ChevronRight className="w-3.5 h-3.5" />
              </motion.span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryCards;
