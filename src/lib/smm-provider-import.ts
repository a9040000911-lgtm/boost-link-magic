/**
 * SMM Provider Import Module
 * Handles importing services from SMM panel providers
 * Supports multiple API formats (GET/POST, various auth methods)
 * 
 * Updated: 22 networks, 86 activities, improved Cyrillic support
 */

// =============================================================================
// TYPES
// =============================================================================

export interface ProviderConfig {
  id: string;
  name: string;
  apiUrl: string;
  apiKey: string;
  currency: 'USD' | 'RUB' | 'EUR';
  markupPercent: number;
  isActive: boolean;
}

export interface ProviderService {
  service: string | number;
  name: string;
  type?: string;
  rate: string | number;
  min: string | number;
  max: string | number;
  category?: string;
  description?: string;
  refill?: boolean;
  cancel?: boolean;
}

export interface ImportedService {
  id: string;
  providerId: string;
  providerServiceId: string;
  providerName: string;
  originalName: string;
  originalCategory?: string;
  
  // Classification
  networkId: string;
  networkName: string;
  categoryId: string;
  categoryName: string;
  linkType: string;
  
  // Pricing
  providerRate: number;
  sellRate: number;
  currency: string;
  
  // Limits
  minOrder: number;
  maxOrder: number;
  
  // Features
  hasRefill: boolean;
  hasCancel: boolean;
  
  // Quality detection
  quality: 'economy' | 'standard' | 'premium' | 'live';
  speed?: string;
  geo?: string;
  
  // Status
  isActive: boolean;
  lastSyncAt: string;
}

export interface ImportResult {
  success: boolean;
  providerId: string;
  providerName: string;
  servicesTotal: number;
  servicesImported: number;
  servicesUpdated: number;
  errors: string[];
  duration: number;
}

// =============================================================================
// UNIFIED CATEGORIES - 22 Networks, 86 Activities
// =============================================================================

export const SOCIAL_NETWORKS = {
  telegram: { name: 'Telegram', icon: '📱', color: '#039BE5' },
  instagram: { name: 'Instagram', icon: '📷', color: '#E4405F' },
  tiktok: { name: 'TikTok', icon: '🎵', color: '#000000' },
  youtube: { name: 'YouTube', icon: '▶️', color: '#FF0000' },
  vk: { name: 'VK', icon: '💬', color: '#0077FF' },
  twitter: { name: 'Twitter/X', icon: '🐦', color: '#1DA1F2' },
  spotify: { name: 'Spotify', icon: '🎧', color: '#1DB954' },
  twitch: { name: 'Twitch', icon: '🎮', color: '#9146FF' },
  discord: { name: 'Discord', icon: '💬', color: '#5865F2' },
  facebook: { name: 'Facebook', icon: '👤', color: '#1877F2' },
  odnoklassniki: { name: 'Одноклассники', icon: '🟠', color: '#EE8208' },
  rutube: { name: 'Rutube', icon: '🎬', color: '#00AAFF' },
  yandex_zen: { name: 'Яндекс Дзен', icon: '📰', color: '#FF0000' },
  threads: { name: 'Threads', icon: '🧵', color: '#000000' },
  kick: { name: 'Kick', icon: '🟢', color: '#53FC18' },
  linkedin: { name: 'LinkedIn', icon: '💼', color: '#0A66C2' },
  pinterest: { name: 'Pinterest', icon: '📌', color: '#E60023' },
  snapchat: { name: 'Snapchat', icon: '👻', color: '#FFFC00' },
  whatsapp: { name: 'WhatsApp', icon: '💬', color: '#25D366' },
  onlyfans: { name: 'OnlyFans', icon: '💎', color: '#00AFF0' },
  truth_social: { name: 'Truth Social', icon: '🗣️', color: '#0085FF' },
  rumble: { name: 'Rumble', icon: '🎬', color: '#85C742' },
} as const;

