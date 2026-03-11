export const SEO_CONFIG = {
  brandName: "CoolLike",
  defaultTitle: "CoolLike - Премиальное продвижение в социальных сетях",
  defaultDescription: "Профессиональный сервис продвижения в соцсетях. Накрутка подписчиков, лайков и просмотров с гарантией качества.",
  patterns: {
    home: {
      title: "CoolLike - Премиальное продвижение в социальных сетях | Накрутка подписчиков и лайков",
      description: "Профессиональный сервис продвижения в соцсетях. Накрутка подписчиков, лайков и просмотров с гарантией качества. Попробуйте CoolLike прямо сейчас!",
    },
    catalog: {
      title: "Каталог услуг по продвижению в соцсетях | CoolLike",
      description: "Ознакомьтесь с полным списком услуг по продвижению в Telegram, Instagram, VK и других соцсетях. Качественная накрутка от CoolLike.",
    },
    platform: {
      title: (platform: string) => `Купить ${platform} подписчиков и лайки - Быстро и надежно | CoolLike`,
      description: (platform: string) => `Хотите популярности в ${platform}? Закажите качественную накрутку у нас. Быстрый старт, безопасная доставка, выгодные цены.`,
    },
    service: {
      title: (service: string, platform: string) => `${service} ${platform} - Накрутка недорого с гарантией | CoolLike`,
      description: (service: string, platform: string) => `Качественная услуга: ${service} в ${platform}. Гарантия результата, моментальный старт и лучшие цены на рынке.`,
    },
  },
};

export function getMetaTitle(page: "home" | "catalog" | "platform" | "service", params?: { platform?: string; service?: string }) {
  if (page === "home") return SEO_CONFIG.patterns.home.title;
  if (page === "catalog") return SEO_CONFIG.patterns.catalog.title;
  if (page === "platform" && params?.platform) return SEO_CONFIG.patterns.platform.title(params.platform);
  if (page === "service" && params?.service && params?.platform) return SEO_CONFIG.patterns.service.title(params.service, params.platform);
  return SEO_CONFIG.defaultTitle;
}

export function getMetaDescription(page: "home" | "catalog" | "platform" | "service", params?: { platform?: string; service?: string }) {
  if (page === "home") return SEO_CONFIG.patterns.home.description;
  if (page === "catalog") return SEO_CONFIG.patterns.catalog.description;
  if (page === "platform" && params?.platform) return SEO_CONFIG.patterns.platform.description(params.platform);
  if (page === "service" && params?.service && params?.platform) return SEO_CONFIG.patterns.service.description(params.service, params.platform);
  return SEO_CONFIG.defaultDescription;
}
