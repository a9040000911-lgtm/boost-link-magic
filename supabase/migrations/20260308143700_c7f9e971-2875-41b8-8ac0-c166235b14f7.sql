
-- Revoke PUBLIC execute on sensitive SECURITY DEFINER functions
REVOKE EXECUTE ON FUNCTION public.credit_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.deduct_balance(uuid, numeric) FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_idempotency_keys() FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.cleanup_expired_2fa_codes() FROM PUBLIC;

-- Grant only to service_role (used by Edge Functions)
GRANT EXECUTE ON FUNCTION public.credit_balance(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.deduct_balance(uuid, numeric) TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_idempotency_keys() TO service_role;
GRANT EXECUTE ON FUNCTION public.cleanup_expired_2fa_codes() TO service_role;
