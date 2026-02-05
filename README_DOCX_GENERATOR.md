# 📄 DOCX Form Generator

**Dynamic DOCX file editing for Next.js 14 applications**

Generate filled Word documents by replacing `[[placeholders]]` with real employee data from your database.

---

## 🎯 What This Does

✅ **Reads** DOCX template files  
✅ **Extracts** `[[placeholder]]` patterns  
✅ **Fetches** employee data from database  
✅ **Replaces** placeholders with actual data  
✅ **Returns** downloadable, editable DOCX files

**Not PDFs. Not previews. Actual DOCX files that open in Microsoft Word.**

---

## 🚀 Quick Start

### 1. Test the System

```bash
npx tsx scripts/test-docx-editing.ts
```

### 2. Start Your App

```bash
npm run dev
```

### 3. Generate Forms

Navigate to: `http://localhost:3000/dashboard/form-generator`

1. Select template (Form_A)
2. Select table (employees)
3. Select employee
4. Click "Generate & Download Form"
5. Open downloaded file in Word

**Done! Your placeholders are now filled with real data.**

---

## 📁 What's Included

### Core Files

```
lib/
├── docx-processor.ts      # DOCX editing functions
├── form-generator.ts      # Main generation logic
├── db-mapper.ts           # Database column mapping
└── supabase.ts            # Database connection

app/api/
├── generate-form/route.ts # Generate DOCX endpoint
├── templates/route.ts     # List templates endpoint
└── employees/
    ├── route.ts           # List employees endpoint
    └── [id]/route.ts      # Get single employee endpoint

components/
└── form-generator.tsx     # UI component

app/dashboard/
└── form-generator/page.tsx # Form generator page
```

### Documentation

```
README_DOCX_GENERATOR.md        # This file
QUICK_START_DOCX.md             # 3-step quick start
DOCX_GENERATOR_SETUP.md         # Detailed setup guide
EXAMPLE_USAGE.md                # Real-world examples
SETUP_CHECKLIST.md              # Verification checklist
IMPLEMENTATION_SUMMARY.md       # Technical summary
SYSTEM_FLOW.md                  # Architecture diagrams
TROUBLESHOOTING_DOCX.md         # Problem solving guide
```

### Scripts

```
scripts/
└── test-docx-editing.ts   # Test all functionality
```

---

## 📝 Template Format

Your DOCX template should use double square brackets:

```
EMPLOYEE INFORMATION

Name: [[Empname]]
Designation: [[Designation Name]]
Address: [[Present Res No]]
Date of Birth: [[Date of Birth]]
```

**Rules:**

- Use `[[...]]` format (double square brackets)
- Spaces in placeholders become underscores in database
- Case-insensitive: `[[Empname]]` = `[[empname]]`

---

## 🗄️ Database Setup

Placeholders automatically map to database columns:

| Placeholder            | Database Column    |
| ---------------------- | ------------------ |
| `[[Empname]]`          | `empname`          |
| `[[Designation Name]]` | `designation_name` |
| `[[Date of Birth]]`    | `date_of_birth`    |

**Column Naming:**

- Lowercase only
- Spaces → underscores
- No special characters

---

## 🎨 UI Features

The form generator includes:

- ✅ Template selection dropdown
- ✅ Table selection dropdown
- ✅ Employee selection dropdown
- ✅ Live data preview
- ✅ Field status (filled/empty)
- ✅ Missing column warnings
- ✅ One-click download
- ✅ Loading states
- ✅ Error handling

---

## 💻 API Usage

### Generate Form

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

const blob = await response.blob();
// Download the DOCX file
```

### Preview Data

```javascript
const response = await fetch(
  "/api/generate-form?templatePath=forms/Form_A.docx&tableName=employees&employeeId=123",
);
const data = await response.json();
console.log(data.preview.employeeData);
```

---

## 🔧 Programmatic Usage

```typescript
import { generateForm } from "@/lib/form-generator";

const result = await generateForm({
  templatePath: "forms/Form_A.docx",
  tableName: "employees",
  employeeId: "123",
});

if (result.success) {
  // result.buffer contains the filled DOCX file
  return new Response(result.buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": 'attachment; filename="form.docx"',
    },
  });
}
```

---

## 📦 Dependencies

All required packages are already installed:

- `docx-templates@^4.15.0` - Primary DOCX editor
- `docxtemplater@^3.67.6` - Fallback DOCX processor
- `pizzip@^3.2.0` - ZIP handling
- `@supabase/supabase-js@2.93.3` - Database client

**No additional installation needed!**

---

## 🎯 How It Works

```
1. Load template from forms/Form_A.docx
   ↓
