import { useEffect, useState } from 'react';
import { Mail, MessageCircle, Send, Headset, Clock } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useSiteContent } from '@/hooks/useSiteContent';
import { supabase } from '@/integrations/supabase/client';

const CONTACT_KEYS = ['contact_email', 'contact_work_hours', 'contact_work_days'];
const CONTACT_DEFAULTS: Record<string, string> = {
  contact_email: 'support@smmpanel.ru',
  contact_work_hours: '9:00 — 21:00 МСК',
  contact_work_days: 'Пн — Вс',
};

const legalLinks = [
  { title: 'Каталог услуг', to: '/catalog' },
  { title: 'Контакты', to: '/contact' },
  { title: 'Помощь', to: '/page/help' },
  { title: 'Возврат средств', to: '/page/refund' },
  { title: 'Правила сервиса', to: '/page/terms' },
  { title: 'Договор оферта', to: '/page/offer' },
  { title: 'Политика конфиденциальности', to: '/page/privacy-policy' },
  { title: 'Cookie', to: '/page/cookie-policy' },
];

const Footer = () => {
  const { content } = useSiteContent();
  const [contacts, setContacts] = useState(CONTACT_DEFAULTS);

  useEffect(() => {
    supabase
      .from('app_settings')
      .select('key, value')
      .in('key', CONTACT_KEYS)
      .then(({ data }) => {
        if (data) {
          const map = { ...CONTACT_DEFAULTS };
          data.forEach((r) => { if (r.value) map[r.key] = r.value; });
          setContacts(map);
        }
      });
  }, []);

  const brandName = content?.brandName || 'CoolLike';
  const brandTagline = content?.brandTagline || 'Продвижение в социальных сетях';
  const disclaimer = content?.footerDisclaimer || '';

  const socials = [
    { name: 'Telegram', href: content?.socialTelegram || 'https://t.me/smmpanel', icon: Send },
    { name: 'WhatsApp', href: content?.socialWhatsapp || 'https://wa.me/79001234567', icon: MessageCircle },
    { name: 'Email', href: `mailto:${contacts.contact_email}`, icon: Mail },
  ];

  return (
    <motion.footer
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.6 }}
      className="bg-gradient-to-br from-primary/90 via-secondary/80 to-accent/70 border-t border-white/10 py-10 px-4"
    >
      <div className="max-w-5xl mx-auto">
        <div className="flex flex-col md:flex-row items-start justify-between gap-8 mb-8">
          <div>
            <p className="text-2xl font-extrabold text-white tracking-tight">{brandName}</p>
            <p className="text-xs text-white/60 mt-1">{brandTagline}</p>
            <div className="flex items-center gap-2 mt-2 text-xs text-white/50">
              <Clock className="w-3 h-3" />
              <span>{contacts.contact_work_days}, {contacts.contact_work_hours}</span>
            </div>
            <div className="flex items-center gap-3 mt-3">
              {socials.map((s) => (
                <a
                  key={s.name}
                  href={s.href}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors"
                  aria-label={s.name}
                >
                  <s.icon className="w-3.5 h-3.5" />
                </a>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 gap-x-8 gap-y-1.5">
            {legalLinks.map((link) => (
              <Link
                key={link.to}
                to={link.to}
                className="text-xs text-white/60 hover:text-white transition-colors whitespace-nowrap"
              >
                {link.title}
              </Link>
            ))}
          </div>
        </div>

        <div className="flex justify-center mb-6">
          <Link
            to="/dashboard/support"
            className="inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-white/15 backdrop-blur-sm text-white font-medium text-sm border border-white/20 hover:bg-white/25 hover:border-white/30 transition-all shadow-lg"
          >
            <Headset className="w-4 h-4" />
            Техническая поддержка
          </Link>
        </div>

        <div className="border-t border-white/10 pt-4 space-y-2">
          <p className="text-xs text-white/40 text-center">
            © {new Date().getFullYear()} {brandName}. Все права защищены.
          </p>
          {disclaimer && (
            <p className="text-[10px] text-white/30 text-center leading-relaxed">
              {disclaimer}
            </p>
          )}
        </div>
      </div>
    </motion.footer>
  );
};

export default Footer;
