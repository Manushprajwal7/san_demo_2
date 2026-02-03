-- Comprehensive Verification and Fix Script
-- Run this ENTIRE script in your Supabase SQL Editor

-- 1. First, let's check what tables currently exist
SELECT '=== EXISTING TABLES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'custom_%'
ORDER BY table_name;

-- 2. Check if the exec_sql function exists
SELECT '=== FUNCTION CHECK ===' as info;
SELECT proname, prosrc 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND proname = 'exec_sql';

-- 3. Test the exec_sql function with a simple query
SELECT '=== FUNCTION TEST ===' as info;
SELECT exec_sql('SELECT 1 as test_result;');

-- 4. If the function doesn't exist, create it
-- (This will only run if the function is missing)
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_proc p 
        JOIN pg_namespace n ON p.pronamespace = n.oid 
        WHERE n.nspname = 'public' AND p.proname = 'exec_sql'
    ) THEN
        CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
        RETURNS VOID AS $$
        BEGIN
            EXECUTE sql_statement;
        END;
        $$ LANGUAGE plpgsql SECURITY DEFINER;
        
        -- Grant execute permission
        GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
        GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;
        
        RAISE NOTICE 'exec_sql function created successfully';
    ELSE
        RAISE NOTICE 'exec_sql function already exists';
    END IF;
END $$;

-- 5. Test creating a sample table
SELECT '=== TABLE CREATION TEST ===' as info;
SELECT exec_sql('CREATE TABLE IF NOT EXISTS custom_test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_field TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);');

-- 6. Verify the test table was created
SELECT '=== VERIFICATION ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'custom_test_table';

-- 7. Test inserting into the test table
INSERT INTO custom_test_table (test_field) VALUES ('Test successful!');

-- 8. Verify data insertion
SELECT * FROM custom_test_table;

-- 9. Clean up test table (optional)
-- DROP TABLE IF EXISTS custom_test_table;

-- 10. Check permissions for authenticated users
SELECT '=== PERMISSIONS CHECK ===' as info;
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name LIKE 'custom_%' 
AND grantee = 'authenticated';