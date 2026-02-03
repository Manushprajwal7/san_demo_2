# HRMS API Documentation

## Overview
This document describes all API endpoints available in the HRMS application. All endpoints are fully integrated with Supabase and return real data from the database.

## Base URL
All endpoints are prefixed with `/api`

---

## 1. Dashboard API

### Get Dashboard Data
**Endpoint:** `GET /api/dashboard?company={company}`

**Parameters:**
- `company` (required): Company code (e.g., 'sangeetha', 'ampl')

**Response:**
```json
{
  "licenses": [...],
  "branches": [...],
  "employees": 120,
  "maleCount": 75,
  "femaleCount": 45,
  "totalSalary": 5000000,
  "licenseStatusCounts": {
    "active": 5,
    "expiring": 1,
    "expired": 1
  }
}
```

---

## 2. Employees API

### Get All Employees
**Endpoint:** `GET /api/employees?company={company}&branchId={branchId}&status={status}`

**Parameters:**
- `company` (required): Company code
- `branchId` (optional): Filter by branch
- `status` (optional): Filter by status (active/inactive)

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "John Doe",
    "email": "john@example.com",
    "designation": "Manager",
    "salary": 50000,
    "gender": "Male",
    "join_date": "2023-01-15",
    "status": "active"
  }
]
```

### Create Employee
**Endpoint:** `POST /api/employees`

**Request Body:**
```json
{
  "companyId": "uuid",
  "branchId": "uuid",
  "name": "Jane Doe",
  "email": "jane@example.com",
  "gender": "Female",
  "salary": 60000,
  "designation": "Senior Manager",
  "joinDate": "2023-06-01"
}
```

### Update Employee
**Endpoint:** `PATCH /api/employees?id={employeeId}`

**Request Body:**
```json
{
  "id": "uuid",
  "name": "Updated Name",
  "salary": 65000,
  "status": "active"
}
```

### Delete Employee
**Endpoint:** `DELETE /api/employees?id={employeeId}`

---

## 3. Branches API

### Get All Branches
**Endpoint:** `GET /api/branches?company={company}`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Main Branch",
    "location": "Chennai",
    "approved_manpower": 50,
    "actual_manpower": 48,
    "total_salary": 2500000
  }
]
```

### Create Branch
**Endpoint:** `POST /api/branches`

**Request Body:**
```json
{
  "companyId": "uuid",
  "name": "New Branch",
  "location": "Mumbai",
  "approvedManpower": 30
}
```

### Update Branch
**Endpoint:** `PATCH /api/branches?id={branchId}`

**Request Body:**
```json
{
  "id": "uuid",
  "approved_manpower": 35,
  "total_salary": 1800000
}
```

---

## 4. Calendar API

### Get Calendar Events
**Endpoint:** `GET /api/calendar?company={company}`

**Response:**
```json
{
  "events": [
    {
      "id": "uuid",
      "title": "Diwali Holiday",
      "description": "Company holiday",
      "event_date": "2024-11-01",
      "event_type": "Holiday"
    }
  ],
  "branches": [...]
}
```

### Create Event
**Endpoint:** `POST /api/calendar`

**Request Body:**
```json
{
  "companyId": "uuid",
  "title": "Team Meeting",
  "description": "Quarterly review",
  "eventDate": "2024-12-15",
  "eventType": "Meeting",
  "branchId": "uuid"
}
```

---

## 5. Compliance API

### Get Compliance Submissions
**Endpoint:** `GET /api/compliance?company={company}`

**Response:**
```json
{
  "submissions": [
    {
      "id": "uuid",
      "compliance_type": "pf",
      "submission_month": "2024-12-01",
      "status": "pending",
      "created_at": "2024-12-01T10:00:00Z"
    }
  ],
  "branches": [...]
}
```

### Create Compliance Submissions
**Endpoint:** `POST /api/compliance`

**Request Body:**
```json
{
  "submissions": [
    {
      "company_id": "uuid",
      "branch_id": "uuid",
      "compliance_type": "pf",
      "submission_month": "2024-12-01",
      "status": "pending"
    }
  ]
}
```

### Update Compliance Status
**Endpoint:** `PATCH /api/compliance`

**Request Body:**
```json
{
  "id": "uuid",
  "status": "approved"
}
```

---

## 6. Leaves API

