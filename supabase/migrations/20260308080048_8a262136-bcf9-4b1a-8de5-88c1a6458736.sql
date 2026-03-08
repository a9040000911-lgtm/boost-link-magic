
-- Таблица наших услуг (каталог для клиентов)
CREATE TABLE public.services (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  category text NOT NULL DEFAULT 'Uncategorized',
  network text NOT NULL DEFAULT 'Other',
  min_quantity integer NOT NULL DEFAULT 0,
  max_quantity integer NOT NULL DEFAULT 0,
  price numeric NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Маппинг услуг к провайдерам с приоритетом для failover
CREATE TABLE public.service_provider_mappings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id uuid NOT NULL REFERENCES public.services(id) ON DELETE CASCADE,
  provider_service_id uuid NOT NULL REFERENCES public.provider_services(id) ON DELETE CASCADE,
  priority integer NOT NULL DEFAULT 1,
  is_active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (service_id, provider_service_id)
);

-- RLS для services
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage services"
  ON public.services FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Anyone can view enabled services"
  ON public.services FOR SELECT TO authenticated
  USING (is_enabled = true);

-- RLS для service_provider_mappings
ALTER TABLE public.service_provider_mappings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage mappings"
  ON public.service_provider_mappings FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'))
  WITH CHECK (has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can view mappings"
  ON public.service_provider_mappings FOR SELECT TO authenticated
  USING (true);
