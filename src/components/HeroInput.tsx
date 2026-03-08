import { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowUp, Link2, List } from 'lucide-react';

interface HeroInputProps {
  onSubmit: (urls: string[]) => void;
  isLoading: boolean;
}

const HeroInput = ({ onSubmit, isLoading }: HeroInputProps) => {
  const [text, setText] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const urls = text
      .split(/[\n,]+/)
      .map((u) => u.trim())
      .filter((u) => u.length > 0);
    if (urls.length > 0) onSubmit(urls);
  };

  const lineCount = text.split(/[\n,]+/).filter((u) => u.trim().length > 0).length;

  return (
    <motion.form
      onSubmit={handleSubmit}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.6, delay: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <div className="input-card px-5 py-4">
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={"Вставьте одну или несколько ссылок...\nКаждая ссылка с новой строки или через запятую"}
          rows={3}
          className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none text-base mb-3 resize-none"
        />
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link2 className="w-5 h-5 text-muted-foreground/60" />
            {lineCount > 1 && (
              <motion.span
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-primary/10 text-primary text-xs font-medium"
              >
                <List className="w-3 h-3" />
                {lineCount} ссылок
              </motion.span>
            )}
          </div>
          <button
            type="submit"
            disabled={lineCount === 0 || isLoading}
            className="w-9 h-9 rounded-full bg-foreground text-background flex items-center justify-center transition-all hover:scale-110 disabled:opacity-25 disabled:hover:scale-100"
          >
            {isLoading ? (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 1, ease: 'linear' }}
                className="w-4 h-4 border-2 border-background border-t-transparent rounded-full"
              />
            ) : (
              <ArrowUp className="w-4 h-4" />
            )}
          </button>
        </div>
      </div>
    </motion.form>
  );
};

export default HeroInput;
