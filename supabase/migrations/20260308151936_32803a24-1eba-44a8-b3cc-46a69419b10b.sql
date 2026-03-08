
DROP POLICY IF EXISTS "Users can read public settings" ON public.app_settings;
CREATE POLICY "Users can read public settings"
ON public.app_settings
FOR SELECT
USING (
  key ~~ 'contact_%'
  OR key ~~ 'widget_%'
  OR key ~~ 'plan_%'
  OR key ~~ 'site_%'
  OR key ~~ 'license_%'
);
