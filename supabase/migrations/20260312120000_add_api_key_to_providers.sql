-- Add api_key column to providers table
-- This allows storing API keys directly in DB instead of ENV variables

ALTER TABLE public.providers
ADD COLUMN IF NOT EXISTS api_key text;

-- Add comment
COMMENT ON COLUMN public.providers.api_key IS 'API key for the provider (stored directly, consider encryption for production)';

-- Make api_key_env nullable since we can now use api_key directly
ALTER TABLE public.providers
ALTER COLUMN api_key_env DROP NOT NULL;
