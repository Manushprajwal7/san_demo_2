# HRMS Setup Guide

This guide will help you set up the HRMS application with Supabase backend.

## Prerequisites

- Node.js 16 or higher
- A Supabase account (https://supabase.com)
- Git (optional)

## Step 1: Supabase Setup

### Create a Supabase Project

1. Go to https://supabase.com and sign in
2. Click "New Project"
3. Fill in the project details:
   - **Name**: HRMS-Project (or your preferred name)
   - **Database Password**: Create a strong password
   - **Region**: Select your closest region
4. Wait for the project to be created (2-3 minutes)

### Get Your Credentials

1. Go to your project's **Settings** → **API**
2. Copy these values:
   - `Project URL` (this is your `NEXT_PUBLIC_SUPABASE_URL`)
   - `anon public` key (this is your `NEXT_PUBLIC_SUPABASE_ANON_KEY`)

## Step 2: Initialize Database

### Method 1: Using Supabase SQL Editor (Recommended)

1. In your Supabase project, go to **SQL Editor**
2. Click **New Query**
3. Open `/scripts/init-database.sql` in your code editor
4. Copy the entire content
5. Paste it into the Supabase SQL Editor
6. Click **Run** to execute all queries

The script will create:
- All necessary tables with proper relationships
- Sample data for testing
- Indexes for performance optimization
- RLS policies for security

### Sample Data Created

**Companies:**
- Sangeetha Mobiles
- AMPL
- Demo Company

**Branches (for Sangeetha Mobiles):**
- Main Branch - Chennai (50 approved, 45 actual employees)
- North Branch - Delhi (30 approved, 28 actual employees)
- South Branch - Bangalore (40 approved, 38 actual employees)

**License Status:**
- PF License: Active (expires in 180 days)
- ESIC License: Expiring Soon (expires in 90 days)
- PT License: Expired

## Step 3: Application Setup

### 1. Clone or Download the Project

```bash
git clone <repository-url>
cd hrms-app
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory:

```
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

**Example:**
```
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Run the Application

```bash
npm run dev
```

The application will start at `http://localhost:3000`

## Step 4: Access the Application

### Login Page

Navigate to `http://localhost:3000/login`

**Demo Credentials:**
- Email: `demo@sangeetha.in`
- Password: `demo@123`
- Company: Select "Sangeetha Mobiles" from the dropdown

## Features Overview

### Dashboard Tab
- **License Status Summary**: Shows Active, Expiring Soon, and Expired licenses
- **Branch-wise Summary**: Bar chart comparing approved vs actual manpower
- **Manpower Summary**: Total employees, gender distribution, and salary overview
- **Gender Distribution**: Pie chart showing male/female ratio

### Calendar Tab
- Interactive calendar showing company holidays and events
- Click on dates to view event details
- Branch information panel with manpower and salary details
- Month/year navigation

### Notice Generator Tab
- **Form Builder**: Create custom forms/tables with multiple field types
- **Excel Import**: Import data from CSV/Excel files
- **Data Management**: View, edit, and delete records in custom tables
- **Export**: Download data back to Excel

### Compliance Tab
- **Submission Form**: Submit compliance reports for multiple branches
- **Compliance Types**: PF, ESIC, PT, TDS, ESI, Gratuity
- **Report Generation**: Create and print PDF compliance reports
- **Excel Export**: Export all submissions to Excel

## Database Schema

### Main Tables

#### companies
- Stores company information
- Sample: Sangeetha Mobiles, AMPL, Demo Company

#### branches
- Stores branch/office information
- Links to companies
- Contains manpower counts and salary data

#### employees
- Stores employee records
- Links to branch and company
- Includes designation, salary, gender, etc.

#### calendar_events
- Stores company holidays and important events
- Associated with branches

#### leave_types & leave_records
- Manages leave allocation and requests
- Tracks leave balance

#### dynamic_tables_metadata
- Stores definition of custom forms created via Notice Generator
- Tracks field names and data types

#### dynamic_table_data
- Stores actual data for custom forms
- Flexible JSONB storage for form data

#### compliance_submissions
- Tracks compliance submissions
- Stores status and submission dates

#### license_status
- Tracks company licenses and compliance deadlines
- Alerts for expiring licenses

## Troubleshooting

### Issue: "Invalid custom property" Error
**Solution**: Clear your browser cache and restart the dev server
```bash
npm run dev
```

### Issue: Supabase Connection Failed
**Solution**: Verify your environment variables:
1. Check `.env.local` file exists
2. Verify `NEXT_PUBLIC_SUPABASE_URL` format: `https://xxxxx.supabase.co`
3. Ensure `NEXT_PUBLIC_SUPABASE_ANON_KEY` is complete (not truncated)
4. Restart the dev server after updating `.env.local`

### Issue: Tables Not Found
**Solution**: 
1. Verify SQL script was executed successfully in Supabase
2. Go to Supabase → Tables section and confirm tables exist
3. If not, re-run the SQL script

### Issue: No Data in Dashboard
**Solution**:
1. Verify sample data was inserted (check Sangeetha Mobiles company records)
2. Make sure you're viewing data for the selected company
3. Check browser console for any errors (F12 → Console tab)

## Performance Optimization

The application includes:
- Database indexes on frequently queried columns
- Optimized queries with Supabase
- Efficient component rendering
- Light theme for better performance

## Security Considerations

- No sensitive data stored in frontend code
- Environment variables kept in `.env.local` (never commit to git)
- Supabase RLS policies configured but basic in this demo
- For production, implement proper authentication

## Next Steps

1. **Customize for Your Company**: Update company names and branches
2. **Add More Employees**: Insert employee records in Supabase
3. **Implement Authentication**: Connect Supabase Auth for real user management
4. **Add Role-Based Access**: Implement manager and HR admin roles
5. **Email Notifications**: Set up email alerts for compliance deadlines

## Support

If you encounter issues:
1. Check the browser console (F12)
2. Verify Supabase connection in Network tab
3. Review the README.md for feature documentation
4. Check Supabase logs for any server-side errors

## Deployment

To deploy to Vercel:

1. Push your code to GitHub
2. Go to vercel.com and connect your repository
3. Add environment variables in Vercel project settings
4. Deploy with a single click

```bash
git push
# Then deploy from Vercel dashboard
```

The application will be live at your Vercel domain!
