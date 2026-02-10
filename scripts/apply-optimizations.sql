-- Database Optimization Script
-- Run this in the Supabase SQL Editor

-- 1. Optimize get_notice_table_data to support pagination
-- This prevents loading the entire table into memory when only a page is needed.
-- Defaults (p_page=1, p_page_size=10000) allow backward compatibility if called without new args,
-- though ideally the client should start passing these.
CREATE OR REPLACE FUNCTION get_notice_table_data(
  p_table_name text,
  p_page int DEFAULT 1,
  p_page_size int DEFAULT 10000
)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
  v_offset int;
BEGIN
  -- Validate table name to prevent SQL injection (extra safety, though %I handles identifiers)
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Calculate offset
  IF p_page < 1 THEN p_page := 1; END IF;
  v_offset := (p_page - 1) * p_page_size;
  
  -- Execute dynamic query with LIMIT and OFFSET
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t.*) ORDER BY t.created_at DESC), ''[]''::jsonb) 
     FROM (SELECT * FROM %I ORDER BY created_at DESC LIMIT %L OFFSET %L) t',
    p_table_name, p_page_size, v_offset
  ) INTO result;
  
  RETURN result;
END;
$$;

-- 2. Ensure critical indices exist for 'man_power' (slow query target)
CREATE INDEX IF NOT EXISTS idx_man_power_branch_name ON man_power (branch_name);
CREATE INDEX IF NOT EXISTS idx_man_power_id ON man_power (id); -- Useful if not PK
CREATE INDEX IF NOT EXISTS idx_man_power_created_at ON man_power (created_at);

-- 3. Ensure critical indices exist for 'ka_branches'
CREATE INDEX IF NOT EXISTS idx_ka_branches_district ON ka_branches (district);
CREATE INDEX IF NOT EXISTS idx_ka_branches_id ON ka_branches (id); -- Useful if not PK

-- 4. Ensure critical indices exist for 'notice_tables_registry'
CREATE INDEX IF NOT EXISTS idx_notice_tables_registry_table_name ON notice_tables_registry (table_name);
CREATE INDEX IF NOT EXISTS idx_notice_tables_registry_created_at ON notice_tables_registry (created_at);

-- 5. Backfill indices for dynamic notice tables
-- Iterates through all registered notice tables and adds an index on created_at
DO $$
DECLARE
  r RECORD;
BEGIN
  FOR r IN SELECT table_name FROM notice_tables_registry LOOP
    BEGIN
      EXECUTE format('CREATE INDEX IF NOT EXISTS idx_%I_created_at ON %I (created_at)', r.table_name, r.table_name);
    EXCEPTION WHEN OTHERS THEN
      RAISE NOTICE 'Could not create index for %: %', r.table_name, SQLERRM;
    END;
  END LOOP;
END;
$$;

-- 6. Update create_notice_table to automatically index new tables
CREATE OR REPLACE FUNCTION create_notice_table(
  p_table_name text,
  p_columns jsonb
) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  col_def text := '';
  col record;
  sql_stmt text;
BEGIN
  FOR col IN SELECT * FROM jsonb_array_elements(p_columns)
  LOOP
    col_def := col_def || format(', %I %s', col.value->>'name',
      CASE (col.value->>'type')
        WHEN 'text' THEN 'text'
        WHEN 'number' THEN 'numeric'
        WHEN 'date' THEN 'date'
        WHEN 'boolean' THEN 'boolean'
        ELSE 'text'
      END
    );
  END LOOP;

  sql_stmt := format(
    'CREATE TABLE %I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now(), updated_at timestamptz DEFAULT now()%s)',
    p_table_name,
    col_def
  );

  EXECUTE sql_stmt;
  
  -- Add index on created_at immediately for performance
  EXECUTE format('CREATE INDEX idx_%I_created_at ON %I (created_at)', p_table_name, p_table_name);

  NOTIFY pgrst, 'reload schema';
END;
$$;
