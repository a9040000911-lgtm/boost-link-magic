CREATE TABLE public.app_settings (
  key text PRIMARY KEY,
  value text NOT NULL,
  updated_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.app_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage settings" ON public.app_settings FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

CREATE POLICY "Authenticated can read settings" ON public.app_settings FOR SELECT TO authenticated
  USING (true);

-- Seed defaults
INSERT INTO public.app_settings (key, value) VALUES
  ('ticket_auto_close_hours', '24'),
  ('ticket_reopen_window_hours', '48'),
  ('default_markup_percent', '30'),
  ('max_orders_per_day', '100'),
  ('min_order_amount', '1'),
  ('support_welcome_message', 'Здравствуйте! Опишите вашу проблему и мы поможем.'),
  ('maintenance_mode', 'false'),
  ('new_user_bonus', '0'),
  ('min_deposit_amount', '50'),
  ('min_withdraw_amount', '100'),
  ('telegram_notifications', 'true'),
  ('auto_confirm_email', 'false')
ON CONFLICT (key) DO NOTHING;