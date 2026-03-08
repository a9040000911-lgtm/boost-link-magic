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
      <div className="input-card px-5 py-4">
        <input
          type="url"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Вставьте ссылку на профиль или пост..."
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base mb-3"
        />
        <div className="flex items-center justify-between">
          <Link2 className="w-5 h-5 text-muted-foreground" />
          <button
            type="submit"
            disabled={!url.trim() || isLoading}
            className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center transition-all hover:scale-110 disabled:opacity-30 disabled:hover:scale-100"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
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
