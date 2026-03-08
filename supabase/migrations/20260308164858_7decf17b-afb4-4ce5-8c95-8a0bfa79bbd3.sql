
-- 1. CRITICAL FIX: Restrict profile UPDATE to safe columns only
-- Drop the permissive UPDATE policy that allows balance/discount modification
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;

-- Create SECURITY DEFINER function for safe profile updates
CREATE OR REPLACE FUNCTION public.update_own_profile(
  p_display_name text DEFAULT NULL,
  p_avatar_url text DEFAULT NULL,
  p_bio text DEFAULT NULL,
  p_telegram_chat_id text DEFAULT NULL
) RETURNS void LANGUAGE plpgsql SECURITY DEFINER SET search_path = 'public' AS $$
BEGIN
  UPDATE profiles SET
    display_name = COALESCE(p_display_name, display_name),
    avatar_url = COALESCE(p_avatar_url, avatar_url),
    bio = COALESCE(p_bio, bio),
    telegram_chat_id = COALESCE(p_telegram_chat_id, telegram_chat_id),
    updated_at = now()
  WHERE id = auth.uid();
END;
$$;

-- Re-create a restricted UPDATE policy: users can only update safe columns
-- We keep the policy but add admin override for full access
CREATE POLICY "Users can update own safe profile fields"
ON public.profiles
FOR UPDATE
TO authenticated
USING (auth.uid() = id)
WITH CHECK (
  auth.uid() = id
  AND balance = (SELECT balance FROM public.profiles WHERE id = auth.uid())
  AND discount = (SELECT discount FROM public.profiles WHERE id = auth.uid())
);

-- Admins need full UPDATE access
CREATE POLICY "Admins can update all profiles"
ON public.profiles
FOR UPDATE
TO authenticated
USING (public.has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (public.has_role(auth.uid(), 'admin'::app_role));

-- 2. Remove license_% from public SELECT policy on app_settings
DROP POLICY IF EXISTS "Users can read public settings" ON public.app_settings;
CREATE POLICY "Users can read public settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (
  key LIKE 'contact_%'
  OR key LIKE 'widget_%'
  OR key LIKE 'plan_%'
  OR key LIKE 'site_%'
);
