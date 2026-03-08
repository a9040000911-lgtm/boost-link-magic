
-- 1. Remove sensitive payment credentials from app_settings
DELETE FROM public.app_settings WHERE key IN ('yookassa_secret_key', 'yookassa_shop_id');

-- 2. Fix the SELECT policy to require authenticated role
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;
CREATE POLICY "Authenticated can read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);
