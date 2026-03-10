import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const SITE_KEYS = [
  "site_hero_title", "site_hero_subtitle",
  "site_stats",
  "site_features_title", "site_features_subtitle", "site_features",
  "site_cta_title", "site_cta_text", "site_cta_button",
  "site_brand_name", "site_brand_tagline",
  "site_social_telegram", "site_social_whatsapp",
  "site_footer_disclaimer",
  "site_reviews",
];

const DEFAULTS: Record<string, string> = {
  site_hero_title: "COOLLIKE",
  site_hero_subtitle: "Продвигайте свои соцсети",
  site_stats: JSON.stringify([
    { value: "5K+", label: "Заказов выполнено" },
    { value: "1K+", label: "Активных клиентов" },
    { value: "99.5%", label: "Успешных заказов" },
    { value: "24/7", label: "Поддержка" },
  ]),
  site_features_title: "Почему выбирают нас",
  site_features_subtitle: "Современный сервис продвижения, продуманный до мелочей. Умный подбор услуг, удобный интерфейс и минимум ошибок",
  site_features: JSON.stringify([
    { icon: "Brain", title: "Умный подбор услуг", description: "Вставьте ссылку — система сама определит платформу и подберёт подходящие услуги", gradient: "card-gradient-amber" },
    { icon: "Shield", title: "Минимум ошибок", description: "Автоматическая валидация ссылок и параметров заказа до оформления — меньше отмен и проблем", gradient: "card-gradient-blue" },
    { icon: "Clock", title: "Гарантия и возврат", description: "30 дней гарантии на все услуги. Возврат средств, если результат не соответствует", gradient: "card-gradient-violet" },
    { icon: "MousePointerClick", title: "Удобный интерфейс", description: "Продуманный сервис: от вставки ссылки до результата за пару кликов, без лишних шагов", gradient: "card-gradient-pink" },
    { icon: "Sparkles", title: "Новый подход", description: "Современная платформа, созданная с нуля — быстрая, понятная и без устаревших решений", gradient: "card-gradient-blue" },
    { icon: "Zap", title: "Быстрый старт", description: "Заказы начинают выполняться в течение нескольких минут после оплаты", gradient: "card-gradient-amber" },
  ]),
  site_cta_title: "Начните продвижение прямо сейчас",
  site_cta_text: "Вставьте ссылку на ваш профиль или пост выше — мы автоматически определим платформу и предложим лучшие услуги",
  site_cta_button: "Начать продвижение ↑",
  site_brand_name: "CoolLike",
  site_brand_tagline: "Продвижение в социальных сетях",
  site_social_telegram: "https://t.me/smmpanel",
  site_social_whatsapp: "https://wa.me/79001234567",
  site_footer_disclaimer: "Meta Platforms Inc. (Facebook, Instagram) признана экстремистской организацией и запрещена на территории Российской Федерации.",
  site_reviews: JSON.stringify([
    { name: "Алексей В.", rating: 5, message: "Лучший сервис по накрутке, что я пробовал. Всё быстро и качественно!", platform: "telegram" },
    { name: "Мария К.", rating: 5, message: "Очень удобный интерфейс. Ссылка распознается мгновенно, не нужно ничего выбирать вручную.", platform: "instagram" },
    { name: "Иван С.", rating: 4, message: "Поддержка ответила за 5 минут. Помогли разобраться с заказом. Рекомендую!", platform: "vk" },
    { name: "Елена Р.", rating: 5, message: "Цены адекватные, результат виден сразу. Буду пользоваться постоянно.", platform: "youtube" },
    { name: "Дмитрий П.", rating: 5, message: "Заказывал подписчиков в Telegram, прилетели за час. Без списаний!", platform: "telegram" },
  ]),
};

export interface SiteContent {
  heroTitle: string;
  heroSubtitle: string;
  stats: { value: string; label: string }[];
  featuresTitle: string;
  featuresSubtitle: string;
  features: { icon: string; title: string; description: string; gradient: string }[];
  ctaTitle: string;
  ctaText: string;
  ctaButton: string;
  brandName: string;
  brandTagline: string;
  socialTelegram: string;
  socialWhatsapp: string;
  footerDisclaimer: string;
  reviews: { name: string; rating: number; message: string; platform: string }[];
}

function parseJSON<T>(raw: string, fallback: T): T {
  try { return JSON.parse(raw); } catch { return fallback; }
}

export function useSiteContent() {
  const [content, setContent] = useState<SiteContent | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase
      .from("app_settings")
      .select("key, value")
      .in("key", SITE_KEYS)
      .then(({ data }) => {
        const s: Record<string, string> = { ...DEFAULTS };
        (data || []).forEach((r: any) => { if (r.value) s[r.key] = r.value; });

        setContent({
          heroTitle: s.site_hero_title,
          heroSubtitle: s.site_hero_subtitle,
          stats: parseJSON(s.site_stats, []),
          featuresTitle: s.site_features_title,
          featuresSubtitle: s.site_features_subtitle,
          features: parseJSON(s.site_features, []),
          ctaTitle: s.site_cta_title,
          ctaText: s.site_cta_text,
          ctaButton: s.site_cta_button,
          brandName: s.site_brand_name,
          brandTagline: s.site_brand_tagline,
          socialTelegram: s.site_social_telegram,
          socialWhatsapp: s.site_social_whatsapp,
          footerDisclaimer: s.site_footer_disclaimer,
          reviews: parseJSON(s.site_reviews, []),
        });
        setLoading(false);
      });
  }, []);

  return { content, loading };
}

export { SITE_KEYS, DEFAULTS };
