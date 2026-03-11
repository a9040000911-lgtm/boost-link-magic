/**
 * Link Analyzer Module
 * Handles URL normalization, link type detection, and service requirements
 * 
 * Updated: 70+ domain aliases, improved pattern matching, Cyrillic support
 */

// =============================================================================
// TYPES
// =============================================================================

export interface LinkAnalysisResult {
  isValid: boolean;
  original: string;
  normalized: string;
  
  // Detection
  networkId: string | null;
  networkName: string | null;
  linkType: string | null;
  linkTypeName: string | null;
  
  // Extracted data
  username?: string;
  contentId?: string;
  
  // Warnings and requirements
  warnings: string[];
  requiresUserChoice: boolean;
  choices?: LinkChoice[];
  
  // Service matching
  suggestedCategories: string[];
  matchingServiceTypes: string[];
}

export interface LinkChoice {
  id: string;
  label: string;
  description: string;
  linkType: string;
  warning?: string;
}

export interface ServiceRequirement {
  type: 'warning' | 'error' | 'info' | 'choice';
  message: string;
  action?: string;
}

export interface ServiceLinkRequirement {
  expectedLinkTypes: string[];
  supportsClosed: boolean;
  supportsOpen: boolean;
  supportsGroup: boolean;
  requiresBotAdmin: boolean;
  allowsMultipleLinks: boolean;
  requirements: ServiceRequirement[];
}

// =============================================================================
// URL NORMALIZATION - 70+ DOMAIN ALIASES
// =============================================================================

/**
 * Domain aliases for social networks
 * Maps all known domains to their canonical network
 */
