
-- 1. Fix spartan_members: remove overly permissive public SELECT, add RPC for count
DROP POLICY IF EXISTS "Anyone can view spartan count" ON public.spartan_members;

-- Authenticated users can view only their own row (already exists: "Users can view own spartan status")
-- Add a secure RPC to get the count without exposing rows
CREATE OR REPLACE FUNCTION public.get_spartan_count()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COUNT(*)::integer FROM public.spartan_members;
$$;

-- 2. Revoke public execute on balance manipulation functions
REVOKE EXECUTE ON FUNCTION public.credit_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_idempotency_keys() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.credit_balance(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_balance(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_idempotency_keys() TO service_role;
