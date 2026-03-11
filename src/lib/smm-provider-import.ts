/**
 * SMM Provider Import Module
 * Handles importing services from SMM panel providers
 * Supports multiple API formats (GET/POST, various auth methods)
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
// SERVICE CLASSIFIER
// =============================================================================

export class ServiceClassifier {
  // Network patterns with priority
  private static networkPatterns = [
    { id: 'telegram', patterns: [/telegram/i, /телеграм/i, /\btg\s/i, /\btg\b/i, /t\.me/i], priority: 100 },
    { id: 'tiktok', patterns: [/tiktok/i, /тикток/i, /\btt\s/i, /vm\.tiktok/i], priority: 95 },
    { id: 'instagram', patterns: [/instagram/i, /\big\s/i, /insta/i, /инстаграм/i], priority: 90 },
    { id: 'youtube', patterns: [/youtube/i, /\byt\s/i, /ютуб/i, /youtu\.be/i], priority: 85 },
    { id: 'twitter', patterns: [/twitter/i, /x\.com/i, /твиттер/i, /\btw\s/i], priority: 80 },
    { id: 'spotify', patterns: [/spotify/i, /спотифай/i], priority: 75 },
    { id: 'twitch', patterns: [/twitch/i, /твич/i], priority: 70 },
    { id: 'discord', patterns: [/discord/i, /дискорд/i], priority: 65 },
    { id: 'vk', patterns: [/vk\s/i, /vkontakte/i, /вк\s/i, /vk\.com/i], priority: 60 },
    { id: 'facebook', patterns: [/facebook/i, /\bfb\s/i, /фейсбук/i], priority: 55 },
    { id: 'odnoklassniki', patterns: [/одноклассники/i, /ok\.ru/i, /\bок\s/i], priority: 50 },
    { id: 'rutube', patterns: [/rutube/i, /рутуб/i], priority: 45 },
    { id: 'yandex_zen', patterns: [/dzen/i, /яндекс\s*дзен/i, /zen\.yandex/i], priority: 40 },
    { id: 'kick', patterns: [/kick\.com/i, /кик\s*стрим/i], priority: 35 },
    { id: 'threads', patterns: [/threads/i, /тредс/i], priority: 30 },
    { id: 'linkedin', patterns: [/linkedin/i, /линкедин/i], priority: 25 },
    { id: 'pinterest', patterns: [/pinterest/i, /пинтерест/i], priority: 20 },
    { id: 'snapchat', patterns: [/snapchat/i, /снапчат/i], priority: 15 },
  ];

  // Category patterns
  private static categoryPatterns = [
    { id: 'followers', patterns: [/подписчик/i, /follower/i, /\bsub\s/i, /subscriber/i], priority: 100 },
    { id: 'likes', patterns: [/лайк/i, /\blike\b/i, /heart/i], priority: 95 },
    { id: 'views', patterns: [/просмотр/i, /\bview\b/i, /\bwatch/i], priority: 90 },
    { id: 'comments', patterns: [/комментари/i, /\bcomment/i], priority: 85 },
    { id: 'reactions', patterns: [/реакци/i, /\breaction/i], priority: 80 },
    { id: 'shares', patterns: [/репост/i, /\brepost/i, /\bshare/i], priority: 75 },
    { id: 'saves', patterns: [/сохранен/i, /\bsave\b/i, /bookmark/i], priority: 70 },
    { id: 'members', patterns: [/участник/i, /\bmember/i, /\bjoin/i], priority: 65 },
    { id: 'live', patterns: [/\blive\b/i, /трансляц/i, /стрим/i, /зрители/i], priority: 60 },
    { id: 'story', patterns: [/\bstory\b/i, /сторис/i], priority: 55 },
    { id: 'reels', patterns: [/\breel\b/i, /\bshorts\b/i, /рилс/i], priority: 50 },
    { id: 'friends', patterns: [/друг/i, /\bfriend/i, /заявк/i], priority: 45 },
    { id: 'votes', patterns: [/голос/i, /\bvote\b/i, /\bpoll/i], priority: 40 },
    { id: 'boosts', patterns: [/буст/i, /\bboost\b/i], priority: 35 },
  ];

  /**
   * Detect social network from service name
   */
  static detectNetwork(serviceName: string): { networkId: string; confidence: number } {
    const text = serviceName.toLowerCase();
    
    // Sort by priority
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
    
    if (text.includes('живые') || text.includes('live') || text.includes('реальные')) {
      return 'live';
    }
    if (text.includes('премиум') || text.includes('premium') || text.includes('hq') || text.includes('качеств')) {
      return 'premium';
    }
    if (text.includes('эконом') || text.includes('economy') || text.includes('дешёв') || text.includes('бот')) {
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
      { pattern: /\bru\b|россия|рф/i, geo: 'RU' },
      { pattern: /\bua\b|украин/i, geo: 'UA' },
      { pattern: /\bkz\b|казахстан/i, geo: 'KZ' },
      { pattern: /\bby\b|беларус/i, geo: 'BY' },
      { pattern: /\busa\b|сша|america/i, geo: 'US' },
      { pattern: /\beu\b|европ/i, geo: 'EU' },
      { pattern: /\basia\b|ази/i, geo: 'ASIA' },
      { pattern: /снг/i, geo: 'CIS' },
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
    
    if (text.includes('мгновен') || text.includes('instant') || text.includes('fast')) {
      return 'instant';
    }
    if (text.includes('быстр') || text.includes('quick')) {
      return 'fast';
    }
    if (text.includes('медлен') || text.includes('slow')) {
      return 'slow';
    }
    if (text.includes('плавн') || text.includes('gradual')) {
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
    
    const networkNames: Record<string, string> = {
      telegram: 'Telegram',
      tiktok: 'TikTok',
      instagram: 'Instagram',
      youtube: 'YouTube',
      twitter: 'Twitter/X',
      spotify: 'Spotify',
      twitch: 'Twitch',
      discord: 'Discord',
      vk: 'VK',
      facebook: 'Facebook',
      odnoklassniki: 'Одноклассники',
      rutube: 'Rutube',
      yandex_zen: 'Яндекс Дзен',
      kick: 'Kick',
      threads: 'Threads',
      linkedin: 'LinkedIn',
      pinterest: 'Pinterest',
      snapchat: 'Snapchat',
      other: 'Другое',
    };
    
    const categoryNames: Record<string, string> = {
      followers: 'Подписчики',
      likes: 'Лайки',
      views: 'Просмотры',
      comments: 'Комментарии',
      reactions: 'Реакции',
      shares: 'Репосты',
      saves: 'Сохранения',
      members: 'Участники',
      live: 'Трансляции',
      story: 'Сторис',
      reels: 'Reels/Shorts',
      friends: 'Друзья',
      votes: 'Голоса',
      boosts: 'Бусты',
      other: 'Другое',
    };
    
    return {
      id: `${provider.id}_${service.service}`,
      providerId: provider.id,
      providerServiceId: String(service.service),
      providerName: provider.name,
      originalName: service.name,
      originalCategory: service.category,
      
      networkId: networkResult.networkId,
      networkName: networkNames[networkResult.networkId] || networkResult.networkId,
      categoryId: categoryResult.categoryId,
      categoryName: categoryNames[categoryResult.categoryId] || categoryResult.categoryId,
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
// NETWORK NAMES & COLORS
// =============================================================================

export const NETWORK_NAMES: Record<string, string> = {
  telegram: 'Telegram',
  tiktok: 'TikTok',
  instagram: 'Instagram',
  youtube: 'YouTube',
  twitter: 'Twitter/X',
  spotify: 'Spotify',
  twitch: 'Twitch',
  discord: 'Discord',
  vk: 'VK',
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
};

export const NETWORK_COLORS: Record<string, string> = {
  telegram: '#039BE5',
  tiktok: '#000000',
  instagram: '#E4405F',
  youtube: '#FF0000',
  twitter: '#1DA1F2',
  spotify: '#1DB954',
  twitch: '#9146FF',
  discord: '#5865F2',
  vk: '#0077FF',
  facebook: '#1877F2',
  odnoklassniki: '#EE8208',
  rutube: '#00AAFF',
  yandex_zen: '#FF0000',
  kick: '#53FC18',
  threads: '#000000',
  linkedin: '#0A66C2',
  pinterest: '#E60023',
  snapchat: '#FFFC00',
  whatsapp: '#25D366',
  onlyfans: '#00AFF0',
};

export const NETWORK_ICONS: Record<string, string> = {
  telegram: '📱',
  tiktok: '🎵',
  instagram: '📷',
  youtube: '▶️',
  twitter: '🐦',
  spotify: '🎧',
  twitch: '🎮',
  discord: '💬',
  vk: '💬',
  facebook: '👤',
  odnoklassniki: '🟠',
  rutube: '🎬',
  yandex_zen: '📰',
  kick: '🟢',
  threads: '🧵',
  linkedin: '💼',
  pinterest: '📌',
  snapchat: '👻',
  whatsapp: '💬',
  onlyfans: '💎',
};
