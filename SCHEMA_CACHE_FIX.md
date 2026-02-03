# Schema Cache Synchronization Fix

## Problem

You're getting `PGRST205` errors indicating that PostgREST can't find tables in its schema cache, even though they exist in the database.

## Root Cause

Supabase's PostgREST service maintains a schema cache that sometimes gets out of sync with the actual database state.

## Solutions

### Solution 1: Run Schema Cache Fix Script

Execute `scripts/schema-cache-fix.sql` in your Supabase SQL Editor. This will:

- Show all existing custom tables
- Verify table existence
- Force cache refresh by querying tables
- Provide option to create missing tables

### Solution 2: Manual Cache Refresh

1. Go to Supabase Dashboard
2. Navigate to "Table Editor"
3. Click "Refresh" button or reload the page
4. Wait 30-60 seconds for cache to sync

### Solution 3: API-Driven Cache Refresh

The updated form builder now includes automatic cache refresh:

- After table creation, it queries the new table
- This forces PostgREST to update its schema cache
- Happens automatically in the background

### Solution 4: Restart Supabase Services

If other solutions don't work:

1. Go to Supabase Dashboard
2. Navigate to "Database" → "Settings"
3. Look for "Restart services" option
4. Restart PostgREST service

## Verification Steps

After applying any solution:

1. **Check table existence:**

```sql
SELECT table_name FROM information_schema.tables
WHERE table_name LIKE 'custom_%';
```

2. **Verify specific table:**

```sql
SELECT * FROM custom_qqq LIMIT 1; -- Replace with your table name
```

3. **Test form submission** and check browser console for:
   - `=== TABLE CREATION ATTEMPT ===` logs
   - Schema cache refresh confirmation
   - Successful insertion messages

## Prevention

1. **Always verify table creation** in Supabase Table Editor
2. **Check browser console** after creating forms
3. **Test with simple data** before production use
4. **Refresh cache** after database schema changes

## Quick Emergency Fix

If you need immediate access:

```sql
-- Force recreate the table with proper permissions
DROP TABLE IF EXISTS custom_qqq;

CREATE TABLE custom_qqq (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
    -- Add your columns here
);

GRANT ALL ON TABLE custom_qqq TO authenticated;
GRANT ALL ON TABLE custom_qqq TO anon;

-- Force cache refresh
SELECT COUNT(*) FROM custom_qqq;
```

The enhanced system now handles schema cache issues more gracefully and provides automatic recovery mechanisms.
