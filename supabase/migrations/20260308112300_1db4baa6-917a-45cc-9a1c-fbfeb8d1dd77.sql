
CREATE TABLE public.platforms (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  key text NOT NULL UNIQUE,
  name text NOT NULL,
  domains text[] NOT NULL DEFAULT '{}',
  icon text,
  color text,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.platforms ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage platforms"
ON public.platforms
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled platforms"
ON public.platforms
FOR SELECT
TO anon, authenticated
USING (is_enabled = true);

-- Seed built-in platforms
INSERT INTO public.platforms (key, name, domains, icon, color, sort_order) VALUES
  ('instagram', 'Instagram', ARRAY['instagram.com', 'instagr.am'], 'instagram', '330 80% 60%', 1),
  ('youtube', 'YouTube', ARRAY['youtube.com', 'youtu.be'], 'youtube', '0 80% 55%', 2),
  ('tiktok', 'TikTok', ARRAY['tiktok.com', 'vm.tiktok.com'], 'music', '170 80% 50%', 3),
  ('telegram', 'Telegram', ARRAY['t.me', 'telegram.org'], 'send', '200 80% 55%', 4),
  ('vk', 'ВКонтакте', ARRAY['vk.com', 'vk.ru'], 'message-circle', '215 70% 55%', 5);
