export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'telegram' | 'vk';

export interface Category {
  id: string;
  name: string;
  icon: string;
  description: string;
  serviceCount: number;
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
    { id: 'ig-likes', name: 'Лайки', icon: '❤️', description: 'Увеличьте вовлечённость постов', serviceCount: 8 },
    { id: 'ig-followers', name: 'Подписчики', icon: '👥', description: 'Органический рост аудитории', serviceCount: 12 },
    { id: 'ig-views', name: 'Просмотры', icon: '👁', description: 'Просмотры Reels и Stories', serviceCount: 6 },
    { id: 'ig-comments', name: 'Комментарии', icon: '💬', description: 'Живые комментарии к постам', serviceCount: 4 },
  ],
  youtube: [
    { id: 'yt-views', name: 'Просмотры', icon: '▶️', description: 'Просмотры видео с удержанием', serviceCount: 10 },
    { id: 'yt-subs', name: 'Подписчики', icon: '🔔', description: 'Рост базы подписчиков', serviceCount: 6 },
    { id: 'yt-likes', name: 'Лайки', icon: '👍', description: 'Лайки на видео', serviceCount: 5 },
    { id: 'yt-comments', name: 'Комментарии', icon: '💬', description: 'Комментарии под видео', serviceCount: 3 },
  ],
  tiktok: [
    { id: 'tt-views', name: 'Просмотры', icon: '👁', description: 'Просмотры видео', serviceCount: 7 },
    { id: 'tt-likes', name: 'Лайки', icon: '❤️', description: 'Сердечки на видео', serviceCount: 5 },
    { id: 'tt-followers', name: 'Подписчики', icon: '👥', description: 'Рост аудитории', serviceCount: 8 },
    { id: 'tt-shares', name: 'Репосты', icon: '🔄', description: 'Поделиться видео', serviceCount: 3 },
  ],
  telegram: [
    { id: 'tg-members', name: 'Участники', icon: '👥', description: 'Подписчики канала/группы', serviceCount: 9 },
    { id: 'tg-views', name: 'Просмотры', icon: '👁', description: 'Просмотры постов', serviceCount: 5 },
    { id: 'tg-reactions', name: 'Реакции', icon: '🔥', description: 'Реакции к постам', serviceCount: 4 },
  ],
  vk: [
    { id: 'vk-likes', name: 'Лайки', icon: '❤️', description: 'Лайки на записи', serviceCount: 6 },
    { id: 'vk-friends', name: 'Друзья', icon: '👥', description: 'Добавление друзей', serviceCount: 4 },
    { id: 'vk-subs', name: 'Подписчики', icon: '📢', description: 'Подписчики сообщества', serviceCount: 7 },
    { id: 'vk-reposts', name: 'Репосты', icon: '🔄', description: 'Репосты записей', serviceCount: 3 },
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

// Default services for categories without specific data
export function getServicesForCategory(categoryId: string): Service[] {
  return servicesByCategory[categoryId] || [
    { id: 'def1', name: 'Стандарт', description: 'Базовый пакет услуг', price: '1₽', minOrder: 100, maxOrder: 50000, speed: '1000/час' },
    { id: 'def2', name: 'Premium', description: 'Высокое качество', price: '2.5₽', minOrder: 50, maxOrder: 30000, speed: '500/час' },
    { id: 'def3', name: 'Pro', description: 'Максимальное качество и гарантия', price: '4₽', minOrder: 50, maxOrder: 10000, speed: '200/час' },
  ];
}
