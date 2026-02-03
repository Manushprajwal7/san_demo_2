-- Complete setup script for form builder table creation
-- Run this entire script in your Supabase SQL editor

-- 1. Add the missing column if it doesn't exist
ALTER TABLE dynamic_tables_metadata ADD COLUMN IF NOT EXISTS actual_table_name VARCHAR(255);

-- 2. Create the RPC function for executing dynamic SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql_statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 3. Grant execute permission on the function
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;

-- 4. Verify the setup
SELECT 'Column added successfully' as status WHERE EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'dynamic_tables_metadata' 
    AND column_name = 'actual_table_name'
);

SELECT 'Function created successfully' as status WHERE EXISTS (
    SELECT 1 FROM pg_proc p 
    JOIN pg_namespace n ON p.pronamespace = n.oid 
    WHERE n.nspname = 'public' AND p.proname = 'exec_sql'
);

-- 5. Test the function (optional)
-- SELECT exec_sql('SELECT 1;');