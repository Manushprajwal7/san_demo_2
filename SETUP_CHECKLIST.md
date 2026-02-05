# DOCX Form Generator - Setup Checklist

Use this checklist to ensure everything is configured correctly.

## ✅ Pre-requisites

- [ ] Node.js installed (v18 or higher)
- [ ] Next.js 14 project set up
- [ ] Supabase account and database created
- [ ] Microsoft Word or compatible DOCX editor

## ✅ Environment Setup

- [ ] `.env.local` file exists in project root
- [ ] `NEXT_PUBLIC_SUPABASE_URL` is set
- [ ] `NEXT_PUBLIC_SUPABASE_ANON_KEY` is set
- [ ] Environment variables are valid (test with `npm run dev`)

## ✅ Dependencies

All these should already be in your `package.json`:

- [ ] `docx-templates` - Primary DOCX editor
- [ ] `docxtemplater` - Fallback DOCX processor
- [ ] `pizzip` - ZIP handling for DOCX
- [ ] `@supabase/supabase-js` - Database client

Run `npm install` if you just cloned the project.

## ✅ File Structure

Verify these files exist:

### Core Library Files

- [ ] `lib/docx-processor.ts` - DOCX editing functions
- [ ] `lib/form-generator.ts` - Main generation logic
- [ ] `lib/db-mapper.ts` - Database column mapping
- [ ] `lib/supabase.ts` - Database connection

### API Routes

- [ ] `app/api/generate-form/route.ts` - Generate DOCX endpoint
- [ ] `app/api/templates/route.ts` - List templates endpoint
- [ ] `app/api/employees/route.ts` - List employees endpoint
- [ ] `app/api/employees/[id]/route.ts` - Get single employee endpoint

### UI Components

- [ ] `components/form-generator.tsx` - Main UI component
- [ ] `app/dashboard/form-generator/page.tsx` - Form generator page

### Template Directory

- [ ] `forms/` directory exists in project root
- [ ] `forms/Form_A.docx` exists (or another template)

## ✅ Template File

Open `forms/Form_A.docx` and verify:

- [ ] File opens in Microsoft Word
- [ ] Contains placeholders in format: `[[Placeholder Name]]`
- [ ] Placeholders use double square brackets (not single, not curly braces)
- [ ] At least one placeholder exists
- [ ] File is saved as `.docx` (not `.doc` or `.docm`)

Example placeholders:

```
[[Empname]]
[[Designation Name]]
[[Date of Birth]]
[[Present Res No]]
```

## ✅ Database Setup

### Tables

- [ ] At least one employee table exists in Supabase
- [ ] Table is registered in `notice_tables_registry` (if using that system)
- [ ] Table has an `id` column (UUID or text)
- [ ] Table has at least one employee record

### Columns

Verify your table has columns matching your template placeholders:

Example for `[[Empname]]` placeholder:

- [ ] Table has column named `empname` (lowercase, underscores for spaces)

Example for `[[Designation Name]]` placeholder:

- [ ] Table has column named `designation_name`

**Column Naming Rules:**

- Lowercase only
- Spaces become underscores
- No special characters

## ✅ Testing

### 1. Run Test Script

```bash
npx tsx scripts/test-docx-editing.ts
```

Expected output:

- [ ] ✅ Template found
- [ ] ✅ Placeholders extracted
- [ ] ✅ Column mapping working
- [ ] ✅ DOCX population working
- [ ] ✅ Test file created: `forms/Form_A_TEST.docx`

### 2. Verify Test File

- [ ] Open `forms/Form_A_TEST.docx` in Word
- [ ] Placeholders are replaced with sample data
- [ ] Formatting is preserved
- [ ] No `[[...]]` patterns remain

### 3. Start Development Server

```bash
npm run dev
```

Expected:

- [ ] Server starts without errors
- [ ] No TypeScript compilation errors
- [ ] Can access `http://localhost:3000`

### 4. Test UI

Navigate to: `http://localhost:3000/dashboard/form-generator`

- [ ] Page loads without errors
- [ ] Template dropdown shows Form_A
- [ ] Table dropdown shows your employee table
- [ ] Employee dropdown shows employees (after selecting table)
- [ ] Preview shows employee data (after selecting employee)
- [ ] "Generate & Download Form" button is enabled

