-- Add api_key column to providers table
ALTER TABLE public.providers ADD COLUMN IF NOT EXISTS api_key TEXT;

-- Update RLS if necessary (usually not needed if already managed by service role or specific policies)
COMMENT ON COLUMN public.providers.api_key IS 'Direct API key value, prioritized over api_key_env';
