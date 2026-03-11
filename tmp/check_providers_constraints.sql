
-- Find all foreign key constraints referencing the 'providers' table
SELECT 
    conname AS constraint_name, 
    rel.relname AS table_name, 
    pref.relname AS referenced_table,
    pg_get_constraintdef(con.oid) AS definition
FROM 
    pg_constraint con 
    JOIN pg_class rel ON rel.oid = con.conrelid 
    JOIN pg_class pref ON pref.oid = con.confrelid 
WHERE 
    pref.relname = 'providers';

-- Also check for tables referencing by key name if they don't have a formal FK
-- (though less likely to block unless there's a trigger)

-- Check RLS on providers
SELECT 
    policyname, 
    cmd, 
    qual, 
    with_check 
FROM 
    pg_policies 
WHERE tablename = 'providers';
