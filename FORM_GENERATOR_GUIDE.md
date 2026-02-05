# Form Generator System - Complete Guide

## Overview

The Form Generator system dynamically populates Word documents (DOCX) with employee data from your database. It extracts placeholders from templates, maps them to database columns, and generates filled forms while preserving all formatting.

## Features

✅ **Dynamic Placeholder Extraction** - Automatically detects `[[placeholder]]` patterns in DOCX files
✅ **Smart Column Mapping** - Converts placeholder names to database column names intelligently
✅ **Data Preview** - Shows what data will be filled before generating
✅ **Format Preservation** - Maintains all document formatting, tables, images, and styles
✅ **Missing Data Handling** - Gracefully handles empty fields and missing columns
✅ **Multi-Table Support** - Works with any table in your database
✅ **Download Ready** - Generates downloadable DOCX files instantly

## How It Works

### 1. Placeholder Format

In your Word template (`forms/Form_A.docx`), use double square brackets:

```
[[Empname]]
[[Designation Name]]
[[Present Res No]]
[[Date of Birth]]
[[Aadhar No]]
```

### 2. Column Mapping Rules

The system automatically converts placeholder names to database column names:

| Placeholder            | Database Column    |
| ---------------------- | ------------------ |
| `[[Empname]]`          | `empname`          |
| `[[Designation Name]]` | `designation_name` |
| `[[Present Res No]]`   | `present_res_no`   |
| `[[Date of Birth]]`    | `date_of_birth`    |

**Conversion Rules:**

- Convert to lowercase
- Replace spaces with underscores
- Remove special characters
- Handle multiple underscores

### 3. Data Flow

```
Template (DOCX) → Extract Placeholders → Map to Columns → Fetch Data → Populate → Download
```

## File Structure

```
your-project/
├── forms/
│   └── Form_A.docx              # Your template with [[placeholders]]
├── lib/
│   ├── docx-processor.ts        # DOCX parsing and population
│   ├── db-mapper.ts             # Placeholder to column mapping
│   └── form-generator.ts        # Main generation logic
├── app/
│   ├── api/
│   │   ├── templates/route.ts   # GET available templates
│   │   └── generate-form/route.ts # POST generate form
│   └── dashboard/
│       └── form-generator/page.tsx # UI page
└── components/
    └── form-generator.tsx       # Main UI component
```

## API Endpoints

### GET /api/templates

Returns list of available templates with metadata.

**Response:**

```json
{
  "success": true,
  "templates": [
    {
      "name": "Form_A.docx",
      "path": "forms/Form_A.docx",
      "placeholderCount": 15,
      "placeholders": ["Empname", "Designation Name", ...]
    }
  ]
}
```

### GET /api/generate-form

Get preview of data that will be filled.

**Query Parameters:**

- `templatePath` - Path to template (e.g., "forms/Form_A.docx")
- `tableName` - Database table name
- `employeeId` - Employee ID

**Response:**

```json
{
  "success": true,
  "preview": {
    "placeholders": ["Empname", "Designation Name"],
    "columnMapping": {
      "Empname": "empname",
      "Designation Name": "designation_name"
    },
    "employeeData": {
      "Empname": "John Doe",
      "Designation Name": "Manager"
    },
    "missingColumns": []
  }
}
```

### POST /api/generate-form

Generate and download populated form.

**Request Body:**

```json
{
  "templatePath": "forms/Form_A.docx",
  "tableName": "employees",
  "employeeId": "123"
}
```

**Response:**

- Binary DOCX file with populated data
- Headers include metadata about filled fields

## Usage Guide

### Step 1: Prepare Your Template

1. Create a Word document with placeholders in `[[Name]]` format
2. Save it in the `forms/` directory
3. Use descriptive names that match your database columns

**Example Template:**

```
Employee Information Form

Name: [[Empname]]
Designation: [[Designation Name]]
Address: [[Present Res No]]
Date of Birth: [[Date of Birth]]
Aadhar Number: [[Aadhar No]]
```

### Step 2: Access Form Generator

1. Navigate to `/dashboard/form-generator`
2. Select your template from the dropdown
3. Choose the data table (e.g., employees, contractors)
4. Select an employee from the list

### Step 3: Preview & Generate

1. Review the preview showing which fields will be filled
2. Check for any missing columns warnings
3. Click "Generate & Download Form"
4. The populated DOCX file will download automatically