export const ACTIVITY_TYPES = {
  // Подписчики и участники
  followers: { name: 'Подписчики', keywords: ['подписчик', 'follower', 'subscriber', 'subs', 'фолловер'] },
  members: { name: 'Участники', keywords: ['участник', 'member', 'участники'] },
  friends: { name: 'Друзья', keywords: ['друг', 'friend', 'друзья', 'заявк'] },
  
  // Вовлечённость
  likes: { name: 'Лайки', keywords: ['лайк', 'like', 'heart', 'сердечк', 'нравитс'] },
  views: { name: 'Просмотры', keywords: ['просмотр', 'view', 'watch', 'плей'] },
  comments: { name: 'Комментарии', keywords: ['комментари', 'comment', 'коммент'] },
  reactions: { name: 'Реакции', keywords: ['реакци', 'reaction', 'emoji', 'эмодзи'] },
  shares: { name: 'Репосты/Шеры', keywords: ['репост', 'repost', 'share', 'шер', 'ретвит'] },
  saves: { name: 'Сохранения', keywords: ['сохранен', 'save', 'bookmark', 'закладк'] },
  
  // Контент
  story: { name: 'Stories', keywords: ['story', 'сторис', 'сториз', 'истори'] },
  reels: { name: 'Reels/Shorts', keywords: ['reel', 'shorts', 'рилс', 'шорт'] },
  live: { name: 'Трансляции', keywords: ['live', 'стрим', 'трансляц', 'stream'] },
  live_viewers: { name: 'Зрители трансляций', keywords: ['зрители', 'viewers', 'spectators', 'spectator'] },
  video: { name: 'Видео', keywords: ['видео', 'video'] },
  post: { name: 'Посты', keywords: ['пост', 'post'] },
  
  // Специфичное
  votes: { name: 'Голоса/Опросы', keywords: ['голос', 'vote', 'poll', 'опрос'] },
  boosts: { name: 'Бусты', keywords: ['буст', 'boost'] },
  mentions: { name: 'Упоминания', keywords: ['упоминани', 'mention', 'тег'] },
  reviews: { name: 'Отзывы', keywords: ['отзыв', 'review', 'рейтинг', 'rating'] },
  
  // Telegram специфичное
  reactions_tg: { name: 'Реакции TG', keywords: ['реакци', '👍', '❤️', '🔥', '👏', '😢', '🤔', '😎'] },
  
  // Spotify специфичное
  plays: { name: 'Прослушивания', keywords: ['прослушиван', 'play', 'stream', 'стрим'] },
  monthly_listeners: { name: 'Месячные слушатели', keywords: ['месячн', 'monthly', 'listeners'] },
  
  // Мессенджеры
  messaging: { name: 'Сообщения', keywords: ['сообщени', 'message', 'рассылк', 'dm', 'direct'] },
  
  // Премиум
  premium: { name: 'Премиум', keywords: ['premium', 'премиум', 'подписк', 'subscription'] },
  
  // Валюты/Донаты
  currency: { name: 'Валюта/Донаты', keywords: ['донат', 'donat', 'currency', 'валют', 'star', 'звезд', 'coin', 'коин'] },
  
  // Другое
  other: { name: 'Другое', keywords: [] },
} as const;

// =============================================================================
// PROVIDER API CLIENT
// =============================================================================

export class ProviderAPIClient {
  /**
   * Fetch services from provider API
   */
  static async fetchServices(provider: ProviderConfig): Promise<ProviderService[]> {
    const { apiUrl, apiKey } = provider;
    
    // Detect API method based on URL
    const useGetMethod = apiUrl.includes('vexboost') || apiUrl.includes('soc-rocket');
    
    // Some providers need lowercase API key
    const key = apiUrl.includes('smmpanelus') ? apiKey.toLowerCase() : apiKey;
    
    let response: Response;
    
    if (useGetMethod) {
      // GET request
      const url = `${apiUrl}?action=services&key=${key}`;
      response = await fetch(url, { method: 'GET' });
    } else {
      // POST request with FormData
      const formData = new FormData();
      formData.append('key', key);
      formData.append('action', 'services');
      response = await fetch(apiUrl, { method: 'POST', body: formData });
    }
    
    if (!response.ok) {
      throw new Error(`API returned ${response.status}`);
    }
    
    const data = await response.json();
    
    if (!Array.isArray(data)) {
      throw new Error('Invalid API response: expected array');
    }
    
    return data as ProviderService[];
  }
  
