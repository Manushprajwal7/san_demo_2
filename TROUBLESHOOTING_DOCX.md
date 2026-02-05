# DOCX Form Generator - Troubleshooting Guide

## 🔧 Common Issues and Solutions

### Issue 1: "Template not found at: forms/Form_A.docx"

**Symptoms:**

- Error when trying to generate form
- Test script fails at template loading

**Causes:**

- File doesn't exist
- Wrong file path
- File permissions issue

**Solutions:**

1. **Check if file exists:**

```bash
# Windows
dir forms\Form_A.docx

# Mac/Linux
ls -la forms/Form_A.docx
```

2. **Create the file if missing:**

- Open Microsoft Word
- Create a new document
- Add placeholders: `[[Empname]]`, `[[Designation Name]]`
- Save as `Form_A.docx` in the `forms/` directory

3. **Check file permissions:**

```bash
# Make sure the file is readable
# Windows: Right-click → Properties → Security
# Mac/Linux: chmod 644 forms/Form_A.docx
```

---

### Issue 2: "No placeholders found in template"

**Symptoms:**

- Template loads but shows 0 placeholders
- Generated form has no data filled

**Causes:**

- Wrong placeholder format
- Placeholders in headers/footers/text boxes
- File corruption

**Solutions:**

1. **Check placeholder format:**

```
❌ Wrong: {Empname}, [Empname], {{Empname}}
✅ Correct: [[Empname]]
```

2. **Open template in Word and verify:**

- Placeholders should be in the main document body
- Not in headers, footers, or text boxes
- Use Find (Ctrl+F) to search for `[[`

3. **Re-create placeholders:**

- Delete existing placeholders
- Type them fresh: `[[Empname]]`
- Make sure no special formatting is applied
- Save and try again

4. **Test with simple template:**

```
Create a new document with just:
Name: [[Empname]]
```

---

### Issue 3: "Failed to fetch employee data"

**Symptoms:**

- Error when selecting employee
- Preview doesn't load
- Generation fails

**Causes:**

- Database connection issue
- Wrong table name
- Employee doesn't exist
- RLS policies blocking access

**Solutions:**

1. **Check environment variables:**

```bash
# .env.local should have:
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

2. **Test database connection:**

```typescript
// Run in browser console on your site
const { createClient } = require("@supabase/supabase-js");
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
);
const { data, error } = await supabase.from("employees").select("*").limit(1);
console.log(data, error);
```

3. **Check table exists:**

```sql
-- Run in Supabase SQL Editor
SELECT * FROM employees LIMIT 1;
```

4. **Check RLS policies:**

```sql
-- Temporarily disable RLS for testing
ALTER TABLE employees DISABLE ROW LEVEL SECURITY;

-- Or add a policy to allow reads
CREATE POLICY "Allow public read" ON employees
FOR SELECT USING (true);
```

---

### Issue 4: "Missing columns in database"

**Symptoms:**

- Warning message about missing columns
- Some fields empty in generated form
- Preview shows missing columns

**Causes:**

- Database columns don't match placeholders
- Wrong column naming

**Solutions:**

1. **Check column mapping:**

```
Placeholder: [[Designation Name]]
Expected column: designation_name (lowercase, underscore)
```

2. **Add missing columns:**

```sql
ALTER TABLE employees
ADD COLUMN designation_name TEXT;
```

3. **Or remove placeholders from template:**

- Open template in Word
- Delete placeholders for missing columns
- Save template

4. **Check column names:**

```sql
-- List all columns in table
SELECT column_name
FROM information_schema.columns
WHERE table_name = 'employees';
```

---

### Issue 5: "Empty fields in generated document"

**Symptoms:**

- DOCX generates successfully
- But some fields are blank
- No error messages

**Causes:**

- Database has NULL values
- Data not entered for that employee

**Solutions:**

1. **This is normal behavior:**

- System replaces NULL with empty string
- Not an error, just missing data

2. **Add data to database:**

```sql
UPDATE employees
SET designation_name = 'Manager'
WHERE id = '123';
```

3. **Check data exists:**

```sql
SELECT * FROM employees WHERE id = '123';
```

---

### Issue 6: "Error populating template"

**Symptoms:**

- Template loads, data fetches, but generation fails
- Error during DOCX population

**Causes:**

- Corrupted template file
- Invalid DOCX structure
- Library compatibility issue

**Solutions:**

1. **Validate template:**

```bash
npx tsx scripts/test-docx-editing.ts
```

2. **Re-save template:**

- Open in Microsoft Word
- Save As → Word Document (.docx)
- Make sure it's not .doc or .docm

3. **Check for complex formatting:**

- Remove tables, images temporarily
- Test with simple text only
- Add complexity back gradually

4. **Try fallback method:**
   The system automatically tries docxtemplater if docx-templates fails.
   Check server logs for details.

---

### Issue 7: "Downloaded file won't open in Word"

**Symptoms:**

- File downloads but won't open
- Word shows error message
- File size is 0 bytes

**Causes:**

- Generation failed but error not caught
- Network interruption during download
- Browser issue

**Solutions:**

1. **Check file size:**

```bash
# File should be > 10KB
ls -lh form_*.docx
```

2. **Check server logs:**

```bash
# Look for errors in npm run dev output
```

3. **Try different browser:**

- Chrome, Firefox, Edge, Safari

4. **Check API response:**

```javascript
// In browser console
const response = await fetch("/api/generate-form", {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    templatePath: "forms/Form_A.docx",
    tableName: "employees",
    employeeId: "123",
  }),
});
console.log(response.status, response.headers.get("content-type"));
```

---

### Issue 8: "Placeholders not replaced"

**Symptoms:**

- File downloads and opens
- But still shows `[[Empname]]` instead of data

**Causes:**

- Wrong delimiter configuration
- Data not passed correctly
- Template format issue

**Solutions:**

1. **Check delimiter configuration:**

```typescript
// In lib/docx-processor.ts
cmdDelimiter: ["[[", "]]"]; // Should match your template
```

2. **Verify data is passed:**

```typescript
// Add console.log in lib/form-generator.ts
console.log("Template data:", templateData);
```

3. **Test with simple data:**

```typescript
const testData = { Empname: "TEST NAME" };
const result = await populateTemplate(buffer, testData);
```

---

### Issue 9: "Formatting lost in generated document"

**Symptoms:**

- Data is filled correctly
- But formatting (bold, colors, etc.) is lost

**Causes:**

- Library limitation
- Complex formatting not supported

**Solutions:**

1. **Use docx-templates (primary method):**
   This preserves formatting better than docxtemplater.

2. **Simplify formatting:**

- Avoid complex styles
- Use basic formatting only
- Test incrementally

3. **Check if fallback is being used:**

```typescript
// In lib/docx-processor.ts
// If you see "docx-templates failed, using fallback"
// The fallback (docxtemplater) may not preserve all formatting
```

---

### Issue 10: "UI not loading"

**Symptoms:**

- Blank page at /dashboard/form-generator
- Console errors
- Components not rendering

**Causes:**

- Import errors
- Missing dependencies
- TypeScript errors

**Solutions:**

1. **Check browser console:**

```
F12 → Console tab
Look for red errors
```

2. **Check server logs:**

```bash
npm run dev
# Look for compilation errors
```

3. **Verify imports:**

```typescript
// In app/dashboard/form-generator/page.tsx
import { FormGenerator } from "@/components/form-generator";
```

4. **Check TypeScript:**

```bash
npx tsc --noEmit
```

---

### Issue 11: "Slow generation"

**Symptoms:**

- Takes > 5 seconds to generate
- UI freezes
- Timeout errors

**Causes:**

- Large template file
- Many placeholders
- Slow database query
- Network latency

**Solutions:**

1. **Optimize template:**

- Remove unnecessary images
- Reduce file size
- Compress images

2. **Add indexes to database:**

```sql
CREATE INDEX idx_employees_id ON employees(id);
```

3. **Use preview before generating:**

- Verify data first
- Then generate

4. **Add loading indicators:**
   Already implemented in UI component.

---

### Issue 12: "Multiple employees not working"

**Symptoms:**

- Can generate for one employee
- But not for others
- Inconsistent results

**Causes:**

- Data quality issues
- NULL values
- Special characters in data

**Solutions:**

1. **Check data quality:**

```sql
SELECT * FROM employees WHERE id = 'problematic-id';
```

2. **Handle special characters:**

```typescript
// In lib/db-mapper.ts formatValue()
return String(value)
  .trim()
  .replace(/[^\x00-\x7F]/g, "");
