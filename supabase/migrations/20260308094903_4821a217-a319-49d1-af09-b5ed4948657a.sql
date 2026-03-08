
CREATE TABLE public.pages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NOT NULL UNIQUE,
  title text NOT NULL DEFAULT '',
  content text DEFAULT '',
  is_published boolean NOT NULL DEFAULT false,
  meta_title text DEFAULT '',
  meta_description text DEFAULT '',
  og_image text DEFAULT '',
  custom_css text DEFAULT '',
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.pages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage pages"
  ON public.pages FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published pages"
  ON public.pages FOR SELECT TO anon, authenticated
  USING (is_published = true);
