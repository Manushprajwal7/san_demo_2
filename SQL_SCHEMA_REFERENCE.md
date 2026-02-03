# HRMS Database Schema Reference

Complete schema documentation for the HRMS application.

## Tables Overview

### 1. companies
Stores organization/company information.

```sql
CREATE TABLE companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data:**
- Sangeetha Mobiles (SANGEETHA)
- AMPL
- Demo Company

---

### 2. branches
Stores branch/office locations and manpower information.

```sql
CREATE TABLE branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  approved_manpower INT DEFAULT 0,
  actual_manpower INT DEFAULT 0,
  total_salary DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- Foreign Key: company_id → companies.id

**Example Data:**
- Main Branch - Chennai (50/45 manpower, ₹2,250,000 salary)
- North Branch - Delhi (30/28 manpower, ₹1,400,000 salary)
- South Branch - Bangalore (40/38 manpower, ₹1,900,000 salary)

---

### 3. employees
Stores employee records and personal information.

```sql
CREATE TABLE employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  branch_id UUID NOT NULL REFERENCES branches(id),
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  salary DECIMAL(15,2),
  designation VARCHAR(255),
  join_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Relationships:**
- Foreign Key: company_id → companies.id
- Foreign Key: branch_id → branches.id

**Indexes:**
- idx_employees_company
- idx_employees_branch

---

### 4. leave_types
Defines available leave types in the organization.

```sql
CREATE TABLE leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  name VARCHAR(100) NOT NULL,
  total_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Data:**
- Annual Leave (20 days)
- Casual Leave (12 days)
- Sick Leave (10 days)

---

### 5. leave_records
Tracks leave requests and approvals.

```sql
CREATE TABLE leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id),
  leave_type_id UUID NOT NULL REFERENCES leave_types(id),
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values:**
- pending
- approved
- rejected
- cancelled

---

### 6. calendar_events
Stores company-wide events and holidays.

```sql
CREATE TABLE calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  branch_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Sample Event Types:**
- Holiday
- Event
- Meeting
- Training
- Deadline

**Indexes:**
- idx_calendar_company

---

### 7. dynamic_tables_metadata
Stores definitions of user-created forms/tables (Notice Generator).

```sql
CREATE TABLE dynamic_tables_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  table_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  fields JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Fields Structure (JSONB):**
```json
[
  {
    "name": "Employee ID",
    "type": "text"
  },
  {
    "name": "Attendance Date",
    "type": "date"
  },
  {
    "name": "Present",
    "type": "boolean"
  },
  {
    "name": "Hours Worked",
    "type": "number"
  }
]
```

---

### 8. dynamic_table_data
Stores actual data for dynamically created tables.

```sql
CREATE TABLE dynamic_table_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_metadata_id UUID NOT NULL REFERENCES dynamic_tables_metadata(id),
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Data Structure (JSONB):**
```json
{
  "Employee ID": "EMP001",
  "Attendance Date": "2024-02-03",
  "Present": true,
  "Hours Worked": 8
}
```

---

### 9. compliance_submissions
Tracks compliance submissions for regulatory requirements.

```sql
CREATE TABLE compliance_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  branch_id UUID,
  compliance_type VARCHAR(100) NOT NULL,
  submission_month DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Compliance Types:**
- pf (Provident Fund)
- esic (Employee State Insurance)
- pt (Professional Tax)
- tds (Tax Deducted at Source)
- esi (Employee Security Insurance)
- gratuity (Gratuity)

**Status Values:**
- pending
- submitted
- approved
- rejected

**Indexes:**
- idx_compliance_company

---

### 10. license_status
Tracks company licenses and compliance deadlines.

```sql
CREATE TABLE license_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id),
  license_type VARCHAR(100) NOT NULL,
  expiry_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

**Status Values:**
- Active
- Expiring Soon (within 90 days)
- Expired

**Sample Licenses:**
- PF License
- ESIC License
- PT License

---

## Indexes

All indexes created for performance optimization:

