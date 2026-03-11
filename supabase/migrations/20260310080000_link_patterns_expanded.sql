-- Migration: Expanded Link Patterns for Smart Analyzer
-- Date: 2026-03-10 08:00:00

INSERT INTO public.link_patterns (platform, link_type, pattern, label, extract_username_group, extract_id_group, sort_order)
VALUES
  -- Telegram
  ('telegram', 'post', '^t\.me\/([A-Za-z0-9_]+)\/(\d+)\?comment=(\d+)$', 'Комментарий', 1, 3, 10),
  ('telegram', 'post', '^t\.me\/([A-Za-z0-9_]+)\/(\d+)$', 'Пост', 1, 2, 20),
  ('telegram', 'post', '^t\.me\/c\/(\d+)\/(\d+)$', 'Пост (приватный)', null, 2, 30),
  ('telegram', 'invite', '^t\.me\/(?:\+|joinchat\/)([A-Za-z0-9_-]+)$', 'Инвайт-ссылка', null, 1, 40),
  ('telegram', 'story', '^t\.me\/s\/([A-Za-z0-9_]+)\/(\d+)$', 'Stories', 1, 2, 50),
  ('telegram', 'boost', '^t\.me\/([A-Za-z0-9_]+)\?boost$', 'Буст канала', 1, null, 60),
  ('telegram', 'channel', '^t\.me\/([A-Za-z0-9_]{5,})\/?$', 'Канал / Группа', 1, null, 70),
  ('telegram', 'stars', '^t\.me\/invoice\/([A-Za-z0-9_-]+)$', 'Оплата Stars', null, 1, 80),

  -- VK
  ('vk', 'comment', '^vk\.com\/wall(-?\d+_\d+)\?reply=(\d+)$', 'Комментарий', null, 2, 90),
  ('vk', 'post', '^vk\.com\/wall(-?\d+_\d+)$', 'Пост', null, 1, 100),
  ('vk', 'photo', 'z=photo(-?\d+_\d+)', 'Фото (альбом)', null, 1, 105),
  ('vk', 'photo', '^vk\.com\/photo(-?\d+_\d+)$', 'Фото', null, 1, 110),
  ('vk', 'video', '^vk\.com\/video\/playlist\/(-?\d+_\d+)$', 'Плейлист видео', null, 1, 115),
  ('vk', 'video', '^vk\.com\/video(-?\d+_\d+)$', 'Видео', null, 1, 120),
  ('vk', 'video', '^vk\.com\/clip(-?\d+_\d+)$', 'Клип', null, 1, 130),
  ('vk', 'audio', '^vk\.com\/audio_playlist(-?\d+_\d+)$', 'Плейлист', null, 1, 131),
  ('vk', 'audio', '^vk\.com\/music\/playlist\/(-?\d+_\d+)$', 'Плейлист', null, 1, 132),
  ('vk', 'audio', '^vk\.com\/audio(-?\d+_\d+)$', 'Аудиозапись', null, 1, 133),
  ('vk', 'podcast', '^vk\.com\/podcast(-?\d+_\d+)$', 'Подкаст', null, 1, 134),
  ('vk', 'product', '^vk\.com\/product(-?\d+_\d+)$', 'Товар', null, 1, 135),
  ('vk', 'product', '^vk\.com\/market(-\d+)\?w=product(-?\d+_\d+)$', 'Товар', null, 2, 136),
  ('vk', 'story', '^vk\.com\/story(-?\d+_\d+)$', 'История', null, 1, 138),
  ('vk', 'channel', '^vk\.com\/(club|public|event)(\d+)$', 'Сообщество', null, 2, 140),
  ('vk', 'profile', '^vk\.com\/id(\d+)$', 'Профиль', null, 1, 150),

  -- YouTube
  ('youtube', 'shorts', '^youtube\.com\/shorts\/([A-Za-z0-9_-]+)$', 'Shorts', null, 1, 200),
  ('youtube', 'live', '^youtube\.com\/live\/([A-Za-z0-9_-]+)$', 'Прямой эфир', null, 1, 210),
  ('youtube', 'comment', '[&?]lc=([A-Za-z0-9_-]+)', 'Комментарий', null, 1, 215),
  ('youtube', 'video', '^youtube\.com\/watch\?v=([A-Za-z0-9_-]+)$', 'Видео', null, 1, 220),
  ('youtube', 'channel', '^youtube\.com\/@([A-Za-z0-9_.-]+)$', 'Канал', 1, null, 230),

  -- Twitch
  ('twitch', 'channel', '^twitch\.tv\/([A-Za-z0-9_]{3,})\/?$', 'Канал', 1, null, 300),
  ('twitch', 'video', '^twitch\.tv\/videos\/(\d+)$', 'Видео (VOD)', null, 1, 310),
  ('twitch', 'reel', '^clips\.twitch\.tv\/([A-Za-z0-9_-]+)$', 'Клип', null, 1, 320),

  -- VK Play
  ('vkplay', 'channel', '^vkplay\.live\/([A-Za-z0-9_-]+)$', 'Канал', 1, null, 400),
  ('vkplay', 'channel', '^live\.vkvideo\.ru\/([A-Za-z0-9_-]+)$', 'Канал', 1, null, 410),

  -- Dzen
  ('dzen', 'video', 'dzen\.ru\/video\/watch\/([A-Za-z0-9_-]+)', 'Видео', null, 1, 500),
  ('dzen', 'shorts', 'dzen\.ru\/shorts\/([A-Za-z0-9_-]+)', 'Ролик', null, 1, 510),
  ('dzen', 'article', 'dzen\.ru\/a\/([A-Za-z0-9_-]+)', 'Статья', null, 1, 520),
  ('dzen', 'channel', 'dzen\.ru\/([a-z0-9._-]+)', 'Канал', 1, null, 530),

  -- OK
  ('ok', 'profile', 'ok\.ru\/profile\/(\d+)', 'Профиль', null, 1, 600),
  ('ok', 'channel', 'ok\.ru\/group\/(\d+)', 'Группа', null, 1, 610),
  ('ok', 'post', 'ok\.ru\/group\/\d+\/topic\/(\d+)', 'Тема', null, 1, 620),
  ('ok', 'video', 'ok\.ru\/video\/(\d+)', 'Видео', null, 1, 630),

  -- Likee
  ('likee', 'profile', 'likee\.video\/@([a-zA-Z0-9_.]+)', 'Профиль', 1, null, 700),
  ('likee', 'video', 'likee\.video\/v\/([A-Za-z0-9_-]+)', 'Видео', null, 1, 710),
  ('likee', 'profile', 'l\.likee\.video\/p\/([A-Za-z0-9_-]+)', 'Профиль', null, 1, 720),
  ('likee', 'video', 'l\.likee\.video\/v\/([A-Za-z0-9_-]+)', 'Видео', null, 1, 730),

  -- Threads
  ('threads', 'profile', 'threads\.net\/@([a-zA-z0-9_.]+)', 'Профиль', 1, null, 800),
  ('threads', 'post', 'threads\.net\/@[^\/]+\/post\/([A-Za-z0-9_-]+)', 'Пост', null, 1, 810),

  -- Facebook
  ('facebook', 'profile', 'facebook\.com\/profile\.php\?id=(\d+)', 'Профиль', null, 1, 900),
  ('facebook', 'profile', 'facebook\.com\/([a-zA-Z0-9.]+)', 'Профиль/Страница', 1, null, 910),
  ('facebook', 'post', 'facebook\.com\/[^\/]+\/posts\/(\d+)', 'Пост', null, 1, 920),
  ('facebook', 'reel', 'facebook\.com\/reel\/(\d+)', 'Reels', null, 1, 930),

  -- X / Twitter
  ('x', 'profile', '(x|twitter)\.com\/([a-zA-Z0-9_]{1,15})', 'Профиль', 2, null, 1000),
  ('x', 'post', '(x|twitter)\.com\/[^\/]+\/status\/(\d+)', 'Пост', null, 2, 1010)
ON CONFLICT (platform, pattern) DO UPDATE SET
  link_type = EXCLUDED.link_type,
  label = EXCLUDED.label,
  extract_username_group = EXCLUDED.extract_username_group,
  extract_id_group = EXCLUDED.extract_id_group;
