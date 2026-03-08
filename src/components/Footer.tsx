import { Mail, MessageCircle, Send } from 'lucide-react';
import { Link } from 'react-router-dom';

const socials = [
  { name: 'Telegram', href: 'https://t.me/smmpanel', icon: Send },
  { name: 'WhatsApp', href: 'https://wa.me/79001234567', icon: MessageCircle },
  { name: 'Email', href: 'mailto:support@smmpanel.ru', icon: Mail },
];

const legalLinks = [
  { title: 'Каталог услуг', to: '/catalog' },
  { title: 'Контакты', to: '/page/contacts' },
  { title: 'Помощь', to: '/page/help' },
  { title: 'Возврат средств', to: '/page/refund' },
  { title: 'Правила сервиса', to: '/page/terms' },
  { title: 'Договор оферта', to: '/page/offer' },
  { title: 'Политика конфиденциальности', to: '/page/privacy-policy' },
  { title: 'Cookie', to: '/page/cookie-policy' },
];

const Footer = () => {
  return (
    <footer className="bg-foreground border-t border-border py-10 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Top row */}
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div>
            <p className="text-sm font-semibold text-background">CoolLike</p>
            <p className="text-xs text-background/60 mt-1">Продвижение в социальных сетях</p>
            <div className="flex items-center gap-3 mt-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-background/10 flex items-center justify-center text-background/60 hover:text-background hover:bg-background/20 transition-colors"
                  aria-label={s.name}
                >
                  <s.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          {/* Legal links grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-background/60 hover:text-background transition-colors whitespace-nowrap"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        {/* Bottom */}
        <div className="border-t border-background/10 pt-4">
          <p className="text-xs text-background/40 text-center">
            © {new Date().getFullYear()} CoolLike. Все права защищены.
          </p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
