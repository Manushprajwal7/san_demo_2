-- Migration script to add missing column
-- Run this in your Supabase SQL editor

ALTER TABLE dynamic_tables_metadata ADD COLUMN IF NOT EXISTS actual_table_name VARCHAR(255);

-- Verify the column was added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'dynamic_tables_metadata' 
AND column_name = 'actual_table_name';