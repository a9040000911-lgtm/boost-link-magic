
-- User roles system
CREATE TYPE public.app_role AS ENUM ('admin', 'moderator', 'user');

CREATE TABLE public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  role app_role NOT NULL,
  UNIQUE (user_id, role)
);

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role app_role)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.user_roles
    WHERE user_id = _user_id
      AND role = _role
  )
$$;

CREATE POLICY "Users can view own roles"
  ON public.user_roles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Provider services table
CREATE TABLE public.provider_services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider_service_id integer NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL,
  network text NOT NULL,
  description text,
  type text NOT NULL DEFAULT 'Default',
  rate numeric NOT NULL DEFAULT 0,
  min_quantity integer NOT NULL DEFAULT 0,
  max_quantity integer NOT NULL DEFAULT 0,
  our_price numeric,
  markup_percent numeric DEFAULT 30,
  is_enabled boolean NOT NULL DEFAULT false,
  can_cancel boolean NOT NULL DEFAULT false,
  can_refill boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.provider_services ENABLE ROW LEVEL SECURITY;

-- Anyone authenticated can read enabled services
CREATE POLICY "Authenticated can view enabled services"
  ON public.provider_services FOR SELECT
  TO authenticated
  USING (is_enabled = true);

-- Admins can manage all services
CREATE POLICY "Admins can manage services"
  ON public.provider_services FOR ALL
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- Admin policy to view ALL services (including disabled)
CREATE POLICY "Admins can view all services"
  ON public.provider_services FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'));
