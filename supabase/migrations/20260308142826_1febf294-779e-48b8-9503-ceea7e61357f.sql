
-- Add telegram_chat_id to profiles for staff 2FA via Telegram
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS telegram_chat_id text;

-- Create table for 2FA OTP codes
CREATE TABLE public.staff_2fa_codes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  code text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  expires_at timestamptz NOT NULL DEFAULT (now() + interval '5 minutes'),
  used boolean NOT NULL DEFAULT false,
  ip_address text
);

ALTER TABLE public.staff_2fa_codes ENABLE ROW LEVEL SECURITY;

-- No direct access - only via edge functions with service role
CREATE POLICY "No direct access to 2fa codes"
ON public.staff_2fa_codes
FOR ALL
USING (false);

-- Index for fast lookups
CREATE INDEX idx_staff_2fa_user_code ON public.staff_2fa_codes (user_id, code, used);

-- Auto-cleanup expired codes
CREATE OR REPLACE FUNCTION public.cleanup_expired_2fa_codes()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
AS $$
  DELETE FROM public.staff_2fa_codes
  WHERE expires_at < now() OR used = true;
$$;
