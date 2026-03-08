import { motion } from 'framer-motion';
import { type Category, type Platform, platformColors } from '@/lib/smm-data';

interface CategoryCardsProps {
  categories: Category[];
  platform: Platform;
  onSelect: (category: Category) => void;
  selectedId: string | null;
}

const CategoryCards = ({ categories, platform, onSelect, selectedId }: CategoryCardsProps) => {
  const color = platformColors[platform];

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="grid grid-cols-2 md:grid-cols-4 gap-4 w-full max-w-3xl mx-auto"
    >
      {categories.map((cat, i) => (
        <motion.button
          key={cat.id}
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: i * 0.08 }}
          onClick={() => onSelect(cat)}
          className={`glass-card p-5 text-left transition-all duration-300 hover:scale-[1.03] group cursor-pointer ${
            selectedId === cat.id ? 'glow-border ring-1 ring-primary/50' : 'hover:border-primary/30'
          }`}
          style={selectedId === cat.id ? {
            boxShadow: `0 0 25px -5px hsl(${color} / 0.3)`,
          } : undefined}
        >
          <span className="text-2xl block mb-3">{cat.icon}</span>
          <h3 className="font-semibold text-foreground mb-1">{cat.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
          <span className="text-xs text-primary mt-3 block opacity-70 group-hover:opacity-100 transition-opacity">
            {cat.serviceCount} услуг
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default CategoryCards;
