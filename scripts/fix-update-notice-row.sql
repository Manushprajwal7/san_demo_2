-- Run this if you get 400 error when editing rows (PUT /api/notice)
-- This fixes update_notice_row to work with tables that may not have updated_at column

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
