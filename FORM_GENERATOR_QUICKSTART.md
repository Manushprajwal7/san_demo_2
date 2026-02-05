# Form Generator - Quick Start Guide

## 🚀 Get Started in 5 Minutes

### Step 1: Verify Installation

The system is already installed! Dependencies added:

- ✅ `pizzip` - DOCX file handling
- ✅ `docxtemplater` - Template engine

### Step 2: Prepare Your Template

Your template `forms/Form_A.docx` should contain placeholders like:

```
[[Empname]]
[[Designation Name]]
[[Present Res No]]
[[Date of Birth]]
```

**Important:** Use double square brackets `[[Name]]` - not single brackets or curly braces.

### Step 3: Test the System

Run the test script to verify everything works:

```bash
npx tsx scripts/test-form-generator.ts
```

This will:

- Load your template
- Extract all placeholders
- Show the column mapping
- Verify the system is ready

### Step 4: Start the Development Server

```bash
npm run dev
```

### Step 5: Access the Form Generator

1. Open your browser to `http://localhost:3000`
2. Navigate to **Dashboard → Form Generator**
3. Or go directly to: `http://localhost:3000/dashboard/form-generator`

### Step 6: Generate Your First Form

1. **Select Template**: Choose "Form_A.docx" from the dropdown
2. **Select Table**: Pick the table containing your employee data
3. **Select Employee**: Choose an employee from the list
4. **Preview**: Review the data that will be filled
5. **Generate**: Click "Generate & Download Form"

The populated DOCX file will download automatically! 🎉

## 📋 What Happens Behind the Scenes

```
1. Template Selection → Extracts [[placeholders]]
2. Table Selection → Loads employee list
3. Employee Selection → Fetches employee data
4. Preview → Shows data mapping
5. Generate → Populates template & downloads
```

## 🔧 Customization

### Add More Templates

1. Create a new DOCX file with `[[placeholders]]`
2. Save it in the `forms/` directory
3. It will automatically appear in the template dropdown

### Customize Column Mapping

Edit `lib/db-mapper.ts` to add custom mappings:

```typescript
const customMappings: Record<string, string> = {
  "Employee Name": "full_name",
  DOB: "birth_date",
};
```

### Change Date Format

Edit the `formatValue` function in `lib/db-mapper.ts`:

```typescript
return date.toLocaleDateString("en-US", {
  month: "long",
  day: "numeric",
  year: "numeric",
});
```

## 🐛 Troubleshooting

### "Template not found"

- Verify `forms/Form_A.docx` exists
- Check file permissions
- Ensure it's a valid DOCX file

### "No placeholders found"

- Use double brackets: `[[Name]]` not `{Name}` or `[Name]`
- Check for typos in placeholder syntax
- Open the DOCX and verify placeholders are visible

### "Column not found"

- Check your database table has the required columns
- Review the column mapping in the preview
- Add custom mappings if needed

### "Employee not found"

- Verify the employee exists in the selected table
- Check the employee ID is correct
- Ensure the table has data

## 📊 Example Database Schema

Your database should have tables like:

```sql
CREATE TABLE employees (
  id SERIAL PRIMARY KEY,
  empname VARCHAR(100),
  designation_name VARCHAR(100),
  present_res_no VARCHAR(200),
  date_of_birth DATE,
  aadhar_no VARCHAR(12)
);
```

Column names should match the placeholder mapping:

- `[[Empname]]` → `empname`
- `[[Designation Name]]` → `designation_name`

## 🎯 Best Practices

1. **Use Descriptive Placeholders**: `[[Employee Full Name]]` is better than `[[Name]]`
2. **Test with Sample Data**: Create a test employee with all fields filled
3. **Check Preview First**: Always review the preview before generating
4. **Handle Missing Data**: The system leaves empty placeholders blank
5. **Keep Templates Simple**: Start with basic templates, add complexity later

## 📚 Next Steps

- Read the full guide: `FORM_GENERATOR_GUIDE.md`
- Explore the API endpoints for programmatic access
- Add more templates for different forms
- Customize the UI in `components/form-generator.tsx`

## 🆘 Need Help?

1. Check the console logs in your browser DevTools
2. Review the server logs in your terminal
3. Run the test script to diagnose issues
4. Check the full documentation in `FORM_GENERATOR_GUIDE.md`

## ✨ Features

- ✅ Dynamic placeholder extraction
- ✅ Smart column mapping
- ✅ Real-time preview
- ✅ Format preservation
- ✅ Missing data handling
- ✅ Multi-table support
- ✅ Instant downloads

Happy form generating! 🎉