  /**
   * Fetch balance from provider
   */
  static async fetchBalance(provider: ProviderConfig): Promise<{ balance: number; currency?: string }> {
    const { apiUrl, apiKey } = provider;
    
    const useGetMethod = apiUrl.includes('vexboost') || apiUrl.includes('soc-rocket');
    const key = apiUrl.includes('smmpanelus') ? apiKey.toLowerCase() : apiKey;
    
    let response: Response;
    
    if (useGetMethod) {
      response = await fetch(`${apiUrl}?action=balance&key=${key}`, { method: 'GET' });
    } else {
      const formData = new FormData();
      formData.append('key', key);
      formData.append('action', 'balance');
      response = await fetch(apiUrl, { method: 'POST', body: formData });
    }
    
    const data = await response.json();
    return {
      balance: parseFloat(data.balance || '0'),
      currency: data.currency,
    };
  }
  
  /**
   * Submit order to provider
   */
  static async submitOrder(
    provider: ProviderConfig,
    serviceId: string | number,
    link: string,
    quantity: number
  ): Promise<{ orderId: string | number; status: string }> {
    const { apiUrl, apiKey } = provider;
    
    const useGetMethod = apiUrl.includes('vexboost') || apiUrl.includes('soc-rocket');
    const key = apiUrl.includes('smmpanelus') ? apiKey.toLowerCase() : apiKey;
    
    let response: Response;
    
    if (useGetMethod) {
      const url = `${apiUrl}?action=add&key=${key}&service=${serviceId}&link=${encodeURIComponent(link)}&quantity=${quantity}`;
      response = await fetch(url, { method: 'GET' });
    } else {
      const formData = new FormData();
      formData.append('key', key);
      formData.append('action', 'add');
      formData.append('service', String(serviceId));
      formData.append('link', link);
      formData.append('quantity', String(quantity));
      response = await fetch(apiUrl, { method: 'POST', body: formData });
    }
    
    const data = await response.json();
    
    if (data.error) {
      throw new Error(data.error);
    }
    
    return {
      orderId: data.order,
      status: data.status || 'pending',
    };
  }
  
  /**
   * Check order status
   */
  static async checkOrderStatus(
    provider: ProviderConfig,
    orderId: string | number
  ): Promise<{
    status: string;
    startCount?: number;
    remains?: number;
    charge?: number;
  }> {
    const { apiUrl, apiKey } = provider;
    
    const useGetMethod = apiUrl.includes('vexboost') || apiUrl.includes('soc-rocket');
    const key = apiUrl.includes('smmpanelus') ? apiKey.toLowerCase() : apiKey;
    
    let response: Response;
    
    if (useGetMethod) {
      response = await fetch(`${apiUrl}?action=status&key=${key}&order=${orderId}`, { method: 'GET' });
    } else {
      const formData = new FormData();
      formData.append('key', key);
      formData.append('action', 'status');
      formData.append('order', String(orderId));
      response = await fetch(apiUrl, { method: 'POST', body: formData });
    }
    
    return await response.json();
  }
}

// =============================================================================
// SERVICE CLASSIFIER - IMPROVED
// =============================================================================

