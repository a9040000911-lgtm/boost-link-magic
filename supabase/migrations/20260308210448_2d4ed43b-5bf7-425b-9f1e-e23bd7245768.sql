
-- The previous migration partially applied. Re-run only what's needed.
-- Check: the policies and view may already exist from the failed transaction.
-- Use IF NOT EXISTS / IF EXISTS patterns.

-- Ensure provider_services policy exists with correct role
DROP POLICY IF EXISTS "Authenticated can view enabled services" ON public.provider_services;
CREATE POLICY "Authenticated can view enabled services" ON public.provider_services FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Ensure service_provider_mappings is restricted
DROP POLICY IF EXISTS "Authenticated can view mappings" ON public.service_provider_mappings;
DROP POLICY IF EXISTS "Staff can view mappings" ON public.service_provider_mappings;
CREATE POLICY "Staff can view mappings" ON public.service_provider_mappings FOR SELECT
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'moderator'::app_role));

-- Create view for provider_services (hide cost columns)
CREATE OR REPLACE VIEW public.provider_services_public
WITH (security_invoker = on) AS
  SELECT id, name, description, category, network, type,
         min_quantity, max_quantity, can_cancel, can_refill,
         is_enabled, provider, provider_service_id, created_at, updated_at
  FROM public.provider_services
  WHERE is_enabled = true;
