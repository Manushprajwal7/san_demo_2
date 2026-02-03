-- Schema Cache Refresh and Verification Script
-- Run this to diagnose and fix schema cache issues

-- 1. Check what tables actually exist
SELECT '=== EXISTING CUSTOM TABLES ===' as info;
SELECT table_schema, table_name 
FROM information_schema.tables 
WHERE table_name LIKE 'custom_%'
ORDER BY table_name;

-- 2. Check specific table existence
SELECT '=== TABLE EXISTENCE CHECK ===' as info;
SELECT 
    'custom_qqq' as requested_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'custom_qqq'
        ) THEN 'EXISTS'
        ELSE 'NOT FOUND'
    END as status;

SELECT 
    'custom_e3' as existing_table,
    CASE 
        WHEN EXISTS (
            SELECT 1 FROM information_schema.tables 
            WHERE table_name = 'custom_e3'
        ) THEN 'EXISTS'
        ELSE 'NOT FOUND'
    END as status;

-- 3. Check table structure for custom_e3 (the one that exists)
SELECT '=== CUSTOM_E3 STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'custom_e3'
ORDER BY ordinal_position;

-- 4. Force refresh schema cache by querying the table
-- This helps synchronize the PostgREST schema cache
SELECT '=== FORCE CACHE REFRESH ===' as info;
SELECT COUNT(*) as row_count FROM custom_e3;

-- 5. Check if we can create the missing table
SELECT '=== TABLE CREATION TEST ===' as info;
-- Uncomment the following lines to create custom_qqq:
/*
CREATE TABLE IF NOT EXISTS custom_qqq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

GRANT ALL ON TABLE custom_qqq TO authenticated;
GRANT ALL ON TABLE custom_qqq TO anon;

SELECT 'Table custom_qqq created successfully' as result;
*/