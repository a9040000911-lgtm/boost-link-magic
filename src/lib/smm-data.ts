/**
 * SMM Data Module
 * Main export file for SMM-related types, classifiers, and analyzers
 * 
 * Re-exports from:
 * - smm-provider-import.ts (Provider API, Service Classifier)
 * - link-analyzer.ts (Link Analysis, URL Normalization)
 * - unified-categories.ts (Network & Activity definitions)
 */

export type Platform = 'instagram' | 'youtube' | 'tiktok' | 'telegram' | 'vk' | 'twitch' | 'vkplay' | string;

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
  | 'invite'
  | 'comment'
  | 'boost'
  | 'product'
  | 'stars'
  | 'audio'
  | 'podcast'
  | 'article'
  | 'poll'
  | 'unknown';

export interface LinkAnalysis {
  platform: Platform;
  linkType: LinkType;
  username?: string;
  contentId?: string;
  label: string;
  raw: string;
  categoryId?: string; // optional DB category mapping
  confidence: 'high' | 'medium' | 'low';
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

// ──── DB pattern type ────
export interface DbLinkPattern {
  id: string;
  platform: string;
  link_type: string;
  pattern: string;
  label: string;
  extract_username_group: number | null;
  extract_id_group: number | null;
  category_id: string | null;
  is_enabled: boolean;
}

// DB platform type
export interface DbPlatform {
  id: string;
  key: string;
  name: string;
  domains: string[];
  icon: string | null;
  color: string | null;
  is_enabled: boolean;
}

// ──── Platform detection ────

const platformPatterns: { platform: Platform; patterns: RegExp[] }[] = [
  { platform: 'instagram', patterns: [/instagram\.com/i, /instagr\.am/i] },
  { platform: 'youtube', patterns: [/youtube\.com/i, /youtu\.be/i] },
  { platform: 'tiktok', patterns: [/tiktok\.com/i, /vm\.tiktok/i] },
  { platform: 'telegram', patterns: [/t\.me/i, /telegram\./i] },
  { platform: 'vk', patterns: [/vk\.com/i, /vk\.ru/i] },
  { platform: 'twitch', patterns: [/twitch\.tv/i] },
  { platform: 'vkplay', patterns: [/vkplay\.live/i, /live\.vkvideo\.ru/i] },
  { platform: 'dzen', patterns: [/dzen\.ru/i] },
  { platform: 'ok', patterns: [/ok\.ru/i] },
  { platform: 'likee', patterns: [/likee\.video/i, /likee\.com/i] },
  { platform: 'threads', patterns: [/threads\.net/i] },
  { platform: 'facebook', patterns: [/facebook\.com/i, /fb\.com/i, /fb\.me/i] },
  { platform: 'x', patterns: [/x\.com/i, /twitter\.com/i] },
];

export function detectPlatform(url: string): Platform | null {
  for (const { platform, patterns } of platformPatterns) {
    if (patterns.some((p) => p.test(url))) return platform;
  }
  return null;
}

/**
 * Detect platform using DB platforms (domains) and DB patterns as secondary sources.
 */
export function detectPlatformWithDb(url: string, dbPatterns: DbLinkPattern[], dbPlatforms?: DbPlatform[]): Platform | null {
  // 1. Try hardcoded first
  const hardcoded = detectPlatform(url);
  if (hardcoded) return hardcoded;

  // 2. Try DB platforms by domain matching
  if (dbPlatforms) {
    for (const plat of dbPlatforms) {
      if (plat.domains.some(domain => url.toLowerCase().includes(domain.toLowerCase()))) {
        return plat.key;
      }
    }
  }

  // 3. Try DB patterns
  for (const dp of dbPatterns) {
    try {
      const re = new RegExp(dp.pattern, 'i');
      if (re.test(url)) return dp.platform;
    } catch { }
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
  categoryId?: string;
}

const instagramRules: TypeRule[] = [
  { type: 'reel', pattern: /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/i, label: 'Reels', extractId: 1 },
  { type: 'story', pattern: /instagram\.com\/stories\/([A-Za-z0-9_.]+)\/(\d+)/i, label: 'Stories', extractUsername: 1, extractId: 2 },
  { type: 'story', pattern: /instagram\.com\/stories\/([A-Za-z0-9_.]+)/i, label: 'Stories', extractUsername: 1 },
  { type: 'post', pattern: /instagram\.com\/p\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1 },
  { type: 'live', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1 },
  { type: 'profile', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1 },
];

const youtubeRules: TypeRule[] = [
  { type: 'comment', pattern: /[&?]lc=([A-Za-z0-9_-]+)/i, label: 'Комментарий', extractId: 1 },
  { type: 'shorts', pattern: /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i, label: 'Shorts', extractId: 1 },
  { type: 'live', pattern: /youtube\.com\/live\/([A-Za-z0-9_-]+)/i, label: 'Прямой эфир', extractId: 1 },
  { type: 'playlist', pattern: /youtube\.com\/playlist\?list=([A-Za-z0-9_-]+)/i, label: 'Плейлист', extractId: 1 },
  { type: 'video', pattern: /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1 },
  { type: 'video', pattern: /youtu\.be\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1 },
  { type: 'channel', pattern: /youtube\.com\/@([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1 },
  { type: 'channel', pattern: /youtube\.com\/channel\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractId: 1 },
  { type: 'channel', pattern: /youtube\.com\/user\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractUsername: 1 },
  { type: 'post', pattern: /youtube\.com\/post\/([A-Za-z0-9_-]+)/i, label: 'Пост в сообществе', extractId: 1 },
];

const tiktokRules: TypeRule[] = [
  { type: 'video', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/video\/(\d+)/i, label: 'Видео', extractUsername: 1, extractId: 2 },
  { type: 'video', pattern: /vm\.tiktok\.com\/([A-Za-z0-9]+)/i, label: 'Видео (короткая)', extractId: 1 },
  { type: 'live', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1 },
  { type: 'profile', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1 },
];

const telegramRules: TypeRule[] = [
  { type: 'post', pattern: /t\.me\/([A-Za-z0-9_]+)\/(\d+)\?comment=(\d+)/i, label: 'Комментарий', extractUsername: 1, extractId: 3 },
  { type: 'post', pattern: /t\.me\/c\/(\d+)\/(\d+)/i, label: 'Пост (приватный)', extractId: 2 },
  { type: 'post', pattern: /t\.me\/([A-Za-z0-9_]+)\/(\d+)/i, label: 'Пост', extractUsername: 1, extractId: 2 },
  { type: 'invite', pattern: /t\.me\/(?:\+|joinchat\/)([A-Za-z0-9_-]+)/i, label: 'Инвайт-ссылка', extractId: 1 },
  { type: 'story', pattern: /t\.me\/s\/([A-Za-z0-9_]+)\/(\d+)/i, label: 'Stories', extractUsername: 1, extractId: 2 },
  { type: 'boost', pattern: /t\.me\/([A-Za-z0-9_]+)\?boost/i, label: 'Буст канала', extractUsername: 1 },
  { type: 'stars', pattern: /t\.me\/invoice\/([A-Za-z0-9_-]+)/i, label: 'Оплата Stars', extractId: 1 },
  { type: 'channel', pattern: /t\.me\/([A-Za-z0-9_]{5,})\/?$/i, label: 'Канал / Группа', extractUsername: 1 },
];

const vkRules: TypeRule[] = [
  { type: 'comment', pattern: /vk\.com\/wall(-?\d+_\d+)\?reply=(\d+)/i, label: 'Комментарий', extractId: 2 },
  { type: 'post', pattern: /vk\.com\/wall(-?\d+_\d+)/i, label: 'Пост', extractId: 1 },
  { type: 'photo', pattern: /z=photo(-?\d+_\d+)/i, label: 'Фото (альбом)', extractId: 1 },
  { type: 'photo', pattern: /vk\.com\/photo(-?\d+_\d+)/i, label: 'Фото', extractId: 1 },
  { type: 'video', pattern: /vk\.com\/video\/playlist\/(-?\d+_\d+)/i, label: 'Плейлист видео', extractId: 1 },
  { type: 'video', pattern: /vk\.com\/video(-?\d+_\d+)/i, label: 'Видео', extractId: 1 },
  { type: 'reel', pattern: /vk\.com\/clip(-?\d+_\d+)/i, label: 'Клип', extractId: 1 },
  { type: 'audio', pattern: /vk\.com\/audio_playlist(-?\d+_\d+)/i, label: 'Плейлист', extractId: 1 },
  { type: 'audio', pattern: /vk\.com\/music\/playlist\/(-?\d+_\d+)/i, label: 'Плейлист', extractId: 1 },
  { type: 'audio', pattern: /vk\.com\/audio(-?\d+_\d+)/i, label: 'Аудиозапись', extractId: 1 },
  { type: 'podcast', pattern: /vk\.com\/podcast(-?\d+_\d+)/i, label: 'Подкаст', extractId: 1 },
  { type: 'product', pattern: /vk\.com\/product(-?\d+_\d+)/i, label: 'Товар', extractId: 1 },
  { type: 'product', pattern: /vk\.com\/market(-\d+)\?w=product(-?\d+_\d+)/i, label: 'Товар', extractId: 2 },
  { type: 'story', pattern: /vk\.com\/story(-?\d+_\d+)/i, label: 'История', extractId: 1 },
  { type: 'poll', pattern: /vk\.com\/poll(-?\d+_\d+)/i, label: 'Опрос', extractId: 1 },
  { type: 'channel', pattern: /vk\.com\/(club|public|event)(\d+)/i, label: 'Сообщество', extractId: 2 },
  { type: 'profile', pattern: /vk\.com\/id(\d+)/i, label: 'Профиль', extractId: 1 },
  { type: 'profile', pattern: /vk\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1 },
];

const twitchRules: TypeRule[] = [
  { type: 'reel', pattern: /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/i, label: 'Клип', extractId: 1 },
  { type: 'reel', pattern: /twitch\.tv\/[^\/]+\/clip\/([A-Za-z0-9_-]+)/i, label: 'Клип', extractId: 1 },
  { type: 'video', pattern: /twitch\.tv\/videos\/(\d+)/i, label: 'Видео (VOD)', extractId: 1 },
  { type: 'channel', pattern: /twitch\.tv\/([A-Za-z0-9_]{3,})\/?$/i, label: 'Канал', extractUsername: 1 },
];

const vkPlayRules: TypeRule[] = [
  { type: 'channel', pattern: /vkplay\.live\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractUsername: 1 },
  { type: 'channel', pattern: /live\.vkvideo\.ru\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractUsername: 1 },
];

const dzenRules: TypeRule[] = [
  { type: 'video', pattern: /dzen\.ru\/video\/watch\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1 },
  { type: 'shorts', pattern: /dzen\.ru\/shorts\/([A-Za-z0-9_-]+)/i, label: 'Ролик', extractId: 1 },
  { type: 'article', pattern: /dzen\.ru\/a\/([A-Za-z0-9_-]+)/i, label: 'Статья', extractId: 1 },
  { type: 'channel', pattern: /dzen\.ru\/([a-z0-9._-]+)/i, label: 'Канал', extractUsername: 1 },
];
const okRules: TypeRule[] = [
  { type: 'post', pattern: /ok\.ru\/group\/\d+\/topic\/(\d+)/i, label: 'Тема', extractId: 1 },
  { type: 'profile', pattern: /ok\.ru\/profile\/(\d+)/i, label: 'Профиль', extractId: 1 },
  { type: 'channel', pattern: /ok\.ru\/group\/(\d+)/i, label: 'Группа', extractId: 1 },
  { type: 'video', pattern: /ok\.ru\/video\/(\d+)/i, label: 'Видео', extractId: 1 },
];

const likeeRules: TypeRule[] = [
  { type: 'video', pattern: /likee\.video\/v\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1 },
  { type: 'profile', pattern: /likee\.video\/@([a-zA-Z0-9_.]+)/i, label: 'Профиль', extractUsername: 1 },
  { type: 'profile', pattern: /l\.likee\.video\/p\/([A-Za-z0-9_-]+)/i, label: 'Профиль (Share)', extractId: 1 },
  { type: 'video', pattern: /l\.likee\.video\/v\/([A-Za-z0-9_-]+)/i, label: 'Видео (Share)', extractId: 1 },
];

const threadsRules: TypeRule[] = [
  { type: 'post', pattern: /threads\.net\/@[^\/]+\/post\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1 },
  { type: 'profile', pattern: /threads\.net\/@([a-zA-Z0-9_.]+)/i, label: 'Профиль', extractUsername: 1 },
];

const facebookRules: TypeRule[] = [
  { type: 'reel', pattern: /facebook\.com\/reel\/(\d+)/i, label: 'Reels', extractId: 1 },
  { type: 'video', pattern: /facebook\.com\/watch\/\?v=(\d+)/i, label: 'Видео', extractId: 1 },
  { type: 'post', pattern: /facebook\.com\/[^\/]+\/posts\/(\d+)/i, label: 'Пост', extractId: 1 },
  { type: 'post', pattern: /facebook\.com\/permalink\.php\?story_fbid=(\d+)/i, label: 'Пост', extractId: 1 },
  { type: 'profile', pattern: /facebook\.com\/profile\.php\?id=(\d+)/i, label: 'Профиль', extractId: 1 },
  { type: 'profile', pattern: /facebook\.com\/([a-zA-Z0-9.]+)\/?$/i, label: 'Профиль/Страница', extractUsername: 1 },
];

const xRules: TypeRule[] = [
  { type: 'post', pattern: /(x|twitter)\.com\/[^\/]+\/status\/(\d+)/i, label: 'Пост (Твит)', extractId: 2 },
  { type: 'profile', pattern: /(x|twitter)\.com\/([a-zA-Z0-9_]{1,15})\/?$/i, label: 'Профиль', extractUsername: 2 },
];

const rulesByPlatform: Record<string, TypeRule[]> = {
  instagram: instagramRules,
  youtube: youtubeRules,
  tiktok: tiktokRules,
  telegram: telegramRules,
  vk: vkRules,
  twitch: twitchRules,
  vkplay: vkPlayRules,
  dzen: dzenRules,
  ok: okRules,
  likee: likeeRules,
  threads: threadsRules,
  facebook: facebookRules,
  x: xRules,
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
  group: 'Сообщество',
  wall: 'Пост',
  photo: 'Фото',
  invite: 'Инвайт-ссылка',
  comment: 'Комментарий',
  boost: 'Буст канала',
  product: 'Товар',
  stars: 'Telegram Stars',
  audio: 'Аудиозапись',
  podcast: 'Подкаст',
  article: 'Статья',
  poll: 'Опрос',
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
  if (rules) {
    for (const rule of rules) {
      const match = url.match(rule.pattern);
      if (match) {
        const username = rule.extractUsername ? match[rule.extractUsername] : undefined;
        const contentId = rule.extractId ? match[rule.extractId] : undefined;
        if (username && ['explore', 'accounts', 'about', 'settings', 'direct', 'reels'].includes(username.toLowerCase())) {
          continue;
        }
        return {
          platform,
          linkType: rule.type,
          username,
          contentId,
          label: rule.label,
          raw: url,
          confidence: rule.pattern.source.includes('^') ? 'high' : 'medium'
        };
      }
    }
  }

  return { platform, linkType: 'unknown', label: 'Ссылка', raw: url, confidence: 'low' };
}

/**
 * Analyze link with DB patterns as secondary source.
 * First tries hardcoded rules, then DB patterns.
 */
export function analyzeLinkWithDb(url: string, dbPatterns: DbLinkPattern[]): LinkAnalysis | null {
  // 1. Try hardcoded analysis first
  const hardcoded = analyzeLink(url);
  if (hardcoded) return hardcoded;

  // 2. Try DB patterns
  for (const dp of dbPatterns) {
    try {
      const re = new RegExp(dp.pattern, 'i');
      const match = url.match(re);
      if (match) {
        const username = dp.extract_username_group ? match[dp.extract_username_group] : undefined;
        const contentId = dp.extract_id_group ? match[dp.extract_id_group] : undefined;
        return {
          platform: dp.platform,
          linkType: dp.link_type as LinkType,
          username,
          contentId,
          label: dp.label,
          raw: url,
          categoryId: dp.category_id || undefined,
          confidence: 'high',
        };
      }
    } catch {
      // invalid regex — skip
    }
  }

  return null;
}

/**
 * Returns the recommended category ID suffix based on link type.
 */
const linkTypeToCategory: Record<LinkType, string[]> = {
  profile: ['followers', 'subs', 'members', 'friends'],
  post: ['likes', 'comments', 'votes', 'views', 'reactions'],
  reel: ['views', 'likes'],
  story: ['views'],
  video: ['views', 'likes'],
  shorts: ['views', 'likes'],
  channel: ['subs', 'members', 'followers', 'friends'],
  playlist: ['views'],
  live: ['views', 'followers', 'subs'],
  group: ['subs', 'members'],
  wall: ['likes', 'reposts', 'comments'],
  photo: ['likes'],
  invite: ['subs', 'members'],
  comment: ['likes', 'comments'],
  boost: ['boost'],
  product: ['likes'],
  stars: ['stars'],
  audio: ['plays'],
  podcast: ['plays', 'likes'],
  article: ['likes', 'views', 'readings'],
  poll: ['votes', 'poll'],
  unknown: [],
};

export function getRecommendedCategoryIds(analysis: LinkAnalysis | null, categories: Category[]): string[] {
  if (!analysis) return [];

  // High confidence via categoryId (direct DB pattern match)
  if (analysis.categoryId && analysis.confidence === 'high') {
    const directHit = categories.find(c => c.id === analysis.categoryId);
    if (directHit) return [directHit.id];
  }

  const keywords = linkTypeToCategory[analysis.linkType as LinkType] || [];
  if (keywords.length === 0) return [];

  const matches = categories
    .filter((cat) => keywords.some((kw) => cat.id.toLowerCase().includes(kw)))
    .map((cat) => cat.id);

  return matches;
}

/**
 * Returns whether the category list should be filtered (Strict Mode) 
 * or if we should show all with highlights (Ambiguous Mode).
 */
export function isConfidenceReliable(analysis: LinkAnalysis | null): boolean {
  if (!analysis) return false;
  return analysis.confidence === 'high';
}

export const platformNames: Record<string, string> = {
  instagram: 'Instagram',
  youtube: 'YouTube',
  tiktok: 'TikTok',
  telegram: 'Telegram',
  vk: 'ВКонтакте',
  dzen: 'Дзен',
  twitch: 'Twitch',
  ok: 'Одноклассники',
  likee: 'Likee',
  threads: 'Threads',
  facebook: 'Facebook',
  x: 'X (Twitter)',
  traffic: 'Трафик',
  max: 'МАКС',
  vkplay: 'VK Play Live',
};

export interface PlatformBranding {
  color: string;
  bg: string;
  border: string;
  shadow: string;
  lightBg: string;
  ring: string;
}

export const platformBranding: Record<string, PlatformBranding> = {
  instagram: {
    color: 'text-pink-600',
    bg: 'bg-gradient-to-r from-pink-500 via-rose-500 to-orange-400',
    border: 'border-pink-400/50',
    shadow: 'shadow-pink-500/20',
    lightBg: 'bg-pink-50',
    ring: 'ring-pink-500'
  },
  youtube: {
    color: 'text-red-600',
    bg: 'bg-red-500',
    border: 'border-red-400/50',
    shadow: 'shadow-red-500/20',
    lightBg: 'bg-red-50',
    ring: 'ring-red-500'
  },
  tiktok: {
    color: 'text-slate-700',
    bg: 'bg-gradient-to-r from-slate-800 to-slate-700',
    border: 'border-slate-600/50',
    shadow: 'shadow-slate-500/20',
    lightBg: 'bg-slate-50',
    ring: 'ring-slate-800'
  },
  telegram: {
    color: 'text-sky-600',
    bg: 'bg-sky-500',
    border: 'border-sky-400/50',
    shadow: 'shadow-sky-500/20',
    lightBg: 'bg-sky-50',
    ring: 'ring-sky-500'
  },
  vk: {
    color: 'text-blue-600',
    bg: 'bg-blue-600',
    border: 'border-blue-400/50',
    shadow: 'shadow-blue-500/20',
    lightBg: 'bg-blue-50',
    ring: 'ring-blue-600'
  },
  dzen: {
    color: 'text-orange-600',
    bg: 'bg-gradient-to-r from-orange-500 to-amber-500',
    border: 'border-orange-400/50',
    shadow: 'shadow-orange-500/20',
    lightBg: 'bg-orange-50',
    ring: 'ring-orange-500'
  },
  twitch: {
    color: 'text-purple-600',
    bg: 'bg-[#9146FF]',
    border: 'border-purple-400/50',
    shadow: 'shadow-purple-500/20',
    lightBg: 'bg-purple-50',
    ring: 'ring-purple-500'
  },
  ok: {
    color: 'text-orange-500',
    bg: 'bg-[#EE8208]',
    border: 'border-orange-400/50',
    shadow: 'shadow-orange-500/20',
    lightBg: 'bg-orange-50',
    ring: 'ring-orange-500'
  },
  likee: {
    color: 'text-rose-500',
    bg: 'bg-gradient-to-r from-rose-500 to-pink-500',
    border: 'border-rose-400/50',
    shadow: 'shadow-rose-500/20',
    lightBg: 'bg-rose-50',
    ring: 'ring-rose-500'
  },
  threads: {
    color: 'text-slate-900',
    bg: 'bg-black',
    border: 'border-slate-800/50',
    shadow: 'shadow-slate-500/20',
    lightBg: 'bg-slate-50',
    ring: 'ring-black'
  },
  vkplay: {
    color: 'text-blue-500',
    bg: 'bg-[#0077FF]',
    border: 'border-blue-400/50',
    shadow: 'shadow-blue-500/20',
    lightBg: 'bg-blue-50',
    ring: 'ring-blue-600'
  },
  facebook: {
    color: 'text-blue-700',
    bg: 'bg-[#1877F2]',
    border: 'border-blue-500/50',
    shadow: 'shadow-blue-600/20',
    lightBg: 'bg-blue-50',
    ring: 'ring-blue-700'
  },
  x: {
    color: 'text-slate-900',
    bg: 'bg-black',
    border: 'border-slate-800/50',
    shadow: 'shadow-slate-500/20',
    lightBg: 'bg-slate-50',
    ring: 'ring-black'
  },
  default: {
    color: 'text-primary',
    bg: 'bg-primary',
    border: 'border-primary/50',
    shadow: 'shadow-primary/20',
    lightBg: 'bg-primary/5',
    ring: 'ring-primary'
  }
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
    { id: 'tt-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры видео для попадания в рекомендацию', serviceCount: 7, highlight: 'Топ продаж' },
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
    { id: 'vk-votes', name: 'Голоса в опросе', icon: 'check-square', description: 'Голоса в опросах и конкурсах', serviceCount: 5, highlight: 'Новое' },
  ],
  twitch: [
    { id: 'tw-followers', name: 'Подписчики', icon: 'users', description: 'Рост фолловеров канала', serviceCount: 5, highlight: 'Популярное' },
    { id: 'tw-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры стримов и видео', serviceCount: 4, highlight: 'Топ продаж' },
  ],
  vkplay: [
    { id: 'vkp-followers', name: 'Подписчики', icon: 'users', description: 'Подписчики на канал VK Play', serviceCount: 3, highlight: 'Новое' },
    { id: 'vkp-views', name: 'Просмотры', icon: 'eye', description: 'Зрители на стрим', serviceCount: 2, highlight: 'Топ' },
  ],
  dzen: [
    { id: 'dz-subs', name: 'Подписчики', icon: 'bell', description: 'Подписчики на Дзен-канал', serviceCount: 5, highlight: 'Популярное' },
    { id: 'dz-likes', name: 'Лайки', icon: 'thumbs-up', description: 'Лайки на статьи и видео', serviceCount: 4, highlight: 'Топ продаж' },
    { id: 'dz-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры видео и роликов', serviceCount: 6, highlight: 'Быстрый старт' },
  ],
  ok: [
    { id: 'ok-subs', name: 'Подписчики', icon: 'users', description: 'Участники в группу ОК', serviceCount: 7, highlight: 'Популярное' },
    { id: 'ok-friends', name: 'Друзья', icon: 'user-plus', description: 'Друзья в профиль ОК', serviceCount: 5, highlight: 'Топ продаж' },
    { id: 'ok-likes', name: 'Классы', icon: 'thumbs-up', description: 'Классы на посты и фото', serviceCount: 8, highlight: 'Быстрый старт' },
    { id: 'ok-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры видео', serviceCount: 4, highlight: 'Premium' },
  ],
  likee: [
    { id: 'lk-followers', name: 'Подписчики', icon: 'users', description: 'Подписчики Likee', serviceCount: 3, highlight: 'Топ' },
    { id: 'lk-likes', name: 'Лайки', icon: 'thumbs-up', description: 'Лайки на видео Likee', serviceCount: 5, highlight: 'Быстро' },
    { id: 'lk-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры видео Likee', serviceCount: 4, highlight: 'Новое' },
  ],
  threads: [
    { id: 'th-followers', name: 'Подписчики', icon: 'users', description: 'Подписчики Threads', serviceCount: 2, highlight: 'Новое' },
    { id: 'th-likes', name: 'Лайки', icon: 'thumbs-up', description: 'Лайки на посты Threads', serviceCount: 3, highlight: 'Хит' },
  ],
  facebook: [
    { id: 'fb-followers', name: 'Подписчики', icon: 'users', description: 'Подписчики на профиль/страницу', serviceCount: 6, highlight: 'Топ' },
    { id: 'fb-likes', name: 'Лайки', icon: 'thumbs-up', description: 'Лайки на посты и фото', serviceCount: 8, highlight: 'Быстро' },
    { id: 'fb-reels', name: 'Просмотры Reels', icon: 'play', description: 'Просмотры на Reels', serviceCount: 4, highlight: 'Новое' },
  ],
  x: [
    { id: 'x-followers', name: 'Подписчики', icon: 'users', description: 'Подписчики в профиль X', serviceCount: 5, highlight: 'Топ' },
    { id: 'x-likes', name: 'Лайки', icon: 'thumbs-up', description: 'Лайки на посты (Твиты)', serviceCount: 7, highlight: 'Популярное' },
    { id: 'x-views', name: 'Просмотры', icon: 'eye', description: 'Просмотры на посты', serviceCount: 4, highlight: 'Новое' },
  ],
};

export const servicesByCategory: Record<string, Service[]> = {
  // Hardcoded fallbacks removed in favor of Database synchronization.
  // These keys are kept for type compatibility during transition.
  'ig-likes': [],
  'ig-followers': [],
  'ig-views': [],
  'ig-comments': [],
};

export function getServicesForCategory(categoryId: string): Service[] {
  // If database fetch fails, show a message instead of fake data
  return servicesByCategory[categoryId] || [
    { id: 'sync-required', name: 'Синхронизация...', description: 'Пожалуйста, выполните синхронизацию в панели управления', price: '—', minOrder: 0, maxOrder: 0, speed: '—' },
  ];
}

// =============================================================================
// RE-EXPORT FROM NEW MODULES
// =============================================================================

export {
  ProviderAPIClient,
  ServiceClassifier,
  NETWORK_NAMES,
  NETWORK_COLORS,
  NETWORK_ICONS,
  ACTIVITY_NAMES,
  type ProviderConfig,
  type ProviderService,
  type ImportedService,
  type ImportResult,
  SOCIAL_NETWORKS,
  ACTIVITY_TYPES,
} from './smm-provider-import';

export {
  LinkAnalyzer as EnhancedLinkAnalyzer,
  getServiceRequirements,
  isValidForNetwork,
  getSupportedNetworks,
  getLinkTypesForNetwork,
  type LinkAnalysisResult,
  type LinkChoice,
  type ServiceRequirement,
  type ServiceLinkRequirement,
} from './link-analyzer';

export {
  SOCIAL_NETWORKS_LIST,
  ACTIVITY_TYPES_LIST,
  NETWORK_ACTIVITIES,
  getNetworkById,
  getActivityById,
  getPopularNetworks,
  getActivitiesForNetwork,
  detectNetworkFromUrl,
  getNetworkName,
  getActivityName,
  NETWORK_NAMES_RU,
  ACTIVITY_NAMES_RU,
  type SocialNetwork,
  type ActivityType,
} from './unified-categories';
