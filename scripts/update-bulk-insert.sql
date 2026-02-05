-- Updated bulk insert function that only inserts valid columns
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
  -- Validate table name to prevent SQL injection
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Get table columns from registry
  SELECT columns INTO v_columns
  FROM notice_tables_registry
  WHERE table_name = p_table_name;

  IF v_columns IS NULL THEN
    RAISE EXCEPTION 'Table % not found in registry', p_table_name;
  END IF;

  -- Extract valid column names from registry
  SELECT array_agg(elem->>'name') INTO v_valid_columns
  FROM jsonb_array_elements(v_columns) AS elem;

  FOR row_data IN SELECT * FROM jsonb_array_elements(p_rows)
  LOOP
    BEGIN
      col_names := '';
      col_values := '';

      -- Only process columns that exist in the target table
      FOR key, val IN SELECT * FROM jsonb_each_text(row_data)
      LOOP
        -- Skip if column doesn't exist in target table
        IF NOT (key = ANY(v_valid_columns)) THEN
          CONTINUE;
        END IF;

        -- Get column type from registry
        SELECT (elem->>'type')::TEXT INTO v_col_type
        FROM jsonb_array_elements(v_columns) AS elem
        WHERE elem->>'name' = key;

        IF col_names != '' THEN
          col_names := col_names || ', ';
          col_values := col_values || ', ';
        END IF;
        
        col_names := col_names || format('%I', key);
        
        -- Handle different data types and NULL values
        IF val IS NULL OR val = '' THEN
          col_values := col_values || 'NULL';
        ELSE
          CASE v_col_type
            WHEN 'number' THEN
              -- Try to convert to number, use NULL if invalid
              BEGIN
                col_values := col_values || format('%L::NUMERIC', val::NUMERIC);
              EXCEPTION WHEN OTHERS THEN
                col_values := col_values || 'NULL';
              END;
            WHEN 'boolean' THEN
              col_values := col_values || format('%L::BOOLEAN', val::BOOLEAN);
            WHEN 'date' THEN
              -- Try to convert to date, use NULL if invalid
              BEGIN
                col_values := col_values || format('%L::DATE', val::DATE);
              EXCEPTION WHEN OTHERS THEN
                col_values := col_values || 'NULL';
              END;
            ELSE -- text
              col_values := col_values || format('%L', val);
          END CASE;
        END IF;
      END LOOP;

      -- Only insert if we have valid columns
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION bulk_insert_notice_rows(text, jsonb) TO authenticated;