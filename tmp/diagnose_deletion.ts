
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function diagnose() {
  console.log("Fetching providers...");
  const { data: providers, error: fetchError } = await supabase.from('providers').select('id, key, label');
  if (fetchError) {
    console.error("Fetch error:", fetchError);
    return;
  }

  console.log("Providers found:", providers.length);
  for (const p of providers) {
    console.log(`Attempting to delete provider: ${p.label} (${p.key}) - ID: ${p.id}`);
    // We use a rollback transaction if possible, but Supabase JS doesn't support them easily.
    // So we just try to delete and see the error. We can re-insert if it succeeds (but it's risky).
    // Better: just check for FK constraints strictly.
  }
}

async function checkConstraints() {
  const query = `
    SELECT
        conname AS constraint_name,
        confrelid::regclass AS referenced_table,
        conrelid::regclass AS table_name,
        a.attname AS column_name,
        confdeltype
    FROM
        pg_constraint c
    JOIN
        pg_attribute a ON a.attnum = ANY(c.conkey) AND a.attrelid = c.conrelid
    WHERE
        confrelid = 'public.providers'::regclass;
  `;
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });
  if (error) {
    // If RPC not available, this script might fail. 
    // I'll use the CLI tool in parallel.
    console.log("RPC execute_sql failed, use CLI instead.");
  } else {
    console.log("Referencing constraints:", JSON.stringify(data, null, 2));
  }
}

checkConstraints();
