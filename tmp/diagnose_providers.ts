
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkData() {
  console.log("--- Providers ---");
  const { data: providers, error: pError } = await supabase.from('providers').select('id, key, label, is_enabled');
  if (pError) console.error("Providers error:", pError);
  else console.table(providers);

  console.log("\n--- Service Counts per Provider ---");
  const { data: counts, error: cError } = await supabase.from('provider_services').select('provider');
  if (cError) console.error("Counts error:", cError);
  else {
    const stats = counts.reduce((acc, curr) => {
      acc[curr.provider] = (acc[curr.provider] || 0) + 1;
      return acc;
    }, {});
    console.table(Object.entries(stats).map(([key, count]) => ({ provider: key, services: count })));
  }
}

checkData();
