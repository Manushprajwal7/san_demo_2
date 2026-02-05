-- Migration to rename license_status to branch_status
-- This script should be run in the Supabase SQL Editor

-- 1. First, rename the table
ALTER TABLE IF EXISTS license_status RENAME TO branch_status;

-- 2. Update the sequence if it exists
ALTER SEQUENCE IF EXISTS license_status_id_seq RENAME TO branch_status_id_seq;

-- 3. Update indexes
ALTER INDEX IF EXISTS idx_license_company RENAME TO idx_branch_company;

-- 4. Update any foreign key constraints
-- Note: This is just an example - adjust based on actual foreign key constraints
-- ALTER TABLE some_other_table RENAME CONSTRAINT some_other_table_license_status_id_fkey TO some_other_table_branch_status_id_fkey;

-- 5. Update any views, functions, or triggers that reference the old table name
-- Example:
-- CREATE OR REPLACE FUNCTION some_function()
-- RETURNS trigger AS $$
-- BEGIN
--   -- Updated reference to branch_status
--   SELECT * FROM branch_status WHERE ...
--   RETURN NEW;
-- END;
-- $$ LANGUAGE plpgsql;

-- 6. Update any RLS (Row Level Security) policies
-- Example:
-- ALTER POLICY some_policy ON branch_status
--   USING (some_condition);

-- 7. Update any default privileges
-- Example:
-- ALTER DEFAULT PRIVILEGES IN SCHEMA public GRANT SELECT ON TABLES TO authenticated;

-- 8. Notify PostgREST to reload the schema
NOTIFY pgrst, 'reload schema';

-- 9. Add a comment to document this change
COMMENT ON TABLE branch_status IS 'Stores branch status and compliance information. Renamed from license_status on 2024-02-05.';
