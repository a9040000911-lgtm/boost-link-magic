
CREATE OR REPLACE FUNCTION public.increment_ai_key_usage(key_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE ai_api_keys
  SET usage_count = usage_count + 1,
      last_used_at = now(),
      updated_at = now()
  WHERE id = key_id;
$$;

CREATE OR REPLACE FUNCTION public.increment_ai_key_error(key_id uuid)
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  UPDATE ai_api_keys
  SET error_count = error_count + 1,
      updated_at = now()
  WHERE id = key_id;
$$;
