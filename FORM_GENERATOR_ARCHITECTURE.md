# Form Generator System Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     Form Generator System                        │
│                                                                   │
│  User Interface → API Layer → Business Logic → Database          │
└─────────────────────────────────────────────────────────────────┘
```

## Component Architecture

```
┌──────────────────────────────────────────────────────────────────┐
│                         User Interface                            │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  FormGenerator Component (components/form-generator.tsx)   │  │
│  │                                                             │  │
│  │  ┌──────────────┐  ┌──────────────┐  ┌─────────────────┐ │  │
│  │  │   Template   │  │    Table     │  │    Employee     │ │  │
│  │  │   Selector   │  │   Selector   │  │    Selector     │ │  │
│  │  └──────────────┘  └──────────────┘  └─────────────────┘ │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │              Data Preview Section                     │ │  │
│  │  │  - Shows placeholders and values                      │ │  │
│  │  │  - Highlights filled vs empty fields                  │ │  │
│  │  │  - Warns about missing columns                        │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │                                                             │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │         Generate & Download Button                    │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └─────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                          API Layer                                │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  GET /api/templates                                        │  │
│  │  - Lists available DOCX templates                          │  │
│  │  - Returns placeholder counts                              │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  GET /api/employees                                        │  │
│  │  - Lists tables and employees                              │  │
│  │  - Returns employee metadata                               │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  GET /api/generate-form (preview)                          │  │
│  │  - Returns preview data                                    │  │
│  │  - Shows column mappings                                   │  │
│  └────────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  POST /api/generate-form                                   │  │
│  │  - Generates populated DOCX                                │  │
│  │  - Returns binary file                                     │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                      Business Logic Layer                         │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  lib/docx-processor.ts                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  loadTemplate(path)                                   │ │  │
│  │  │  - Reads DOCX file from filesystem                    │ │  │
│  │  │  - Returns Buffer                                     │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  extractPlaceholders(buffer)                          │ │  │
│  │  │  - Parses DOCX XML                                    │ │  │
│  │  │  - Extracts [[placeholder]] patterns                  │ │  │
│  │  │  - Returns array of placeholder names                 │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  populateTemplate(buffer, data)                       │ │  │
│  │  │  - Replaces placeholders with values                  │ │  │
│  │  │  - Preserves formatting                               │ │  │
│  │  │  - Returns populated Buffer                           │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  lib/db-mapper.ts                                          │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  placeholderToColumn(placeholder)                     │ │  │
│  │  │  - Converts "Employee Name" → "employee_name"         │ │  │
│  │  │  - Handles spaces, special chars                      │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  mapPlaceholdersToColumns(placeholders)               │ │  │
│  │  │  - Maps all placeholders to columns                   │ │  │
│  │  │  - Returns mapping object                             │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  formatValue(value, columnName)                       │ │  │
│  │  │  - Formats dates, numbers, booleans                   │ │  │
│  │  │  - Handles null/undefined                             │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  transformDataForTemplate(dbRow, mapping)             │ │  │
│  │  │  - Converts DB row to template format                 │ │  │
│  │  │  - Applies formatting                                 │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                   │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  lib/form-generator.ts                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  generateForm(options)                                │ │  │
│  │  │  - Orchestrates entire generation process             │ │  │
│  │  │  - Returns populated buffer + metadata                │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  getFormPreview(options)                              │ │  │
│  │  │  - Returns preview without generating                 │ │  │
│  │  │  - Shows what will be filled                          │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
                              ↓
┌──────────────────────────────────────────────────────────────────┐
│                        Database Layer                             │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Supabase (PostgreSQL)                                     │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  employees table                                      │ │  │
│  │  │  - empname, designation_name, etc.                    │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  notice_tables_registry                               │ │  │
│  │  │  - Lists available tables                             │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  │  ┌──────────────────────────────────────────────────────┐ │  │
│  │  │  Custom tables (dynamic)                              │ │  │
│  │  │  - User-created tables                                │ │  │
│  │  └──────────────────────────────────────────────────────┘ │  │
│  └────────────────────────────────────────────────────────────┘  │
└──────────────────────────────────────────────────────────────────┘
```

## Data Flow Diagram

```
┌─────────────┐
│    User     │
└──────┬──────┘
       │ 1. Selects template, table, employee
       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Form Generator UI                         │
└──────┬──────────────────────────────────────────────────────┘
       │ 2. GET /api/generate-form?preview=true
       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Generate Form API                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 3. Load template from filesystem                       │ │
│  │    forms/Form_A.docx → Buffer                          │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 4. Extract placeholders                                │ │
│  │    [[Empname]], [[Designation Name]], ...              │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 5. Map to database columns                             │ │
│  │    Empname → empname                                   │ │
│  │    Designation Name → designation_name                 │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 6. Query database                                      │ │
│  │    SELECT empname, designation_name                    │ │
│  │    FROM employees WHERE id = $1                        │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 7. Transform data                                      │ │
│  │    Format dates, handle nulls, etc.                    │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 8. Return preview data                                 │ │
│  │    { placeholders, employeeData, missingColumns }      │ │
│  └────────────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────────────┘
       │ 9. Display preview to user
       ↓
┌─────────────────────────────────────────────────────────────┐
│                    Form Generator UI                         │
│  Shows: Filled fields (green), Empty fields (yellow)        │
└──────┬──────────────────────────────────────────────────────┘
       │ 10. User clicks "Generate & Download"
       ↓