const DOMAIN_ALIASES: Record<string, { networkId: string; type: 'main' | 'mobile' | 'short' | 'regional' | 'subdomain' }> = {
  // Instagram
  'instagram.com': { networkId: 'instagram', type: 'main' },
  'instagr.am': { networkId: 'instagram', type: 'short' },
  'www.instagram.com': { networkId: 'instagram', type: 'subdomain' },
  
  // YouTube
  'youtube.com': { networkId: 'youtube', type: 'main' },
  'youtu.be': { networkId: 'youtube', type: 'short' },
  'm.youtube.com': { networkId: 'youtube', type: 'mobile' },
  'www.youtube.com': { networkId: 'youtube', type: 'subdomain' },
  'music.youtube.com': { networkId: 'youtube', type: 'subdomain' },
  'gaming.youtube.com': { networkId: 'youtube', type: 'subdomain' },
  
  // TikTok
  'tiktok.com': { networkId: 'tiktok', type: 'main' },
  'vm.tiktok.com': { networkId: 'tiktok', type: 'short' },
  'vt.tiktok.com': { networkId: 'tiktok', type: 'short' },
  'm.tiktok.com': { networkId: 'tiktok', type: 'mobile' },
  'www.tiktok.com': { networkId: 'tiktok', type: 'subdomain' },
  
  // Telegram
  't.me': { networkId: 'telegram', type: 'main' },
  'telegram.me': { networkId: 'telegram', type: 'main' },
  'telegram.org': { networkId: 'telegram', type: 'main' },
  'telegra.ph': { networkId: 'telegram', type: 'regional' },
  'telesco.pe': { networkId: 'telegram', type: 'regional' },
  
  // VK
  'vk.com': { networkId: 'vk', type: 'main' },
  'vkontakte.ru': { networkId: 'vk', type: 'regional' },
  'm.vk.com': { networkId: 'vk', type: 'mobile' },
  'vk.ru': { networkId: 'vk', type: 'main' },
  
  // Facebook
  'facebook.com': { networkId: 'facebook', type: 'main' },
  'fb.com': { networkId: 'facebook', type: 'short' },
  'm.facebook.com': { networkId: 'facebook', type: 'mobile' },
  'www.facebook.com': { networkId: 'facebook', type: 'subdomain' },
  'fb.watch': { networkId: 'facebook', type: 'short' },
  'facebook.watch': { networkId: 'facebook', type: 'short' },
  
  // Twitter/X
  'twitter.com': { networkId: 'twitter', type: 'main' },
  'x.com': { networkId: 'twitter', type: 'main' },
  't.co': { networkId: 'twitter', type: 'short' },
  'mobile.twitter.com': { networkId: 'twitter', type: 'mobile' },
  'www.twitter.com': { networkId: 'twitter', type: 'subdomain' },
  
  // Twitch
  'twitch.tv': { networkId: 'twitch', type: 'main' },
  'clips.twitch.tv': { networkId: 'twitch', type: 'regional' },
  'm.twitch.tv': { networkId: 'twitch', type: 'mobile' },
  'www.twitch.tv': { networkId: 'twitch', type: 'subdomain' },
  
  // Spotify
  'spotify.com': { networkId: 'spotify', type: 'main' },
  'open.spotify.com': { networkId: 'spotify', type: 'main' },
  'spoti.fi': { networkId: 'spotify', type: 'short' },
  'play.spotify.com': { networkId: 'spotify', type: 'regional' },
  
  // Discord
  'discord.gg': { networkId: 'discord', type: 'main' },
  'discord.com': { networkId: 'discord', type: 'main' },
  'discordapp.com': { networkId: 'discord', type: 'regional' },
  'disboard.org': { networkId: 'discord', type: 'regional' },
  
  // Одноклассники
  'ok.ru': { networkId: 'odnoklassniki', type: 'main' },
  'odnoklassniki.ru': { networkId: 'odnoklassniki', type: 'main' },
  'www.ok.ru': { networkId: 'odnoklassniki', type: 'subdomain' },
  'm.ok.ru': { networkId: 'odnoklassniki', type: 'mobile' },
  
  // Rutube
  'rutube.ru': { networkId: 'rutube', type: 'main' },
  'www.rutube.ru': { networkId: 'rutube', type: 'subdomain' },
  
  // Яндекс Дзен
  'dzen.ru': { networkId: 'yandex_zen', type: 'main' },
  'zen.yandex.ru': { networkId: 'yandex_zen', type: 'regional' },
  'zen.yandex.com': { networkId: 'yandex_zen', type: 'regional' },
  
  // Kick
  'kick.com': { networkId: 'kick', type: 'main' },
  'www.kick.com': { networkId: 'kick', type: 'subdomain' },
  
  // Threads
  'threads.net': { networkId: 'threads', type: 'main' },
  'www.threads.net': { networkId: 'threads', type: 'subdomain' },
  
  // LinkedIn
  'linkedin.com': { networkId: 'linkedin', type: 'main' },
  'lnkd.in': { networkId: 'linkedin', type: 'short' },
  'www.linkedin.com': { networkId: 'linkedin', type: 'subdomain' },
  
  // Pinterest
  'pinterest.com': { networkId: 'pinterest', type: 'main' },
  'pin.it': { networkId: 'pinterest', type: 'short' },
  'www.pinterest.com': { networkId: 'pinterest', type: 'subdomain' },
  'ru.pinterest.com': { networkId: 'pinterest', type: 'regional' },
  
  // Snapchat
  'snapchat.com': { networkId: 'snapchat', type: 'main' },
  'www.snapchat.com': { networkId: 'snapchat', type: 'subdomain' },
  'snap.com': { networkId: 'snapchat', type: 'short' },
  
  // WhatsApp
  'whatsapp.com': { networkId: 'whatsapp', type: 'main' },
  'chat.whatsapp.com': { networkId: 'whatsapp', type: 'regional' },
  'wa.me': { networkId: 'whatsapp', type: 'short' },
  'api.whatsapp.com': { networkId: 'whatsapp', type: 'regional' },
  
  // OnlyFans
  'onlyfans.com': { networkId: 'onlyfans', type: 'main' },
  'www.onlyfans.com': { networkId: 'onlyfans', type: 'subdomain' },
  
  // Truth Social
  'truthsocial.com': { networkId: 'truth_social', type: 'main' },
  
  // Rumble
  'rumble.com': { networkId: 'rumble', type: 'main' },
  'www.rumble.com': { networkId: 'rumble', type: 'subdomain' },
};

// =============================================================================
// LINK TYPE DETECTION RULES
// =============================================================================

interface LinkTypeRule {
  type: string;
  pattern: RegExp;
  label: string;
  extractUsername?: number;
  extractId?: number;
  suggestedCategories: string[];
}

