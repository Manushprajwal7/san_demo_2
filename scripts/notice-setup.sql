-- Notice Builder SQL Setup
-- Run this script in Supabase SQL Editor to set up the notice module tables and functions.

-- 1. Registry table to track user-created tables
CREATE TABLE IF NOT EXISTS notice_tables_registry (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  table_name text UNIQUE NOT NULL,
  display_name text NOT NULL,
  columns jsonb NOT NULL,  -- [{name: "emp_id", type: "text"}, ...]
  created_at timestamptz DEFAULT now()
);

-- 2. RPC function to create dynamic tables
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
  -- Build column definitions from jsonb array
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

  -- Build and execute CREATE TABLE statement
  sql_stmt := format(
    'CREATE TABLE %I (id uuid PRIMARY KEY DEFAULT gen_random_uuid(), created_at timestamptz DEFAULT now()%s)',
    p_table_name,
    col_def
  );

  EXECUTE sql_stmt;

  -- Notify PostgREST to reload schema so the new table is immediately accessible
  NOTIFY pgrst, 'reload schema';
END;
$$;

-- 3. RPC function to check if a table exists
CREATE OR REPLACE FUNCTION check_table_exists(p_table_name text)
RETURNS boolean
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  table_found boolean;
BEGIN
  SELECT EXISTS (
    SELECT 1
    FROM information_schema.tables
    WHERE table_schema = 'public'
      AND table_name = p_table_name
  ) INTO table_found;

  RETURN table_found;
END;
$$;

-- 4. RPC function to fetch data from a dynamic table
CREATE OR REPLACE FUNCTION get_notice_table_data(p_table_name text)
RETURNS jsonb
LANGUAGE plpgsql SECURITY DEFINER AS $$
DECLARE
  result jsonb;
BEGIN
  EXECUTE format('SELECT COALESCE(jsonb_agg(row_to_json(t.*) ORDER BY t.created_at DESC), ''[]''::jsonb) FROM %I t', p_table_name)
  INTO result;

  RETURN result;
END;
$$;

-- 5. RPC function to insert a single row
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

-- 6. RPC function to bulk insert rows
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
BEGIN
  FOR row_data IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      col_names := '';
      col_values := '';

      FOR key, val IN SELECT * FROM jsonb_each_text(row_data)
      LOOP
        IF col_names != '' THEN
          col_names := col_names || ', ';
          col_values := col_values || ', ';
        END IF;
        col_names := col_names || format('%I', key);
        col_values := col_values || format('%L', val);
      END LOOP;

      EXECUTE format(
        'INSERT INTO %I (%s) VALUES (%s)',
        p_table_name, col_names, col_values
      );

      inserted_count := inserted_count + 1;
    EXCEPTION WHEN OTHERS THEN
      failed_count := failed_count + 1;
    END;
  END LOOP;

  RETURN jsonb_build_object('inserted', inserted_count, 'failed', failed_count);
END;
$$;
