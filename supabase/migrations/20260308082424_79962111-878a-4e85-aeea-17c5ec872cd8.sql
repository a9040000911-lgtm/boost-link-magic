
CREATE TABLE public.providers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  key text NOT NULL UNIQUE,
  label text NOT NULL,
  api_url text NOT NULL,
  api_key_env text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  last_health_check timestamptz,
  health_status text DEFAULT 'unknown',
  health_latency_ms integer,
  balance numeric,
  balance_currency text DEFAULT 'RUB',
  services_count integer DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.providers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage providers"
  ON public.providers FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

-- Seed existing providers
INSERT INTO public.providers (key, label, api_url, api_key_env) VALUES
  ('vexboost', 'VexBoost', 'https://vexboost.ru/api/v2', 'VEXBOOST_API_KEY'),
  ('smmpanelus', 'SMMPanelUS', 'https://smmpanelus.com/api/v2', 'SMMPANELUS_API_KEY');