2. Extract placeholders: [[Empname]], [[Designation Name]]
   ↓
3. Map to database columns: empname, designation_name
   ↓
4. Fetch employee data from database
   ↓
5. Replace placeholders with data
   ↓
6. Return filled DOCX file
```

---

## ✅ Verification

Run the checklist:

- [ ] Test script passes: `npx tsx scripts/test-docx-editing.ts`
- [ ] Server starts: `npm run dev`
- [ ] UI loads: `http://localhost:3000/dashboard/form-generator`
- [ ] Can select template, table, employee
- [ ] Preview shows data
- [ ] Generate downloads DOCX file
- [ ] File opens in Word
- [ ] Placeholders are replaced

---

## 🐛 Troubleshooting

### Common Issues

**"Template not found"**
→ Check `forms/Form_A.docx` exists

**"No placeholders found"**
→ Use `[[Empname]]` not `{Empname}` or `[Empname]`

**"Failed to fetch employee data"**
→ Check `.env.local` has Supabase credentials

**"Missing columns"**
→ Add columns to database or remove placeholders from template

**See `TROUBLESHOOTING_DOCX.md` for detailed solutions.**

---

## 📚 Documentation

| File                        | Purpose                     |
| --------------------------- | --------------------------- |
| `QUICK_START_DOCX.md`       | Get started in 3 steps      |
| `DOCX_GENERATOR_SETUP.md`   | Detailed setup instructions |
| `EXAMPLE_USAGE.md`          | Real-world usage examples   |
| `SETUP_CHECKLIST.md`        | Verification checklist      |
| `IMPLEMENTATION_SUMMARY.md` | Technical details           |
| `SYSTEM_FLOW.md`            | Architecture diagrams       |
| `TROUBLESHOOTING_DOCX.md`   | Problem solving             |

---

## 🎉 Features

- ✅ Dynamic DOCX editing (not PDF)
- ✅ Preserves all formatting
- ✅ Automatic column mapping
- ✅ Preview before generation
- ✅ Handles missing data gracefully
- ✅ Multiple template support
- ✅ Multiple table support
- ✅ Batch generation capable
- ✅ Full TypeScript support
- ✅ Error handling
- ✅ Production ready

---

## 🔐 Environment Variables

Required in `.env.local`:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
```

---

## 🚦 Testing

### Automated Test

```bash
npx tsx scripts/test-docx-editing.ts
```

Tests:

- Template loading
- Placeholder extraction
- Column mapping
- DOCX population
- Database connection

### Manual Test

1. Navigate to `/dashboard/form-generator`
2. Select options
3. Generate form
4. Open in Word
5. Verify data

---

## 📈 Next Steps

### Add More Templates

1. Create DOCX with `[[placeholders]]`
2. Save in `forms/` directory
3. Automatically appears in UI

### Add More Tables

1. Create table in Supabase
2. Register in `notice_tables_registry`
3. Automatically appears in UI

### Customize

- Edit `lib/db-mapper.ts` for custom formatting
- Edit `components/form-generator.tsx` for UI changes
- Add authentication/authorization

---

## 💡 Examples

### Simple Generation

```typescript
const result = await generateForm({
  templatePath: "forms/Form_A.docx",
  tableName: "employees",
  employeeId: "123",
});
```

### Batch Generation

```typescript
for (const employee of employees) {
  const result = await generateForm({
    templatePath: "forms/Form_A.docx",
    tableName: "employees",
    employeeId: employee.id,
  });
  // Save or email result.buffer
}
```

### Custom Formatting

```typescript
// In lib/db-mapper.ts
export function formatValue(value: any, columnName: string): string {
  if (columnName === "salary") {
    return `₹${value.toLocaleString()}`;
  }
  return String(value);
}
```

---

## 🎊 Success!

You now have a fully functional DOCX form generator that:

1. ✅ Reads DOCX templates
2. ✅ Extracts placeholders
3. ✅ Fetches employee data
4. ✅ Fills the template
5. ✅ Returns downloadable DOCX files

**This is real, working code that runs in your Next.js app!**

---

## 📞 Support

If you need help:

1. Check `TROUBLESHOOTING_DOCX.md`
2. Run test script: `npx tsx scripts/test-docx-editing.ts`
3. Check browser console and server logs
4. Verify template format and database columns

---

## 🏗️ Built With

- Next.js 14
- TypeScript
- docx-templates
- Supabase
- React

---

## 📄 License

Part of your Next.js application.

---

## 🙏 Credits

Built for dynamic DOCX editing in Next.js applications.

---

**Ready to use! Start with: `npm run dev`**
