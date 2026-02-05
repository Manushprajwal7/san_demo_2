-- Function to delete a row from a dynamic notice table
CREATE OR REPLACE FUNCTION delete_notice_row(
  p_table_name TEXT,
  p_row_id TEXT
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Validate table name to prevent SQL injection
  IF p_table_name !~ '^[a-z_][a-z0-9_]*$' THEN
    RAISE EXCEPTION 'Invalid table name: %', p_table_name;
  END IF;

  -- Check if table exists in registry
  IF NOT EXISTS (
    SELECT 1 FROM notice_tables_registry WHERE table_name = p_table_name
  ) THEN
    RAISE EXCEPTION 'Table % not found in registry', p_table_name;
  END IF;

  -- Delete the row
  EXECUTE format('DELETE FROM %I WHERE id = $1', p_table_name)
  USING p_row_id;
END;
$$;

-- Function to update a row in a dynamic notice table
CREATE OR REPLACE FUNCTION update_notice_row(
  p_table_name TEXT,
  p_row_id TEXT,
  p_data JSONB
)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_set_clause TEXT;
  v_key TEXT;
  v_value TEXT;
  v_columns JSONB;
  v_col_type TEXT;
BEGIN
  -- Validate table name
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

  -- Build SET clause dynamically
  v_set_clause := '';
  
  FOR v_key IN SELECT jsonb_object_keys(p_data)
  LOOP
    -- Skip 'id' field
    IF v_key = 'id' THEN
      CONTINUE;
    END IF;

    -- Get column type from registry
    SELECT (elem->>'type')::TEXT INTO v_col_type
    FROM jsonb_array_elements(v_columns) AS elem
    WHERE elem->>'name' = v_key;

    IF v_col_type IS NULL THEN
      CONTINUE; -- Skip unknown columns
    END IF;

    -- Get value
    v_value := p_data->>v_key;

    -- Build SET clause
    IF v_set_clause != '' THEN
      v_set_clause := v_set_clause || ', ';
    END IF;

    -- Handle different data types
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
      ELSE -- text
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

  -- Execute update
  EXECUTE format('UPDATE %I SET %s, updated_at = NOW() WHERE id = $1', 
    p_table_name, v_set_clause)
  USING p_row_id;
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION delete_notice_row(TEXT, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION update_notice_row(TEXT, TEXT, JSONB) TO authenticated;