export class ServiceClassifier {
  // Network patterns - NOTE: \b doesn't work with Cyrillic, so we use different patterns
  private static networkPatterns = [
    // Telegram - highest priority
    { id: 'telegram', patterns: [
      /telegram/i, /телеграм/i, /\btg\s/i, /\btg\b/i, /t\.me/i,
      /telegraph/i, /teleguard/i
    ], priority: 100 },
    
    // TikTok
    { id: 'tiktok', patterns: [
      /tiktok/i, /тикток/i, /\btt\s/i, /\btt\b/i, /vm\.tiktok/i, /vt\.tiktok/i,
      /tik\.tok/i, /тикток/i
    ], priority: 95 },
    
    // Instagram
    { id: 'instagram', patterns: [
      /instagram/i, /\big\s/i, /insta/i, /инстаграм/i, /instagr\.am/i,
      /\bigram/i, /инста/i
    ], priority: 90 },
    
    // YouTube
    { id: 'youtube', patterns: [
      /youtube/i, /\byt\s/i, /\byt\b/i, /ютуб/i, /youtu\.be/i,
      /youtube\.com/i, /ютуб/i
    ], priority: 85 },
    
    // Twitter/X
    { id: 'twitter', patterns: [
      /twitter/i, /x\.com/i, /твиттер/i, /\btw\s/i, /\btw\b/i,
      /твит/i, /tweet/i
    ], priority: 80 },
    
    // Spotify
    { id: 'spotify', patterns: [
      /spotify/i, /спотифай/i, /spoti\.fi/i, /spotify\.com/i
    ], priority: 75 },
    
    // Twitch
    { id: 'twitch', patterns: [
      /twitch/i, /твич/i, /twitch\.tv/i
    ], priority: 70 },
    
    // Discord
    { id: 'discord', patterns: [
      /discord/i, /дискорд/i, /discord\.gg/i, /discord\.com/i
    ], priority: 65 },
    
    // VK - careful with "vk" in other words, NO \b for Cyrillic!
    { id: 'vk', patterns: [
      /\bvk\s/i, /vkontakte/i, /вконтакте/i, /vk\.com/i, /vk\.ru/i,
      /вк\s/i, /^вк\b/i, /\sвк\b/i
    ], priority: 60 },
    
    // Facebook
    { id: 'facebook', patterns: [
      /facebook/i, /\bfb\s/i, /\bfb\b/i, /фейсбук/i, /fb\.com/i,
      /meta\s*business/i
    ], priority: 55 },
    
    // Odnoklassniki
    { id: 'odnoklassniki', patterns: [
      /одноклассники/i, /ok\.ru/i, /\bок\s/i, /odnoklassniki/i,
      /одноклассник/i
    ], priority: 50 },
    
    // Rutube
    { id: 'rutube', patterns: [
      /rutube/i, /рутуб/i, /rutube\.ru/i
    ], priority: 45 },
    
    // Yandex Zen
    { id: 'yandex_zen', patterns: [
      /dzen/i, /яндекс\s*дзен/i, /zen\.yandex/i, /дзен/i,
      /yandex\s*zen/i
    ], priority: 40 },
    
    // Kick
    { id: 'kick', patterns: [
      /kick\.com/i, /кик\s*стрим/i, /\bkick\s*stream/i,
      /\bkick\b/i, /кик\s*подпис/i, /кик\s*канал/i
    ], priority: 35 },
    
    // Threads
    { id: 'threads', patterns: [
      /threads/i, /тредс/i, /threads\.net/i
    ], priority: 30 },
    
    // LinkedIn
    { id: 'linkedin', patterns: [
      /linkedin/i, /линкедин/i, /linked\.in/i
    ], priority: 25 },
    
    // Pinterest
    { id: 'pinterest', patterns: [
      /pinterest/i, /пинтерест/i, /pin\.it/i
    ], priority: 20 },
    
    // Snapchat
    { id: 'snapchat', patterns: [
      /snapchat/i, /снапчат/i, /snap\.com/i
    ], priority: 15 },
    
    // WhatsApp
    { id: 'whatsapp', patterns: [
      /whatsapp/i, /ватсап/i, /wa\.me/i, /chat\.whatsapp/i,
      /whats\s*app/i
    ], priority: 14 },
    
    // OnlyFans
    { id: 'onlyfans', patterns: [
      /onlyfans/i, /онлифанс/i, /only\.fans/i
    ], priority: 13 },
    
    // Truth Social
    { id: 'truth_social', patterns: [
      /truth\s*social/i, /truthsocial/i
    ], priority: 12 },
    
    // Rumble
    { id: 'rumble', patterns: [
      /rumble/i, /ramble\.com/i
    ], priority: 11 },
  ];

