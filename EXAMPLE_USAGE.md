# DOCX Form Generator - Complete Example

## Real-World Example: Generating Employee Forms

Let's walk through a complete example of generating a filled employee form.

## 📄 Step 1: Your Template File

**File:** `forms/Form_A.docx`

```
EMPLOYEE INFORMATION FORM

Name: [[Empname]]
Designation: [[Designation Name]]
Employee ID: [[Employee ID]]
Date of Birth: [[Date of Birth]]
Address: [[Present Res No]]
Phone: [[Phone Number]]
Email: [[Email]]
Department: [[Department]]
Date of Joining: [[Date of Joining]]
```

## 🗄️ Step 2: Your Database

**Table:** `employees`

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY,
  empname TEXT,
  designation_name TEXT,
  employee_id TEXT,
  date_of_birth DATE,
  present_res_no TEXT,
  phone_number TEXT,
  email TEXT,
  department TEXT,
  date_of_joining DATE
);

-- Sample data
INSERT INTO employees VALUES (
  '123e4567-e89b-12d3-a456-426614174000',
  'John Doe',
  'Senior Manager',
  'EMP001',
  '1985-06-15',
  '123 Main Street, Mumbai',
  '+91 98765 43210',
  'john.doe@company.com',
  'Information Technology',
  '2020-01-15'
);
```

## 🖥️ Step 3: Using the UI

### 3.1 Navigate to Form Generator

```
http://localhost:3000/dashboard/form-generator
```

### 3.2 Select Options

1. **Template:** Form_A
2. **Table:** employees
3. **Employee:** John Doe (Senior Manager)

### 3.3 Preview Data

The UI will show:

```
✅ 9 fields filled
⚠️ 0 fields empty

Empname: "John Doe"
Designation Name: "Senior Manager"
Employee ID: "EMP001"
Date of Birth: "15/06/1985"
Present Res No: "123 Main Street, Mumbai"
Phone Number: "+91 98765 43210"
Email: "john.doe@company.com"
Department: "Information Technology"
Date of Joining: "15/01/2020"
```

### 3.4 Generate Form

Click "Generate & Download Form" button.

### 3.5 Result

A file named `form_123e4567-e89b-12d3-a456-426614174000_1234567890.docx` downloads.

Open it in Microsoft Word and see:

```
EMPLOYEE INFORMATION FORM

Name: John Doe
Designation: Senior Manager
Employee ID: EMP001
Date of Birth: 15/06/1985
Address: 123 Main Street, Mumbai
Phone: +91 98765 43210
Email: john.doe@company.com
Department: Information Technology
Date of Joining: 15/01/2020
```

## 💻 Step 4: Using the API Directly

### 4.1 Preview Before Generating

```javascript
// GET request to preview data
const response = await fetch(
  '/api/generate-form?' + new URLSearchParams({
    templatePath: 'forms/Form_A.docx',
    tableName: 'employees',
    employeeId: '123e4567-e89b-12d3-a456-426614174000'
  })
);

const result = await response.json();
console.log(result);

// Output:
{
  "success": true,
  "preview": {
    "placeholders": [
      "Empname",
      "Designation Name",
      "Employee ID",
      "Date of Birth",
      "Present Res No",
      "Phone Number",
      "Email",
      "Department",
      "Date of Joining"
    ],
    "columnMapping": {
      "Empname": "empname",
      "Designation Name": "designation_name",
      "Employee ID": "employee_id",
      "Date of Birth": "date_of_birth",
      "Present Res No": "present_res_no",
      "Phone Number": "phone_number",
      "Email": "email",
      "Department": "department",
      "Date of Joining": "date_of_joining"
    },
    "employeeData": {
      "Empname": "John Doe",
      "Designation Name": "Senior Manager",
      "Employee ID": "EMP001",
      "Date of Birth": "15/06/1985",
      "Present Res No": "123 Main Street, Mumbai",
      "Phone Number": "+91 98765 43210",
      "Email": "john.doe@company.com",
      "Department": "Information Technology",
      "Date of Joining": "15/01/2020"
    },
    "missingColumns": []
  }
}
```

### 4.2 Generate and Download

```javascript
// POST request to generate DOCX
const response = await fetch("/api/generate-form", {
  method: "POST",
  headers: {
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    templatePath: "forms/Form_A.docx",
    tableName: "employees",
    employeeId: "123e4567-e89b-12d3-a456-426614174000",
  }),
});

// Check if successful
if (!response.ok) {
  const error = await response.json();
  console.error("Error:", error.error);
  return;
}

// Get metadata from headers
const metadataHeader = response.headers.get("X-Metadata");
const metadata = JSON.parse(metadataHeader);
console.log("Filled fields:", metadata.filledFields.length);
console.log("Empty fields:", metadata.emptyFields.length);

// Download the file
const blob = await response.blob();
const url = window.URL.createObjectURL(blob);
const a = document.createElement("a");
a.href = url;
a.download = "employee_form.docx";
document.body.appendChild(a);
a.click();
window.URL.revokeObjectURL(url);
document.body.removeChild(a);

