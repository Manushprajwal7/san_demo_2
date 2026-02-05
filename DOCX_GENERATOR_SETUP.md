# DOCX Form Generator - Complete Setup Guide

## Overview

This system dynamically edits DOCX files by replacing `[[placeholder]]` patterns with actual employee data from your database.

## ✅ What's Already Installed

All required packages are already in your `package.json`:

- `docx-templates` - Primary DOCX editing library
- `docxtemplater` - Fallback DOCX processor
- `pizzip` - ZIP handling for DOCX files
- `@supabase/supabase-js` - Database connection

## 📁 File Structure

```
app/
├── api/
│   ├── employees/
│   │   ├── route.ts              # GET list of employees
│   │   └── [id]/route.ts         # GET single employee data
│   ├── templates/route.ts        # GET available templates
│   └── generate-form/route.ts    # POST: generate filled DOCX
├── dashboard/
│   └── form-generator/page.tsx   # Frontend UI

components/
└── form-generator.tsx            # Main UI component

lib/
├── docx-processor.ts             # DOCX editing functions
├── db-mapper.ts                  # Database column mapping
├── form-generator.ts             # Main generation logic
└── supabase.ts                   # Database connection

forms/
└── Form_A.docx                   # Your template file
```

## 🚀 How to Use

### Step 1: Prepare Your Template

1. Open `forms/Form_A.docx` in Microsoft Word
2. Add placeholders using double square brackets: `[[Empname]]`, `[[Designation Name]]`
3. Placeholders are case-insensitive and spaces become underscores in database
4. Save the file

**Example placeholders:**

- `[[Empname]]` → maps to database column `empname`
- `[[Designation Name]]` → maps to `designation_name`
- `[[Date of Birth]]` → maps to `date_of_birth`

### Step 2: Access the Form Generator

1. Start your Next.js app: `npm run dev`
2. Navigate to: `http://localhost:3000/dashboard/form-generator`
3. You'll see three dropdowns:
   - **Select Template** - Choose Form_A
   - **Select Data Table** - Choose your employee table
   - **Select Employee** - Choose the employee

### Step 3: Generate the Form

1. Select all three options
2. Preview the data that will be filled
3. Click "Generate & Download Form"
4. The filled DOCX file will download automatically

## 🔧 How It Works

### 1. Template Processing

```typescript
// Extracts all [[placeholder]] patterns from DOCX
const placeholders = extractPlaceholders(docxBuffer);
// Result: ["Empname", "Designation Name", "Present Res No"]
```

### 2. Column Mapping

```typescript
// Converts placeholders to database column names
const mapping = mapPlaceholdersToColumns(placeholders);
// Result: {
//   "Empname": "empname",
//   "Designation Name": "designation_name",
//   "Present Res No": "present_res_no"
// }
```

### 3. Data Fetching

```typescript
// Fetches employee data from database
const { data } = await supabase
  .from(tableName)
  .select("empname, designation_name, present_res_no")
  .eq("id", employeeId)
  .single();
```

### 4. DOCX Population

```typescript
// Replaces placeholders with actual data
const filledDoc = await createReport({
  template: docxBuffer,
  data: {
    Empname: "John Doe",
    "Designation Name": "Manager",
    "Present Res No": "123",
  },
  cmdDelimiter: ["[[", "]]"],
});
```

### 5. File Download

```typescript
// Returns DOCX file for download
return new NextResponse(filledDoc, {
  headers: {
    "Content-Type":
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "Content-Disposition": 'attachment; filename="Form_A_filled.docx"',
  },
});
```

## 📊 Database Requirements

Your employee table should have columns matching your placeholders:

```sql
-- Example table structure
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  empname TEXT,
  designation_name TEXT,
  present_res_no TEXT,
  date_of_birth DATE,
  -- ... other columns
);
```

**Column Naming Rules:**

- Lowercase only
- Use underscores instead of spaces
- No special characters

## 🎯 API Endpoints

### GET /api/templates

Returns all available DOCX templates from `forms/` directory.

**Response:**

