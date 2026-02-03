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

### 3. **Notice Generator** (Dynamic Database)
- Create custom form/table structures
- Define fields with multiple data types (text, number, date, boolean)
- Excel import functionality
- CRUD operations for record management
- Data export to Excel

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
- **Authentication**: Demo credentials (can be extended to Supabase Auth)

## Environment Variables

Create a `.env.local` file with:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## Database Setup

1. Go to your Supabase project
2. Copy the SQL from `/scripts/init-database.sql`
3. Paste it into the SQL Editor in Supabase
4. Execute the script to create all tables and insert sample data

The schema includes:
- `companies` - Organization records
- `branches` - Company branches
- `employees` - Employee records
- `calendar_events` - Company events and holidays
- `leave_types` and `leave_records` - Leave management
- `dynamic_tables_metadata` - Custom form definitions
- `dynamic_table_data` - Custom form data storage
- `compliance_submissions` - Compliance tracking
- `license_status` - License and compliance status

## Usage

### Login
- **Demo Email**: demo@sangeetha.in
- **Demo Password**: demo@123
- **Company Options**: Sangeetha Mobiles, AMPL, Demo Company

### Navigation
- **Dashboard Tab**: View HR summaries and statistics
- **Calendar Tab**: Browse company events and holidays
- **Notice Generator**: Create custom forms and manage data
- **Compliance Tab**: Submit and track compliance requirements

## Color Theme

The application uses a light blue color palette:
- Primary: `#0ea5e9` (Sky Blue)
- Secondary: `#06b6d4` (Cyan)
- Background: Light blue-50
- Text: Dark blue-900

## Project Structure

```
/app
  /login - Authentication page
  /dashboard - Main HRMS dashboard with all features
  /layout.tsx - Root layout
  /page.tsx - Home redirect

/components
  /calendar-view.tsx - Calendar component
  /notice-generator.tsx - Dynamic form builder
  /compliance-submission.tsx - Compliance management
  /ui - shadcn UI components

/lib
  /supabase.ts - Supabase client configuration

/scripts
  /init-database.sql - Database schema and sample data
```

## Features Details

### Dashboard Statistics
- Total employees count
- Gender distribution (Male/Female pie chart)
- Branch-wise manpower comparison
- Total salary overview
- License status indicators

### Calendar Features
- Interactive calendar with event indicators
- Click to view event details
- Branch information panel
- Manpower and salary summary per branch

### Notice Generator
- Step 1: Define form structure with multiple field types
- Step 2: Auto-generate database table in Supabase
- Step 3: Import data from Excel files
- Step 4: Full CRUD operations on form data
- Step 5: Export to Excel for analysis

### Compliance Module
- Select compliance type (PF, ESIC, PT, TDS, ESI, Gratuity)
- Choose submission month
- Select multiple branches
- View submission status
- Generate and print PDF reports
- Export all submissions to Excel

## API Endpoints (via Supabase)

All data operations use Supabase's REST API:
- GET `/rest/v1/companies`
- GET `/rest/v1/branches`
- GET `/rest/v1/employees`
- GET `/rest/v1/calendar_events`
- POST/GET/UPDATE/DELETE `/rest/v1/compliance_submissions`
- POST/GET/UPDATE/DELETE `/rest/v1/dynamic_table_data`

## Security

- Row Level Security (RLS) policies configured in Supabase
- Session-based authentication
- Company-scoped data access
- Branch-specific permissions

## Future Enhancements

- User authentication via Supabase Auth
- Role-based access control (Employee, Manager, HR Admin)
- Email notifications
- Advanced reporting and analytics
- Mobile app support
- API integrations with payroll systems

## Support

For issues or feature requests, please check the console logs and verify:
1. Supabase credentials are correctly configured
2. Database schema is properly initialized
3. Network connectivity to Supabase
4. Browser console for error messages

## License

This project is part of the v0 HRMS initiative.
