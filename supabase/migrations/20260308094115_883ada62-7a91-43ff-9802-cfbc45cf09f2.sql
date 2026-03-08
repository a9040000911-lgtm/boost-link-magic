
-- Промокоды
CREATE TABLE public.promocodes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  code text NOT NULL UNIQUE,
  discount_type text NOT NULL DEFAULT 'percent' CHECK (discount_type IN ('percent', 'fixed')),
  discount_value numeric NOT NULL DEFAULT 0,
  max_uses integer DEFAULT NULL,
  used_count integer NOT NULL DEFAULT 0,
  min_order_amount numeric DEFAULT 0,
  applies_to text NOT NULL DEFAULT 'all' CHECK (applies_to IN ('all', 'category', 'service')),
  applies_to_id uuid DEFAULT NULL,
  is_active boolean NOT NULL DEFAULT true,
  starts_at timestamptz DEFAULT now(),
  expires_at timestamptz DEFAULT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promocodes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage promocodes" ON public.promocodes
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Authenticated can read active promocodes" ON public.promocodes
  FOR SELECT TO authenticated
  USING (is_active = true);

-- Использования промокодов
CREATE TABLE public.promocode_usages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  promocode_id uuid NOT NULL REFERENCES public.promocodes(id) ON DELETE CASCADE,
  user_id uuid NOT NULL,
  order_id uuid REFERENCES public.orders(id) ON DELETE SET NULL,
  discount_amount numeric NOT NULL DEFAULT 0,
  used_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.promocode_usages ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view all usages" ON public.promocode_usages
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own usages" ON public.promocode_usages
  FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own usages" ON public.promocode_usages
  FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);
