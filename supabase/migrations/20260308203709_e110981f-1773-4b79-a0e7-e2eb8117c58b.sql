
CREATE TABLE public.provider_cleanup_rules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  field text NOT NULL DEFAULT 'network',
  match_value text NOT NULL,
  replace_value text NOT NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_cleanup_rules ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage cleanup rules"
  ON public.provider_cleanup_rules
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
