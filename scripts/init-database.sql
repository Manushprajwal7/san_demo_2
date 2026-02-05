-- =============================================================================
-- INIT-DATABASE.SQL
-- Run this script in Supabase SQL Editor to initialize the Notice Builder flow.
-- This sets up: tables, RPC functions for create/read/update/delete/bulk-insert.
-- =============================================================================

-- 1. Registry table to track user-created tables (from Notice Builder)
CREATE TABLE IF NOT EXISTS notice_tables_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  columns jsonb NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- 2. RPC: Create dynamic tables (adds id, created_at, updated_at + user columns)
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
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- 3. RPC: Check if table exists
CREATE OR REPLACE FUNCTION check_table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  table_found boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1 FROM information_schema.tables
    WHERE table_schema = 'public' AND table_name = p_table_name
  ) INTO table_found;
  RETURN table_found;
END;
$$;

-- 4. RPC: Fetch data from a dynamic table
CREATE OR REPLACE FUNCTION get_notice_table_data(p_table_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE format(
    'SELECT COALESCE(jsonb_agg(row_to_json(t.*) ORDER BY t.created_at DESC), ''[]''::jsonb) FROM %I t',
    p_table_name
  ) INTO result;
  RETURN result;
END;
$$;

-- 5. RPC: Insert single row
CREATE OR REPLACE FUNCTION insert_notice_row(p_table_name text, p_data jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  col_names text := '';
  col_values text := '';
  key text;
  val text;
  result jsonb;
BEGIN
  FOR key, val IN SELECT * FROM jsonb_each_text(p_data)
  LOOP
    IF col_names != '' THEN
      col_names := col_names || ', ';
      col_values := col_values || ', ';
    END IF;
    col_names := col_names || format('%I', key);
    col_values := col_values || format('%L', val);
  END LOOP;

  EXECUTE format(
    'INSERT INTO %I (%s) VALUES (%s) RETURNING row_to_json(%I.*)',
    p_table_name, col_names, col_values, p_table_name
  ) INTO result;

  RETURN result;
END;
$$;

-- 6. RPC: Bulk insert rows (for Excel import)
CREATE OR REPLACE FUNCTION bulk_insert_notice_rows(p_table_name text, p_rows jsonb)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  row_data jsonb;
  col_names text;
  col_values text;
  key text;
  val text;
  inserted_count int := 0;
  failed_count int := 0;
  v_columns jsonb;
  v_valid_columns text[];
  v_col_type text;
BEGIN
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  SELECT columns INTO v_columns
  FROM notice_tables_registry
  WHERE table_name = p_table_name;

  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'Table % not found in registry. Create the table first in Notice Builder.', p_table_name;
  END IF;

  SELECT array_agg(elem->>'name') INTO v_valid_columns
  FROM jsonb_array_elements(v_columns) AS elem;

  FOR row_data IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      col_names := '';
      col_values := '';

      FOR key, val IN SELECT * FROM jsonb_each_text(row_data)
      LOOP
        IF NOT (key = ANY(v_valid_columns)) THEN
          CONTINUE;
        END IF;

        SELECT (elem->>'type')::TEXT INTO v_col_type
        FROM jsonb_array_elements(v_columns) AS elem
        WHERE elem->>'name' = key;

        IF col_names != '' THEN
          col_names := col_names || ', ';
          col_values := col_values || ', ';
        END IF;
        
        col_names := col_names || format('%I', key);
        
        IF val IS NULL OR val = '' THEN
          col_values := col_values || 'NULL';
        ELSE
          CASE v_col_type
            WHEN 'number' THEN
              BEGIN
                col_values := col_values || format('%L::NUMERIC', val::NUMERIC);
              EXCEPTION WHEN OTHERS THEN
                col_values := col_values || 'NULL';
              END;
            WHEN 'boolean' THEN
              col_values := col_values || format('%L::BOOLEAN', val::BOOLEAN);
            WHEN 'date' THEN
              BEGIN
                col_values := col_values || format('%L::DATE', val::DATE);
              EXCEPTION WHEN OTHERS THEN
                col_values := col_values || 'NULL';
              END;
            ELSE
              col_values := col_values || format('%L', val);
          END CASE;
        END IF;
      END LOOP;

      IF col_names != '' THEN
        EXECUTE format(
          'INSERT INTO %I (%s) VALUES (%s)',
          p_table_name, col_names, col_values
        );
        inserted_count := inserted_count + 1;
      ELSE
        failed_count := failed_count + 1;
      END IF;
      
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('inserted', inserted_count, 'failed', failed_count);
END;
$$;

-- 7. RPC: Delete row
CREATE OR REPLACE FUNCTION delete_notice_row(p_table_name text, p_row_id text)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  IF NOT EXISTS (SELECT 1 FROM notice_tables_registry WHERE table_name = p_table_name) THEN
    RAISE EXCEPTION 'Table % not found in registry', p_table_name;
  END IF;

  EXECUTE format('DELETE FROM %I WHERE id = $1', p_table_name)
  USING p_row_id;
END;
$$;

-- 8. RPC: Update row (works with or without updated_at column)
CREATE OR REPLACE FUNCTION update_notice_row(p_table_name text, p_row_id text, p_data jsonb)
RETURNS void
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  v_set_clause text := '';
  v_key text;
  v_value text;
  v_columns jsonb;
  v_col_type text;
  v_has_updated_at boolean;
  v_sql text;
BEGIN
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  SELECT columns INTO v_columns
  FROM notice_tables_registry
  WHERE table_name = p_table_name;

  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'Table % not found in registry', p_table_name;
  END IF;
  
  FOR v_key IN SELECT jsonb_object_keys(p_data)
  LOOP
    IF v_key IN ('id', 'created_at') THEN
      CONTINUE;
    END IF;

    SELECT (elem->>'type')::TEXT INTO v_col_type
    FROM jsonb_array_elements(v_columns) AS elem
    WHERE elem->>'name' = v_key;

    IF v_col_type IS NULL THEN
      IF v_key = 'updated_at' THEN
        CONTINUE;
      END IF;
      CONTINUE;
    END IF;

    v_value := p_data->>v_key;

    IF v_set_clause != '' THEN
      v_set_clause := v_set_clause || ', ';
    END IF;

    CASE v_col_type
      WHEN 'number' THEN
        IF v_value IS NULL OR v_value = '' THEN
          v_set_clause := v_set_clause || format('%I = NULL', v_key);
        ELSE
          v_set_clause := v_set_clause || format('%I = %L::NUMERIC', v_key, v_value);
        END IF;
      WHEN 'boolean' THEN
        v_set_clause := v_set_clause || format('%I = %L::BOOLEAN', v_key, v_value);
      WHEN 'date' THEN
        IF v_value IS NULL OR v_value = '' THEN
          v_set_clause := v_set_clause || format('%I = NULL', v_key);
        ELSE
          v_set_clause := v_set_clause || format('%I = %L::DATE', v_key, v_value);
        END IF;
      ELSE
        IF v_value IS NULL OR v_value = '' THEN
          v_set_clause := v_set_clause || format('%I = NULL', v_key);
        ELSE
          v_set_clause := v_set_clause || format('%I = %L', v_key, v_value);
        END IF;
    END CASE;
  END LOOP;

  IF v_set_clause = '' THEN
    RAISE EXCEPTION 'No valid columns to update';
  END IF;

  SELECT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_schema = 'public' AND table_name = p_table_name AND column_name = 'updated_at'
  ) INTO v_has_updated_at;

  IF v_has_updated_at THEN
    v_sql := format('UPDATE %I SET %s, updated_at = NOW() WHERE id = $1', p_table_name, v_set_clause);
  ELSE
    v_sql := format('UPDATE %I SET %s WHERE id = $1', p_table_name, v_set_clause);
  END IF;

  EXECUTE v_sql USING p_row_id;
END;
$$;

-- Grant permissions
GRANT EXECUTE ON FUNCTION create_notice_table(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION check_table_exists(text) TO authenticated;
GRANT EXECUTE ON FUNCTION get_notice_table_data(text) TO authenticated;
GRANT EXECUTE ON FUNCTION insert_notice_row(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION bulk_insert_notice_rows(text, jsonb) TO authenticated;
GRANT EXECUTE ON FUNCTION delete_notice_row(text, text) TO authenticated;
GRANT EXECUTE ON FUNCTION update_notice_row(text, text, jsonb) TO authenticated;

-- Reload schema
NOTIFY pgrst, 'reload schema';