```

3. **Test with different employees:**

- Find pattern in failures
- Check what's different about failing records

---

## 🔍 Debugging Tools

### 1. Test Script

```bash
npx tsx scripts/test-docx-editing.ts
```

Tests all components in isolation.

### 2. Browser Console

```javascript
// Check API responses
fetch("/api/templates")
  .then((r) => r.json())
  .then(console.log);
fetch("/api/employees")
  .then((r) => r.json())
  .then(console.log);
```

### 3. Server Logs

```bash
npm run dev
# Watch for errors and warnings
```

### 4. Database Queries

```sql
-- Check data
SELECT * FROM employees LIMIT 5;

-- Check columns
SELECT column_name FROM information_schema.columns
WHERE table_name = 'employees';
```

### 5. File Inspection

```bash
# Check template exists
ls -la forms/

# Check generated files
ls -la forms/*_TEST.docx
```

---

## 📋 Diagnostic Checklist

When something goes wrong, check these in order:

- [ ] Environment variables set correctly
- [ ] Database connection working
- [ ] Template file exists and is valid
- [ ] Placeholders use correct format `[[...]]`
- [ ] Database has matching columns
- [ ] Employee data exists
- [ ] No TypeScript errors
- [ ] No console errors
- [ ] Test script passes
- [ ] Server is running

---

## 🆘 Still Stuck?

If none of the above helps:

1. **Run full diagnostic:**

```bash
npx tsx scripts/test-docx-editing.ts
```

2. **Check all files exist:**

```bash
ls -la lib/docx-processor.ts
ls -la lib/form-generator.ts
ls -la lib/db-mapper.ts
ls -la app/api/generate-form/route.ts
```

3. **Verify no TypeScript errors:**

```bash
npx tsc --noEmit
```

4. **Check package versions:**

```bash
npm list docx-templates docxtemplater pizzip
```

5. **Try with minimal example:**

- Create simple template with one placeholder
- Create simple table with one column
- Test generation

---

## 📞 Getting Help

When asking for help, provide:

1. **Error message** (exact text)
2. **Server logs** (from npm run dev)
3. **Browser console** (F12 → Console)
4. **Test script output**
5. **Template structure** (how many placeholders)
6. **Database structure** (column names)
7. **What you've tried** (from this guide)

---

## ✅ Prevention

To avoid issues:

1. **Use consistent naming:**
   - Placeholders: `[[Empname]]`
   - Columns: `empname`

2. **Test incrementally:**
   - Start with simple template
   - Add complexity gradually

3. **Validate early:**
   - Run test script after changes
   - Check preview before generating

4. **Keep backups:**
   - Save working templates
   - Document column mappings

5. **Monitor logs:**
   - Watch server output
   - Check browser console
