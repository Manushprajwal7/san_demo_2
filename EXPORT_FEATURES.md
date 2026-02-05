# Export Features Documentation

## Overview

The Data Viewer now supports exporting data in three professional formats:

- **Excel (.xlsx)** - Spreadsheet format
- **PDF (.pdf)** - Formatted document with tables
- **Word (.docx)** - Editable document format

## Installation

The required packages have been added to `package.json`:

```bash
npm install jspdf jspdf-autotable docx
```

## Features

### 1. Excel Export

- Exports filtered and sorted data
- Preserves column structure
- File format: `.xlsx`
- Uses: Data analysis, spreadsheet manipulation

### 2. PDF Export

- Professional formatted document
- Includes:
  - Document title (table display name)
  - Generation timestamp
  - Total record count
  - Formatted table with headers
  - Alternating row colors for readability
- Auto-adjusts orientation (portrait/landscape) based on column count
- Styled headers with blue background
- File format: `.pdf`
- Uses: Reports, presentations, archival

### 3. Word Export

- Editable document format
- Includes:
  - Document title as Heading 1
  - Generation metadata
  - Record count
  - Professional table with borders
  - Styled header row (blue background, white text)
- File format: `.docx`
- Uses: Reports, documentation, further editing

## Usage

1. Navigate to **Notice Builder** → **View Data** tab
2. Select a table from the dropdown
3. Apply any filters or sorting as needed
4. Click the **Export** button
5. Choose your desired format:
   - Export as Excel
   - Export as PDF
   - Export as Word

## Technical Details

### Excel Export

- Library: `xlsx`
- Method: `XLSX.utils.json_to_sheet()`
- Output: Binary Excel file

### PDF Export

- Library: `jspdf` + `jspdf-autotable`
- Features:
  - Auto-orientation based on columns
  - Custom styling
  - Professional table formatting
- Font: Helvetica
- Page size: A4

### Word Export

- Library: `docx`
- Features:
  - Structured document sections
  - Table with borders
  - Custom cell styling
  - Percentage-based column widths
- Output: Office Open XML format

## File Naming Convention

All exports follow this pattern:

```
{table_name}_export.{extension}
```

Examples:

- `employee_notices_export.xlsx`
- `manpower_export.pdf`
- `attendance_export.docx`

## Filtering & Sorting

Exports respect all active filters and sorting:

- Only visible (filtered) rows are exported
- Sort order is preserved
- Column order matches table display

## Browser Compatibility

All export features work in modern browsers:

- Chrome/Edge (recommended)
- Firefox
- Safari

## Troubleshooting

### Export button disabled

- Ensure table has data
- Check if filters are too restrictive

### PDF orientation issues

- Tables with >6 columns automatically use landscape
- For very wide tables, consider exporting to Excel

### Word export slow

- Large datasets (>1000 rows) may take a few seconds
- Browser will show download when complete

## Future Enhancements

Potential additions:

- Custom column selection
- Export templates
- Scheduled exports
- Email delivery
- CSV export option
- Print preview
