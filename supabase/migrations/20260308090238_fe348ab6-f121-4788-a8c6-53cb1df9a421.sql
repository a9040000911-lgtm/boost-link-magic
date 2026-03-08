
CREATE TABLE IF NOT EXISTS public.support_bans (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  warnings integer NOT NULL DEFAULT 0,
  is_banned boolean NOT NULL DEFAULT false,
  ban_type text, -- '24h' or 'permanent'
  banned_at timestamp with time zone,
  ban_expires_at timestamp with time zone,
  banned_by uuid,
  unban_reason text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  UNIQUE(user_id)
);

ALTER TABLE public.support_bans ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage support bans"
  ON public.support_bans
  FOR ALL
  TO authenticated
  USING (has_role(auth.uid(), 'admin'::app_role))
  WITH CHECK (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view own ban status"
  ON public.support_bans
  FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);
