
-- Fix provider deletion by ensuring related orders don't block it
-- We want to keep orders but set the provider_service_id to NULL if the provider/service is deleted

DO $$ 
BEGIN 
    -- 1. Fix orders -> provider_services reference
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.orders'::regclass 
        AND conname = 'orders_provider_service_id_fkey'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_provider_service_id_fkey;
    END IF;

    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_provider_service_id_fkey 
        FOREIGN KEY (provider_service_id) 
        REFERENCES public.provider_services(id) 
        ON DELETE SET NULL;

    -- 2. Fix orders -> services reference (just in case)
    IF EXISTS (
        SELECT 1 FROM pg_constraint 
        WHERE conrelid = 'public.orders'::regclass 
        AND conname = 'orders_service_id_fkey'
    ) THEN
        ALTER TABLE public.orders DROP CONSTRAINT orders_service_id_fkey;
    END IF;

    ALTER TABLE public.orders 
        ADD CONSTRAINT orders_service_id_fkey 
        FOREIGN KEY (service_id) 
        REFERENCES public.services(id) 
        ON DELETE SET NULL;

END $$;
