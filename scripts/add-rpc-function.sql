-- Add RPC function for executing dynamic SQL
CREATE OR REPLACE FUNCTION exec_sql(sql_statement TEXT)
RETURNS VOID AS $$
BEGIN
    EXECUTE sql_statement;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION exec_sql(TEXT) TO anon;