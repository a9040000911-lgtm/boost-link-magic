/**
 * Unified Categories Module
 * Central configuration for all social networks and activity types
 * 
 * This module provides:
 * - Network definitions (22 networks)
 * - Activity types (86 activities)
 * - Link patterns for validation
 * - Keyword mappings for auto-classification
 */

// =============================================================================
// SOCIAL NETWORKS - 22 Networks
// =============================================================================

export interface SocialNetwork {
  id: string;
  name: string;
  nameRu: string;
  icon: string;
  color: string;
  domains: string[];
  linkPatterns: string[];
  popular: boolean;
}

export const SOCIAL_NETWORKS_LIST: SocialNetwork[] = [
  {
    id: 'telegram',
    name: 'Telegram',
    nameRu: 'Телеграм',
    icon: '📱',
    color: '#039BE5',
    domains: ['t.me', 'telegram.me', 'telegram.org'],
    linkPatterns: ['t.me/', 'telegram.me/', '@'],
    popular: true,
  },
  {
    id: 'instagram',
    name: 'Instagram',
    nameRu: 'Инстаграм',
    icon: '📷',
    color: '#E4405F',
    domains: ['instagram.com', 'instagr.am'],
    linkPatterns: ['instagram.com/', 'instagr.am/'],
    popular: true,
  },
  {
    id: 'tiktok',
    name: 'TikTok',
    nameRu: 'ТикТок',
    icon: '🎵',
    color: '#000000',
    domains: ['tiktok.com', 'vm.tiktok.com', 'vt.tiktok.com'],
    linkPatterns: ['tiktok.com/@', 'vm.tiktok.com/', 'vt.tiktok.com/'],
    popular: true,
  },
  {
    id: 'youtube',
    name: 'YouTube',
    nameRu: 'Ютуб',
    icon: '▶️',
    color: '#FF0000',
    domains: ['youtube.com', 'youtu.be'],
    linkPatterns: ['youtube.com/', 'youtu.be/'],
    popular: true,
  },
  {
    id: 'vk',
    name: 'VK',
    nameRu: 'ВКонтакте',
    icon: '💬',
    color: '#0077FF',
    domains: ['vk.com', 'vk.ru', 'vkontakte.ru'],
    linkPatterns: ['vk.com/', 'vk.ru/'],
    popular: true,
  },
  {
    id: 'twitter',
    name: 'Twitter/X',
    nameRu: 'Твиттер',
    icon: '🐦',
    color: '#1DA1F2',
    domains: ['twitter.com', 'x.com', 't.co'],
    linkPatterns: ['twitter.com/', 'x.com/'],
    popular: true,
  },
  {
    id: 'spotify',
    name: 'Spotify',
    nameRu: 'Спотифай',
    icon: '🎧',
    color: '#1DB954',
    domains: ['spotify.com', 'open.spotify.com', 'spoti.fi'],
    linkPatterns: ['spotify.com/', 'open.spotify.com/', 'spoti.fi/'],
    popular: true,
  },
  {
    id: 'twitch',
    name: 'Twitch',
    nameRu: 'Твич',
    icon: '🎮',
    color: '#9146FF',
    domains: ['twitch.tv', 'clips.twitch.tv'],
    linkPatterns: ['twitch.tv/', 'clips.twitch.tv/'],
    popular: true,
  },
  {
    id: 'discord',
    name: 'Discord',
    nameRu: 'Дискорд',
    icon: '💬',
    color: '#5865F2',
    domains: ['discord.gg', 'discord.com', 'discordapp.com'],
    linkPatterns: ['discord.gg/', 'discord.com/invite/'],
    popular: true,
  },
  {
    id: 'facebook',
    name: 'Facebook',
    nameRu: 'Фейсбук',
    icon: '👤',
    color: '#1877F2',
    domains: ['facebook.com', 'fb.com', 'fb.watch'],
    linkPatterns: ['facebook.com/', 'fb.com/', 'fb.watch/'],
    popular: true,
  },
  {
    id: 'odnoklassniki',
    name: 'Odnoklassniki',
    nameRu: 'Одноклассники',
    icon: '🟠',
    color: '#EE8208',
    domains: ['ok.ru', 'odnoklassniki.ru'],
    linkPatterns: ['ok.ru/', 'odnoklassniki.ru/'],
    popular: false,
  },
  {
    id: 'rutube',
    name: 'Rutube',
    nameRu: 'Рутуб',
    icon: '🎬',
    color: '#00AAFF',
    domains: ['rutube.ru'],
    linkPatterns: ['rutube.ru/'],
    popular: false,
  },
  {
    id: 'yandex_zen',
    name: 'Yandex Zen',
    nameRu: 'Яндекс Дзен',
    icon: '📰',
    color: '#FF0000',
    domains: ['dzen.ru', 'zen.yandex.ru'],
    linkPatterns: ['dzen.ru/', 'zen.yandex.ru/'],
    popular: false,
  },
  {
    id: 'threads',
    name: 'Threads',
    nameRu: 'Тредс',
    icon: '🧵',
    color: '#000000',
    domains: ['threads.net'],
    linkPatterns: ['threads.net/@'],
    popular: false,
  },
  {
    id: 'kick',
    name: 'Kick',
    nameRu: 'Кик',
    icon: '🟢',
    color: '#53FC18',
    domains: ['kick.com'],
    linkPatterns: ['kick.com/'],
    popular: false,
  },
  {
    id: 'linkedin',
    name: 'LinkedIn',
    nameRu: 'Линкедин',
    icon: '💼',
    color: '#0A66C2',
    domains: ['linkedin.com', 'lnkd.in'],
    linkPatterns: ['linkedin.com/', 'lnkd.in/'],
    popular: false,
  },
  {
    id: 'pinterest',
    name: 'Pinterest',
    nameRu: 'Пинтерест',
    icon: '📌',
    color: '#E60023',
    domains: ['pinterest.com', 'pin.it'],
    linkPatterns: ['pinterest.com/', 'pin.it/'],
    popular: false,
  },
  {
    id: 'snapchat',
    name: 'Snapchat',
    nameRu: 'Снапчат',
    icon: '👻',
    color: '#FFFC00',
    domains: ['snapchat.com'],
    linkPatterns: ['snapchat.com/'],
    popular: false,
  },
  {
    id: 'whatsapp',
    name: 'WhatsApp',
    nameRu: 'Ватсап',
    icon: '💬',
    color: '#25D366',
    domains: ['whatsapp.com', 'chat.whatsapp.com', 'wa.me'],
    linkPatterns: ['chat.whatsapp.com/', 'wa.me/'],
    popular: false,
  },
  {
    id: 'onlyfans',
    name: 'OnlyFans',
    nameRu: 'ОнлиФанс',
    icon: '💎',
    color: '#00AFF0',
    domains: ['onlyfans.com'],
    linkPatterns: ['onlyfans.com/'],
    popular: false,
  },
  {
    id: 'truth_social',
    name: 'Truth Social',
    nameRu: 'Truth Social',
    icon: '🗣️',
    color: '#0085FF',
    domains: ['truthsocial.com'],
    linkPatterns: ['truthsocial.com/'],
    popular: false,
  },
  {
    id: 'rumble',
    name: 'Rumble',
    nameRu: 'Рамбл',
    icon: '🎬',
    color: '#85C742',
    domains: ['rumble.com'],
    linkPatterns: ['rumble.com/'],
    popular: false,
  },
];

