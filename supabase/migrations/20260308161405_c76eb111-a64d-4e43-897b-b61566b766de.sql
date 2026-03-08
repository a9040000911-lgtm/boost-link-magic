
ALTER TABLE public.services
  ADD COLUMN IF NOT EXISTS speed text NOT NULL DEFAULT 'medium',
  ADD COLUMN IF NOT EXISTS guarantee text NOT NULL DEFAULT 'none';

COMMENT ON COLUMN public.services.speed IS 'Скорость: instant, fast, medium, slow, gradual';
COMMENT ON COLUMN public.services.guarantee IS 'Гарантия: none, 7d, 30d, 60d, lifetime';
