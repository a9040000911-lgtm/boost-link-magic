
-- 1. Atomic balance deduction (returns new balance or -1 if insufficient)
CREATE OR REPLACE FUNCTION public.deduct_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE profiles
  SET balance = balance - p_amount,
      updated_at = now()
  WHERE id = p_user_id
    AND balance >= p_amount
  RETURNING balance INTO v_new_balance;
  
  IF NOT FOUND THEN
    RETURN -1;
  END IF;
  
  RETURN v_new_balance;
END;
$$;

-- 2. Atomic balance credit (always succeeds)
CREATE OR REPLACE FUNCTION public.credit_balance(
  p_user_id UUID,
  p_amount NUMERIC
)
RETURNS NUMERIC
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_new_balance NUMERIC;
BEGIN
  UPDATE profiles
  SET balance = balance + p_amount,
      updated_at = now()
  WHERE id = p_user_id
  RETURNING balance INTO v_new_balance;
  
  IF NOT FOUND THEN
    RETURN -1;
  END IF;
  
  RETURN v_new_balance;
END;
$$;

-- 3. Idempotency table for orders
CREATE TABLE IF NOT EXISTS public.order_idempotency (
  idempotency_key TEXT PRIMARY KEY,
  order_id UUID,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.order_idempotency ENABLE ROW LEVEL SECURITY;

CREATE POLICY "No direct access to idempotency" ON public.order_idempotency
  FOR ALL TO authenticated
  USING (false);

-- 4. Financial anomaly alerts table
CREATE TABLE IF NOT EXISTS public.financial_alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  alert_type TEXT NOT NULL,
  severity TEXT NOT NULL DEFAULT 'medium',
  user_id UUID,
  actor_id UUID,
  details JSONB DEFAULT '{}'::jsonb,
  resolved BOOLEAN NOT NULL DEFAULT false,
  resolved_by UUID,
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.financial_alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage financial alerts" ON public.financial_alerts
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- 5. Clean up old idempotency keys (older than 24h) - for periodic cleanup
CREATE OR REPLACE FUNCTION public.cleanup_idempotency_keys()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.order_idempotency
  WHERE created_at < now() - interval '24 hours';
$$;
