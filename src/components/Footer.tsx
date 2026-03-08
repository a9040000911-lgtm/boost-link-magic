import { Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const socials = [
  { name: 'Telegram', href: 'https://t.me/smmpanel', icon: Send },
  { name: 'WhatsApp', href: 'https://wa.me/79001234567', icon: MessageCircle },
  { name: 'Email', href: 'mailto:support@smmpanel.ru', icon: Mail },
];

const Footer = () => {
  return (
    <footer className="bg-foreground border-t border-border py-10 px-4">
      <div className="max-w-5xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="text-center md:text-left">
          <p className="text-sm font-semibold text-foreground">SMM Panel</p>
          <p className="text-xs text-muted-foreground mt-1">Продвижение в социальных сетях</p>
        </div>

        <div className="flex items-center gap-4">
          {socials.map((s) => (
            <a
              key={s.name}
              href={s.href}
              target="_blank"
              rel="noopener noreferrer"
              className="w-9 h-9 rounded-full bg-muted flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors"
              aria-label={s.name}
            >
              <s.icon className="w-4 h-4" />
            </a>
          ))}
        </div>

        <div className="flex flex-col items-center md:items-end gap-1">
          <Link to="/privacy" className="text-xs text-muted-foreground hover:text-foreground transition-colors underline">
            Политика конфиденциальности
          </Link>
          <p className="text-xs text-muted-foreground">
            © {new Date().getFullYear()} SMM Panel. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
