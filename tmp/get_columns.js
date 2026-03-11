import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const { data, error } = await supabaseAdmin.rpc('get_table_columns', { table_name: 'providers' });
  if (error) {
    // If RPC doesn't exist, try direct query
    const { data: cols, error: err } = await supabaseAdmin.from('providers').select('*').limit(1);
    if (err) {
      console.error(err);
    } else {
      console.log(Object.keys(cols[0] || {}));
    }
  } else {
    console.log(data);
  }
}

check();
