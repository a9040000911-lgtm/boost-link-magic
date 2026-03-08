import { motion } from 'framer-motion';
import { type Category } from '@/lib/smm-data';

interface CategoryCardsProps {
  categories: Category[];
  onSelect: (category: Category) => void;
  selectedId: string | null;
}

const CategoryCards = ({ categories, onSelect, selectedId }: CategoryCardsProps) => {
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
          className={`glass-card p-5 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-md group cursor-pointer ${
            selectedId === cat.id
              ? 'ring-2 ring-primary shadow-md shadow-primary/10'
              : ''
          }`}
        >
          <span className="text-2xl block mb-3">{cat.icon}</span>
          <h3 className="font-semibold text-foreground mb-1">{cat.name}</h3>
          <p className="text-xs text-muted-foreground leading-relaxed">{cat.description}</p>
          <span className="text-xs text-primary mt-3 block font-medium opacity-70 group-hover:opacity-100 transition-opacity">
            {cat.serviceCount} услуг
          </span>
        </motion.button>
      ))}
    </motion.div>
  );
};

export default CategoryCards;