```json
{
  "success": true,
  "templates": [
    {
      "name": "Form_A",
      "path": "forms/Form_A.docx",
      "placeholderCount": 15,
      "placeholders": ["Empname", "Designation Name", ...]
    }
  ]
}
```

### GET /api/employees

Returns list of tables or employees.

**Without table parameter:**

```json
{
  "success": true,
  "tables": [{ "name": "employees", "displayName": "Employees", "count": 50 }]
}
```

**With table parameter:** `?table=employees`

```json
{
  "success": true,
  "employees": [{ "id": "1", "name": "John Doe", "department": "IT" }]
}
```

### GET /api/employees/[id]?table=employees

Returns single employee data.

**Response:**

```json
{
  "success": true,
  "employee": {
    "id": "1",
    "empname": "John Doe",
    "designation_name": "Manager",
    "present_res_no": "123"
  }
}
```

### POST /api/generate-form

Generates and returns filled DOCX file.

**Request:**

```json
{
  "templatePath": "forms/Form_A.docx",
  "tableName": "employees",
  "employeeId": "1"
}
```

**Response:**

- Content-Type: `application/vnd.openxmlformats-officedocument.wordprocessingml.document`
- Downloads filled DOCX file

### GET /api/generate-form (Preview)

Returns preview of data without generating file.

**Query params:** `?templatePath=forms/Form_A.docx&tableName=employees&employeeId=1`

**Response:**

```json
{
  "success": true,
  "preview": {
    "placeholders": ["Empname", "Designation Name"],
    "columnMapping": { "Empname": "empname" },
    "employeeData": { "Empname": "John Doe" },
    "missingColumns": []
  }
}
```

## 🐛 Troubleshooting

### Issue: "No placeholders found in template"

**Solution:** Make sure placeholders use double square brackets: `[[Empname]]` not `{Empname}` or `[Empname]`

### Issue: "Failed to fetch employee data"

**Solution:** Check that:

1. Your database table exists
2. The table has data
3. Environment variables are set correctly

### Issue: "Missing columns in database"

**Solution:** The preview will show which columns are missing. Either:

1. Add the columns to your database, or
2. Remove those placeholders from the template

### Issue: "Template not found"

**Solution:** Make sure `forms/Form_A.docx` exists in your project root

### Issue: Empty fields in generated document

**Solution:** This is normal if database has null values. The system replaces missing data with empty strings.

## 🔒 Environment Variables

Make sure these are set in your `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 📝 Adding More Templates

1. Create a new DOCX file with `[[placeholders]]`
2. Save it in the `forms/` directory
3. It will automatically appear in the template dropdown

## 🎨 Customization

### Change Placeholder Delimiters

Edit `lib/docx-processor.ts`:

```typescript
cmdDelimiter: ["[[", "]]"]; // Change to {{}} or any other
```

### Add Custom Data Formatting

Edit `lib/db-mapper.ts` in the `formatValue` function:

```typescript
export function formatValue(value: any, columnName: string): string {
  // Add your custom formatting logic
  if (columnName === "salary") {
    return `₹${value.toLocaleString()}`;
  }
  // ... existing code
}
```

## ✨ Features

- ✅ Dynamic DOCX editing (not PDF generation)
- ✅ Preserves all formatting, tables, images
- ✅ Automatic column mapping
- ✅ Preview before generation
- ✅ Handles missing data gracefully
- ✅ Multiple template support
- ✅ Multiple table support
- ✅ Download as DOCX file
- ✅ Error handling and validation

## 🚦 Testing

1. Make sure you have at least one employee in your database
2. Make sure `forms/Form_A.docx` exists with placeholders
3. Navigate to `/dashboard/form-generator`
4. Select template, table, and employee
5. Click "Generate & Download Form"
6. Open the downloaded file in Microsoft Word
7. Verify that placeholders are replaced with actual data

## 📞 Support

If you encounter issues:

1. Check browser console for errors
2. Check server logs for API errors
3. Verify database connection
4. Verify template file exists and has placeholders
