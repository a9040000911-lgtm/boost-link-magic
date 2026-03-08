import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Link2 } from 'lucide-react';

interface HeroInputProps {
  onSubmit: (url: string) => void;
  isLoading: boolean;
}

const HeroInput = ({ onSubmit, isLoading }: HeroInputProps) => {
  const [url, setUrl] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (url.trim()) onSubmit(url.trim());
  };

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="relative group">
        <div className="absolute -inset-0.5 bg-gradient-to-r from-primary to-accent rounded-2xl opacity-30 group-hover:opacity-50 group-focus-within:opacity-60 blur transition-opacity duration-500" />
        <div className="relative flex items-center gap-3 glass-card rounded-2xl px-5 py-4">
          <Link2 className="w-5 h-5 text-muted-foreground shrink-0" />
          <input
            type="url"
            value={url}
            onChange={(e) => setUrl(e.target.value)}
            placeholder="Вставьте ссылку на профиль или пост..."
            className="flex-1 bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base"
          />
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="shrink-0 w-10 h-10 rounded-xl bg-primary text-primary-foreground flex items-center justify-center transition-all hover:scale-105 disabled:opacity-40 disabled:hover:scale-100"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-primary-foreground border-t-transparent rounded-full"
              />
            ) : (
              <ArrowRight className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

export default HeroInput;
