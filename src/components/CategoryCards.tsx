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
}

const iconMap: Record<string, LucideIcon> = {
  heart: Heart,
  users: Users,
  eye: Eye,
  'message-circle': MessageCircle,
  play: Play,
  bell: Bell,
  'thumbs-up': ThumbsUp,
  'share-2': Share2,
  flame: Flame,
  'user-plus': UserPlus,
  megaphone: Megaphone,
};

const gradientClasses = [
  'card-gradient-pink',
  'card-gradient-violet',
  'card-gradient-blue',
  'card-gradient-amber',
];

const CategoryCards = ({ categories, onSelect }: CategoryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl mx-auto">
      {categories.map((cat, i) => {
        const Icon = iconMap[cat.icon] || Heart;
        return (
          <motion.button
            key={cat.id}
            initial={{ opacity: 0, y: 50, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.5, delay: i * 0.1, type: 'spring', bounce: 0.3 }}
            onClick={() => onSelect(cat)}
            className={`relative overflow-hidden rounded-2xl p-7 text-left cursor-pointer group transition-all duration-300 hover:scale-[1.04] hover:shadow-2xl ${gradientClasses[i % gradientClasses.length]}`}
          >
            {/* Background decoration */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/10 rounded-full -translate-y-12 translate-x-12 group-hover:scale-150 transition-transform duration-700" />
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-white/5 rounded-full translate-y-10 -translate-x-10" />

            {/* Highlight badge */}
            <div className="flex items-center gap-1.5 mb-5">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/20 backdrop-blur-sm text-white text-xs font-semibold">
                <Sparkles className="w-3 h-3" />
                {cat.highlight}
              </span>
            </div>

            {/* Icon */}
            <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-sm flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300">
              <Icon className="w-6 h-6 text-white" strokeWidth={2} />
            </div>

            {/* Content */}
            <h3 className="text-xl font-bold text-white mb-2 relative z-10">{cat.name}</h3>
            <p className="text-sm text-white/80 leading-relaxed mb-5 relative z-10 line-clamp-2">{cat.description}</p>

            {/* Footer */}
            <div className="flex items-center justify-between relative z-10">
              <span className="text-xs text-white/60 font-medium">
                {cat.serviceCount} услуг доступно
              </span>
              <span className="w-9 h-9 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center group-hover:bg-white/30 group-hover:translate-x-1 transition-all duration-300">
                <ChevronRight className="w-4 h-4 text-white" />
              </span>
            </div>
          </motion.button>
        );
      })}
    </div>
  );
};

export default CategoryCards;
