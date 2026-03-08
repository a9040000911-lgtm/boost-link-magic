
CREATE TABLE public.unrecognized_links (
  id uuid NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  url text NOT NULL,
  user_agent text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  resolved boolean NOT NULL DEFAULT false,
  resolved_at timestamp with time zone,
  notes text
);

ALTER TABLE public.unrecognized_links ENABLE ROW LEVEL SECURITY;

-- Anyone can insert (even anonymous visitors)
CREATE POLICY "Anyone can insert unrecognized links"
ON public.unrecognized_links
FOR INSERT
TO anon, authenticated
WITH CHECK (true);

-- Admins can manage
CREATE POLICY "Admins can manage unrecognized links"
ON public.unrecognized_links
FOR ALL
TO authenticated
USING (has_role(auth.uid(), 'admin'::app_role))
WITH CHECK (has_role(auth.uid(), 'admin'::app_role));
