
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
      AND (
        role = _role
        OR (_role = 'admin'::app_role AND role = 'ceo'::app_role)
      )
  )
$$;

CREATE POLICY "Investors can view orders" ON public.orders FOR SELECT TO authenticated USING (has_role(auth.uid(), 'investor'::app_role));
CREATE POLICY "Investors can view transactions" ON public.transactions FOR SELECT TO authenticated USING (has_role(auth.uid(), 'investor'::app_role));
CREATE POLICY "Investors can view profiles" ON public.profiles FOR SELECT TO authenticated USING (has_role(auth.uid(), 'investor'::app_role));
CREATE POLICY "Investors can view services" ON public.services FOR SELECT TO authenticated USING (has_role(auth.uid(), 'investor'::app_role));
