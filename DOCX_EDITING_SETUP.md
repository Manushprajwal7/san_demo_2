# Dynamic DOCX Editing – Setup & Usage

This app **edits DOCX files** (no PDFs): it reads `forms/Form_A.docx`, replaces `[[PlaceholderName]]` with employee data from the database, and returns a downloadable **.docx** file.

---

## 1. Packages (already installed)

Your `package.json` already includes:

- **docx-templates** – replaces `[[...]]` in the DOCX and preserves formatting
- **pizzip** – used for placeholder extraction and fallback
- **docxtemplater** – fallback if docx-templates fails

No extra install needed. If you ever add from scratch:

```bash
npm install docx-templates pizzip docxtemplater
```

---

## 2. Environment variables

In `.env.local` (or your env):

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
```

Used by `lib/supabase.ts` for DB access.

---

## 3. File structure (what you have)

```
app/
  api/
    employees/route.ts         # GET list of employees (supports table=employees)
    employees/[id]/route.ts    # GET single employee (requires ?table=...)
    generate-form/route.ts     # POST: generate filled DOCX
  form-generator/page.tsx      # /form-generator UI
  dashboard/form-generator/page.tsx  # /dashboard/form-generator

lib/
  docx-processor.ts            # DOCX editing (createReport with [[ ]] delimiters)
  db-mapper.ts                # Maps [[Placeholder Name]] → DB columns (e.g. placeholder_name)
  form-generator.ts           # Load template, fetch employee, populate, return buffer

forms/
  Form_A.docx                 # Template with [[Empname]], [[Designation Name]], etc.
```

---

## 4. API behaviour

| Endpoint | Purpose |
|----------|--------|
| **GET /api/employees** | List tables (includes `employees` if registry is empty). |
| **GET /api/employees?table=employees** | List employees (id, name from `empname`, department from `designation_name`/`designation`). |
| **GET /api/employees/[id]?table=employees** | Single employee row for that table. |
| **POST /api/generate-form** | Body: `{ templatePath, tableName, employeeId }`. Returns **DOCX** with `Content-Type: application/vnd.openxmlformats-officedocument.wordprocessingml.document` and `Content-Disposition: attachment; filename="Form_A_filled.docx"`. |

---

## 5. Placeholder → DB column mapping

- Template: `[[Empname]]`, `[[Designation Name]]`, etc.
- `lib/db-mapper.ts` maps these to DB columns: `empname`, `designation_name`, etc. (lowercase, spaces → underscores).
- Your `employees` table should have columns like: `id`, `empname`, `designation` or `designation_name`, `present_res_no`, etc.

---

## 6. How to test

1. Run the app: `npm run dev`.
2. Open **/form-generator** or **/dashboard/form-generator**.
3. Select template **Form_A** (or the one under `forms/`).
4. Select table **Employees** (or the table that has your employee data).
5. Select an employee (e.g. “John Doe”).
6. Check the preview, then click **Generate & Download Form**.
7. Open the downloaded **Form_A_filled.docx** in Word: `[[Empname]]` should show “John Doe”, `[[Designation Name]]` should show “Manager” (or whatever is in the DB).

---

## 7. What the code does (no PDFs)

- **lib/docx-processor.ts**  
  - `createReport({ template: docxBuffer, data: { Empname: "John Doe", ... }, cmdDelimiter: ['[[', ']]'] })`  
  - Returns a **Buffer** of the filled DOCX.

- **app/api/generate-form/route.ts**  
  - Returns that buffer with headers above so the browser downloads a **.docx** file.

- **No PDF generation** and no fake IDs; the response is the actual edited DOCX.
