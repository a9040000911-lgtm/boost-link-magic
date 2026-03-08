-- Drop restrictive policies and recreate as permissive (default)
DROP POLICY IF EXISTS "Anyone can view enabled services" ON public.services;
CREATE POLICY "Anyone can view enabled services" ON public.services FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "Anyone can view enabled categories" ON public.categories;
CREATE POLICY "Anyone can view enabled categories" ON public.categories FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "Anyone can view published pages" ON public.pages;
CREATE POLICY "Anyone can view published pages" ON public.pages FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can view published FAQ" ON public.faq_items;
CREATE POLICY "Anyone can view published FAQ" ON public.faq_items FOR SELECT USING (is_published = true);

DROP POLICY IF EXISTS "Anyone can view approved reviews" ON public.reviews;
CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT USING (is_approved = true);

DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;
CREATE POLICY "Authenticated can read settings" ON public.app_settings FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can read active promocodes" ON public.promocodes;
CREATE POLICY "Authenticated can read active promocodes" ON public.promocodes FOR SELECT USING (is_active = true);

DROP POLICY IF EXISTS "Authenticated can view exchange rates" ON public.exchange_rates;
CREATE POLICY "Authenticated can view exchange rates" ON public.exchange_rates FOR SELECT USING (true);

DROP POLICY IF EXISTS "Authenticated can view enabled services" ON public.provider_services;
CREATE POLICY "Authenticated can view enabled services" ON public.provider_services FOR SELECT USING (is_enabled = true);

DROP POLICY IF EXISTS "Authenticated can view mappings" ON public.service_provider_mappings;
CREATE POLICY "Authenticated can view mappings" ON public.service_provider_mappings FOR SELECT USING (true);