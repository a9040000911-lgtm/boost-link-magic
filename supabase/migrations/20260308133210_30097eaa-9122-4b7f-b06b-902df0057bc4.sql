
CREATE TABLE public.guest_inquiries (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL DEFAULT '',
  email text NOT NULL,
  message text NOT NULL,
  status text NOT NULL DEFAULT 'new',
  admin_reply text,
  replied_at timestamp with time zone,
  replied_by uuid,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.guest_inquiries ENABLE ROW LEVEL SECURITY;

-- Anyone can submit a guest inquiry (no auth required)
CREATE POLICY "Anyone can insert guest inquiries"
  ON public.guest_inquiries
  FOR INSERT
  WITH CHECK (true);

-- Admins can manage all guest inquiries
CREATE POLICY "Admins can manage guest inquiries"
  ON public.guest_inquiries
  FOR ALL
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));
