
-- Ensure provider_services are deleted when their provider key is deleted
-- First, identifying any existing foreign keys on the 'provider' column
DO $$ 
BEGIN 
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.provider_services'::regclass 
        AND conname = 'provider_services_provider_fkey'
    ) THEN
        ALTER TABLE public.provider_services DROP CONSTRAINT provider_services_provider_fkey;
    END IF;
END $$;

-- Add the foreign key with CASCADE
-- Note: 'provider' in provider_services is a text column matching 'key' in providers
ALTER TABLE public.provider_services 
    ADD CONSTRAINT provider_services_provider_fkey 
    FOREIGN KEY (provider) 
    REFERENCES public.providers(key) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;

-- Also fix handleCleanup logic by adding a helper function if needed, 
-- but we will mainly fix it in the frontend code as planned.
