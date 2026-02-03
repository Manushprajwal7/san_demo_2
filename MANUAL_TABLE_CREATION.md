# Manual Table Creation Guide

## When to Use This

Use this when the automatic table creation fails and you need to create tables manually in Supabase.

## Steps:

### 1. Create the Table

In Supabase Table Editor:

1. Click "New Table"
2. Table name: `custom_yourformname` (use the exact name from the form builder)
3. Click "Create"

### 2. Add Required Columns

Every table needs these base columns:

- `id` - UUID - Primary Key - Default: `gen_random_uuid()`
- `created_at` - TIMESTAMP - Default: `NOW()`
- `updated_at` - TIMESTAMP - Default: `NOW()`

### 3. Add Your Form Fields

For each field in your form, add a column:

- Use the exact field name from your form
- Set the appropriate data type:
  - Text fields → TEXT
  - Number fields → NUMERIC
  - Date fields → DATE
  - Boolean fields → BOOLEAN

### 4. Example

If your form has fields: `employee_name`, `salary`, `hire_date`, `is_active`

Create table `custom_employee_data` with columns:

```
id          UUID      PRIMARY KEY  DEFAULT gen_random_uuid()
created_at  TIMESTAMP              DEFAULT NOW()
updated_at  TIMESTAMP              DEFAULT NOW()
employee_name TEXT
salary      NUMERIC
hire_date   DATE
is_active   BOOLEAN
```

### 5. Set Permissions

Run this in SQL Editor:

```sql
-- Replace 'your_table_name' with actual table name
GRANT ALL ON TABLE your_table_name TO authenticated;
GRANT ALL ON TABLE your_table_name TO anon;

-- If RLS is enabled:
CREATE POLICY "Enable all access" ON your_table_name
FOR ALL TO authenticated USING (true) WITH CHECK (true);
```

### 6. Update Form Builder

After creating the table manually:

1. The form will automatically detect the existing table
2. Form submissions will go directly to your table
3. You can verify data in Supabase Table Editor

## Quick Template Generator

For any form, use this template:

```sql
-- Replace 'your_table_name' and column names
CREATE TABLE your_table_name (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    -- Add your columns here:
    column1 TEXT,
    column2 NUMERIC,
    column3 DATE,
    column4 BOOLEAN
);

-- Set permissions
GRANT ALL ON TABLE your_table_name TO authenticated;
GRANT ALL ON TABLE your_table_name TO anon;
```

The form builder will work with manually created tables just as well as automatically created ones!
