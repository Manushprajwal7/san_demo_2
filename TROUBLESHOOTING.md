# Form Submission Troubleshooting Guide

## Common Issues and Solutions

### 1. **Table Not Found Error**

**Symptoms**: "relation 'custom_tablename' does not exist"
**Solutions**:

- Verify the table was created successfully by checking Supabase Table Editor
- Check that the `exec_sql` function is working properly
- Run the test script in `scripts/test-table-access.sql`

### 2. **Permission Denied Error**

**Symptoms**: "permission denied for table custom_tablename"
**Solutions**:

- Ensure your Supabase project has RLS (Row Level Security) configured properly
- Check that the authenticated user has INSERT permissions
- Run this in Supabase SQL editor:

```sql
GRANT INSERT ON TABLE custom_your_table_name TO authenticated;
```

### 3. **Data Type Mismatch**

**Symptoms**: "invalid input syntax" or "column X cannot accept type Y"
**Solutions**:

- Check that form field types match database column types
- Verify date formats are correct (YYYY-MM-DD)
- Ensure numeric fields contain valid numbers

### 4. **Missing Required Fields**

**Symptoms**: "null value in column X violates not-null constraint"
**Solutions**:

- Check that all required fields are filled in the form
- Verify the table schema doesn't have NOT NULL constraints on optional fields

## Debugging Steps

### Step 1: Check Browser Console

Open browser developer tools (F12) and look at the console output when submitting the form. You should see:

- Table name being used
- Form data being sent
- Supabase response with success/error details

### Step 2: Verify Table Creation

In Supabase dashboard:

1. Go to Table Editor
2. Look for your table (should start with "custom\_")
3. Check the column structure matches your form fields

### Step 3: Test Direct Database Access

Run the test script in `scripts/test-table-access.sql` with your actual table name.

### Step 4: Check Supabase Logs

In Supabase dashboard:

1. Go to Logs Explorer
2. Filter by your table name
3. Look for INSERT operations and their results

## Enhanced Debugging Version

The current code includes extensive logging. When you submit a form, check the browser console for:

```
=== FORM SUBMISSION DEBUG INFO ===
Table name: custom_your_table_name
Form data: { field1: "value1", field2: "value2" }
Table structure: [array of field definitions]
Selected form table: [full table metadata]

Supabase response: { error: null, data: [inserted record] }
```

If there's an error, you'll see:

```
=== INSERT ERROR ===
Error details: [full error object]
Table name used: custom_your_table_name
Raw data sent: [the data that was attempted to insert]
```

## Quick Fixes

### Add Missing Permissions

If you get permission errors, run this in Supabase SQL editor:

```sql
-- Replace 'your_table_name' with actual table name
GRANT ALL ON TABLE custom_your_table_name TO authenticated;
GRANT ALL ON TABLE custom_your_table_name TO anon;
```

### Check RLS Policies

If RLS is enabled, you might need to create a policy:

```sql
CREATE POLICY "Enable insert for authenticated users"
ON custom_your_table_name
FOR INSERT
TO authenticated
WITH CHECK (true);
```

The enhanced debugging should help identify exactly where the issue occurs!