// =============================================================================
// ACTIVITY TYPES - 26 Categories
// =============================================================================

export interface ActivityType {
  id: string;
  name: string;
  nameRu: string;
  icon: string;
  keywords: string[];
  networks: string[]; // Empty = all networks
}

export const ACTIVITY_TYPES_LIST: ActivityType[] = [
  // Followers & Members
  {
    id: 'followers',
    name: 'Followers',
    nameRu: 'Подписчики',
    icon: '👥',
    keywords: ['подписчик', 'follower', 'subscriber', 'subs', 'фолловер', 'фолловеры'],
    networks: [],
  },
  {
    id: 'members',
    name: 'Members',
    nameRu: 'Участники',
    icon: '👨‍👩‍👧‍👦',
    keywords: ['участник', 'member', 'участники', 'джойн'],
    networks: ['telegram', 'discord', 'vk'],
  },
  {
    id: 'friends',
    name: 'Friends',
    nameRu: 'Друзья',
    icon: '🤝',
    keywords: ['друг', 'friend', 'друзья', 'заявк', 'френд'],
    networks: ['vk', 'facebook', 'odnoklassniki'],
  },
  
  // Engagement
  {
    id: 'likes',
    name: 'Likes',
    nameRu: 'Лайки',
    icon: '❤️',
    keywords: ['лайк', 'like', 'heart', 'сердечк', 'нравитс', 'люблю'],
    networks: [],
  },
  {
    id: 'views',
    name: 'Views',
    nameRu: 'Просмотры',
    icon: '👁️',
    keywords: ['просмотр', 'view', 'watch', 'плей'],
    networks: [],
  },
  {
    id: 'comments',
    name: 'Comments',
    nameRu: 'Комментарии',
    icon: '💬',
    keywords: ['комментари', 'comment', 'коммент'],
    networks: [],
  },
  {
    id: 'reactions',
    name: 'Reactions',
    nameRu: 'Реакции',
    icon: '🔥',
    keywords: ['реакци', 'reaction', 'emoji', 'эмодзи'],
    networks: ['telegram', 'facebook', 'vk'],
  },
  {
    id: 'shares',
    name: 'Shares/Reposts',
    nameRu: 'Репосты',
    icon: '🔄',
    keywords: ['репост', 'repost', 'share', 'шер', 'ретвит', 'retweet', 'reblog'],
    networks: [],
  },
  {
    id: 'saves',
    name: 'Saves',
    nameRu: 'Сохранения',
    icon: '🔖',
    keywords: ['сохранен', 'save', 'bookmark', 'закладк', 'избранн', 'favorite'],
    networks: ['instagram', 'pinterest'],
  },
  
  // Content Types
  {
    id: 'story',
    name: 'Stories',
    nameRu: 'Stories',
    icon: '📱',
    keywords: ['story', 'сторис', 'сториз', 'истори', 'stories'],
    networks: ['instagram', 'tiktok', 'snapchat', 'vk', 'facebook'],
  },
  {
    id: 'reels',
    name: 'Reels/Shorts',
    nameRu: 'Reels/Shorts',
    icon: '🎬',
    keywords: ['reel', 'shorts', 'рилс', 'шорт'],
    networks: ['instagram', 'youtube', 'tiktok', 'facebook'],
  },
  {
    id: 'live',
    name: 'Live Streams',
    nameRu: 'Трансляции',
    icon: '📺',
    keywords: ['live', 'стрим', 'трансляц', 'stream', 'прямой эфир'],
    networks: [],
  },
  {
    id: 'live_viewers',
    name: 'Live Viewers',
    nameRu: 'Зрители трансляций',
    icon: '👥',
    keywords: ['зрители', 'viewers', 'spectators', 'стрим зрители'],
    networks: ['twitch', 'youtube', 'tiktok', 'kick', 'telegram'],
  },
  {
    id: 'video',
    name: 'Video',
    nameRu: 'Видео',
    icon: '🎥',
    keywords: ['видео', 'video'],
    networks: [],
  },
  {
    id: 'post',
    name: 'Posts',
    nameRu: 'Посты',
    icon: '📝',
    keywords: ['пост', 'post'],
    networks: [],
  },
  
  // Special
  {
    id: 'votes',
    name: 'Votes/Polls',
    nameRu: 'Голоса',
    icon: '🗳️',
    keywords: ['голос', 'vote', 'poll', 'опрос', 'voting'],
    networks: ['vk', 'telegram', 'twitter'],
  },
  {
    id: 'boosts',
    name: 'Boosts',
    nameRu: 'Бусты',
    icon: '🚀',
    keywords: ['буст', 'boost', 'поддерж'],
    networks: ['telegram', 'spotify'],
  },
  {
    id: 'mentions',
    name: 'Mentions',
    nameRu: 'Упоминания',
    icon: '📢',
    keywords: ['упоминани', 'mention', 'тег', 'tag'],
    networks: [],
  },
  {
    id: 'reviews',
    name: 'Reviews',
    nameRu: 'Отзывы',
    icon: '⭐',
    keywords: ['отзыв', 'review', 'рейтинг', 'rating'],
    networks: [],
  },
  
  // Spotify-specific
  {
    id: 'plays',
    name: 'Plays',
    nameRu: 'Прослушивания',
    icon: '🎵',
    keywords: ['прослушиван', 'play', 'stream', 'стрим'],
    networks: ['spotify'],
  },
  {
    id: 'monthly_listeners',
    name: 'Monthly Listeners',
    nameRu: 'Месячные слушатели',
    icon: '📊',
    keywords: ['месячн', 'monthly', 'listeners', 'слушател'],
    networks: ['spotify'],
  },
  
  // Messaging
  {
    id: 'messaging',
    name: 'Messages',
    nameRu: 'Сообщения',
    icon: '✉️',
    keywords: ['сообщени', 'message', 'рассылк', 'dm', 'direct'],
    networks: ['telegram', 'whatsapp', 'instagram', 'facebook'],
  },
  
  // Premium
  {
    id: 'premium',
    name: 'Premium',
    nameRu: 'Премиум',
    icon: '👑',
    keywords: ['premium', 'премиум', 'подписк', 'subscription'],
    networks: ['spotify', 'telegram'],
  },
  
  // Currency/Donates
  {
    id: 'currency',
    name: 'Currency/Donates',
    nameRu: 'Валюта/Донаты',
    icon: '💰',
    keywords: ['донат', 'donat', 'currency', 'валют', 'star', 'звезд', 'coin', 'коин', 'bit', 'cheer', 'tip', 'чаев'],
    networks: ['telegram', 'twitch', 'tiktok'],
  },
  
  // Other
  {
    id: 'other',
    name: 'Other',
    nameRu: 'Другое',
    icon: '📦',
    keywords: [],
    networks: [],
  },
];

