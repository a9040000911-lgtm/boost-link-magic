export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'telegram' | 'vk';

export type LinkType =
  | 'profile'
  | 'post'
  | 'reel'
  | 'story'
  | 'video'
  | 'shorts'
  | 'channel'
  | 'playlist'
  | 'live'
  | 'group'
  | 'wall'
  | 'photo'
  | 'unknown';

export interface LinkAnalysis {
  platform: Platform;
  linkType: LinkType;
  username?: string;
  contentId?: string;
  label: string;
  raw: string;
}

export interface Category {
  id: string;
  name: string;
  icon: string;
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

// ──── Platform detection ────

const platformPatterns: { platform: Platform; patterns: RegExp[] }[] = [
  { platform: 'instagram', patterns: [/instagram\.com/i, /instagr\.am/i] },
  { platform: 'youtube', patterns: [/youtube\.com/i, /youtu\.be/i] },
  { platform: 'tiktok', patterns: [/tiktok\.com/i, /vm\.tiktok/i] },
  { platform: 'telegram', patterns: [/t\.me/i, /telegram\./i] },
  { platform: 'vk', patterns: [/vk\.com/i, /vk\.ru/i] },
];

export function detectPlatform(url: string): Platform | null {
  for (const { platform, patterns } of platformPatterns) {
    if (patterns.some((p) => p.test(url))) return platform;
  }
  return null;
}

// ──── Link type detection ────

interface TypeRule {
  type: LinkType;
  pattern: RegExp;
  label: string;
  extractUsername?: number;
  extractId?: number;
}

const instagramRules: TypeRule[] = [
  { type: 'reel', pattern: /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/i, label: 'Reels', extractId: 1 },
  { type: 'story', pattern: /instagram\.com\/stories\/([A-Za-z0-9_.]+)/i, label: 'Stories', extractUsername: 1 },
  { type: 'post', pattern: /instagram\.com\/p\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1 },
  { type: 'live', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1 },
  { type: 'profile', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1 },
];

const youtubeRules: TypeRule[] = [
  { type: 'shorts', pattern: /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i, label: 'Shorts', extractId: 1 },
  { type: 'live', pattern: /youtube\.com\/live\/([A-Za-z0-9_-]+)/i, label: 'Прямой эфир', extractId: 1 },
  { type: 'playlist', pattern: /youtube\.com\/playlist\?list=([A-Za-z0-9_-]+)/i, label: 'Плейлист', extractId: 1 },
  { type: 'video', pattern: /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1 },
  { type: 'video', pattern: /youtu\.be\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1 },
  { type: 'channel', pattern: /youtube\.com\/@([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1 },
  { type: 'channel', pattern: /youtube\.com\/channel\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractId: 1 },
  { type: 'channel', pattern: /youtube\.com\/c\/([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1 },
];

const tiktokRules: TypeRule[] = [
  { type: 'video', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/video\/(\d+)/i, label: 'Видео', extractUsername: 1, extractId: 2 },
  { type: 'video', pattern: /vm\.tiktok\.com\/([A-Za-z0-9]+)/i, label: 'Видео (короткая)', extractId: 1 },
  { type: 'live', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1 },
  { type: 'profile', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1 },
];

const telegramRules: TypeRule[] = [
  { type: 'post', pattern: /t\.me\/([A-Za-z0-9_]+)\/(\d+)/i, label: 'Пост', extractUsername: 1, extractId: 2 },
  { type: 'channel', pattern: /t\.me\/([A-Za-z0-9_]+)\/?$/i, label: 'Канал / Группа', extractUsername: 1 },
];

const vkRules: TypeRule[] = [
  { type: 'wall', pattern: /vk\.com\/wall(-?\d+_\d+)/i, label: 'Запись на стене', extractId: 1 },
  { type: 'photo', pattern: /vk\.com\/photo(-?\d+_\d+)/i, label: 'Фото', extractId: 1 },
  { type: 'video', pattern: /vk\.com\/video(-?\d+_\d+)/i, label: 'Видео', extractId: 1 },
  { type: 'video', pattern: /vk\.com\/clip(-?\d+_\d+)/i, label: 'Клип', extractId: 1 },
  { type: 'group', pattern: /vk\.com\/(club|public)(\d+)/i, label: 'Сообщество', extractId: 2 },
  { type: 'profile', pattern: /vk\.com\/id(\d+)/i, label: 'Профиль', extractId: 1 },
  { type: 'profile', pattern: /vk\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Страница', extractUsername: 1 },
];

const rulesByPlatform: Record<Platform, TypeRule[]> = {
  instagram: instagramRules,
  youtube: youtubeRules,
  tiktok: tiktokRules,
  telegram: telegramRules,
  vk: vkRules,
};

export const linkTypeLabels: Record<LinkType, string> = {
  profile: 'Профиль',
  post: 'Пост',
  reel: 'Reels',
  story: 'Stories',
  video: 'Видео',
  shorts: 'Shorts',
  channel: 'Канал',
  playlist: 'Плейлист',
  live: 'Прямой эфир',
  group: 'Группа',
  wall: 'Запись',
  photo: 'Фото',
  unknown: 'Ссылка',
};

/**
 * Smart link analyzer: detects platform, link type, username/content ID.
 * Returns null if platform is not recognized.
 */
export function analyzeLink(url: string): LinkAnalysis | null {
  const platform = detectPlatform(url);
  if (!platform) return null;

  const rules = rulesByPlatform[platform];
  for (const rule of rules) {
    const match = url.match(rule.pattern);
    if (match) {
      const username = rule.extractUsername ? match[rule.extractUsername] : undefined;
      const contentId = rule.extractId ? match[rule.extractId] : undefined;
      if (username && ['explore', 'accounts', 'about', 'settings', 'direct', 'reels'].includes(username.toLowerCase())) {
        continue;
      }
      return { platform, linkType: rule.type, username, contentId, label: rule.label, raw: url };
    }
  }

  return { platform, linkType: 'unknown', label: 'Ссылка', raw: url };
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