  // Category patterns - NOTE: No \b for Cyrillic patterns!
  private static categoryPatterns = [
    // Live viewers - check BEFORE views (more specific)
    { id: 'live_viewers', patterns: [
      /зрители/i, /viewers/i, /spectators/i, /live.*views/i,
      /стрим.*зрител/i, /трансляц.*зрител/i, /зрители стрим/i
    ], priority: 105 },
    
    // Messaging - check before other categories
    { id: 'messaging', patterns: [
      /сообщени/i, /message/i, /рассылк/i, /\bdm\b/i, /direct.*message/i,
      /личн.*сообщ/i, /массов.*рассыл/i, /whatsapp.*message/i
    ], priority: 102 },
    
    // Premium/Subscription - check before followers
    { id: 'premium', patterns: [
      /premium/i, /премиум/i, /подписк/i, /subscription/i,
      /subscriber/i, /vip/i
    ], priority: 101 },
    
    // Currency/Donates
    { id: 'currency', patterns: [
      /донат/i, /donat/i, /currency/i, /валют/i, 
      /star.*telegram/i, /звезд/i, /\bcoin/i, /коин/i,
      /bit/i, /cheer/i, /tip/i, /чаев/i
    ], priority: 100 },
    
    // Monthly listeners (Spotify) - check before plays
    { id: 'monthly_listeners', patterns: [
      /месячн.*слушател/i, /monthly.*listener/i, /слушател.*месячн/i
    ], priority: 98 },
    
    // Followers
    { id: 'followers', patterns: [
      /подписчик/i, /follower/i, /\bsub\s/i, /subscriber/i,
      /фолловер/i, /подпис/i, /subs/i
    ], priority: 95 },
    
    // Likes
    { id: 'likes', patterns: [
      /лайк/i, /\blike\b/i, /heart/i, /сердечк/i,
      /нравитс/i, /люблю/i
    ], priority: 90 },
    
    // Views
    { id: 'views', patterns: [
      /просмотр/i, /\bview\b/i, /\bwatch\b/i, /плей/i,
      /play.*count/i, /визит/i
    ], priority: 85 },
    
    // Comments
    { id: 'comments', patterns: [
      /комментари/i, /\bcomment\b/i, /коммент/i,
      /отзыв/i, /review/i
    ], priority: 80 },
    
    // Reactions
    { id: 'reactions', patterns: [
      /реакци/i, /\breaction/i, /emoji/i, /эмодзи/i,
      /👍|❤️|🔥|👏|😢|🤔|😎/i
    ], priority: 75 },
    
    // Shares/Reposts
    { id: 'shares', patterns: [
      /репост/i, /\brepost\b/i, /\bshare\b/i, /шер/i,
      /ретвит/i, /retweet/i, /reblog/i
    ], priority: 70 },
    
    // Saves
    { id: 'saves', patterns: [
      /сохранен/i, /\bsave\b/i, /bookmark/i, /закладк/i,
      /избранн/i, /favorite/i
    ], priority: 65 },
    
    // Members
    { id: 'members', patterns: [
      /участник/i, /\bmember\b/i, /\bjoin\b/i, /участии/i
    ], priority: 60 },
    
    // Live/Stream
    { id: 'live', patterns: [
      /\blive\b/i, /трансляц/i, /стрим/i, /stream/i,
      /прямой.*эфир/i, /online/i
    ], priority: 55 },
    
    // Story
    { id: 'story', patterns: [
      /\bstory\b/i, /сторис/i, /сториз/i, /истори/i,
      /stories/i
    ], priority: 50 },
    
    // Reels/Shorts
    { id: 'reels', patterns: [
      /\breel\b/i, /\bshorts\b/i, /рилс/i, /шорт/i,
      /tiktok.*video/i
    ], priority: 45 },
    
    // Friends
    { id: 'friends', patterns: [
      /друг/i, /\bfriend\b/i, /заявк/i, /друз/i,
      /add.*friend/i
    ], priority: 40 },
    
    // Votes
    { id: 'votes', patterns: [
      /голос/i, /\bvote\b/i, /\bpoll\b/i, /опрос/i,
      /voting/i
    ], priority: 35 },
    
    // Boosts
    { id: 'boosts', patterns: [
      /буст/i, /\bboost\b/i, /поддерж/i
    ], priority: 30 },
    
    // Mentions
    { id: 'mentions', patterns: [
      /упоминани/i, /\bmention\b/i, /тег/i, /\btag\b/i,
      /mark/i
    ], priority: 25 },
    
    // Plays (Spotify)
    { id: 'plays', patterns: [
      /прослушиван/i, /\bplay\b/i, /stream/i, /стрим/i,
      /monthly.*listener/i, /месячн.*слушател/i
    ], priority: 20 },
  ];