// =============================================================================
// NETWORK-ACTIVITY MATRIX
// =============================================================================

/**
 * Supported activities for each network
 * Used for filtering and validation
 */
export const NETWORK_ACTIVITIES: Record<string, string[]> = {
  telegram: ['followers', 'members', 'views', 'reactions', 'votes', 'boosts', 'messaging', 'currency', 'premium'],
  instagram: ['followers', 'likes', 'views', 'comments', 'saves', 'shares', 'story', 'reels', 'live_viewers', 'messaging'],
  tiktok: ['followers', 'likes', 'views', 'comments', 'shares', 'story', 'reels', 'live', 'live_viewers', 'currency'],
  youtube: ['followers', 'likes', 'views', 'comments', 'shares', 'reels', 'live', 'live_viewers'],
  vk: ['followers', 'members', 'friends', 'likes', 'views', 'comments', 'shares', 'story', 'reels', 'votes', 'video'],
  twitter: ['followers', 'likes', 'views', 'comments', 'shares', 'votes', 'live'],
  spotify: ['followers', 'plays', 'monthly_listeners', 'premium', 'saves'],
  twitch: ['followers', 'views', 'live_viewers', 'comments', 'shares', 'currency'],
  discord: ['members', 'views', 'messaging'],
  facebook: ['followers', 'friends', 'likes', 'views', 'comments', 'shares', 'reactions', 'story', 'reels', 'live', 'live_viewers'],
  odnoklassniki: ['followers', 'friends', 'likes', 'views', 'comments', 'shares', 'video'],
  rutube: ['followers', 'views', 'likes', 'comments'],
  yandex_zen: ['followers', 'views', 'likes', 'comments', 'shares'],
  threads: ['followers', 'likes', 'comments', 'shares'],
  kick: ['followers', 'live_viewers', 'views', 'comments'],
  linkedin: ['followers', 'likes', 'comments', 'shares'],
  pinterest: ['followers', 'likes', 'saves', 'views'],
  snapchat: ['followers', 'views', 'story', 'reels'],
  whatsapp: ['members', 'messaging'],
  onlyfans: ['followers', 'likes', 'comments'],
  truth_social: ['followers', 'likes', 'shares', 'comments'],
  rumble: ['followers', 'views', 'likes', 'comments'],
};

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Get network by ID
 */