## Advanced Features

### Custom Column Mapping

If your database columns don't follow the standard naming convention, you can customize the mapping in `lib/db-mapper.ts`:

```typescript
export function placeholderToColumn(placeholder: string): string {
  // Add custom mappings
  const customMappings: Record<string, string> = {
    "Employee Name": "full_name",
    DOB: "birth_date",
    "Emp Code": "employee_code",
  };

  if (customMappings[placeholder]) {
    return customMappings[placeholder];
  }

  // Default conversion logic
  return placeholder.toLowerCase().replace(/\s+/g, "_");
}
```

### Date Formatting

Dates are automatically formatted to Indian format (DD/MM/YYYY). Customize in `lib/db-mapper.ts`:

```typescript
export function formatValue(value: any, columnName: string): string {
  if (columnName.includes("date")) {
    const date = new Date(value);
    return date.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
    });
  }
  return String(value);
}
```

### Handling Missing Data

The system handles missing data gracefully:

- **Missing columns**: Shows warning in preview, leaves placeholder empty
- **Null values**: Leaves placeholder empty or shows empty string
- **Invalid data**: Logs error and continues with other fields

## Troubleshooting

### Issue: Placeholders not detected

**Solution:**

- Ensure placeholders use double square brackets: `[[Name]]`
- Check for extra spaces: `[[ Name ]]` won't work
- Verify the DOCX file is not corrupted

### Issue: Data not populating

**Solution:**

- Check column names match the mapping
- Verify employee exists in the selected table
- Check database connection in `.env` file
- Review console logs for specific errors

### Issue: Formatting lost

**Solution:**

- The system preserves formatting by default
- Ensure you're using `docxtemplater` correctly
- Don't manually edit the XML structure

### Issue: Template not found

**Solution:**

- Verify template is in `forms/` directory
- Check file name doesn't start with `~$` (temp file)
- Ensure file has `.docx` extension

## Performance Considerations

### Caching

Templates are loaded fresh each time. For production, consider caching:

```typescript
const templateCache = new Map<string, Buffer>();

export function loadTemplate(templatePath: string): Buffer {
  if (templateCache.has(templatePath)) {
    return templateCache.get(templatePath)!;
  }

  const buffer = readFileSync(templatePath);
  templateCache.set(templatePath, buffer);
  return buffer;
}
```

### Large Documents

For templates with many placeholders (100+):

- Use pagination for employee lists
- Consider server-side streaming
- Implement progress indicators

### Database Queries

The system only fetches required columns:

```sql
SELECT empname, designation_name, present_res_no
FROM employees
WHERE id = $1
```

## Security Considerations

1. **Input Validation**: All inputs are validated before processing
2. **SQL Injection**: Uses parameterized queries via Supabase
3. **File Access**: Only accesses files in `forms/` directory
4. **User Permissions**: Implement role-based access control

## Testing

### Test Cases

1. **Complete Data**: Employee with all fields filled
2. **Partial Data**: Employee with some missing fields
3. **Special Characters**: Names with accents, symbols
4. **Large Documents**: Templates with 50+ placeholders
5. **Multiple Tables**: Different table structures

### Example Test

```typescript
// Test placeholder extraction
const buffer = loadTemplate("forms/Form_A.docx");
const placeholders = extractPlaceholders(buffer);
console.log("Found placeholders:", placeholders);

// Test column mapping
const mapping = mapPlaceholdersToColumns(placeholders);
console.log("Column mapping:", mapping);

// Test data transformation
const dbRow = { empname: "John Doe", designation_name: "Manager" };
const templateData = transformDataForTemplate(dbRow, mapping);
console.log("Template data:", templateData);
```

## Future Enhancements

- [ ] Batch generation for multiple employees
- [ ] PDF export option
- [ ] Email delivery of generated forms
- [ ] Template versioning
- [ ] Audit trail for generated forms
- [ ] Custom placeholder syntax
- [ ] Conditional sections
- [ ] Image placeholders
- [ ] Table row generation

## Support

For issues or questions:

1. Check console logs for detailed error messages
2. Verify database schema matches expectations
3. Test with a simple template first
4. Review the API responses in browser DevTools

## Dependencies

- `pizzip`: ZIP file handling for DOCX
- `docxtemplater`: Template engine for Word documents
- `@supabase/supabase-js`: Database client
- `next`: React framework

## License

This system is part of your Next.js application and follows the same license.
