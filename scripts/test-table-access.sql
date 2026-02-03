-- Test script to verify table creation and access
-- Run this in your Supabase SQL editor after creating a form

-- Replace 'your_table_name' with the actual table name from your form
-- The table name will be in the format: custom_yourformname

-- Check if table exists
SELECT table_name 
FROM information_schema.tables 
WHERE table_name = 'custom_your_table_name';

-- Check table structure
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'custom_your_table_name'
ORDER BY ordinal_position;

-- Test inserting sample data (replace with your actual field names)
INSERT INTO custom_your_table_name (field1, field2, field3) 
VALUES ('test value 1', 'test value 2', 'test value 3');

-- Check if data was inserted
SELECT * FROM custom_your_table_name;

-- Check permissions
SELECT grantee, privilege_type 
FROM information_schema.table_privileges 
WHERE table_name = 'custom_your_table_name';