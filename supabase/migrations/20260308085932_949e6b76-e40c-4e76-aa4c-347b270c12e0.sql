
-- Add rate_currency to providers (currency of service rates/prices)
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS rate_currency text NOT NULL DEFAULT 'RUB';

-- Exchange rates table
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  base_currency text NOT NULL DEFAULT 'USD',
  target_currency text NOT NULL DEFAULT 'RUB',
  rate numeric NOT NULL DEFAULT 0,
  source text NOT NULL DEFAULT 'cbr',
  fetched_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(base_currency, target_currency)
);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read exchange rates
CREATE POLICY "Authenticated can view exchange rates"
  ON public.exchange_rates
  FOR SELECT
  TO authenticated
  USING (true);

-- Only admins can manage exchange rates
CREATE POLICY "Admins can manage exchange rates"
  ON public.exchange_rates
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