  /**
   * Detect social network from service name
   */
  static detectNetwork(serviceName: string): { networkId: string; confidence: number } {
    const text = serviceName.toLowerCase();
    
    // Sort by priority (highest first)
    const sorted = [...this.networkPatterns].sort((a, b) => b.priority - a.priority);
    
    for (const network of sorted) {
      for (const pattern of network.patterns) {
        if (pattern.test(text)) {
          return { networkId: network.id, confidence: 0.9 };
        }
      }
    }
    
    return { networkId: 'other', confidence: 0 };
  }

  /**
   * Detect service category from service name
   */
  static detectCategory(serviceName: string): { categoryId: string; confidence: number } {
    const text = serviceName.toLowerCase();
    
    // Sort by priority (highest first)
    const sorted = [...this.categoryPatterns].sort((a, b) => b.priority - a.priority);
    
    for (const category of sorted) {
      for (const pattern of category.patterns) {
        if (pattern.test(text)) {
          return { categoryId: category.id, confidence: 0.85 };
        }
      }
    }
    
    return { categoryId: 'other', confidence: 0 };
  }

  /**
   * Detect service quality from name
   */
  static detectQuality(serviceName: string): 'economy' | 'standard' | 'premium' | 'live' {
    const text = serviceName.toLowerCase();
    
    if (text.includes('живые') || text.includes('live') || text.includes('реальные') || text.includes('real') || text.includes('organic')) {
      return 'live';
    }
    if (text.includes('премиум') || text.includes('premium') || text.includes('hq') || 
        text.includes('качеств') || text.includes('quality') || text.includes('high')) {
      return 'premium';
    }
    if (text.includes('эконом') || text.includes('economy') || text.includes('дешёв') || 
        text.includes('дешев') || text.includes('bot') || text.includes('бот') || text.includes('mix')) {
      return 'economy';
    }
    return 'standard';
  }

  /**
   * Detect GEO from service name
   */
  static detectGeo(serviceName: string): string | undefined {
    const text = serviceName.toLowerCase();
    
    const geoPatterns = [
      { pattern: /\bru\b|россия|рф\b|russian/i, geo: 'RU' },
      { pattern: /\bua\b|украин|ukrain/i, geo: 'UA' },
      { pattern: /\bkz\b|казахстан|kazakh/i, geo: 'KZ' },
      { pattern: /\bby\b|беларус|belarus/i, geo: 'BY' },
      { pattern: /\busa\b|\bus\b|сша|america|united\s*state/i, geo: 'US' },
      { pattern: /\beu\b|европ|europe|european/i, geo: 'EU' },
      { pattern: /\basia\b|ази|asian/i, geo: 'ASIA' },
      { pattern: /снг|cis/i, geo: 'CIS' },
      { pattern: /\bbr\b|brazil|бразил/i, geo: 'BR' },
      { pattern: /\bin\b|india|инди/i, geo: 'IN' },
      { pattern: /\btr\b|turkey|турц/i, geo: 'TR' },
      { pattern: /\bde\b|germany|герман/i, geo: 'DE' },
      { pattern: /\bfr\b|france|франц/i, geo: 'FR' },
      { pattern: /\bgb\b|uk\b|britain|британ/i, geo: 'GB' },
      { pattern: /\bes\b|spain|испан/i, geo: 'ES' },
      { pattern: /\bit\b|italy|итал/i, geo: 'IT' },
      { pattern: /\bjp\b|japan|япон/i, geo: 'JP' },
      { pattern: /\bkr\b|korea|кор/i, geo: 'KR' },
      { pattern: /\bcn\b|china|кита/i, geo: 'CN' },
      { pattern: /\bar\b|arab|араб/i, geo: 'AR' },
      { pattern: /global|world|весь.*мир|mir/i, geo: 'GLOBAL' },
    ];
    
    for (const { pattern, geo } of geoPatterns) {
      if (pattern.test(text)) {
        return geo;
      }
    }
    
    return undefined;
  }