export function getNetworkById(id: string): SocialNetwork | undefined {
  return SOCIAL_NETWORKS_LIST.find(n => n.id === id);
}

/**
 * Get activity by ID
 */
export function getActivityById(id: string): ActivityType | undefined {
  return ACTIVITY_TYPES_LIST.find(a => a.id === id);
}

/**
 * Get popular networks
 */
export function getPopularNetworks(): SocialNetwork[] {
  return SOCIAL_NETWORKS_LIST.filter(n => n.popular);
}

/**
 * Get activities for a specific network
 */
export function getActivitiesForNetwork(networkId: string): ActivityType[] {
  const activityIds = NETWORK_ACTIVITIES[networkId] || [];
  return ACTIVITY_TYPES_LIST.filter(a => activityIds.includes(a.id));
}

/**
 * Detect network from URL
 */
export function detectNetworkFromUrl(url: string): string | null {
  const urlLower = url.toLowerCase();
  for (const network of SOCIAL_NETWORKS_LIST) {
    for (const pattern of network.linkPatterns) {
      if (urlLower.includes(pattern.toLowerCase())) {
        return network.id;
      }
    }
    for (const domain of network.domains) {
      if (urlLower.includes(domain.toLowerCase())) {
        return network.id;
      }
    }
  }
  return null;
}

