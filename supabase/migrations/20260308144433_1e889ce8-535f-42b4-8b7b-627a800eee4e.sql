
-- Drop the old overly permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;

-- New policy: non-admin users can only read public setting keys
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
