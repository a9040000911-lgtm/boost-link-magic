
-- Drop the old permissive SELECT policy
DROP POLICY IF EXISTS "Authenticated can read active promocodes" ON public.promocodes;

-- Create a secure function to validate a specific promo code
CREATE OR REPLACE FUNCTION public.validate_promocode(p_code text)
RETURNS jsonb
LANGUAGE plpgsql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_promo RECORD;
BEGIN
  SELECT id, code, discount_type, discount_value, applies_to, applies_to_id, 
         min_order_amount, max_uses, used_count, starts_at, expires_at, is_active
  INTO v_promo
  FROM public.promocodes
  WHERE code = UPPER(TRIM(p_code))
    AND is_active = true
  LIMIT 1;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод не найден');
  END IF;

  IF v_promo.starts_at IS NOT NULL AND v_promo.starts_at > now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод ещё не активен');
  END IF;

  IF v_promo.expires_at IS NOT NULL AND v_promo.expires_at < now() THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод истёк');
  END IF;

  IF v_promo.max_uses IS NOT NULL AND v_promo.used_count >= v_promo.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'error', 'Промокод исчерпан');
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'id', v_promo.id,
    'discount_type', v_promo.discount_type,
    'discount_value', v_promo.discount_value,
    'applies_to', v_promo.applies_to,
    'applies_to_id', v_promo.applies_to_id,
    'min_order_amount', v_promo.min_order_amount
  );
END;
$$;

-- Only authenticated users can call validate_promocode
REVOKE EXECUTE ON FUNCTION public.validate_promocode(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.validate_promocode(text) TO authenticated;