/**
 * Get network name in specified language
 */
export function getNetworkName(networkId: string, lang: 'en' | 'ru' = 'ru'): string {
  const network = getNetworkById(networkId);
  if (!network) return networkId;
  return lang === 'ru' ? network.nameRu : network.name;
}

/**
 * Get activity name in specified language
 */
export function getActivityName(activityId: string, lang: 'en' | 'ru' = 'ru'): string {
  const activity = getActivityById(activityId);
  if (!activity) return activityId;
  return lang === 'ru' ? activity.nameRu : activity.name;
}

// =============================================================================
// EXPORT LISTS FOR BACKWARD COMPATIBILITY
// =============================================================================

export const NETWORK_NAMES: Record<string, string> = Object.fromEntries(
  SOCIAL_NETWORKS_LIST.map(n => [n.id, n.name])
);

export const NETWORK_NAMES_RU: Record<string, string> = Object.fromEntries(
  SOCIAL_NETWORKS_LIST.map(n => [n.id, n.nameRu])
);

export const NETWORK_COLORS: Record<string, string> = Object.fromEntries(
  SOCIAL_NETWORKS_LIST.map(n => [n.id, n.color])
);

export const NETWORK_ICONS: Record<string, string> = Object.fromEntries(
  SOCIAL_NETWORKS_LIST.map(n => [n.id, n.icon])
);

export const ACTIVITY_NAMES: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES_LIST.map(a => [a.id, a.name])
);

export const ACTIVITY_NAMES_RU: Record<string, string> = Object.fromEntries(
  ACTIVITY_TYPES_LIST.map(a => [a.id, a.nameRu])
);
