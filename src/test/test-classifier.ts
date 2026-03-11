import { describe, it, expect } from 'vitest';
import { ServiceClassifier } from '../src/lib/smm-provider-import';

describe('ServiceClassifier', () => {
  const testCases = [
    // Telegram
    { name: 'Telegram подписчики канал', expectedNetwork: 'telegram', expectedCategory: 'followers' },
    { name: 'TG подписчики', expectedNetwork: 'telegram', expectedCategory: 'followers' },
    { name: 'Телеграм просмотры постов', expectedNetwork: 'telegram', expectedCategory: 'views' },
    { name: 'Telegram реакции к постам', expectedNetwork: 'telegram', expectedCategory: 'reactions' },
    { name: 'Telegram бусты канала', expectedNetwork: 'telegram', expectedCategory: 'boosts' },
    { name: 'Telegram закрытый канал подписчики', expectedNetwork: 'telegram', expectedCategory: 'followers' },
    { name: 'Telegram зрители трансляции', expectedNetwork: 'telegram', expectedCategory: 'live_viewers' },
    { name: 'Telegram рассылка сообщений', expectedNetwork: 'telegram', expectedCategory: 'messaging' },
    
    // Instagram
    { name: 'Instagram подписчики', expectedNetwork: 'instagram', expectedCategory: 'followers' },
    { name: 'IG лайки на пост', expectedNetwork: 'instagram', expectedCategory: 'likes' },
    { name: 'Instagram Reels просмотры', expectedNetwork: 'instagram', expectedCategory: 'views' },
    { name: 'Instagram Stories просмотры', expectedNetwork: 'instagram', expectedCategory: 'views' },
    { name: 'Instagram сохранения', expectedNetwork: 'instagram', expectedCategory: 'saves' },
    
    // YouTube
    { name: 'YouTube подписчики канала', expectedNetwork: 'youtube', expectedCategory: 'followers' },
    { name: 'YT просмотры видео', expectedNetwork: 'youtube', expectedCategory: 'views' },
    { name: 'YouTube Shorts лайки', expectedNetwork: 'youtube', expectedCategory: 'likes' },
    { name: 'YouTube live зрители стрима', expectedNetwork: 'youtube', expectedCategory: 'live_viewers' },
    
    // TikTok
    { name: 'TikTok подписчики', expectedNetwork: 'tiktok', expectedCategory: 'followers' },
    { name: 'TT лайки на видео', expectedNetwork: 'tiktok', expectedCategory: 'likes' },
    { name: 'TikTok просмотры', expectedNetwork: 'tiktok', expectedCategory: 'views' },
    { name: 'TikTok live трансляция', expectedNetwork: 'tiktok', expectedCategory: 'live' },
    
    // Spotify
    { name: 'Spotify прослушивания трек', expectedNetwork: 'spotify', expectedCategory: 'plays' },
    { name: 'Spotify месячные слушатели', expectedNetwork: 'spotify', expectedCategory: 'monthly_listeners' },
    
    // New networks
    { name: 'WhatsApp участники группы', expectedNetwork: 'whatsapp', expectedCategory: 'members' },
    { name: 'Discord участники сервера', expectedNetwork: 'discord', expectedCategory: 'members' },
    { name: 'OnlyFans подписчики', expectedNetwork: 'onlyfans', expectedCategory: 'followers' },
    { name: 'Kick зрители стрима', expectedNetwork: 'kick', expectedCategory: 'live_viewers' },
    
    // Cyrillic tests
    { name: 'ТикТок подписчики', expectedNetwork: 'tiktok', expectedCategory: 'followers' },
    { name: 'Ютуб просмотры', expectedNetwork: 'youtube', expectedCategory: 'views' },
    { name: 'Инстаграм лайки', expectedNetwork: 'instagram', expectedCategory: 'likes' },
  ];

  for (const tc of testCases) {
    it(`classifies "${tc.name}"`, () => {
      const result = ServiceClassifier.detectNetwork(tc.name);
      expect(result.networkId).toBe(tc.expectedNetwork);
      
      const catResult = ServiceClassifier.detectCategory(tc.name);
      expect(catResult.categoryId).toBe(tc.expectedCategory);
    });
  }
});
