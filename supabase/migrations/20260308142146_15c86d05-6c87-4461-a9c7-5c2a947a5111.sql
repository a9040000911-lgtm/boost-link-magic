
-- 1. Remove user INSERT policy on transactions (users should NOT insert directly)
DROP POLICY IF EXISTS "Users can insert own transactions" ON public.transactions;

-- 2. Fix promocodes: restrict to authenticated only
DROP POLICY IF EXISTS "Authenticated can read active promocodes" ON public.promocodes;
CREATE POLICY "Authenticated can read active promocodes"
ON public.promocodes
FOR SELECT
TO authenticated
USING (is_active = true);

-- 3. Fix service_provider_mappings: restrict to authenticated only
DROP POLICY IF EXISTS "Authenticated can view mappings" ON public.service_provider_mappings;
CREATE POLICY "Authenticated can view mappings"
ON public.service_provider_mappings
FOR SELECT
TO authenticated
USING (true);

-- 4. Fix app_settings: restrict to authenticated only
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;
CREATE POLICY "Authenticated can read settings"
ON public.app_settings
FOR SELECT
TO authenticated
USING (true);

-- 5. Fix exchange_rates: restrict to authenticated only
DROP POLICY IF EXISTS "Authenticated can view exchange rates" ON public.exchange_rates;
CREATE POLICY "Authenticated can view exchange rates"
ON public.exchange_rates
FOR SELECT
TO authenticated
USING (true);
