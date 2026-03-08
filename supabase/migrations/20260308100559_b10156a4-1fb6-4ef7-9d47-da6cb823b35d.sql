
-- FAQ items table
CREATE TABLE public.faq_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  question text NOT NULL,
  answer text NOT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_published boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.faq_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage FAQ" ON public.faq_items FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view published FAQ" ON public.faq_items FOR SELECT
  USING (is_published = true);

-- Reviews table
CREATE TABLE public.reviews (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  name text NOT NULL DEFAULT '',
  rating integer NOT NULL DEFAULT 5 CHECK (rating >= 1 AND rating <= 5),
  message text NOT NULL,
  is_approved boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage reviews" ON public.reviews FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view approved reviews" ON public.reviews FOR SELECT
  USING (is_approved = true);

CREATE POLICY "Authenticated can insert reviews" ON public.reviews FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Bug reports table
CREATE TABLE public.bug_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  title text NOT NULL,
  description text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  priority text NOT NULL DEFAULT 'normal',
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bug_reports ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bug reports" ON public.bug_reports FOR ALL
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can insert bug reports" ON public.bug_reports FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view own bug reports" ON public.bug_reports FOR SELECT
  USING (auth.uid() = user_id);

-- Widget toggle settings
INSERT INTO public.app_settings (key, value) VALUES ('widget_reviews_enabled', 'true') ON CONFLICT (key) DO NOTHING;
INSERT INTO public.app_settings (key, value) VALUES ('widget_bugreport_enabled', 'true') ON CONFLICT (key) DO NOTHING;
