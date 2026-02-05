# DOCX Form Generator - Quick Start

## 🚀 Start Using in 3 Steps

### Step 1: Run the Test

```bash
npx tsx scripts/test-docx-editing.ts
```

This will verify everything is working and create a test file.

### Step 2: Start Your App

```bash
npm run dev
```

### Step 3: Generate Forms

Navigate to: `http://localhost:3000/dashboard/form-generator`

## 📋 What You Get

### ✅ ACTUAL DOCX EDITING

- Reads your `forms/Form_A.docx` file
- Finds all `[[placeholder]]` patterns
- Replaces them with real employee data
- Returns a downloadable DOCX file (NOT PDF!)

### ✅ Complete Working Code

All files are ready to use:

- ✅ `lib/docx-processor.ts` - DOCX editing functions
- ✅ `lib/form-generator.ts` - Main generation logic
- ✅ `lib/db-mapper.ts` - Database column mapping
- ✅ `app/api/generate-form/route.ts` - API endpoint
- ✅ `app/api/templates/route.ts` - Template listing
- ✅ `app/api/employees/route.ts` - Employee listing
- ✅ `app/api/employees/[id]/route.ts` - Single employee
- ✅ `components/form-generator.tsx` - UI component
- ✅ `app/dashboard/form-generator/page.tsx` - Page

## 🎯 How It Works

```
1. User selects employee "John Doe"
   ↓
2. System reads forms/Form_A.docx
   ↓
3. Finds placeholders: [[Empname]], [[Designation Name]]
   ↓
4. Fetches data from database:
   - empname: "John Doe"
   - designation_name: "Manager"
   ↓
5. Replaces placeholders in DOCX
   ↓
6. Returns filled DOCX file for download
   ↓
7. User opens in Word and sees:
   - [[Empname]] → "John Doe"
   - [[Designation Name]] → "Manager"
```

## 📝 Template Format

Your `forms/Form_A.docx` should have placeholders like:

```
Employee Name: [[Empname]]
Designation: [[Designation Name]]
Address: [[Present Res No]]
Date of Birth: [[Date of Birth]]
```

**Rules:**

- Use double square brackets: `[[...]]`
- Spaces in placeholders become underscores in database
- Case doesn't matter: `[[Empname]]` = `[[empname]]` = `[[EMPNAME]]`

## 🗄️ Database Columns

Placeholders automatically map to database columns:

| Placeholder            | Database Column    |
| ---------------------- | ------------------ |
| `[[Empname]]`          | `empname`          |
| `[[Designation Name]]` | `designation_name` |
| `[[Date of Birth]]`    | `date_of_birth`    |
| `[[Present Res No]]`   | `present_res_no`   |

## 🔧 API Usage

### Generate Form (POST)

```javascript
const response = await fetch("/api/generate-form", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    templatePath: "forms/Form_A.docx",
    tableName: "employees",
    employeeId: "123",
  }),
});

// Download the DOCX file
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "filled_form.docx";
a.click();
```

### Preview Data (GET)

```javascript
const response = await fetch(
  "/api/generate-form?templatePath=forms/Form_A.docx&tableName=employees&employeeId=123",
);
const data = await response.json();
console.log(data.preview.employeeData);
```

## 🎨 UI Features

The form generator UI includes:

- ✅ Template selection dropdown
- ✅ Table selection dropdown
- ✅ Employee selection dropdown
- ✅ Live data preview
- ✅ Field status (filled/empty)
- ✅ Missing column warnings
- ✅ One-click download
- ✅ Loading states
- ✅ Error handling

## 🐛 Common Issues

### "No placeholders found"

→ Use `[[Empname]]` not `{Empname}` or `[Empname]`

### "Template not found"

→ Make sure `forms/Form_A.docx` exists

### "Failed to fetch employee data"

→ Check your `.env.local` has Supabase credentials

### "Missing columns"

→ Add columns to database or remove placeholders from template

## 📦 What's Installed

All required packages are already in your `package.json`:

- `docx-templates` - Primary DOCX editor
- `docxtemplater` - Fallback DOCX processor
- `pizzip` - ZIP handling
- `@supabase/supabase-js` - Database

No additional installation needed!

## 🎉 That's It!

You now have a fully working DOCX form generator that:

1. Reads DOCX templates
2. Extracts placeholders
3. Fetches employee data
4. Fills the template
5. Returns downloadable DOCX files

**Not PDFs. Not previews. Actual editable DOCX files!**