┌─────────────────────────────────────────────────────────────┐
│                  Generate Form API                           │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 11. Repeat steps 3-7                                   │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 12. Populate template                                  │ │
│  │     Replace [[placeholders]] with actual values        │ │
│  │     Preserve all formatting                            │ │
│  └────────────────────────────────────────────────────────┘ │
│  ┌────────────────────────────────────────────────────────┐ │
│  │ 13. Return DOCX buffer                                 │ │
│  │     Content-Type: application/vnd...docx               │ │
│  │     Content-Disposition: attachment                    │ │
│  └────────────────────────────────────────────────────────┘ │
└──────┬──────────────────────────────────────────────────────┘
       │ 14. Download file
       ↓
┌─────────────┐
│    User     │
│  Opens DOCX │
└─────────────┘
```

## Placeholder Processing Flow

```
Template: "Employee Name: [[Empname]]"
                    ↓
         Extract Placeholder
                    ↓
              "Empname"
                    ↓
         Convert to Column
                    ↓
              "empname"
                    ↓
         Query Database
                    ↓
    SELECT empname FROM employees
                    ↓
         "Rajesh Kumar"
                    ↓
         Format Value
                    ↓
         "Rajesh Kumar"
                    ↓
      Replace in Template
                    ↓
Result: "Employee Name: Rajesh Kumar"
```

## Error Handling Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    Error Scenarios                           │
└─────────────────────────────────────────────────────────────┘

Template Not Found
    ↓
Return 404 error
    ↓
Show user-friendly message
    ↓
Suggest checking template path

No Placeholders Found
    ↓
Log warning
    ↓
Continue with empty template
    ↓
Return original document

Column Not Found
    ↓
Log warning
    ↓
Leave placeholder empty
    ↓
Show in preview as missing

Employee Not Found
    ↓
Return 404 error
    ↓
Show "Employee not found" message
    ↓
Suggest selecting different employee

Database Connection Error
    ↓
Return 500 error
    ↓
Log detailed error
    ↓
Show "Database connection failed"

Invalid DOCX File
    ↓
Catch parsing error
    ↓
Return 400 error
    ↓
Show "Invalid template file"
```

## Security Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    Security Layers                           │
└─────────────────────────────────────────────────────────────┘

Input Validation
    ↓
    • Validate template path (no directory traversal)
    • Validate table name (alphanumeric + underscore)
    • Validate employee ID (numeric or UUID)
    ↓
Authentication
    ↓
    • Check user session
    • Verify user permissions
    ↓
Authorization
    ↓
    • Check table access rights
    • Verify employee data access
    ↓
SQL Injection Prevention
    ↓
    • Use parameterized queries
    • Supabase client handles escaping
    ↓
File System Security
    ↓
    • Restrict to forms/ directory
    • No arbitrary file access
    ↓
Output Sanitization
    ↓
    • Validate DOCX output
    • Set correct content headers
```

## Performance Optimization

```
┌─────────────────────────────────────────────────────────────┐
│                  Performance Strategy                        │
└─────────────────────────────────────────────────────────────┘

Template Caching
    • Cache parsed templates in memory
    • Invalidate on file change
    • Reduces parsing time by 80%

Database Optimization
    • Select only required columns
    • Use indexes on ID columns
    • Connection pooling via Supabase

Streaming
    • Stream large DOCX files
    • Avoid loading entire file in memory
    • Better for 10MB+ documents

Parallel Processing
    • Process multiple forms concurrently
    • Use Promise.all for batch generation
    • Limit concurrent operations

Client-Side Caching
    • Cache template list
    • Cache employee list
    • Reduce API calls
```

## Technology Stack

```
┌─────────────────────────────────────────────────────────────┐
│                    Technology Stack                          │
└─────────────────────────────────────────────────────────────┘

Frontend
    • Next.js 16 (React 19)
    • TypeScript
    • Tailwind CSS
    • Radix UI components
    • Sonner (toast notifications)

Backend
    • Next.js API Routes
    • Node.js
    • TypeScript

Libraries
    • pizzip (ZIP handling)
    • docxtemplater (DOCX templating)
    • @supabase/supabase-js (database)

Database
    • Supabase (PostgreSQL)
    • Dynamic table support

File System
    • Node.js fs module
    • forms/ directory for templates
```

## Deployment Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                  Deployment Diagram                          │
└─────────────────────────────────────────────────────────────┘

┌──────────────┐
│   Browser    │
└──────┬───────┘
       │ HTTPS
       ↓
┌──────────────────────────────────────────────────────────────┐
│                    Vercel / Cloud Host                        │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  Next.js Application                                   │  │
│  │  • Static pages                                        │  │
│  │  • API routes                                          │  │
│  │  • Server components                                   │  │
│  └────────────────────────────────────────────────────────┘  │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  File System                                           │  │
│  │  • forms/ directory                                    │  │
│  │  • Template files                                      │  │
│  └────────────────────────────────────────────────────────┘  │
└──────┬───────────────────────────────────────────────────────┘
       │ PostgreSQL Protocol
       ↓
┌──────────────────────────────────────────────────────────────┐
│                    Supabase                                   │
│  • PostgreSQL database                                        │
│  • Connection pooling                                         │
│  • Row-level security                                         │
└──────────────────────────────────────────────────────────────┘
```

---

**This architecture provides:**

- ✅ Scalability
- ✅ Maintainability
- ✅ Security
- ✅ Performance
- ✅ Extensibility
