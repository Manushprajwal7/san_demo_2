# Column Mismatch Error Troubleshooting

## Error: PGRST204 - Column Not Found

This error occurs when trying to insert data into a column that doesn't exist in the database table.

## Common Causes:

1. **Table doesn't exist** - The table was never created
2. **Column name mismatch** - Form field names don't match table column names exactly
3. **Case sensitivity** - PostgreSQL is case-sensitive for column names
4. **Schema cache issue** - Supabase schema cache is out of sync

## Solutions:

### 1. Verify Table Structure

Run the schema check script:

```sql
-- In Supabase SQL Editor
SELECT column_name, data_type
FROM information_schema.columns
WHERE table_name = 'custom_e3'
ORDER BY ordinal_position;
```

### 2. Compare Form Fields vs Table Columns

Check that every form field has a matching column:

- Field names must match exactly (case-sensitive)
- Data types must be compatible
- Required columns must be present

### 3. Manual Table Creation

If the table doesn't exist or columns are missing:

```sql
-- Example for a form with fields: Name, Address, Phone, Email
CREATE TABLE custom_e3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    Name TEXT,
    Address TEXT,
    Phone TEXT,
    Email TEXT
);

-- Set permissions
GRANT ALL ON TABLE custom_e3 TO authenticated;
GRANT ALL ON TABLE custom_e3 TO anon;
```

### 4. Refresh Supabase Schema Cache

Sometimes the schema cache needs to be refreshed:

1. Go to Supabase Dashboard
2. Navigate to "Table Editor"
3. Click "Refresh" or reload the page
4. Try submitting the form again

### 5. Check Browser Console

The enhanced error handling now provides detailed information:

- Exact table name being used
- Form data being sent
- Which fields are being filtered out
- Specific error details

## Prevention:

1. **Always verify table creation** after creating forms
2. **Use exact field names** in forms that match database columns
3. **Check the schema** before submitting data
4. **Test with simple data** first

## Quick Fix Template:

```sql
-- Replace with your actual table name and fields
DROP TABLE IF EXISTS custom_e3;

CREATE TABLE custom_e3 (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Add your actual form fields here:
    Address_I TEXT,  -- Make sure this matches your form field exactly
    -- other fields...
);

GRANT ALL ON TABLE custom_e3 TO authenticated;
```

The enhanced form submission now automatically filters out mismatched fields and provides clear error messages to help you resolve these issues.