const LINK_TYPE_RULES: Record<string, LinkTypeRule[]> = {
  instagram: [
    { type: 'reel', pattern: /instagram\.com\/reels?\/([A-Za-z0-9_-]+)/i, label: 'Reels', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'story', pattern: /instagram\.com\/stories\/([A-Za-z0-9_.]+)/i, label: 'Stories', extractUsername: 1, suggestedCategories: ['views'] },
    { type: 'igtv', pattern: /instagram\.com\/tv\/([A-Za-z0-9_-]+)/i, label: 'IGTV', extractId: 1, suggestedCategories: ['views'] },
    { type: 'post', pattern: /instagram\.com\/p\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1, suggestedCategories: ['likes', 'comments', 'saves'] },
    { type: 'post', pattern: /instagram\.com\/reel\/([A-Za-z0-9_-]+)/i, label: 'Reels', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'highlight', pattern: /instagram\.com\/stories\/highlights\/([A-Za-z0-9_-]+)/i, label: 'Highlights', extractId: 1, suggestedCategories: ['views'] },
    { type: 'live', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1, suggestedCategories: ['live_viewers'] },
    { type: 'profile', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  youtube: [
    { type: 'shorts', pattern: /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i, label: 'Shorts', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'live', pattern: /youtube\.com\/live\/([A-Za-z0-9_-]+)/i, label: 'Прямой эфир', extractId: 1, suggestedCategories: ['views', 'live_viewers'] },
    { type: 'video', pattern: /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes', 'comments'] },
    { type: 'video', pattern: /youtu\.be\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'video', pattern: /youtube\.com\/embed\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views'] },
    { type: 'playlist', pattern: /youtube\.com\/playlist\?list=([A-Za-z0-9_-]+)/i, label: 'Плейлист', extractId: 1, suggestedCategories: ['views'] },
    { type: 'channel', pattern: /youtube\.com\/@([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'channel', pattern: /youtube\.com\/channel\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['followers'] },
    { type: 'channel', pattern: /youtube\.com\/c\/([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'channel', pattern: /youtube\.com\/user\/([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  tiktok: [
    { type: 'video', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/video\/(\d+)/i, label: 'Видео', extractUsername: 1, extractId: 2, suggestedCategories: ['views', 'likes', 'shares'] },
    { type: 'video', pattern: /vm\.tiktok\.com\/([A-Za-z0-9]+)/i, label: 'Видео (короткая)', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'video', pattern: /vt\.tiktok\.com\/([A-Za-z0-9]+)/i, label: 'Видео (короткая)', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'live', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1, suggestedCategories: ['live_viewers'] },
    { type: 'profile', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  telegram: [
    // Private invite links
    { type: 'invite', pattern: /t\.me\/\+([A-Za-z0-9_-]+)/i, label: 'Инвайт-ссылка', extractId: 1, suggestedCategories: ['members'] },
    { type: 'invite', pattern: /t\.me\/joinchat\/([A-Za-z0-9_-]+)/i, label: 'Инвайт-ссылка', extractId: 1, suggestedCategories: ['members'] },
    // Boost
    { type: 'boost', pattern: /t\.me\/([A-Za-z0-9_]+)\?boost/i, label: 'Буст', extractUsername: 1, suggestedCategories: ['boosts'] },
    // Post with username and ID
    { type: 'post', pattern: /t\.me\/([A-Za-z0-9_]+)\/(\d+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['views', 'reactions'] },
    // Username with s parameter (story)
    { type: 'story', pattern: /t\.me\/([A-Za-z0-9_]+)\?s=(\d+)/i, label: 'Stories', extractUsername: 1, extractId: 2, suggestedCategories: ['views'] },
    // Channel/Group
    { type: 'channel', pattern: /t\.me\/([A-Za-z0-9_]+)\/?$/i, label: 'Канал/Группа', extractUsername: 1, suggestedCategories: ['members'] },
    // Bot
    { type: 'bot', pattern: /t\.me\/([A-Za-z0-9_]+)bot\b/i, label: 'Бот', extractUsername: 1, suggestedCategories: [] },
    // Sticker pack
    { type: 'stickers', pattern: /t\.me\/addstickers\/([A-Za-z0-9_]+)/i, label: 'Стикеры', extractId: 1, suggestedCategories: [] },
  ],
  
  vk: [
    { type: 'clip', pattern: /vk\.com\/clip(-?\d+_\d+)/i, label: 'Клип', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'video', pattern: /vk\.com\/video(-?\d+_\d+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'wall', pattern: /vk\.com\/wall(-?\d+_\d+)/i, label: 'Запись', extractId: 1, suggestedCategories: ['likes', 'comments', 'shares'] },
    { type: 'photo', pattern: /vk\.com\/photo(-?\d+_\d+)/i, label: 'Фото', extractId: 1, suggestedCategories: ['likes'] },
    { type: 'album', pattern: /vk\.com\/album(-?\d+_\d+)/i, label: 'Альбом', extractId: 1, suggestedCategories: ['likes'] },
    { type: 'market', pattern: /vk\.com\/market(-?\d+_\d+)/i, label: 'Товар', extractId: 1, suggestedCategories: ['likes'] },
    { type: 'story', pattern: /vk\.com\/story(-?\d+_\d+)/i, label: 'Stories', extractId: 1, suggestedCategories: ['views'] },
    { type: 'group', pattern: /vk\.com\/(club|public|group)(\d+)/i, label: 'Сообщество', extractId: 2, suggestedCategories: ['members'] },
    { type: 'event', pattern: /vk\.com\/event(\d+)/i, label: 'Событие', extractId: 1, suggestedCategories: ['members'] },
    { type: 'profile', pattern: /vk\.com\/id(\d+)/i, label: 'Профиль', extractId: 1, suggestedCategories: ['followers', 'friends'] },
    { type: 'profile', pattern: /vk\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Страница', extractUsername: 1, suggestedCategories: ['followers', 'friends'] },
  ],
  
  twitter: [
    { type: 'tweet', pattern: /twitter\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/i, label: 'Твит', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'shares', 'comments'] },
    { type: 'tweet', pattern: /x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'shares', 'comments'] },
    { type: 'space', pattern: /twitter\.com\/i\/spaces\/([A-Za-z0-9]+)/i, label: 'Space', extractId: 1, suggestedCategories: ['live_viewers'] },
    { type: 'space', pattern: /x\.com\/i\/spaces\/([A-Za-z0-9]+)/i, label: 'Space', extractId: 1, suggestedCategories: ['live_viewers'] },
    { type: 'profile', pattern: /twitter\.com\/([A-Za-z0-9_]+)\/?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /x\.com\/([A-Za-z0-9_]+)\/?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  spotify: [
    { type: 'track', pattern: /spotify\.com\/track\/([A-Za-z0-9]+)/i, label: 'Трек', extractId: 1, suggestedCategories: ['plays', 'saves'] },
    { type: 'artist', pattern: /spotify\.com\/artist\/([A-Za-z0-9]+)/i, label: 'Исполнитель', extractId: 1, suggestedCategories: ['followers', 'monthly_listeners'] },
    { type: 'playlist', pattern: /spotify\.com\/playlist\/([A-Za-z0-9]+)/i, label: 'Плейлист', extractId: 1, suggestedCategories: ['followers', 'plays'] },
    { type: 'album', pattern: /spotify\.com\/album\/([A-Za-z0-9]+)/i, label: 'Альбом', extractId: 1, suggestedCategories: ['plays'] },
    { type: 'episode', pattern: /spotify\.com\/episode\/([A-Za-z0-9]+)/i, label: 'Эпизод', extractId: 1, suggestedCategories: ['plays'] },
    { type: 'show', pattern: /spotify\.com\/show\/([A-Za-z0-9]+)/i, label: 'Подкаст', extractId: 1, suggestedCategories: ['followers', 'plays'] },
  ],
  
  twitch: [
    { type: 'channel', pattern: /twitch\.tv\/([A-Za-z0-9_]+)\/?(?:\?.*)?$/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers', 'live_viewers'] },
    { type: 'clip', pattern: /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/i, label: 'Клип', extractId: 1, suggestedCategories: ['views'] },
    { type: 'clip', pattern: /twitch\.tv\/([A-Za-z0-9_]+)\/clip\/([A-Za-z0-9_-]+)/i, label: 'Клип', extractUsername: 1, extractId: 2, suggestedCategories: ['views'] },
    { type: 'video', pattern: /twitch\.tv\/videos\/(\d+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views'] },
    { type: 'video', pattern: /twitch\.tv\/([A-Za-z0-9_]+)\/v\/(\d+)/i, label: 'Видео', extractUsername: 1, extractId: 2, suggestedCategories: ['views'] },
  ],
  
  discord: [
    { type: 'invite', pattern: /discord\.gg\/([A-Za-z0-9]+)/i, label: 'Сервер', extractId: 1, suggestedCategories: ['members'] },
    { type: 'invite', pattern: /discord\.com\/invite\/([A-Za-z0-9]+)/i, label: 'Сервер', extractId: 1, suggestedCategories: ['members'] },
    { type: 'channel', pattern: /discord\.com\/channels\/(\d+)\/(\d+)/i, label: 'Канал', extractId: 2, suggestedCategories: ['members'] },
  ],
  
  facebook: [
    { type: 'video', pattern: /facebook\.com\/.*\/videos\/(\d+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'video', pattern: /fb\.watch\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'reel', pattern: /facebook\.com\/reel\/(\d+)/i, label: 'Reels', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'post', pattern: /facebook\.com\/.*\/posts\/(\d+)/i, label: 'Пост', extractId: 1, suggestedCategories: ['likes', 'comments', 'shares'] },
    { type: 'post', pattern: /facebook\.com\/permalink\.php\?story_fbid=(\d+)/i, label: 'Пост', extractId: 1, suggestedCategories: ['likes', 'comments'] },
    { type: 'group', pattern: /facebook\.com\/groups\/([A-Za-z0-9_.]+)/i, label: 'Группа', extractId: 1, suggestedCategories: ['members'] },
    { type: 'page', pattern: /facebook\.com\/([A-Za-z0-9_.]+)\/?$/i, label: 'Страница', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /facebook\.com\/profile\.php\?id=(\d+)/i, label: 'Профиль', extractId: 1, suggestedCategories: ['followers', 'friends'] },
  ],
  
  odnoklassniki: [
    { type: 'video', pattern: /ok\.ru\/video\/(\d+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'group', pattern: /ok\.ru\/group\/(\d+)/i, label: 'Группа', extractId: 1, suggestedCategories: ['members'] },
    { type: 'profile', pattern: /ok\.ru\/profile\/(\d+)/i, label: 'Профиль', extractId: 1, suggestedCategories: ['followers', 'friends'] },
    { type: 'profile', pattern: /ok\.ru\/([A-Za-z0-9_.]+)/i, label: 'Страница', extractUsername: 1, suggestedCategories: ['followers', 'friends'] },
  ],
  
  kick: [
    { type: 'channel', pattern: /kick\.com\/([A-Za-z0-9_]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers', 'live_viewers'] },
    { type: 'video', pattern: /kick\.com\/.*video=([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views'] },
  ],
  
  threads: [
    { type: 'post', pattern: /threads\.net\/@([A-Za-z0-9_.]+)\/post\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'comments'] },
    { type: 'post', pattern: /threads\.net\/@([A-Za-z0-9_.]+)\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'comments'] },
    { type: 'profile', pattern: /threads\.net\/@([A-Za-z0-9_.]+)/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  linkedin: [
    { type: 'company', pattern: /linkedin\.com\/company\/([A-Za-z0-9_-]+)/i, label: 'Компания', extractId: 1, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /linkedin\.com\/in\/([A-Za-z0-9_-]+)/i, label: 'Профиль', extractId: 1, suggestedCategories: ['followers'] },
    { type: 'post', pattern: /linkedin\.com\/posts\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1, suggestedCategories: ['likes', 'comments'] },
  ],
  
  pinterest: [
    { type: 'pin', pattern: /pinterest\.com\/pin\/(\d+)/i, label: 'Пин', extractId: 1, suggestedCategories: ['likes', 'saves'] },
    { type: 'board', pattern: /pinterest\.com\/([A-Za-z0-9_]+)\/([A-Za-z0-9_-]+)/i, label: 'Доска', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /pinterest\.com\/([A-Za-z0-9_]+)\/?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  snapchat: [
    { type: 'story', pattern: /snapchat\.com\/add\/([A-Za-z0-9_.]+)/i, label: 'Профиль', extractId: 1, suggestedCategories: ['followers'] },
    { type: 'spotlight', pattern: /snapchat\.com\/spotlight\/([A-Za-z0-9_-]+)/i, label: 'Spotlight', extractId: 1, suggestedCategories: ['views'] },
  ],
  
  whatsapp: [
    { type: 'group', pattern: /chat\.whatsapp\.com\/([A-Za-z0-9]+)/i, label: 'Группа', extractId: 1, suggestedCategories: ['members'] },
    { type: 'channel', pattern: /whatsapp\.com\/channel\/([A-Za-z0-9]+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['members'] },
    { type: 'contact', pattern: /wa\.me\/(\d+)/i, label: 'Контакт', extractId: 1, suggestedCategories: [] },
  ],
  
  onlyfans: [
    { type: 'profile', pattern: /onlyfans\.com\/([A-Za-z0-9_]+)/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  truth_social: [
    { type: 'post', pattern: /truthsocial\.com\/@([A-Za-z0-9_]+)\/posts\/(\d+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'shares'] },
    { type: 'profile', pattern: /truthsocial\.com\/@([A-Za-z0-9_]+)/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  rumble: [
    { type: 'video', pattern: /rumble\.com\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'channel', pattern: /rumble\.com\/c\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['followers'] },
    { type: 'user', pattern: /rumble\.com\/user\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['followers'] },
  ],
  
  rutube: [
    { type: 'video', pattern: /rutube\.ru\/video\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'channel', pattern: /rutube\.ru\/channel\/(\d+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['followers'] },
  ],
  
  yandex_zen: [
    { type: 'post', pattern: /dzen\.ru\/.*\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'channel', pattern: /dzen\.ru\/id\/(\d+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /dzen\.ru\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
};

// =============================================================================
// LINK ANALYZER CLASS
// =============================================================================

export class LinkAnalyzer {
  /**
   * Analyze a URL and extract all metadata
   */
  static analyze(url: string): LinkAnalysisResult {
    const original = url.trim();
    let normalized = original;
    const warnings: string[] = [];
    
    // Add protocol if missing
    if (!normalized.startsWith('http://') && !normalized.startsWith('https://')) {
      normalized = 'https://' + normalized;
    }
    
    try {
      const urlObj = new URL(normalized);
      const domain = urlObj.hostname.toLowerCase().replace('www.', '');
      
      // Find matching network
      const domainInfo = DOMAIN_ALIASES[domain];
      const networkId = domainInfo?.networkId || null;
      
      // Normalize mobile/short URLs
      if (domainInfo?.type === 'mobile' || domainInfo?.type === 'short') {
        normalized = this.convertToMainDomain(normalized, domain);
        warnings.push(domainInfo.type === 'mobile' 
          ? 'Мобильная версия URL автоматически преобразована' 
          : 'Короткая ссылка автоматически преобразована');
      }
      
      if (!networkId) {
        return {
          isValid: false,
          original,
          normalized,
          networkId: null,
          networkName: null,
          linkType: null,
          linkTypeName: null,
          warnings: ['Не удалось определить социальную сеть'],
          requiresUserChoice: false,
          suggestedCategories: [],
          matchingServiceTypes: [],
        };
      }
      
      const networkName = this.getNetworkName(networkId);
      
      // Detect link type
      const typeResult = this.detectLinkType(normalized, networkId);
      
      // Check for special cases (invite links, etc.)
      const specialCase = this.checkSpecialCases(normalized, networkId, typeResult?.type || null);
      
      return {
        isValid: true,
        original,
        normalized,
        networkId,
        networkName,
        linkType: specialCase?.linkType || typeResult?.type || null,
        linkTypeName: specialCase?.label || typeResult?.label || null,
        username: typeResult?.username,
        contentId: typeResult?.contentId,
        warnings,
        requiresUserChoice: specialCase?.requiresUserChoice || false,
        choices: specialCase?.choices,
        suggestedCategories: typeResult?.suggestedCategories || [],
        matchingServiceTypes: this.getServiceTypesFromCategories(typeResult?.suggestedCategories || []),
      };
      
    } catch (error) {
      return {
        isValid: false,
        original,
        normalized,
        networkId: null,
        networkName: null,
        linkType: null,
        linkTypeName: null,
        warnings: ['Некорректный формат URL'],
        requiresUserChoice: false,
        suggestedCategories: [],
        matchingServiceTypes: [],
      };
    }
  }
  
  /**
   * Detect link type from URL
   */
  private static detectLinkType(url: string, networkId: string): {
    type: string;
    label: string;
    username?: string;
    contentId?: string;
    suggestedCategories: string[];
  } | null {
    const rules = LINK_TYPE_RULES[networkId];
    if (!rules) return null;
    
    for (const rule of rules) {
      const match = url.match(rule.pattern);
      if (match) {
        const username = rule.extractUsername ? match[rule.extractUsername] : undefined;
        const contentId = rule.extractId ? match[rule.extractId] : undefined;
        
        // Skip non-profile pages (explore, settings, etc.)
        if (username && ['explore', 'accounts', 'about', 'settings', 'direct', 'reels', 
                         'hashtag', 'search', 'messages', 'notifications', 'help', 
                         'terms', 'privacy', 'login', 'signup', 'api'].includes(username.toLowerCase())) {
          continue;
        }
        
        return {
          type: rule.type,
          label: rule.label,
          username,
          contentId,
          suggestedCategories: rule.suggestedCategories,
        };
      }
    }
    
    return null;
  }
  
  /**
   * Check for special cases that require user input
   */
  private static checkSpecialCases(url: string, networkId: string, linkType: string | null): {
    linkType: string;
    label: string;
    requiresUserChoice: boolean;
    choices?: LinkChoice[];
  } | null {
    // Telegram invite links - need to know if open or closed channel
    if (networkId === 'telegram' && linkType === 'invite') {
      return {
        linkType: 'invite',
        label: 'Инвайт-ссылка',
        requiresUserChoice: true,
        choices: [
          {
            id: 'open_channel',
            label: 'Открытый канал/группа',
            description: 'Публичный канал или группа с публичной ссылкой',
            linkType: 'channel',
          },
          {
            id: 'closed_channel',
            label: 'Закрытый канал/группа',
            description: 'Приватный канал или группа, требуется добавление бота',
            linkType: 'channel',
            warning: '⚠️ Необходимо добавить бота провайдера в администраторы',
          },
        ],
      };
    }
    
    // Telegram regular channel link - ask if channel or group
    if (networkId === 'telegram' && linkType === 'channel') {
      // Could be channel or group - we assume channel by default
      // In future, could add choice for user to specify
    }
    
    return null;
  }
  
  /**
   * Convert mobile/short URLs to main domain
   */
  private static convertToMainDomain(url: string, domain: string): string {
    const urlObj = new URL(url);
    
    const replacements: Record<string, string> = {
      'm.youtube.com': 'youtube.com',
      'm.tiktok.com': 'tiktok.com',
      'm.vk.com': 'vk.com',
      'm.facebook.com': 'facebook.com',
      'm.twitch.tv': 'twitch.tv',
      'm.ok.ru': 'ok.ru',
      'youtu.be': 'youtube.com',
      'instagr.am': 'instagram.com',
    };
    
    if (replacements[domain]) {
      urlObj.hostname = replacements[domain];
    }
    
    // Handle youtu.be -> youtube.com/watch?v=...
    if (domain === 'youtu.be') {
      const videoId = urlObj.pathname.slice(1);
      urlObj.pathname = '/watch';
      urlObj.searchParams.set('v', videoId);
    }
    
    return urlObj.toString();
  }
  
  /**
   * Get network display name
   */
  private static getNetworkName(networkId: string): string {
    const names: Record<string, string> = {
      instagram: 'Instagram',
      youtube: 'YouTube',
      tiktok: 'TikTok',
      telegram: 'Telegram',
      vk: 'VK',
      twitter: 'Twitter/X',
      spotify: 'Spotify',
      twitch: 'Twitch',
      discord: 'Discord',
      facebook: 'Facebook',
      odnoklassniki: 'Одноклассники',
      rutube: 'Rutube',
      yandex_zen: 'Яндекс Дзен',
      kick: 'Kick',
      threads: 'Threads',
      linkedin: 'LinkedIn',
      pinterest: 'Pinterest',
      snapchat: 'Snapchat',
      whatsapp: 'WhatsApp',
      onlyfans: 'OnlyFans',
      truth_social: 'Truth Social',
      rumble: 'Rumble',
    };
    
    return names[networkId] || networkId;
  }
  
  /**
   * Get service types from suggested categories
   */
  private static getServiceTypesFromCategories(categories: string[]): string[] {
    const mapping: Record<string, string[]> = {
      followers: ['followers', 'subscribers', 'members'],
      likes: ['likes', 'hearts'],
      views: ['views', 'watch'],
      comments: ['comments'],
      shares: ['shares', 'reposts', 'retweets'],
      saves: ['saves', 'bookmarks'],
      reactions: ['reactions', 'emojis'],
      live: ['live', 'stream', 'viewers'],
      live_viewers: ['live_viewers', 'viewers', 'spectators'],
      plays: ['plays', 'streams'],
      boosts: ['boosts'],
      monthly_listeners: ['monthly_listeners', 'listeners'],
    };
    
    const types: string[] = [];
    for (const cat of categories) {
      if (mapping[cat]) {
        types.push(...mapping[cat]);
      }
    }
    
    return [...new Set(types)];
  }
}

// =============================================================================
// SERVICE REQUIREMENTS HELPER
// =============================================================================

/**
 * Get service requirements based on service name and network
 */
export function getServiceRequirements(serviceName: string, networkId: string, categoryId: string): ServiceLinkRequirement {
  const nameLower = serviceName.toLowerCase();
  
  const requirement: ServiceLinkRequirement = {
    expectedLinkTypes: [],
    supportsClosed: false,
    supportsOpen: true,
    supportsGroup: false,
    requiresBotAdmin: false,
    allowsMultipleLinks: false,
    requirements: [],
  };
  
  // Telegram specific
  if (networkId === 'telegram') {
    const isClosed = nameLower.includes('закрыт') || nameLower.includes('приват') || nameLower.includes('private');
    const isMassViews = nameLower.includes('массов') || nameLower.includes('всех постов') || nameLower.includes('all posts');
    
    if (isMassViews) {
      requirement.expectedLinkTypes = ['channel'];
      requirement.requirements.push({
        type: 'info',
        message: 'Для массовых просмотров укажите ссылку на канал',
        action: 'Укажите ссылку вида https://t.me/channelname',
      });
      requirement.allowsMultipleLinks = true;
    }
    
    if (categoryId === 'views' && !isMassViews) {
      requirement.expectedLinkTypes = ['post'];
      requirement.requirements.push({
        type: 'info',
        message: 'Для просмотров одного поста укажите ссылку на пост',
        action: 'Укажите ссылку вида https://t.me/channelname/123',
      });
    }
    
    if (isClosed) {
      requirement.supportsClosed = true;
      requirement.requiresBotAdmin = true;
      requirement.requirements.push({
        type: 'warning',
        message: 'Для закрытого канала добавьте бота провайдера в администраторы',
        action: 'Добавьте бота в админы канала перед заказом',
      });
    }
    
    if (categoryId === 'boosts') {
      requirement.expectedLinkTypes = ['channel', 'boost'];
      requirement.requirements.push({
        type: 'info',
        message: 'Укажите ссылку на канал или прямую ссылку на буст',
        action: 'https://t.me/channelname?boost или https://t.me/channelname',
      });
    }
    
    if (categoryId === 'reactions' || categoryId === 'reactions_tg') {
      requirement.expectedLinkTypes = ['post'];
      requirement.requirements.push({
        type: 'info',
        message: 'Реакции работают только на посты в каналах',
        action: 'Укажите ссылку вида https://t.me/channelname/123',
      });
    }
  }
  
  // VK specific
  if (networkId === 'vk') {
    const isClip = nameLower.includes('клип');
    const isVideo = (nameLower.includes('видео') || nameLower.includes('video')) && !isClip;
    
    if (isClip) {
      requirement.expectedLinkTypes = ['clip'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с клипами VK',
        action: 'Укажите ссылку вида https://vk.com/clip-xxx_yyy',
      });
    }
    
    if (isVideo) {
      requirement.expectedLinkTypes = ['video'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с видео VK',
        action: 'Укажите ссылку вида https://vk.com/video-xxx_yyy',
      });
    }
    
    if (categoryId === 'likes') {
      requirement.expectedLinkTypes = ['wall', 'photo', 'video'];
      requirement.requirements.push({
        type: 'info',
        message: 'Лайки работают на посты, фото и видео',
      });
    }
    
    if (categoryId === 'members') {
      requirement.supportsGroup = true;
    }
  }
  
  // YouTube specific
  if (networkId === 'youtube') {
    const isShorts = nameLower.includes('shorts');
    const isLive = nameLower.includes('live') || nameLower.includes('стрим') || nameLower.includes('stream');
    
    if (isShorts) {
      requirement.expectedLinkTypes = ['shorts'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с YouTube Shorts',
        action: 'Укажите ссылку вида https://youtube.com/shorts/xxx',
      });
    }
    
    if (isLive) {
      requirement.expectedLinkTypes = ['live', 'video'];
      requirement.requirements.push({
        type: 'info',
        message: 'Для стримов укажите ссылку на прямую трансляцию',
      });
    }
    
    if (categoryId === 'views' && !isShorts && !isLive) {
      requirement.expectedLinkTypes = ['video', 'shorts'];
    }
  }
  
  // Instagram specific
  if (networkId === 'instagram') {
    const isReels = nameLower.includes('reel');
    const isStory = nameLower.includes('story') || nameLower.includes('сторис') || nameLower.includes('сториз');
    
    if (isReels) {
      requirement.expectedLinkTypes = ['reel'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с Reels',
        action: 'Укажите ссылку вида https://instagram.com/reels/xxx',
      });
    }
    
    if (isStory) {
      requirement.expectedLinkTypes = ['story'];
      requirement.requirements.push({
        type: 'warning',
        message: 'Для сторис аккаунт должен быть публичным',
        action: 'Убедитесь, что аккаунт не приватный',
      });
    }
  }
  
  // TikTok specific
  if (networkId === 'tiktok') {
    const isLive = nameLower.includes('live') || nameLower.includes('стрим');
    
    if (isLive) {
      requirement.expectedLinkTypes = ['live'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с прямыми эфирами TikTok',
        action: 'Укажите ссылку вида https://tiktok.com/@username/live',
      });
    }
  }
  
  // Twitch specific
  if (networkId === 'twitch') {
    const isClip = nameLower.includes('clip') || nameLower.includes('клип');
    
    if (isClip) {
      requirement.expectedLinkTypes = ['clip'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с клипами Twitch',
        action: 'Укажите ссылку вида https://clips.twitch.tv/xxx',
      });
    }
    
    if (categoryId === 'live_viewers') {
      requirement.expectedLinkTypes = ['channel'];
      requirement.requirements.push({
        type: 'info',
        message: 'Для зрителей стрима укажите ссылку на канал во время трансляции',
      });
    }
  }
  
  // Spotify specific
  if (networkId === 'spotify') {
    if (categoryId === 'plays') {
      requirement.expectedLinkTypes = ['track', 'album'];
      requirement.requirements.push({
        type: 'info',
        message: 'Прослушивания работают для треков и альбомов',
      });
    }
    
    if (categoryId === 'monthly_listeners') {
      requirement.expectedLinkTypes = ['artist'];
      requirement.requirements.push({
        type: 'info',
        message: 'Месячные слушатели работают для профилей исполнителей',
      });
    }
  }
  
  // Discord specific
  if (networkId === 'discord') {
    requirement.expectedLinkTypes = ['invite'];
    requirement.requirements.push({
      type: 'info',
      message: 'Укажите ссылку-приглашение на сервер Discord',
      action: 'https://discord.gg/xxx',
    });
  }
  
  return requirement;
}

// =============================================================================
// UTILITY FUNCTIONS
// =============================================================================

/**
 * Quick check if URL is valid for a specific network
 */
export function isValidForNetwork(url: string, networkId: string): boolean {
  const result = LinkAnalyzer.analyze(url);
  return result.isValid && result.networkId === networkId;
}

/**
 * Get all supported networks
 */
export function getSupportedNetworks(): string[] {
  return Object.keys(LINK_TYPE_RULES);
}

/**
 * Get link types for a specific network
 */
export function getLinkTypesForNetwork(networkId: string): string[] {
  const rules = LINK_TYPE_RULES[networkId];
  if (!rules) return [];
  return [...new Set(rules.map(r => r.type))];
}
