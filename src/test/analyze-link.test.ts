import { describe, it, expect } from 'vitest';
import { analyzeLink } from '@/lib/smm-data';

describe('analyzeLink', () => {
  it('detects Instagram post', () => {
    const result = analyzeLink('https://www.instagram.com/p/ABC123xyz/');
    expect(result?.platform).toBe('instagram');
    expect(result?.linkType).toBe('post');
    expect(result?.contentId).toBe('ABC123xyz');
  });

  it('detects Instagram Reel', () => {
    const result = analyzeLink('https://www.instagram.com/reel/CxYz123/');
    expect(result?.platform).toBe('instagram');
    expect(result?.linkType).toBe('reel');
  });

  it('detects Instagram Story', () => {
    const result = analyzeLink('https://www.instagram.com/stories/username123/');
    expect(result?.platform).toBe('instagram');
    expect(result?.linkType).toBe('story');
    expect(result?.username).toBe('username123');
  });

  it('detects Instagram profile', () => {
    const result = analyzeLink('https://www.instagram.com/elonmusk/');
    expect(result?.platform).toBe('instagram');
    expect(result?.linkType).toBe('profile');
    expect(result?.username).toBe('elonmusk');
  });

  it('detects YouTube Shorts', () => {
    const result = analyzeLink('https://www.youtube.com/shorts/dQw4w9WgXcQ');
    expect(result?.platform).toBe('youtube');
    expect(result?.linkType).toBe('shorts');
    expect(result?.contentId).toBe('dQw4w9WgXcQ');
  });

  it('detects YouTube video (watch)', () => {
    const result = analyzeLink('https://www.youtube.com/watch?v=dQw4w9WgXcQ');
    expect(result?.platform).toBe('youtube');
    expect(result?.linkType).toBe('video');
    expect(result?.contentId).toBe('dQw4w9WgXcQ');
  });

  it('detects YouTube short URL', () => {
    const result = analyzeLink('https://youtu.be/dQw4w9WgXcQ');
    expect(result?.platform).toBe('youtube');
    expect(result?.linkType).toBe('video');
  });

  it('detects YouTube channel (@)', () => {
    const result = analyzeLink('https://www.youtube.com/@MrBeast');
    expect(result?.platform).toBe('youtube');
    expect(result?.linkType).toBe('channel');
    expect(result?.username).toBe('MrBeast');
  });

  it('detects YouTube playlist', () => {
    const result = analyzeLink('https://www.youtube.com/playlist?list=PLrAXtmErZgOeiKm4sgNOknGvNjby9efdf');
    expect(result?.platform).toBe('youtube');
    expect(result?.linkType).toBe('playlist');
  });

  it('detects Telegram channel', () => {
    const result = analyzeLink('https://t.me/durov');
    expect(result?.platform).toBe('telegram');
    expect(result?.linkType).toBe('channel');
    expect(result?.username).toBe('durov');
  });

  it('detects Telegram post', () => {
    const result = analyzeLink('https://t.me/durov/123');
    expect(result?.platform).toBe('telegram');
    expect(result?.linkType).toBe('post');
    expect(result?.username).toBe('durov');
    expect(result?.contentId).toBe('123');
  });

  it('detects TikTok video', () => {
    const result = analyzeLink('https://www.tiktok.com/@username/video/7123456789');
    expect(result?.platform).toBe('tiktok');
    expect(result?.linkType).toBe('video');
    expect(result?.username).toBe('username');
  });

  it('detects TikTok profile', () => {
    const result = analyzeLink('https://www.tiktok.com/@cooluser');
    expect(result?.platform).toBe('tiktok');
    expect(result?.linkType).toBe('profile');
    expect(result?.username).toBe('cooluser');
  });

  it('detects VK wall post', () => {
    const result = analyzeLink('https://vk.com/wall-123_456');
    expect(result?.platform).toBe('vk');
    expect(result?.linkType).toBe('wall');
  });

  it('detects VK community', () => {
    const result = analyzeLink('https://vk.com/club12345');
    expect(result?.platform).toBe('vk');
    expect(result?.linkType).toBe('group');
  });

  it('returns null for unknown URL', () => {
    const result = analyzeLink('https://example.com/page');
    expect(result).toBeNull();
  });
});