### Get Leave Types
**Endpoint:** `GET /api/leaves?company={company}&type=types`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Annual Leave",
    "total_days": 20
  }
]
```

### Get Leave Records
**Endpoint:** `GET /api/leaves?company={company}`

**Response:**
```json
[
  {
    "id": "uuid",
    "employee_id": "uuid",
    "leave_type_id": "uuid",
    "from_date": "2024-12-10",
    "to_date": "2024-12-15",
    "status": "pending",
    "reason": "Personal leave"
  }
]
```

### Create Leave Request
**Endpoint:** `POST /api/leaves`

**Request Body:**
```json
{
  "employeeId": "uuid",
  "leaveTypeId": "uuid",
  "fromDate": "2024-12-10",
  "toDate": "2024-12-15",
  "reason": "Personal leave"
}
```

### Update Leave Status
**Endpoint:** `PATCH /api/leaves`

**Request Body:**
```json
{
  "id": "uuid",
  "status": "approved"
}
```

---

## 7. Dynamic Tables API

### Get Tables Metadata
**Endpoint:** `GET /api/dynamic-tables?company={company}`

**Response:**
```json
[
  {
    "id": "uuid",
    "table_name": "employee_attendance",
    "display_name": "Employee Attendance",
    "fields": [
      { "name": "date", "type": "date" },
      { "name": "present", "type": "boolean" }
    ]
  }
]
```

### Get Table Data
**Endpoint:** `GET /api/dynamic-tables?company={company}&tableId={tableId}`

**Response:**
```json
[
  {
    "id": "uuid",
    "table_metadata_id": "uuid",
    "data": {
      "date": "2024-12-01",
      "present": true
    }
  }
]
```

### Create Custom Table
**Endpoint:** `POST /api/dynamic-tables`

**Request Body:**
```json
{
  "type": "table",
  "data": {
    "companyId": "uuid",
    "tableName": "new_table",
    "displayName": "New Table",
    "fields": [
      { "name": "field1", "type": "text" },
      { "name": "field2", "type": "number" }
    ]
  }
}
```

### Create Table Row
**Endpoint:** `POST /api/dynamic-tables`

**Request Body:**
```json
{
  "type": "data",
  "data": {
    "tableMetadataId": "uuid",
    "rowData": {
      "field1": "value1",
      "field2": 100
    }
  }
}
```

### Update Table Row
**Endpoint:** `PATCH /api/dynamic-tables`

**Request Body:**
```json
{
  "id": "uuid",
  "data": {
    "field1": "updated value",
    "field2": 200
  }
}
```

### Delete Table Row
**Endpoint:** `DELETE /api/dynamic-tables?id={rowId}`

---

## 8. Licenses API

### Get All Licenses
**Endpoint:** `GET /api/licenses?company={company}`

**Response:**
```json
[
  {
    "id": "uuid",
    "license_type": "PF License",
    "expiry_date": "2025-06-30",
    "status": "Active"
  }
]
```

### Create License
**Endpoint:** `POST /api/licenses`

**Request Body:**
```json
{
  "companyId": "uuid",
  "licenseType": "ESIC License",
  "expiryDate": "2025-12-31",
  "status": "Active"
}
```

### Update License
**Endpoint:** `PATCH /api/licenses`

**Request Body:**
```json
{
  "id": "uuid",
  "status": "Expiring Soon",
  "expiryDate": "2025-01-31"
}
```

---

## 9. Companies API

### Get All Companies
**Endpoint:** `GET /api/companies`

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "Sangeetha Mobiles",
    "code": "SANGEETHA"
  }
]
```

### Get Company by Code
**Endpoint:** `GET /api/companies?code={code}`

**Response:**
```json
{
  "id": "uuid",
  "name": "Sangeetha Mobiles",
  "code": "SANGEETHA"
}
```

### Create Company
**Endpoint:** `POST /api/companies`

**Request Body:**
```json
{
  "name": "New Company",
  "code": "NEWCO"
}
```

---

## API Client Usage

### Using the ApiClient Class

```typescript
import { employeesAPI, branchesAPI, dashboardAPI } from '@/lib/api-client'

// Get employees
const employees = await employeesAPI.getEmployees('sangeetha')

// Create employee
const newEmployee = await employeesAPI.createEmployee({
  companyId: 'uuid',
  name: 'John Doe',
  email: 'john@example.com'
})

// Get dashboard data
const dashboard = await dashboardAPI.getDashboard('sangeetha')
```

### Using the useApi Hook

```typescript
import { useApi } from '@/hooks/useApi'

export function MyComponent() {
  const { data, loading, error, fetch, post, patch, delete: delete_ } = useApi()

  const loadData = async () => {
    await fetch('/api/employees?company=sangeetha')
  }

  return (
    <div>
      {loading && <p>Loading...</p>}
      {error && <p>Error: {error}</p>}
      {data && <p>{JSON.stringify(data)}</p>}
    </div>
  )
}
```

---

## Error Handling

All endpoints follow this error response format:

```json
{
  "error": "Description of the error"
}
```

HTTP Status Codes:
- `200` - Success
- `400` - Bad Request (validation error)
- `404` - Not Found
- `500` - Internal Server Error

---

## Authentication

Currently, the APIs use Supabase service role key for authentication. In production, implement proper authentication and authorization middleware.

---

## Rate Limiting

No rate limiting is currently implemented. Consider adding rate limiting middleware for production deployments.
