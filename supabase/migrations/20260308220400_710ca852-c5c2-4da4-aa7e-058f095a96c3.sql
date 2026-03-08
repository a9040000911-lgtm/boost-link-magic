-- Fix 1: Drop overly permissive app_settings policy
DROP POLICY IF EXISTS "Authenticated can read settings" ON public.app_settings;

-- Fix 2: Drop overly permissive spartan_members policy
DROP POLICY IF EXISTS "Anyone can view spartan count" ON public.spartan_members;