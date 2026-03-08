
-- Response templates for support
CREATE TABLE public.support_response_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  content text NOT NULL,
  category text NOT NULL DEFAULT 'general',
  shortcut text,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_response_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage response templates" ON public.support_response_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Staff can read response templates" ON public.support_response_templates
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'moderator'::app_role));
