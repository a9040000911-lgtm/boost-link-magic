import { motion } from 'framer-motion';
import { type Category } from '@/lib/smm-data';
import { ChevronRight } from 'lucide-react';

interface CategoryCardsProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  selectedId: string | null;
}

const cardGradients = [
  'from-pink-500/90 to-rose-400/90',
  'from-violet-500/90 to-purple-400/90',
  'from-blue-500/90 to-cyan-400/90',
  'from-amber-500/90 to-orange-400/90',
];

const CategoryCards = ({ categories, onSelect }: CategoryCardsProps) => {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 gap-5 w-full max-w-3xl mx-auto">
      {categories.map((cat, i) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: i * 0.1 }}
          onClick={() => onSelect(cat)}
          className={`relative overflow-hidden rounded-2xl p-6 text-left cursor-pointer group transition-all duration-300 hover:scale-[1.03] hover:shadow-xl bg-gradient-to-br ${cardGradients[i % cardGradients.length]}`}
        >
          <span className="text-4xl block mb-4 drop-shadow-md">{cat.icon}</span>
          <h3 className="text-xl font-bold text-card mb-2">{cat.name}</h3>
          <p className="text-sm text-card/80 leading-relaxed mb-4">{cat.description}</p>
          <div className="flex items-center justify-between">
            <span className="text-xs text-card/70 font-medium">
              {cat.serviceCount} услуг
            </span>
            <span className="w-8 h-8 rounded-full bg-card/20 flex items-center justify-center group-hover:bg-card/40 transition-colors">
              <ChevronRight className="w-4 h-4 text-card" />
            </span>
          </div>
        </motion.button>
      ))}
    </div>
  );
};

export default CategoryCards;
