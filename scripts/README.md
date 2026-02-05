# Database Scripts

## Init Database (Required for Notice Builder + Employees flow)

**Run `init-database.sql` in Supabase SQL Editor** to set up the Notice Builder flow.

This creates:
- `notice_tables_registry` – stores metadata for user-created tables
- RPC functions: `create_notice_table`, `check_table_exists`, `get_notice_table_data`, `insert_notice_row`, `bulk_insert_notice_rows`, `delete_notice_row`, `update_notice_row`

## Flow

1. **Notice Builder** (`/dashboard/notice`)
   - Define fields: `column_name:datatype` (e.g. `empname:text`, `joining_date:date`)
   - Click **Apply Fields**
   - Enter table name and display name
   - Click **Create Form / Table** → creates table in Supabase and registers it

2. **Employees** (`/dashboard/employees`)
   - Select the table created in Notice Builder
   - Import Excel/CSV (column names must match the table)
   - View, filter, export, edit, delete data

## Other scripts

- `notice-setup.sql` – legacy; use `init-database.sql` instead
- `notice-crud-functions.sql` – legacy; included in `init-database.sql`
- `update-bulk-insert.sql` – legacy; included in `init-database.sql`
- `create-employees-table.sql` – only if you need a standalone `employees` table (not used in the Notice Builder flow)
