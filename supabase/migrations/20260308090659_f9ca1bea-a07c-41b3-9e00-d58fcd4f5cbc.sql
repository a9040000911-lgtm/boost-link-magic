
-- Add auto-close fields to support_tickets
ALTER TABLE public.support_tickets 
  ADD COLUMN IF NOT EXISTS auto_close_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS auto_closed boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS last_admin_reply_at timestamp with time zone,
  ADD COLUMN IF NOT EXISTS reopened_at timestamp with time zone;
