-- Database Optimization Script
-- This script creates indexes and optimizes the database for better performance

-- Create indexes for frequently queried tables
-- These indexes target the slow queries identified in the analysis

-- Index for man_power table (most frequently queried)
CREATE INDEX IF NOT EXISTS idx_man_power_id ON man_power (id);
CREATE INDEX IF NOT EXISTS idx_man_power_empname ON man_power (empname);
CREATE INDEX IF NOT EXISTS idx_man_power_department ON man_power (department);
CREATE INDEX IF NOT EXISTS idx_man_power_branch_name ON man_power (branch_name);
CREATE INDEX IF NOT EXISTS idx_man_power_month_name ON man_power (month_name);
CREATE INDEX IF NOT EXISTS idx_man_power_created_at ON man_power (created_at);

-- Composite index for common query patterns
CREATE INDEX IF NOT EXISTS idx_man_power_dept_branch ON man_power (department, branch_name);
CREATE INDEX IF NOT EXISTS idx_man_power_month_dept ON man_power (month_name, department);

-- Index for ka_branches table
CREATE INDEX IF NOT EXISTS idx_ka_branches_id ON ka_branches (id);
CREATE INDEX IF NOT EXISTS idx_ka_branches_branch ON ka_branches (branch);
CREATE INDEX IF NOT EXISTS idx_ka_branches_district ON ka_branches (district);
CREATE INDEX IF NOT EXISTS idx_ka_branches_state_head ON ka_branches (state_head);
CREATE INDEX IF NOT EXISTS idx_ka_branches_created_at ON ka_branches (created_at);

-- Index for notice_tables_registry
CREATE INDEX IF NOT EXISTS idx_notice_tables_registry_table_name ON notice_tables_registry (table_name);
CREATE INDEX IF NOT EXISTS idx_notice_tables_registry_created_at ON notice_tables_registry (created_at);

-- Index for compliance_submissions (only if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compliance_submissions' AND table_schema = 'public') THEN
        CREATE INDEX IF NOT EXISTS idx_compliance_submissions_table_name ON compliance_submissions (table_name);
        CREATE INDEX IF NOT EXISTS idx_compliance_submissions_submitted_at ON compliance_submissions (submitted_at);
        CREATE INDEX IF NOT EXISTS idx_compliance_submissions_state_district ON compliance_submissions (state, district);
    END IF;
END $$;

-- Partial indexes for better performance on large tables (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'man_power' AND table_schema = 'public') THEN
        -- Create a functional index that can be used for filtering recent records
        CREATE INDEX IF NOT EXISTS idx_man_power_created_at ON man_power (created_at);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ka_branches' AND table_schema = 'public') THEN
        -- Create a functional index that can be used for filtering recent records
        CREATE INDEX IF NOT EXISTS idx_ka_branches_created_at ON ka_branches (created_at);
    END IF;
END $$;

-- Optimize table statistics for better query planning (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'man_power' AND table_schema = 'public') THEN
        ANALYZE man_power;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ka_branches' AND table_schema = 'public') THEN
        ANALYZE ka_branches;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'notice_tables_registry' AND table_schema = 'public') THEN
        ANALYZE notice_tables_registry;
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'compliance_submissions' AND table_schema = 'public') THEN
        ANALYZE compliance_submissions;
    END IF;
END $$;

-- Set up autovacuum tuning for better performance on high-traffic tables (only if tables exist)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'man_power' AND table_schema = 'public') THEN
        ALTER TABLE man_power SET (autovacuum_vacuum_scale_factor = 0.1);
        ALTER TABLE man_power SET (autovacuum_analyze_scale_factor = 0.05);
    END IF;
    
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'ka_branches' AND table_schema = 'public') THEN
        ALTER TABLE ka_branches SET (autovacuum_vacuum_scale_factor = 0.1);
        ALTER TABLE ka_branches SET (autovacuum_analyze_scale_factor = 0.05);
    END IF;
END $$;

-- Create a materialized view for frequently accessed aggregated data (only if man_power table exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.tables WHERE table_name = 'man_power' AND table_schema = 'public') THEN
        CREATE MATERIALIZED VIEW IF NOT EXISTS mv_employee_summary AS
        SELECT 
            department,
            branch_name,
            COUNT(*) as total_employees,
            COUNT(CASE WHEN gender = 'Male' THEN 1 END) as male_count,
            COUNT(CASE WHEN gender = 'Female' THEN 1 END) as female_count,
            AVG(ctc) as avg_ctc,
            MAX(updated_at) as last_updated
        FROM man_power 
        GROUP BY department, branch_name;
        
        -- Create index for the materialized view
        CREATE INDEX IF NOT EXISTS idx_mv_employee_summary_dept_branch ON mv_employee_summary (department, branch_name);
    END IF;
END $$;

-- Create a refresh function for the materialized view (only if view exists)
DO $$
BEGIN
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'mv_employee_summary' AND table_schema = 'public') THEN
        EXECUTE 'CREATE OR REPLACE FUNCTION refresh_employee_summary()
        RETURNS void AS $func$
        BEGIN
            REFRESH MATERIALIZED VIEW CONCURRENTLY mv_employee_summary;
        END;
        $func$ LANGUAGE plpgsql';
    END IF;
END $$;

-- Set up a cron job to refresh the materialized view periodically (requires pg_cron extension)
-- This would be: SELECT cron.schedule('refresh-employee-summary', '0 */6 * * *', 'SELECT refresh_employee_summary();');

-- Create optimized function for getting table counts
DO $$
BEGIN
    EXECUTE 'CREATE OR REPLACE FUNCTION get_table_counts()
    RETURNS TABLE(table_name text, row_count bigint) AS $func$
    BEGIN
        RETURN QUERY
        SELECT 
            schemaname||''.''||tablename as table_name,
            n_tup_ins - n_tup_del as row_count
        FROM pg_stat_user_tables 
        WHERE schemaname = ''public''
        AND tablename IN (''man_power'', ''ka_branches'', ''notice_tables_registry'', ''compliance_submissions'');
    END;
    $func$ LANGUAGE plpgsql';
END $$;

-- Grant necessary permissions (only if objects exist)
DO $$
BEGIN
    -- Grant permissions on materialized view
    IF EXISTS (SELECT FROM information_schema.views WHERE table_name = 'mv_employee_summary' AND table_schema = 'public') THEN
        GRANT SELECT ON mv_employee_summary TO anon, authenticated, service_role;
    END IF;
    
    -- Grant permissions on refresh function
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'refresh_employee_summary' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION refresh_employee_summary() TO service_role;
    END IF;
    
    -- Grant permissions on get_table_counts function
    IF EXISTS (SELECT FROM information_schema.routines WHERE routine_name = 'get_table_counts' AND routine_schema = 'public') THEN
        GRANT EXECUTE ON FUNCTION get_table_counts() TO anon, authenticated, service_role;
    END IF;
END $$;
