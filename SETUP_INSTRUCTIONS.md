# Supabase Form Builder Setup Instructions

## Step 1: Run Database Setup

1. Go to your Supabase project dashboard
2. Navigate to the SQL Editor
3. Copy and paste the entire content of `scripts/complete-setup.sql`
4. Click "Run" to execute the script

This will:

- Add the missing `actual_table_name` column
- Create the `exec_sql` RPC function needed for dynamic table creation
- Grant proper permissions

## Step 2: Test the Form Builder

After running the setup script:

1. Go to your application
2. Navigate to the Notice Generator / Form Builder
3. Create a new form with fields
4. Click "Create Form/Table"

You should now see:

- A real database table created in Supabase
- Success message indicating table creation
- Ability to submit form data directly to the database table

## What This Enables:

- ✅ Real database tables created in Supabase
- ✅ Direct data insertion into created tables
- ✅ Proper table structure with UUID primary keys
- ✅ Automatic timestamps (created_at, updated_at)
- ✅ Fallback to metadata storage if direct table access fails

## Troubleshooting:

If you still get errors:

1. Check that the SQL script ran successfully in Supabase
2. Verify the `exec_sql` function exists in your database
3. Check browser console for detailed error messages
4. Ensure your Supabase connection is working properly

The form builder will now create actual PostgreSQL tables in your Supabase database!
