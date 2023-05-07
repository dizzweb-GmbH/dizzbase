SELECT
    tc.table_name as table, 
    tc.constraint_name as contraint, 
    kcu.column_name as fkey,
    ccu.table_name AS foreign_table,
    ccu.column_name AS foreign_pkey 
FROM 
    information_schema.table_constraints AS tc 
    JOIN information_schema.key_column_usage AS kcu
      ON tc.constraint_name = kcu.constraint_name
      AND tc.table_schema = kcu.table_schema
    JOIN information_schema.constraint_column_usage AS ccu
      ON ccu.constraint_name = tc.constraint_name
      AND ccu.table_schema = tc.table_schema
WHERE tc.constraint_type = 'FOREIGN KEY' AND tc.table_name='order' AND tc.table_schema = 'public';
