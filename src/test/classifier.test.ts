import { describe, it, expect } from 'vitest';
import { ServiceClassifier } from '../lib/smm-provider-import';

describe('ServiceClassifier - Extended Tests', () => {
  const testCases = [
    // Telegram tests
    { name: 'Telegram подписчики канал', expectedNetwork: 'telegram', expectedCategory: 'followers' },
    { name: 'TG подписчики', expectedNetwork: 'telegram', expectedCategory: 'followers' },
    { name: 'Телеграм просмотры постов', expectedNetwork: 'telegram', expectedCategory: 'views' },
    { name: 'Telegram реакции к постам', expectedNetwork: 'telegram', expectedCategory: 'reactions' },
    { name: 'Telegram бусты канала', expectedNetwork: 'telegram', expectedCategory: 'boosts' },
    { name: 'Telegram закрытый канал подписчики', expectedNetwork: 'telegram', expectedCategory: 'followers' },
    { name: 'Telegram зрители трансляции', expectedNetwork: 'telegram', expectedCategory: 'live_viewers' },
    { name: 'Telegram рассылка сообщений', expectedNetwork: 'telegram', expectedCategory: 'messaging' },
    { name: 'Telegram донаты звезды', expectedNetwork: 'telegram', expectedCategory: 'currency' },
    
    // Instagram tests
    { name: 'Instagram подписчики', expectedNetwork: 'instagram', expectedCategory: 'followers' },
    { name: 'IG лайки на пост', expectedNetwork: 'instagram', expectedCategory: 'likes' },
    { name: 'Instagram Reels просмотры', expectedNetwork: 'instagram', expectedCategory: 'views' },
    { name: 'Instagram Stories просмотры', expectedNetwork: 'instagram', expectedCategory: 'views' },
    { name: 'Instagram сохранения постов', expectedNetwork: 'instagram', expectedCategory: 'saves' },
    { name: 'IG комментарии', expectedNetwork: 'instagram', expectedCategory: 'comments' },
    
    // YouTube tests
    { name: 'YouTube подписчики канала', expectedNetwork: 'youtube', expectedCategory: 'followers' },
    { name: 'YT просмотры видео', expectedNetwork: 'youtube', expectedCategory: 'views' },
    { name: 'YouTube Shorts лайки', expectedNetwork: 'youtube', expectedCategory: 'likes' },
    { name: 'YouTube live зрители стрима', expectedNetwork: 'youtube', expectedCategory: 'live_viewers' },
    { name: 'YT комментарии под видео', expectedNetwork: 'youtube', expectedCategory: 'comments' },
    
    // TikTok tests
    { name: 'TikTok подписчики', expectedNetwork: 'tiktok', expectedCategory: 'followers' },
    { name: 'TT лайки на видео', expectedNetwork: 'tiktok', expectedCategory: 'likes' },
    { name: 'TikTok просмотры видео', expectedNetwork: 'tiktok', expectedCategory: 'views' },
    { name: 'TikTok live трансляция', expectedNetwork: 'tiktok', expectedCategory: 'live' },
    { name: 'TikTok репосты видео', expectedNetwork: 'tiktok', expectedCategory: 'shares' },
    
    // VK tests
    { name: 'ВК подписчики группы', expectedNetwork: 'vk', expectedCategory: 'followers' },
    { name: 'VK лайки на стену', expectedNetwork: 'vk', expectedCategory: 'likes' },
    { name: 'ВК просмотры видео', expectedNetwork: 'vk', expectedCategory: 'views' },
    { name: 'VK друзья в профиль', expectedNetwork: 'vk', expectedCategory: 'friends' },
    { name: 'ВК репосты записи', expectedNetwork: 'vk', expectedCategory: 'shares' },
    
    // Spotify tests
    { name: 'Spotify прослушивания трек', expectedNetwork: 'spotify', expectedCategory: 'plays' },
    { name: 'Spotify месячные слушатели', expectedNetwork: 'spotify', expectedCategory: 'monthly_listeners' },
    { name: 'Spotify подписчики исполнителя', expectedNetwork: 'spotify', expectedCategory: 'followers' },
    
    // Twitch tests
    { name: 'Twitch подписчики канала', expectedNetwork: 'twitch', expectedCategory: 'followers' },
    { name: 'Twitch зрители стрима', expectedNetwork: 'twitch', expectedCategory: 'live_viewers' },
    { name: 'Twitch клипы просмотры', expectedNetwork: 'twitch', expectedCategory: 'views' },
    
    // Discord tests
    { name: 'Discord участники сервера', expectedNetwork: 'discord', expectedCategory: 'members' },
    
    // New networks tests
    { name: 'WhatsApp участники группы', expectedNetwork: 'whatsapp', expectedCategory: 'members' },
    { name: 'OnlyFans подписчики', expectedNetwork: 'onlyfans', expectedCategory: 'followers' },
    { name: 'Rutube просмотры видео', expectedNetwork: 'rutube', expectedCategory: 'views' },
    { name: 'Яндекс Дзен подписчики', expectedNetwork: 'yandex_zen', expectedCategory: 'followers' },
    { name: 'Kick подписчики канала', expectedNetwork: 'kick', expectedCategory: 'followers' },
    { name: 'Threads подписчики', expectedNetwork: 'threads', expectedCategory: 'followers' },
    
    // Quality tests
    { name: 'Telegram Premium подписчики', expectedNetwork: 'telegram', expectedQuality: 'premium' },
    { name: 'Instagram живые подписчики', expectedNetwork: 'instagram', expectedQuality: 'live' },
    { name: 'TikTok эконом лайки', expectedNetwork: 'tiktok', expectedQuality: 'economy' },
    { name: 'YouTube HQ просмотры', expectedNetwork: 'youtube', expectedQuality: 'premium' },
    
    // GEO tests
    { name: 'Telegram подписчики RU', expectedNetwork: 'telegram', expectedCategory: 'followers', expectedGeo: 'RU' },
    { name: 'Instagram лайки Украина', expectedNetwork: 'instagram', expectedCategory: 'likes', expectedGeo: 'UA' },
    { name: 'VK подписчики СНГ', expectedNetwork: 'vk', expectedCategory: 'followers', expectedGeo: 'CIS' },
    { name: 'TikTok просмотры USA', expectedNetwork: 'tiktok', expectedCategory: 'views', expectedGeo: 'US' },
  ];

  for (const tc of testCases) {
    it(`classifies "${tc.name}"`, () => {
      const networkResult = ServiceClassifier.detectNetwork(tc.name);
      expect(networkResult.networkId).toBe(tc.expectedNetwork);

      // Only check category if expectedCategory is defined
      if (tc.expectedCategory !== undefined) {
        const categoryResult = ServiceClassifier.detectCategory(tc.name);
        expect(categoryResult.categoryId).toBe(tc.expectedCategory);
      }

      if (tc.expectedQuality) {
        const quality = ServiceClassifier.detectQuality(tc.name);
        expect(quality).toBe(tc.expectedQuality);
      }

      if (tc.expectedGeo) {
        const geo = ServiceClassifier.detectGeo(tc.name);
        expect(geo).toBe(tc.expectedGeo);
      }
    });
  }
});
