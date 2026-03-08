
CREATE TABLE public.ai_api_keys (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL DEFAULT 'gemini',
  label text NOT NULL DEFAULT '',
  api_key text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  usage_count bigint NOT NULL DEFAULT 0,
  last_used_at timestamptz,
  error_count integer NOT NULL DEFAULT 0,
  last_error text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.ai_api_keys ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage ai_api_keys"
ON public.ai_api_keys
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
