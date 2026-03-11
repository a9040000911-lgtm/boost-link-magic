
-- Find all tables and columns that reference public.providers
SELECT
    m.table_schema,
    m.table_name,
    m.column_name,
    m.constraint_name,
    x.table_name AS referenced_table,
    x.column_name AS referenced_column,
    m.data_type
FROM
    information_schema.columns m
JOIN
    (
        SELECT
            kcu.table_schema,
            kcu.table_name,
            kcu.column_name,
            ccu.table_name AS referenced_table,
            ccu.column_name AS referenced_column
        FROM
            information_schema.table_constraints AS tc
        JOIN
            information_schema.key_column_usage AS kcu
            ON tc.constraint_name = kcu.constraint_name
            AND tc.table_schema = kcu.table_schema
        JOIN
            information_schema.constraint_column_usage AS ccu
            ON ccu.constraint_name = tc.constraint_name
            AND ccu.table_schema = tc.table_schema
        WHERE
            tc.constraint_type = 'FOREIGN KEY'
            AND ccu.table_name = 'providers'
    ) x
    ON m.table_schema = x.table_schema
    AND m.table_name = x.table_name
    AND m.column_name = x.column_name;
