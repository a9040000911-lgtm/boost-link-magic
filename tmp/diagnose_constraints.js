
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function check() {
  const query = `
    SELECT
        conname AS constraint_name,
        conrelid::regclass AS table_name,
        confrelid::regclass AS referenced_table,
        pg_get_constraintdef(con.oid) AS definition
    FROM
        pg_constraint con
    WHERE
        confrelid = 'public.providers'::regclass;
  `;
  
  const { data, error } = await supabase.rpc('execute_sql', { sql_query: query });
  
  if (error) {
    // If RPC not found, try a different approach (direct query if it was allowed, but it's not for system catalogs usually)
    console.log("RPC execute_sql not found or failed. Trying direct query on information_schema...");
    
    // Fallback to information_schema which is usually accessible
    const infoQuery = `
      SELECT 
          tc.table_name, 
          kcu.column_name, 
          ccu.table_name AS foreign_table_name,
          ccu.column_name AS foreign_column_name 
      FROM 
          information_schema.table_constraints AS tc 
          JOIN information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
          JOIN information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
      WHERE tc.constraint_type = 'FOREIGN KEY' AND ccu.table_name='providers';
    `;
    
    const { data: infoData, error: infoError } = await supabase.rpc('execute_sql', { sql_query: infoQuery });
    if (infoError) {
        console.error("Both attempts failed.");
        console.error(infoError);
    } else {
        console.log(JSON.stringify(infoData, null, 2));
    }
  } else {
    console.log(JSON.stringify(data, null, 2));
  }
}

check();