```sql
CREATE INDEX idx_branches_company ON branches(company_id);
CREATE INDEX idx_employees_company ON employees(company_id);
CREATE INDEX idx_employees_branch ON employees(branch_id);
CREATE INDEX idx_calendar_company ON calendar_events(company_id);
CREATE INDEX idx_compliance_company ON compliance_submissions(company_id);
CREATE INDEX idx_license_company ON license_status(company_id);
CREATE INDEX idx_dynamic_metadata_company ON dynamic_tables_metadata(company_id);
```

---

## Relationships Diagram

```
companies (1)
├── branches (many)
│   └── employees (many)
│       ├── leave_records (many)
│       └── dynamic_table_data (many)
├── leave_types (many)
│   └── leave_records (many)
├── calendar_events (many)
├── compliance_submissions (many)
├── license_status (many)
└── dynamic_tables_metadata (many)
    └── dynamic_table_data (many)
```

---

## Queries Reference

### Get All Branches for a Company
```sql
SELECT * FROM branches 
WHERE company_id = '<company-id>'
ORDER BY name;
```

### Get Employee Count by Branch
```sql
SELECT 
  b.name,
  COUNT(e.id) as employee_count
FROM branches b
LEFT JOIN employees e ON b.id = e.branch_id
GROUP BY b.id, b.name;
```

### Get License Status Summary
```sql
SELECT 
  status,
  COUNT(*) as count
FROM license_status
WHERE company_id = '<company-id>'
GROUP BY status;
```

### Get Upcoming Calendar Events
```sql
SELECT *
FROM calendar_events
WHERE company_id = '<company-id>'
  AND event_date >= CURRENT_DATE
ORDER BY event_date
LIMIT 10;
```

### Get Custom Form Data
```sql
SELECT 
  dtm.display_name,
  COUNT(dtd.id) as record_count
FROM dynamic_tables_metadata dtm
LEFT JOIN dynamic_table_data dtd ON dtm.id = dtd.table_metadata_id
WHERE dtm.company_id = '<company-id>'
GROUP BY dtm.id, dtm.display_name;
```

### Get Pending Compliance Submissions
```sql
SELECT *
FROM compliance_submissions
WHERE company_id = '<company-id>'
  AND status = 'pending'
ORDER BY submission_month;
```

---

## Data Types

### Supported Field Types in dynamic_tables_metadata
- **text** - VARCHAR, free text
- **number** - DECIMAL, numeric values
- **date** - DATE, calendar dates
- **boolean** - BOOLEAN, true/false

---

## Best Practices

1. **Always filter by company_id** - Multi-tenant data isolation
2. **Use indexes for frequent queries** - Performance optimization
3. **Keep JSONB data normalized** - Use consistent field names
4. **Set appropriate date ranges** - For leave and compliance queries
5. **Validate status values** - Use predefined statuses only

---

## Backup & Recovery

### Backup Strategy
1. Supabase provides automatic daily backups
2. Access backups through Supabase dashboard
3. Export critical data regularly to CSV

### Recovery
1. Use Supabase's backup restoration feature
2. Or re-run init-database.sql script
3. Sample data will be restored

---

## Performance Considerations

- Indexes on all foreign keys
- JSONB storage for flexible data
- Pagination recommended for large result sets
- Cache frequently accessed data
- Use batch operations for bulk inserts

---

## Security

- Row Level Security (RLS) can be enabled per table
- All queries use parameterized statements
- Company-scoped data access
- Sensitive data encrypted at rest by Supabase

---

## Maintenance

### Regular Tasks
- Monitor table sizes
- Check index usage
- Backup data regularly
- Review and archive old records
- Update employee status for inactive users

### Cleanup Queries
```sql
-- Archive old calendar events (older than 1 year)
DELETE FROM calendar_events
WHERE event_date < CURRENT_DATE - INTERVAL '1 year';

-- Remove expired licenses
DELETE FROM license_status
WHERE expiry_date < CURRENT_DATE;
```

---

## Future Enhancements

1. Add audit logs table
2. Implement employee status history
3. Add salary revision tracking
4. Create performance review table
5. Add attendance tracking
6. Implement shift management
7. Add holiday calendar management
8. Create policy document storage

---

This schema is designed to be:
- ✅ Scalable for growth
- ✅ Flexible for custom needs
- ✅ Secure with proper relationships
- ✅ Performant with proper indexing
- ✅ Extensible for future features
