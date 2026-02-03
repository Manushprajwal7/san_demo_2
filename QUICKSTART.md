# 🚀 HRMS Quick Start Guide (5 Minutes)

Get the HRMS application running in just 5 minutes!

## Step 1: Get Your Supabase Credentials (1 minute)

1. Go to https://supabase.com/dashboard
2. Create a new project (or use existing)
3. Go to **Settings → API**
4. Copy these two values:
   - **Project URL** (looks like: `https://xyzabc.supabase.co`)
   - **anon public key** (long string starting with `eyJ...`)

## Step 2: Setup Database (2 minutes)

1. In Supabase, go to **SQL Editor**
2. Click **New Query**
3. Open `/scripts/init-database.sql` from this project
4. Copy all content and paste into Supabase
5. Click **Run** button
6. ✅ Done! All tables and sample data created

## Step 3: Configure App (1 minute)

1. Create `.env.local` file in project root:

```
NEXT_PUBLIC_SUPABASE_URL=https://xyzabc.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

2. Replace with your actual values from Step 1

## Step 4: Run Application (1 minute)

```bash
npm install
npm run dev
```

Open `http://localhost:3000` in your browser

## Step 5: Login & Explore

**Demo Credentials:**
- Email: `demo@sangeetha.in`
- Password: `demo@123`
- Company: Select "Sangeetha Mobiles"

## What You'll See

### Dashboard Tab
- License status cards (Active, Expiring, Expired)
- Branch manpower bar chart
- Gender distribution pie chart
- Total salary overview

### Calendar Tab
- Full-screen calendar
- Click dates to view events
- Branch details panel
- Holiday and event information

### Notice Generator Tab
- Create custom forms
- Import Excel files
- View and manage data
- Export to Excel

### Compliance Tab
- Submit compliance reports
- Multiple compliance types
- Generate PDF reports
- Track submission status

---

## Troubleshooting

### Error: "Invalid custom property"
**Solution:** Clear cache and restart
```bash
# Press Ctrl+C in terminal
npm run dev
```

### Error: "Failed to connect to Supabase"
**Solution:** Check environment variables
1. Verify `.env.local` exists
2. Copy-paste credentials exactly (no extra spaces)
3. Restart dev server

### Error: "Tables not found"
**Solution:** Verify SQL script ran
1. In Supabase, go to **Tables**
2. Should see: companies, branches, employees, etc.
3. If not, re-run the SQL script

### No data showing?
**Solution:** Verify sample data
1. Check Supabase → Tables → companies
2. Should have "Sangeetha Mobiles" record
3. If empty, re-run SQL script

---

## Next: Deployment (Optional)

### Deploy to Vercel (Free)

1. Push code to GitHub
2. Go to vercel.com
3. Import your repository
4. Add environment variables:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
5. Click Deploy

Your app will be live instantly!

---

## Key Features Summary

| Feature | Status | Details |
|---------|--------|---------|
| Dashboard | ✅ | Live charts & statistics |
| Calendar | ✅ | Full month view with events |
| Notice Generator | ✅ | Create custom forms |
| Compliance | ✅ | Submit & track compliance |
| Theme | ✅ | Light blue modern UI |
| Database | ✅ | Supabase PostgreSQL |
| Sample Data | ✅ | 3 companies, 3 branches |

---

## Project Files

- `app/` - All pages and routes
- `components/` - React components
- `lib/` - Configuration and utilities
- `scripts/init-database.sql` - Database schema
- `README.md` - Full documentation
- `SETUP.md` - Detailed setup guide
- `IMPLEMENTATION.md` - Feature checklist

---

## Demo Data Included

**Companies:**
- Sangeetha Mobiles
- AMPL
- Demo Company

**Branches (Sangeetha):**
- Main Branch (Chennai) - 45/50 employees
- North Branch (Delhi) - 28/30 employees
- South Branch (Bangalore) - 38/40 employees

**Licenses:**
- PF: Active
- ESIC: Expiring Soon
- PT: Expired

**Events:**
- Diwali Holiday
- New Year Holiday
- Team Building Event

---

## Tips & Tricks

1. **Test Different Companies**
   - Login page has dropdown
   - Select different company to see separate data

2. **Create Custom Forms**
   - Notice Generator → Form Builder
   - Define fields and types
   - Auto-creates database table

3. **Export Data**
   - Click "Export to Excel" button
   - Download compliance or form data
   - Opens in Excel/Google Sheets

4. **Print Reports**
   - View compliance submission
   - Click "Generate & Print PDF"
   - Opens print dialog

5. **Check Supabase**
   - Visit Supabase dashboard anytime
   - View all tables and data
   - Run custom SQL queries

---

## Common Questions

**Q: Can I add my own employees?**
A: Yes! Go to Supabase → Tables → employees → Insert row

**Q: Can I change the company name?**
A: Yes! Update in Supabase → Tables → companies

**Q: Is this production-ready?**
A: Yes! Add authentication and deploy to Vercel

**Q: Can I customize the theme?**
A: Yes! Edit colors in `/app/globals.css`

**Q: How do I backup data?**
A: Supabase has automatic daily backups in settings

---

## Support

- 📖 Read `SETUP.md` for detailed setup
- 📋 Read `README.md` for feature docs
- ✅ Read `IMPLEMENTATION.md` for checklist
- 🔧 Read `SQL_SCHEMA_REFERENCE.md` for database

---

## What's Next?

1. ✅ Run the application (you're here!)
2. ⏭️ Explore all 4 tabs
3. ⏭️ Create a custom form
4. ⏭️ Submit compliance report
5. ⏭️ Deploy to Vercel
6. ⏭️ Add real employees
7. ⏭️ Implement authentication

---

**Happy exploring! 🎉**

If you have questions, check the documentation files provided.
If issues persist, verify Supabase credentials and try restarting the dev server.
