-- Fixed Verification Script - Run each section separately
-- Copy and run each section one at a time in Supabase SQL Editor

-- SECTION 1: Check existing custom tables
SELECT '=== EXISTING CUSTOM TABLES ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
AND table_name LIKE 'custom_%'
ORDER BY table_name;

-- SECTION 2: Check if exec_sql function exists
SELECT '=== FUNCTION CHECK ===' as info;
SELECT proname, prosrc 
FROM pg_proc p 
JOIN pg_namespace n ON p.pronamespace = n.oid 
WHERE n.nspname = 'public' AND proname = 'exec_sql';

-- SECTION 3: Create exec_sql function (if it doesn't exist)
-- Run this only if SECTION 2 shows no results
CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql_statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;

-- SECTION 4: Test the function
SELECT '=== FUNCTION TEST ===' as info;
SELECT exec_sql('SELECT 1 as test_result;');

-- SECTION 5: Test table creation
SELECT '=== TABLE CREATION TEST ===' as info;
SELECT exec_sql('CREATE TABLE IF NOT EXISTS custom_test_table (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    test_field TEXT,
    created_at TIMESTAMP DEFAULT NOW()
);');

-- SECTION 6: Verify table creation
SELECT '=== VERIFICATION ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'custom_test_table';

-- SECTION 7: Test data insertion
INSERT INTO custom_test_table (test_field) VALUES ('Test successful!');

-- SECTION 8: Verify data
SELECT * FROM custom_test_table;

-- SECTION 9: Check permissions
SELECT '=== PERMISSIONS CHECK ===' as info;
SELECT table_name, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'custom_test_table' 
AND grantee = 'authenticated';

-- SECTION 10: Clean up (optional)
-- DROP TABLE IF EXISTS custom_test_table;