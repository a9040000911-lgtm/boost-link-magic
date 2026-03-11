
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
    process.env.VITE_SUPABASE_URL,
    process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
    const { data: providers } = await supabase.from('providers').select('*');
    console.log('--- PROVIDERS ---');
    console.table(providers);

    const { data: services } = await supabase.from('services').select('id, name, category, network, is_enabled').limit(10);
    console.log('--- SERVICES (top 10) ---');
    console.table(services);

    const { data: mappings } = await supabase.from('service_provider_mappings').select('id, service_id, provider_service_id').limit(10);
    console.log('--- MAPPINGS (top 10) ---');
    console.table(mappings);
}

check();