### 5. Generate Test Form

- [ ] Click "Generate & Download Form"
- [ ] DOCX file downloads
- [ ] File opens in Microsoft Word
- [ ] Placeholders are replaced with actual employee data
- [ ] Formatting is preserved
- [ ] File is editable

## ✅ API Testing

### Test Templates Endpoint

```bash
curl http://localhost:3000/api/templates
```

Expected response:

```json
{
  "success": true,
  "templates": [
    {
      "name": "Form_A",
      "path": "forms/Form_A.docx",
      "placeholderCount": 9,
      "placeholders": ["Empname", "Designation Name", ...]
    }
  ]
}
```

- [ ] Returns success: true
- [ ] Shows your template
- [ ] Lists placeholders

### Test Employees Endpoint

```bash
curl http://localhost:3000/api/employees
```

Expected response:

```json
{
  "success": true,
  "tables": [
    {
      "name": "employees",
      "displayName": "Employees",
      "count": 10
    }
  ]
}
```

- [ ] Returns success: true
- [ ] Shows your tables
- [ ] Shows correct count

### Test Generate Endpoint

```bash
curl -X POST http://localhost:3000/api/generate-form \
  -H "Content-Type: application/json" \
  -d '{
    "templatePath": "forms/Form_A.docx",
    "tableName": "employees",
    "employeeId": "YOUR_EMPLOYEE_ID"
  }' \
  --output test_form.docx
```

- [ ] Returns DOCX file
- [ ] File size > 0 bytes
- [ ] File opens in Word
- [ ] Data is filled correctly

## ✅ Common Issues

### Issue: "Template not found"

- [ ] Check `forms/Form_A.docx` exists
- [ ] Check file path is correct
- [ ] Check file permissions

### Issue: "No placeholders found"

- [ ] Open template in Word
- [ ] Verify placeholders use `[[...]]` format
- [ ] Check placeholders are not in text boxes or headers/footers
- [ ] Save template and try again

### Issue: "Failed to fetch employee data"

- [ ] Check `.env.local` has correct Supabase credentials
- [ ] Verify table name is correct
- [ ] Verify employee ID exists
- [ ] Check Supabase RLS policies allow access

### Issue: "Missing columns"

- [ ] Check database column names match placeholders
- [ ] Remember: spaces → underscores, lowercase only
- [ ] Add missing columns to database OR remove placeholders from template

### Issue: "Empty fields in generated document"

- [ ] This is normal if database has NULL values
- [ ] Check database has data for those columns
- [ ] System replaces NULL with empty string

## ✅ Production Readiness

Before deploying to production:

- [ ] All tests pass
- [ ] Environment variables set in production
- [ ] Database has proper indexes on `id` columns
- [ ] Error handling tested
- [ ] File size limits considered (if any)
- [ ] User permissions/authentication implemented
- [ ] Logging configured
- [ ] Backup strategy for templates

## 🎉 Ready to Use!

If all items are checked, your DOCX Form Generator is ready to use!

### Quick Start Commands

```bash
# Test the system
npx tsx scripts/test-docx-editing.ts

# Start development server
npm run dev

# Navigate to form generator
# http://localhost:3000/dashboard/form-generator
```

### Next Steps

1. Create more templates in `forms/` directory
2. Add more employee tables
3. Customize data formatting in `lib/db-mapper.ts`
4. Add authentication/authorization
5. Implement batch generation
6. Add email delivery of generated forms

## 📚 Documentation

- `QUICK_START_DOCX.md` - Quick start guide
- `DOCX_GENERATOR_SETUP.md` - Detailed setup instructions
- `EXAMPLE_USAGE.md` - Complete usage examples
- `API_DOCUMENTATION.md` - API reference (if exists)

## 🆘 Need Help?

If you're stuck:

1. Check browser console for errors
2. Check server logs (`npm run dev` output)
3. Run test script: `npx tsx scripts/test-docx-editing.ts`
4. Verify all checklist items above
5. Check that template has correct placeholder format
6. Verify database connection and data