  /**
   * Detect speed from service name
   */
  static detectSpeed(serviceName: string): string | undefined {
    const text = serviceName.toLowerCase();
    
    if (text.includes('мгновен') || text.includes('instant') || /\bfast\b/i.test(text) || 
        text.includes('super fast') || text.includes('ultra fast')) {
      return 'instant';
    }
    if (text.includes('быстр') || text.includes('quick') || text.includes('speed')) {
      return 'fast';
    }
    if (text.includes('медлен') || text.includes('slow')) {
      return 'slow';
    }
    if (text.includes('плавн') || text.includes('gradual') || text.includes('natural')) {
      return 'gradual';
    }
    
    return undefined;
  }

  /**
   * Classify a provider service
   */
  static classify(service: ProviderService, provider: ProviderConfig): ImportedService {
    const networkResult = this.detectNetwork(service.name);
    const categoryResult = this.detectCategory(service.name);
    const quality = this.detectQuality(service.name);
    const geo = this.detectGeo(service.name);
    const speed = this.detectSpeed(service.name);
    
    const providerRate = typeof service.rate === 'string' ? parseFloat(service.rate) : (service.rate || 0);
    const sellRate = providerRate * (1 + provider.markupPercent / 100);
    
    const networkName = SOCIAL_NETWORKS[networkResult.networkId as keyof typeof SOCIAL_NETWORKS]?.name || networkResult.networkId;
    const categoryName = ACTIVITY_TYPES[categoryResult.categoryId as keyof typeof ACTIVITY_TYPES]?.name || categoryResult.categoryId;
    
    return {
      id: `${provider.id}_${service.service}`,
      providerId: provider.id,
      providerServiceId: String(service.service),
      providerName: provider.name,
      originalName: service.name,
      originalCategory: service.category,
      
      networkId: networkResult.networkId,
      networkName,
      categoryId: categoryResult.categoryId,
      categoryName,
      linkType: 'auto',
      
      providerRate,
      sellRate,
      currency: provider.currency,
      
      minOrder: typeof service.min === 'string' ? parseInt(service.min) : (service.min || 100),
      maxOrder: typeof service.max === 'string' ? parseInt(service.max) : (service.max || 10000),
      
      hasRefill: service.refill || false,
      hasCancel: service.cancel || false,
      
      quality,
      speed,
      geo,
      
      isActive: true,
      lastSyncAt: new Date().toISOString(),
    };
  }
}

// =============================================================================
// NETWORK NAMES & COLORS (for backward compatibility)
// =============================================================================

export const NETWORK_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(SOCIAL_NETWORKS).map(([key, val]) => [key, val.name])
);

export const NETWORK_COLORS: Record<string, string> = Object.fromEntries(
  Object.entries(SOCIAL_NETWORKS).map(([key, val]) => [key, val.color])
);

export const NETWORK_ICONS: Record<string, string> = Object.fromEntries(
  Object.entries(SOCIAL_NETWORKS).map(([key, val]) => [key, val.icon])
);

// Activity names for display
export const ACTIVITY_NAMES: Record<string, string> = Object.fromEntries(
  Object.entries(ACTIVITY_TYPES).map(([key, val]) => [key, val.name])
);
