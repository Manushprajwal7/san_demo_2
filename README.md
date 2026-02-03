# HRMS - Human Resource Management System

A modern, enterprise-ready HRMS platform built with Next.js and Supabase. Features a light blue theme, comprehensive HR workflows, and real-time data management.

## Features

### 1. **Dashboard**
- License Status Summary (Active, Expiring Soon, Expired)
- Branch-wise Manpower Summary
- Gender Distribution Analytics
- Salary Management Overview
- Real-time data visualization with Recharts charts

### 2. **Calendar View**
- Full-screen Google Calendar-style interface
- Month/Year navigation
- Event management for company holidays and important dates
- Branch-wise details on selected dates
- Manpower and salary information

### 3. **Notice Builder** (Dynamic Form Builder & Data Management)
- Define custom table schemas using a simple `column_name:datatype` syntax
- Supported data types: `text`, `number`, `date`, `boolean`
- Creates real PostgreSQL tables in Supabase via secure RPC functions
- Auto-generates entry forms from the table schema
- Live data preview table that refreshes after each insert
- Excel/CSV import with column validation and bulk insert
- Registry of all created tables for easy access
- Modular component architecture under `components/notice/`

### 4. **Compliance Submission**
- Support for multiple compliance types (PF, ESIC, PT, TDS, ESI, Gratuity)
- Branch-wise submission management
- Status tracking (Pending, Approved)
- PDF report generation
- Excel export functionality

## Tech Stack

- **Frontend**: Next.js 16 with App Router
- **Styling**: Tailwind CSS v4 with light blue theme
- **Components**: shadcn/ui
- **Backend**: Supabase (PostgreSQL)
- **Charts**: Recharts
- **Excel Handling**: xlsx library for client-side parsing
- **Authentication**: Demo credentials (can be extended to Supabase Auth)

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
```

The `SUPABASE_SERVICE_ROLE_KEY` is required for the Notice Builder API route, which needs elevated privileges to create tables and execute RPC functions.

## Database Setup

### Core Tables

1. Go to your Supabase project
2. Copy the SQL from `/scripts/init-database.sql`
3. Paste it into the SQL Editor in Supabase
4. Execute the script to create all tables and insert sample data

The core schema includes:
- `companies` - Organization records
- `branches` - Company branches
- `employees` - Employee records
- `calendar_events` - Company events and holidays
- `leave_types` and `leave_records` - Leave management
- `compliance_submissions` - Compliance tracking
- `license_status` - License and compliance status

### Notice Builder Setup

Run `/scripts/notice-setup.sql` in the Supabase SQL Editor. This creates:

- `notice_tables_registry` - Tracks all user-created tables with their column definitions
- `create_notice_table(p_table_name, p_columns)` - RPC function to create dynamic PostgreSQL tables
- `check_table_exists(p_table_name)` - RPC function to check if a table already exists
- `get_notice_table_data(p_table_name)` - RPC function to fetch all rows from a dynamic table
- `insert_notice_row(p_table_name, p_data)` - RPC function to insert a single row
- `bulk_insert_notice_rows(p_table_name, p_rows)` - RPC function to bulk insert rows from Excel/CSV import

All RPC functions use `SECURITY DEFINER` and safe identifier quoting via `format(%I)` to prevent SQL injection. The `create_notice_table` function also sends `NOTIFY pgrst, 'reload schema'` so PostgREST immediately recognizes new tables.

## Usage

### Login
- **Demo Email**: demo@sangeetha.in
- **Demo Password**: demo@123
- **Company Options**: Sangeetha Mobiles, AMPL, Demo Company

### Navigation
- **Dashboard Tab**: View HR summaries and statistics
- **Calendar Tab**: Browse company events and holidays
- **Notice Builder**: Create custom forms, manage data, import from Excel/CSV
- **Compliance Tab**: Submit and track compliance requirements

### Notice Builder Workflow

1. **Define Fields**: Enter field definitions in the textarea, one per line (e.g. `emp_id:text`, `notice_date:date`, `reason:text`)
2. **Apply Fields**: Click "Apply Fields" to validate and parse the definitions
3. **Review & Create**: Review the fields table, enter a table name and display name, then click "Create Form / Table"
4. **Fill the Form**: The auto-generated form appears on the right. Fill in values and submit to insert rows
5. **View Data**: The data preview table below the form shows all inserted rows
6. **Import Data**: Switch to the "Import Data" tab to bulk import from Excel or CSV files

## Project Structure

```
/app
  /login              - Authentication page
  /dashboard          - Main HRMS dashboard
    /notice/page.tsx  - Notice Builder page
  /api
    /notice/route.ts  - Notice Builder API (create-table, insert-row, bulk-insert)
    /calendar/        - Calendar API
    /compliance/      - Compliance API
    /employees/       - Employees API
    /branches/        - Branches API
    /companies/       - Companies API
    /leaves/          - Leaves API
    /licenses/        - Licenses API

