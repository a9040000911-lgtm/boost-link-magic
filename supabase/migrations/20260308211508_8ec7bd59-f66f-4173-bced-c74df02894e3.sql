
-- 1. Support topics table
CREATE TABLE public.support_topics (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  icon text DEFAULT '📋',
  requires_order_id boolean NOT NULL DEFAULT false,
  sort_order integer NOT NULL DEFAULT 0,
  is_enabled boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.support_topics ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage support topics" ON public.support_topics
  FOR ALL USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Anyone can view enabled topics" ON public.support_topics
  FOR SELECT USING (is_enabled = true);

-- 2. Add topic_id and order_id to support_tickets
ALTER TABLE public.support_tickets
  ADD COLUMN topic_id uuid REFERENCES public.support_topics(id),
  ADD COLUMN order_id uuid REFERENCES public.orders(id);

-- 3. Seed default topics
INSERT INTO public.support_topics (name, icon, requires_order_id, sort_order) VALUES
  ('Проблема с заказом', '📦', true, 1),
  ('Не начислены услуги', '⚠️', true, 2),
  ('Возврат средств', '💰', true, 3),
  ('Проблема с оплатой', '💳', false, 4),
  ('Вопрос по услуге', '❓', false, 5),
  ('Технические проблемы', '🔧', false, 6),
  ('Предложение / отзыв', '💡', false, 7),
  ('Другое', '📝', false, 8);
