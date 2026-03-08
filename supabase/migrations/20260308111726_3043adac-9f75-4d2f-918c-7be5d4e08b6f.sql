
CREATE TABLE public.link_patterns (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  platform text NOT NULL,
  link_type text NOT NULL DEFAULT 'unknown',
  pattern text NOT NULL,
  label text NOT NULL,
  extract_username_group integer,
  extract_id_group integer,
  category_id uuid REFERENCES public.categories(id) ON DELETE SET NULL,
  is_enabled boolean NOT NULL DEFAULT true,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.link_patterns ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage link patterns"
ON public.link_patterns
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can read enabled link patterns"
ON public.link_patterns
FOR SELECT
TO anon, authenticated
USING (is_enabled = true);
