
-- Add provider column to track which provider a service belongs to
ALTER TABLE public.provider_services ADD COLUMN IF NOT EXISTS provider text NOT NULL DEFAULT 'vexboost';

-- Drop the unique constraint on provider_service_id (same ID can exist across providers)
ALTER TABLE public.provider_services DROP CONSTRAINT IF EXISTS provider_services_provider_service_id_key;

-- Add composite unique constraint
ALTER TABLE public.provider_services ADD CONSTRAINT provider_services_provider_id_unique UNIQUE (provider, provider_service_id);
