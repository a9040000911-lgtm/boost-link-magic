
INSERT INTO public.platforms (key, name, domains, icon, color, is_enabled, sort_order)
VALUES
  ('twitter', 'Twitter / X', ARRAY['twitter.com', 'x.com'], 'twitter', '0 0% 15%', true, 6),
  ('facebook', 'Facebook', ARRAY['facebook.com', 'fb.com', 'fb.me'], 'facebook', '220 70% 50%', true, 7),
  ('twitch', 'Twitch', ARRAY['twitch.tv'], 'twitch', '270 60% 55%', true, 8),
  ('odnoklassniki', 'Одноклассники', ARRAY['ok.ru', 'odnoklassniki.ru'], 'odnoklassniki', '25 90% 55%', true, 9),
  ('likee', 'Likee', ARRAY['likee.video', 'like.video'], 'likee', '340 80% 55%', true, 10),
  ('dzen', 'Дзен', ARRAY['dzen.ru', 'zen.yandex.ru'], 'dzen', '45 90% 55%', true, 11),
  ('max', 'MAX', ARRAY['max.ru'], 'max', '235 60% 55%', true, 12),
  ('spotify', 'Spotify', ARRAY['spotify.com', 'open.spotify.com'], 'spotify', '140 70% 45%', true, 13),
  ('traffic', 'Трафик на сайт', ARRAY[]::text[], 'globe', '155 70% 45%', true, 14)
ON CONFLICT (key) DO UPDATE SET
  name = EXCLUDED.name,
  domains = EXCLUDED.domains,
  icon = EXCLUDED.icon,
  color = EXCLUDED.color,
  is_enabled = EXCLUDED.is_enabled,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();
