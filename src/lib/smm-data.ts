export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'telegram' | 'vk';

export interface Category {
  id: string;
  name: string;
  icon: string; // lucide icon name
  description: string;
  serviceCount: number;
  highlight: string;
}

export interface Service {
  id: string;
  name: string;
  description: string;
  price: string;
  minOrder: number;
  maxOrder: number;
  speed: string;
}

export function detectPlatform(url: string): Platform | null {
  const lower = url.toLowerCase();
  if (lower.includes('instagram.com') || lower.includes('instagr.am')) return 'instagram';
  if (lower.includes('youtube.com') || lower.includes('youtu.be')) return 'youtube';
  if (lower.includes('tiktok.com') || lower.includes('vm.tiktok')) return 'tiktok';
  if (lower.includes('t.me') || lower.includes('telegram.')) return 'telegram';
  if (lower.includes('vk.com') || lower.includes('vk.ru')) return 'vk';
  return null;
}

export const platformNames: Record<Platform, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  vk: 'ВКонтакте',
};

export const platformColors: Record<Platform, string> = {
  instagram: '330 80% 60%',
  youtube: '0 80% 55%',
  tiktok: '170 80% 50%',
  telegram: '200 80% 55%',
  vk: '215 70% 55%',
};

export const categoriesByPlatform: Record<Platform, Category[]> = {
  instagram: [
    { id: 'ig-likes', name: 'Лайки', icon: 'heart', description: 'Увеличьте вовлечённость ваших публикаций с помощью живых лайков от реальных пользователей', serviceCount: 8, highlight: 'Топ продаж' },
    { id: 'ig-followers', name: 'Подписчики', icon: 'users', description: 'Органический рост аудитории вашего аккаунта. Качественные профили с аватарками', serviceCount: 12, highlight: 'Популярное' },
    { id: 'ig-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры на Reels, Stories и IGTV. Быстрый старт и высокое удержание', serviceCount: 6, highlight: 'Быстрый старт' },
    { id: 'ig-comments', name: 'Комментарии', icon: 'message-circle', description: 'Живые тематические комментарии от реальных аккаунтов с аватарками', serviceCount: 4, highlight: 'Premium' },
  ],
  youtube: [
    { id: 'yt-views', name: 'Просмотры', icon: 'play', description: 'Просмотры видео с высоким удержанием. Безопасно для монетизации', serviceCount: 10, highlight: 'Топ продаж' },
    { id: 'yt-subs', name: 'Подписчики', icon: 'bell', description: 'Рост базы подписчиков канала. Качественные аккаунты', serviceCount: 6, highlight: 'Популярное' },
    { id: 'yt-likes', name: 'Лайки', icon: 'thumbs-up', description: 'Лайки на видео для продвижения в рекомендациях', serviceCount: 5, highlight: 'Быстрый старт' },
    { id: 'yt-comments', name: 'Комментарии', icon: 'message-circle', description: 'Тематические комментарии под видео', serviceCount: 3, highlight: 'Premium' },
  ],
  tiktok: [
    { id: 'tt-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры видео для попадания в рекомендации', serviceCount: 7, highlight: 'Топ продаж' },
    { id: 'tt-likes', name: 'Лайки', icon: 'heart', description: 'Сердечки на видео от активных пользователей', serviceCount: 5, highlight: 'Популярное' },
    { id: 'tt-followers', name: 'Подписчики', icon: 'users', description: 'Рост аудитории TikTok аккаунта', serviceCount: 8, highlight: 'Быстрый старт' },
    { id: 'tt-shares', name: 'Репосты', icon: 'share-2', description: 'Поделиться видео для вирусного охвата', serviceCount: 3, highlight: 'Premium' },
  ],
  telegram: [
    { id: 'tg-members', name: 'Участники', icon: 'users', description: 'Подписчики канала или группы. Реальные профили', serviceCount: 9, highlight: 'Топ продаж' },
    { id: 'tg-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры постов в канале', serviceCount: 5, highlight: 'Популярное' },
    { id: 'tg-reactions', name: 'Реакции', icon: 'flame', description: 'Реакции к постам: 🔥 ❤️ 👍 и другие', serviceCount: 4, highlight: 'Premium' },
  ],
  vk: [
    { id: 'vk-likes', name: 'Лайки', icon: 'heart', description: 'Лайки на записи и фото', serviceCount: 6, highlight: 'Топ продаж' },
    { id: 'vk-friends', name: 'Друзья', icon: 'user-plus', description: 'Добавление друзей в профиль', serviceCount: 4, highlight: 'Популярное' },
    { id: 'vk-subs', name: 'Подписчики', icon: 'megaphone', description: 'Подписчики сообщества ВКонтакте', serviceCount: 7, highlight: 'Быстрый старт' },
    { id: 'vk-reposts', name: 'Репосты', icon: 'share-2', description: 'Репосты записей на стены пользователей', serviceCount: 3, highlight: 'Premium' },
  ],
};

export const servicesByCategory: Record<string, Service[]> = {
  'ig-likes': [
    { id: 's1', name: 'Лайки Premium', description: 'Высокое качество, реальные аккаунты', price: '0.8₽', minOrder: 100, maxOrder: 50000, speed: '1000/час' },
    { id: 's2', name: 'Лайки Стандарт', description: 'Быстрая доставка, микс аккаунтов', price: '0.3₽', minOrder: 50, maxOrder: 100000, speed: '5000/час' },
    { id: 's3', name: 'Лайки Instant', description: 'Моментальный старт', price: '0.5₽', minOrder: 100, maxOrder: 30000, speed: '10000/час' },
    { id: 's4', name: 'Авто-лайки', description: 'Автоматически на новые посты', price: '1.2₽', minOrder: 100, maxOrder: 10000, speed: '500/час' },
  ],
  'ig-followers': [
    { id: 's5', name: 'Подписчики HQ', description: 'С аватарками и постами', price: '2.5₽', minOrder: 100, maxOrder: 100000, speed: '1000/день' },
    { id: 's6', name: 'Подписчики Mix', description: 'Смешанное качество', price: '1.0₽', minOrder: 100, maxOrder: 500000, speed: '5000/день' },
    { id: 's7', name: 'Подписчики RU', description: 'Русскоязычные аккаунты', price: '3.5₽', minOrder: 50, maxOrder: 50000, speed: '500/день' },
  ],
  'ig-views': [
    { id: 's8', name: 'Reels просмотры', description: 'Просмотры на Reels', price: '0.1₽', minOrder: 500, maxOrder: 1000000, speed: '50000/час' },
    { id: 's9', name: 'Stories просмотры', description: 'Просмотры историй', price: '0.2₽', minOrder: 100, maxOrder: 100000, speed: '10000/час' },
  ],
  'ig-comments': [
    { id: 's10', name: 'Комментарии Custom', description: 'Ваш текст комментариев', price: '5₽', minOrder: 10, maxOrder: 5000, speed: '100/час' },
  ],
};

export function getServicesForCategory(categoryId: string): Service[] {
  return servicesByCategory[categoryId] || [
    { id: 'def1', name: 'Стандарт', description: 'Базовый пакет услуг', price: '1₽', minOrder: 100, maxOrder: 50000, speed: '1000/час' },
    { id: 'def2', name: 'Premium', description: 'Высокое качество', price: '2.5₽', minOrder: 50, maxOrder: 30000, speed: '500/час' },
    { id: 'def3', name: 'Pro', description: 'Максимальное качество и гарантия', price: '4₽', minOrder: 50, maxOrder: 10000, speed: '200/час' },
  ];
}
