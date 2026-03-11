
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const sql = `
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

ALTER TABLE public.provider_services 
    ADD CONSTRAINT provider_services_provider_fkey 
    FOREIGN KEY (provider) 
    REFERENCES public.providers(key) 
    ON DELETE CASCADE 
    ON UPDATE CASCADE;
`;

async function run() {
  console.log('Applying SQL migration...');
  const { error } = await supabaseAdmin.rpc('exec_sql', { sql_query: sql });
  if (error) {
    if (error.message.includes('NOT FOUND')) {
      console.log('rpc("exec_sql") not found. Attempting direct query if possible, or please run this manually in SQL Editor.');
      console.log(sql);
    } else {
      console.error('Error executing SQL:', error);
    }
  } else {
    console.log('SQL Migration applied successfully!');
  }
}

run();
