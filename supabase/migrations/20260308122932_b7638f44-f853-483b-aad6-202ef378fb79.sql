
-- Table for managing multiple Telegram bots
CREATE TABLE public.telegram_bots (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  token text NOT NULL DEFAULT '',
  bot_type text NOT NULL DEFAULT 'support', -- 'support' | 'orders' | 'custom'
  is_enabled boolean NOT NULL DEFAULT false,
  welcome_message text NOT NULL DEFAULT '👋 Добро пожаловать!',
  confirm_message text NOT NULL DEFAULT '✅ Сообщение получено!',
  description text,
  webhook_url text,
  webhook_active boolean NOT NULL DEFAULT false,
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  template_id text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.telegram_bots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage bots" ON public.telegram_bots
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

-- Table for reusable button definitions
CREATE TABLE public.bot_button_library (
  id text PRIMARY KEY, -- e.g. 'btn_catalog', 'btn_support', 'btn_balance'
  label text NOT NULL,
  icon text, -- emoji
  action_type text NOT NULL DEFAULT 'message', -- 'message' | 'url' | 'submenu' | 'callback'
  action_value text,
  category text NOT NULL DEFAULT 'general', -- 'navigation' | 'support' | 'orders' | 'account' | 'general'
  description text,
  is_system boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_button_library ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage button library" ON public.bot_button_library
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read button library" ON public.bot_button_library
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));

-- Table for bot templates
CREATE TABLE public.bot_templates (
  id text PRIMARY KEY, -- e.g. 'support_basic', 'orders_full'
  name text NOT NULL,
  description text,
  bot_type text NOT NULL DEFAULT 'support',
  category text NOT NULL DEFAULT 'support', -- 'support' | 'orders'
  welcome_message text NOT NULL DEFAULT '👋 Добро пожаловать!',
  confirm_message text NOT NULL DEFAULT '✅ Сообщение получено!',
  buttons jsonb NOT NULL DEFAULT '[]'::jsonb,
  settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  preview_image text,
  sort_order integer NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.bot_templates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage templates" ON public.bot_templates
  FOR ALL TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Admins can read templates" ON public.bot_templates
  FOR SELECT TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role));