/components
  /notice
    /notice-builder.tsx    - Main orchestrator (tabs, state coordination)
    /field-definition.tsx  - Bulk field input with validation
    /fields-table.tsx      - Fields display table + table creation
    /dynamic-form.tsx      - Auto-generated form from schema
    /data-preview.tsx      - Inserted data table with refresh
    /excel-import.tsx      - Excel/CSV import with column validation
  /calendar-view.tsx       - Calendar component
  /compliance-submission.tsx - Compliance management
  /dashboard-sidebar.tsx   - Navigation sidebar
  /dashboard-header.tsx    - Header with user info
  /company-context.tsx     - Company context provider
  /ui                      - shadcn/ui components

/lib
  /supabase.ts    - Supabase client configuration
  /api-client.ts  - REST API client wrapper
  /auth-context.tsx - Authentication context
  /utils.ts       - Utility functions

/scripts
  /init-database.sql   - Core database schema and sample data
  /notice-setup.sql    - Notice Builder tables and RPC functions
```

## API Endpoints

### Notice Builder API (`/api/notice`)

| Method | Parameters | Description |
|--------|-----------|-------------|
| GET | `?action=tables` | List all tables from the registry |
| GET | `?action=data&table=<name>` | Fetch all rows from a dynamic table |
| GET | `?action=columns&table=<name>` | Get column definitions for a table |
| POST | `{action: "create-table", tableName, displayName, columns}` | Create a new table and register it |
| POST | `{action: "insert-row", tableName, data}` | Insert a single row |
| POST | `{action: "bulk-insert", tableName, rows}` | Bulk insert rows (from Excel/CSV) |

### Other APIs (via Supabase)

- GET/POST `/api/dashboard` - Dashboard statistics
- GET/POST `/api/employees` - Employee management
- GET/POST `/api/branches` - Branch management
- GET/POST `/api/calendar` - Calendar events
- GET/POST/PATCH `/api/compliance` - Compliance submissions
- GET/POST/PATCH `/api/leaves` - Leave management
- GET/POST/PATCH `/api/licenses` - License management

## Security

- Row Level Security (RLS) policies configured in Supabase
- Session-based authentication
- Company-scoped data access
- Service role key used only in server-side API routes (never exposed to client)
- RPC functions use `SECURITY DEFINER` with safe identifier quoting to prevent SQL injection

## Color Theme

The application uses a light blue color palette:
- Primary: `#0ea5e9` (Sky Blue)
- Secondary: `#06b6d4` (Cyan)
- Background: Light blue-50
- Text: Dark blue-900

## Future Enhancements

- User authentication via Supabase Auth
- Role-based access control (Employee, Manager, HR Admin)
- Email notifications
- Advanced reporting and analytics
- Mobile app support
- API integrations with payroll systems

## Support

For issues or feature requests, please check the console logs and verify:
1. Supabase credentials are correctly configured (including `SUPABASE_SERVICE_ROLE_KEY`)
2. Database schema is properly initialized (both `init-database.sql` and `notice-setup.sql`)
3. Network connectivity to Supabase
4. Browser console for error messages

## License

This project is part of the v0 HRMS initiative.
