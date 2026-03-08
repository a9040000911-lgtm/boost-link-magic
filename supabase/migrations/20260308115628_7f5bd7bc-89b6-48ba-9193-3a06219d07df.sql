
CREATE TABLE public.licenses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  license_key text NOT NULL UNIQUE,
  domain text NOT NULL,
  plan text NOT NULL DEFAULT 'standard',
  is_active boolean NOT NULL DEFAULT true,
  expires_at timestamp with time zone,
  max_users integer DEFAULT 0,
  metadata jsonb DEFAULT '{}'::jsonb,
  activated_at timestamp with time zone DEFAULT now(),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.licenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage licenses" ON public.licenses
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