console.log("✅ Form downloaded successfully!");
```

## 🔧 Step 5: Programmatic Usage

### 5.1 In a Server Component

```typescript
import { generateForm } from '@/lib/form-generator';

export default async function EmployeeFormPage({
  params
}: {
  params: { id: string }
}) {
  const result = await generateForm({
    templatePath: 'forms/Form_A.docx',
    tableName: 'employees',
    employeeId: params.id
  });

  if (!result.success) {
    return <div>Error: {result.error}</div>;
  }

  // Return the DOCX file
  return new Response(result.buffer, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'Content-Disposition': 'attachment; filename="employee_form.docx"'
    }
  });
}
```

### 5.2 In an API Route

```typescript
import { NextRequest, NextResponse } from "next/server";
import { generateForm } from "@/lib/form-generator";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  const result = await generateForm({
    templatePath: "forms/Form_A.docx",
    tableName: "employees",
    employeeId: params.id,
  });

  if (!result.success) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  return new NextResponse(result.buffer, {
    headers: {
      "Content-Type":
        "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "Content-Disposition": `attachment; filename="employee_${params.id}.docx"`,
    },
  });
}
```

### 5.3 Batch Generation

```typescript
import { generateForm } from "@/lib/form-generator";
import { createServerSupabaseClient } from "@/lib/supabase";

async function generateFormsForAllEmployees() {
  const supabase = createServerSupabaseClient();

  // Get all employees
  const { data: employees } = await supabase
    .from("employees")
    .select("id, empname");

  const results = [];

  for (const employee of employees) {
    const result = await generateForm({
      templatePath: "forms/Form_A.docx",
      tableName: "employees",
      employeeId: employee.id,
    });

    if (result.success) {
      // Save to file system or cloud storage
      const fs = require("fs");
      fs.writeFileSync(`output/employee_${employee.id}.docx`, result.buffer);

      results.push({
        id: employee.id,
        name: employee.empname,
        status: "success",
      });
    } else {
      results.push({
        id: employee.id,
        name: employee.empname,
        status: "failed",
        error: result.error,
      });
    }
  }

  return results;
}
```

## 🎯 Advanced Usage

### Custom Data Transformation

```typescript
// lib/custom-formatter.ts
export function formatEmployeeData(employee: any) {
  return {
    Empname: employee.empname.toUpperCase(),
    "Designation Name": employee.designation_name,
    "Employee ID": `EMP-${employee.employee_id}`,
    "Date of Birth": new Date(employee.date_of_birth).toLocaleDateString(
      "en-IN",
    ),
    "Present Res No": employee.present_res_no,
    "Phone Number": formatPhoneNumber(employee.phone_number),
    Email: employee.email.toLowerCase(),
    Department: employee.department,
    "Date of Joining": new Date(employee.date_of_joining).toLocaleDateString(
      "en-IN",
    ),
  };
}

function formatPhoneNumber(phone: string): string {
  // Format: +91 98765 43210 → +91-98765-43210
  return phone.replace(/\s/g, "-");
}
```

### Multiple Templates

```typescript
const templates = {
  offer_letter: "forms/Offer_Letter.docx",
  appointment_letter: "forms/Appointment_Letter.docx",
  experience_certificate: "forms/Experience_Certificate.docx",
  salary_slip: "forms/Salary_Slip.docx",
};

async function generateDocument(
  type: keyof typeof templates,
  employeeId: string,
) {
  return await generateForm({
    templatePath: templates[type],
    tableName: "employees",
    employeeId,
  });
}
```

## 📊 Monitoring and Logging

```typescript
import { generateForm } from "@/lib/form-generator";

async function generateWithLogging(
  templatePath: string,
  tableName: string,
  employeeId: string,
) {
  console.log(`[${new Date().toISOString()}] Starting form generation`);
  console.log(`  Template: ${templatePath}`);
  console.log(`  Table: ${tableName}`);
  console.log(`  Employee: ${employeeId}`);

  const startTime = Date.now();
  const result = await generateForm({
    templatePath,
    tableName,
    employeeId,
  });
  const duration = Date.now() - startTime;

  if (result.success) {
    console.log(`✅ Form generated successfully in ${duration}ms`);
    console.log(`  Filled fields: ${result.metadata?.filledFields.length}`);
    console.log(`  Empty fields: ${result.metadata?.emptyFields.length}`);
  } else {
    console.error(`❌ Form generation failed after ${duration}ms`);
    console.error(`  Error: ${result.error}`);
  }

  return result;
}
```

## 🎉 Summary

You now have:

1. ✅ Working DOCX template with placeholders
2. ✅ Database with employee data
3. ✅ UI for selecting and generating forms
4. ✅ API endpoints for programmatic access
5. ✅ Functions for batch processing
6. ✅ Custom formatting options

**The system generates ACTUAL DOCX files that can be opened and edited in Microsoft Word!**
