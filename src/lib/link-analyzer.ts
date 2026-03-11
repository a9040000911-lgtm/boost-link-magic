/**
 * Link Analyzer Module
 * Handles URL normalization, link type detection, and service requirements
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
// URL NORMALIZATION
// =============================================================================

/**
 * Domain aliases for social networks
 */
const DOMAIN_ALIASES: Record<string, { networkId: string; type: 'main' | 'mobile' | 'short' | 'regional' }> = {
  // Instagram
  'instagram.com': { networkId: 'instagram', type: 'main' },
  'instagr.am': { networkId: 'instagram', type: 'short' },
  
  // YouTube
  'youtube.com': { networkId: 'youtube', type: 'main' },
  'youtu.be': { networkId: 'youtube', type: 'short' },
  'm.youtube.com': { networkId: 'youtube', type: 'mobile' },
  
  // TikTok
  'tiktok.com': { networkId: 'tiktok', type: 'main' },
  'vm.tiktok.com': { networkId: 'tiktok', type: 'short' },
  'vt.tiktok.com': { networkId: 'tiktok', type: 'short' },
  
  // Telegram
  't.me': { networkId: 'telegram', type: 'main' },
  'telegram.me': { networkId: 'telegram', type: 'main' },
  
  // VK
  'vk.com': { networkId: 'vk', type: 'main' },
  'vkontakte.ru': { networkId: 'vk', type: 'regional' },
  'm.vk.com': { networkId: 'vk', type: 'mobile' },
  
  // Facebook
  'facebook.com': { networkId: 'facebook', type: 'main' },
  'fb.com': { networkId: 'facebook', type: 'short' },
  'm.facebook.com': { networkId: 'facebook', type: 'mobile' },
  
  // Twitter/X
  'twitter.com': { networkId: 'twitter', type: 'main' },
  'x.com': { networkId: 'twitter', type: 'main' },
  't.co': { networkId: 'twitter', type: 'short' },
  
  // Twitch
  'twitch.tv': { networkId: 'twitch', type: 'main' },
  'clips.twitch.tv': { networkId: 'twitch', type: 'regional' },
  
  // Spotify
  'spotify.com': { networkId: 'spotify', type: 'main' },
  'open.spotify.com': { networkId: 'spotify', type: 'main' },
  'spoti.fi': { networkId: 'spotify', type: 'short' },
  
  // Одноклассники
  'ok.ru': { networkId: 'odnoklassniki', type: 'main' },
  'odnoklassniki.ru': { networkId: 'odnoklassniki', type: 'main' },
  
  // Rutube
  'rutube.ru': { networkId: 'rutube', type: 'main' },
  
  // Яндекс Дзен
  'dzen.ru': { networkId: 'yandex_zen', type: 'main' },
  'zen.yandex.ru': { networkId: 'yandex_zen', type: 'regional' },
  
  // Discord
  'discord.gg': { networkId: 'discord', type: 'main' },
  'discord.com': { networkId: 'discord', type: 'main' },
  
  // Kick
  'kick.com': { networkId: 'kick', type: 'main' },
  
  // Threads
  'threads.net': { networkId: 'threads', type: 'main' },
  
  // LinkedIn
  'linkedin.com': { networkId: 'linkedin', type: 'main' },
  'lnkd.in': { networkId: 'linkedin', type: 'short' },
  
  // Pinterest
  'pinterest.com': { networkId: 'pinterest', type: 'main' },
  'pin.it': { networkId: 'pinterest', type: 'short' },
  
  // Snapchat
  'snapchat.com': { networkId: 'snapchat', type: 'main' },
  
  // WhatsApp
  'whatsapp.com': { networkId: 'whatsapp', type: 'main' },
  'chat.whatsapp.com': { networkId: 'whatsapp', type: 'regional' },
  'wa.me': { networkId: 'whatsapp', type: 'short' },
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
    { type: 'post', pattern: /instagram\.com\/p\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractId: 1, suggestedCategories: ['likes', 'comments', 'saves'] },
    { type: 'profile', pattern: /instagram\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  youtube: [
    { type: 'shorts', pattern: /youtube\.com\/shorts\/([A-Za-z0-9_-]+)/i, label: 'Shorts', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'live', pattern: /youtube\.com\/live\/([A-Za-z0-9_-]+)/i, label: 'Прямой эфир', extractId: 1, suggestedCategories: ['views', 'live'] },
    { type: 'video', pattern: /youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes', 'comments'] },
    { type: 'video', pattern: /youtu\.be\/([A-Za-z0-9_-]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'channel', pattern: /youtube\.com\/@([A-Za-z0-9_.-]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'channel', pattern: /youtube\.com\/channel\/([A-Za-z0-9_-]+)/i, label: 'Канал', extractId: 1, suggestedCategories: ['followers'] },
  ],
  
  tiktok: [
    { type: 'video', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/video\/(\d+)/i, label: 'Видео', extractUsername: 1, extractId: 2, suggestedCategories: ['views', 'likes', 'shares'] },
    { type: 'video', pattern: /vm\.tiktok\.com\/([A-Za-z0-9]+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'live', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/live/i, label: 'Прямой эфир', extractUsername: 1, suggestedCategories: ['live', 'views'] },
    { type: 'profile', pattern: /tiktok\.com\/@([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  telegram: [
    { type: 'invite', pattern: /t\.me\/\+([A-Za-z0-9_-]+)/i, label: 'Инвайт-ссылка', extractId: 1, suggestedCategories: ['followers', 'members'] },
    { type: 'invite', pattern: /t\.me\/joinchat\/([A-Za-z0-9_-]+)/i, label: 'Инвайт-ссылка', extractId: 1, suggestedCategories: ['followers', 'members'] },
    { type: 'boost', pattern: /t\.me\/([A-Za-z0-9_]+)\?boost/i, label: 'Буст', extractUsername: 1, suggestedCategories: ['boosts'] },
    { type: 'post', pattern: /t\.me\/([A-Za-z0-9_]+)\/(\d+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['views', 'reactions'] },
    { type: 'channel', pattern: /t\.me\/([A-Za-z0-9_]+)\/?$/i, label: 'Канал/Группа', extractUsername: 1, suggestedCategories: ['followers', 'members'] },
  ],
  
  vk: [
    { type: 'clip', pattern: /vk\.com\/clip(-?\d+_\d+)/i, label: 'Клип', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'video', pattern: /vk\.com\/video(-?\d+_\d+)/i, label: 'Видео', extractId: 1, suggestedCategories: ['views', 'likes'] },
    { type: 'wall', pattern: /vk\.com\/wall(-?\d+_\d+)/i, label: 'Запись', extractId: 1, suggestedCategories: ['likes', 'comments', 'shares'] },
    { type: 'photo', pattern: /vk\.com\/photo(-?\d+_\d+)/i, label: 'Фото', extractId: 1, suggestedCategories: ['likes'] },
    { type: 'group', pattern: /vk\.com\/(club|public)(\d+)/i, label: 'Сообщество', extractId: 2, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /vk\.com\/id(\d+)/i, label: 'Профиль', extractId: 1, suggestedCategories: ['followers', 'friends'] },
    { type: 'profile', pattern: /vk\.com\/([A-Za-z0-9_.]+)\/?(\?.*)?$/i, label: 'Страница', extractUsername: 1, suggestedCategories: ['followers', 'friends'] },
  ],
  
  twitter: [
    { type: 'tweet', pattern: /twitter\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/i, label: 'Твит', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'shares', 'comments'] },
    { type: 'tweet', pattern: /x\.com\/([A-Za-z0-9_]+)\/status\/(\d+)/i, label: 'Твит', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'shares', 'comments'] },
    { type: 'profile', pattern: /twitter\.com\/([A-Za-z0-9_]+)\/?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
    { type: 'profile', pattern: /x\.com\/([A-Za-z0-9_]+)\/?$/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
  ],
  
  spotify: [
    { type: 'track', pattern: /spotify\.com\/track\/([A-Za-z0-9]+)/i, label: 'Трек', extractId: 1, suggestedCategories: ['plays', 'saves'] },
    { type: 'artist', pattern: /spotify\.com\/artist\/([A-Za-z0-9]+)/i, label: 'Исполнитель', extractId: 1, suggestedCategories: ['followers', 'plays'] },
    { type: 'playlist', pattern: /spotify\.com\/playlist\/([A-Za-z0-9]+)/i, label: 'Плейлист', extractId: 1, suggestedCategories: ['followers', 'plays'] },
  ],
  
  twitch: [
    { type: 'channel', pattern: /twitch\.tv\/([A-Za-z0-9_]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers', 'live'] },
    { type: 'clip', pattern: /clips\.twitch\.tv\/([A-Za-z0-9_-]+)/i, label: 'Клип', extractId: 1, suggestedCategories: ['views'] },
  ],
  
  discord: [
    { type: 'invite', pattern: /discord\.gg\/([A-Za-z0-9]+)/i, label: 'Сервер', extractId: 1, suggestedCategories: ['members'] },
    { type: 'invite', pattern: /discord\.com\/invite\/([A-Za-z0-9]+)/i, label: 'Сервер', extractId: 1, suggestedCategories: ['members'] },
  ],
  
  kick: [
    { type: 'channel', pattern: /kick\.com\/([A-Za-z0-9_]+)/i, label: 'Канал', extractUsername: 1, suggestedCategories: ['followers', 'live'] },
  ],
  
  threads: [
    { type: 'post', pattern: /threads\.net\/@([A-Za-z0-9_.]+)\/post\/([A-Za-z0-9_-]+)/i, label: 'Пост', extractUsername: 1, extractId: 2, suggestedCategories: ['likes', 'comments'] },
    { type: 'profile', pattern: /threads\.net\/@([A-Za-z0-9_.]+)/i, label: 'Профиль', extractUsername: 1, suggestedCategories: ['followers'] },
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
        
        // Skip non-profile pages
        if (username && ['explore', 'accounts', 'about', 'settings', 'direct', 'reels', 'hashtag'].includes(username.toLowerCase())) {
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
      plays: ['plays', 'streams'],
      boosts: ['boosts'],
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
    const isMassViews = nameLower.includes('массов') || nameLower.includes('всех постов');
    
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
  }
  
  // VK specific
  if (networkId === 'vk') {
    const isClip = nameLower.includes('клип');
    const isVideo = nameLower.includes('видео') && !isClip;
    
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
      requirement.expectedLinkTypes = ['wall', 'photo'];
      requirement.requirements.push({
        type: 'info',
        message: 'Лайки работают на посты и фото в альбомах',
      });
    }
  }
  
  // YouTube specific
  if (networkId === 'youtube') {
    const isShorts = nameLower.includes('shorts');
    const isLive = nameLower.includes('live') || nameLower.includes('стрим');
    
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
    }
  }
  
  // Instagram specific
  if (networkId === 'instagram') {
    const isReels = nameLower.includes('reel');
    const isStory = nameLower.includes('story') || nameLower.includes('сторис');
    
    if (isReels) {
      requirement.expectedLinkTypes = ['reel'];
      requirement.requirements.push({
        type: 'info',
        message: 'Эта услуга работает только с Reels',
      });
    }
    
    if (isStory) {
      requirement.expectedLinkTypes = ['story'];
      requirement.requirements.push({
        type: 'warning',
        message: 'Для сторис аккаунт должен быть публичным',
      });
    }
  }
  
  return requirement;
}
