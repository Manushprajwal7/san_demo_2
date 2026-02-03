-- Schema Verification Script
-- Run this to check your table structure

-- Replace 'custom_e3' with your actual table name
SELECT '=== TABLE STRUCTURE ===' as info;
SELECT 
    column_name,
    data_type,
    is_nullable,
    column_default
FROM information_schema.columns 
WHERE table_name = 'custom_e3'
ORDER BY ordinal_position;

-- Check if the table exists
SELECT '=== TABLE EXISTS CHECK ===' as info;
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'custom_e3';

-- Check sample data (if any)
SELECT '=== SAMPLE DATA ===' as info;
SELECT * FROM custom_e3 LIMIT 5;