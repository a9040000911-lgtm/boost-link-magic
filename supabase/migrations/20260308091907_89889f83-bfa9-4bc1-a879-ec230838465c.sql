CREATE TABLE public.categories (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  name text NOT NULL,
  slug text NOT NULL UNIQUE,
  icon text DEFAULT NULL,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage categories" ON public.categories FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view enabled categories" ON public.categories FOR SELECT TO authenticated
  USING (is_enabled = true);

-- Seed existing categories from services
INSERT INTO public.categories (name, slug, sort_order)
SELECT DISTINCT category, lower(replace(replace(category, ' ', '-'), '/', '-')), row_number() OVER (ORDER BY category)
FROM public.services
WHERE category IS NOT NULL AND category != ''
ON CONFLICT (slug) DO NOTHING;