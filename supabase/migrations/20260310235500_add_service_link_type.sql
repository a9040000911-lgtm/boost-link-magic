-- Add link_type column to services table
ALTER TABLE public.services ADD COLUMN IF NOT EXISTS link_type text DEFAULT 'unknown';

-- Add comment for documentation
COMMENT ON COLUMN public.services.link_type IS 'Type of link for validation (profile, post, etc)';
