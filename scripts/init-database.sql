-- Companies table
CREATE TABLE IF NOT EXISTS companies (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL UNIQUE,
  code VARCHAR(50) NOT NULL UNIQUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Branches table
CREATE TABLE IF NOT EXISTS branches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  approved_manpower INT DEFAULT 0,
  actual_manpower INT DEFAULT 0,
  total_salary DECIMAL(15,2) DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Employees table
CREATE TABLE IF NOT EXISTS employees (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID NOT NULL REFERENCES branches(id) ON DELETE CASCADE,
  email VARCHAR(255) NOT NULL,
  name VARCHAR(255) NOT NULL,
  gender VARCHAR(50),
  salary DECIMAL(15,2),
  designation VARCHAR(255),
  join_date DATE,
  status VARCHAR(50) DEFAULT 'active',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave types table
CREATE TABLE IF NOT EXISTS leave_types (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  name VARCHAR(100) NOT NULL,
  total_days INT DEFAULT 0,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Leave records table
CREATE TABLE IF NOT EXISTS leave_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  employee_id UUID NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
  leave_type_id UUID NOT NULL REFERENCES leave_types(id) ON DELETE CASCADE,
  from_date DATE NOT NULL,
  to_date DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  reason TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Calendar events table
CREATE TABLE IF NOT EXISTS calendar_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID,
  title VARCHAR(255) NOT NULL,
  description TEXT,
  event_date DATE NOT NULL,
  event_type VARCHAR(100),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic tables metadata
CREATE TABLE IF NOT EXISTS dynamic_tables_metadata (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  table_name VARCHAR(255) NOT NULL,
  display_name VARCHAR(255) NOT NULL,
  fields JSONB NOT NULL,
  actual_table_name VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dynamic table data (stores data for user-created tables)
CREATE TABLE IF NOT EXISTS dynamic_table_data (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  table_metadata_id UUID NOT NULL REFERENCES dynamic_tables_metadata(id) ON DELETE CASCADE,
  data JSONB NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Compliance submissions table
CREATE TABLE IF NOT EXISTS compliance_submissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  branch_id UUID,
  compliance_type VARCHAR(100) NOT NULL,
  submission_month DATE NOT NULL,
  status VARCHAR(50) DEFAULT 'pending',
  document_url VARCHAR(500),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- License status table
CREATE TABLE IF NOT EXISTS license_status (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
  license_type VARCHAR(100) NOT NULL,
  expiry_date DATE,
  status VARCHAR(50),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Insert sample data for Sangeetha Mobiles
INSERT INTO companies (name, code) VALUES 
  ('Sangeetha Mobiles', 'SANGEETHA'),
  ('AMPL', 'AMPL'),
  ('Demo Company', 'DEMO')
ON CONFLICT (code) DO NOTHING;

-- Insert sample branches
INSERT INTO branches (company_id, name, location, approved_manpower, actual_manpower, total_salary)
SELECT id, 'Main Branch - Chennai', 'Chennai', 50, 45, 2250000 FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'North Branch - Delhi', 'Delhi', 30, 28, 1400000 FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'South Branch - Bangalore', 'Bangalore', 40, 38, 1900000 FROM companies WHERE code = 'SANGEETHA'
ON CONFLICT DO NOTHING;

-- Insert sample leave types
INSERT INTO leave_types (company_id, name, total_days)
SELECT id, 'Annual Leave', 20 FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'Casual Leave', 12 FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'Sick Leave', 10 FROM companies WHERE code = 'SANGEETHA'
ON CONFLICT DO NOTHING;

-- Insert sample license status
INSERT INTO license_status (company_id, license_type, expiry_date, status)
SELECT id, 'PF License', CURRENT_DATE + INTERVAL '180 days', 'Active' FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'ESIC License', CURRENT_DATE + INTERVAL '90 days', 'Expiring Soon' FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'PT License', CURRENT_DATE - INTERVAL '10 days', 'Expired' FROM companies WHERE code = 'SANGEETHA'
ON CONFLICT DO NOTHING;

-- Insert sample calendar events
INSERT INTO calendar_events (company_id, title, description, event_date, event_type)
SELECT id, 'Diwali Holiday', 'Diwali Celebration - Office Closed', CURRENT_DATE + INTERVAL '30 days', 'Holiday' FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'New Year Holiday', 'New Year Celebration - Office Closed', CURRENT_DATE + INTERVAL '365 days', 'Holiday' FROM companies WHERE code = 'SANGEETHA'
UNION ALL
SELECT id, 'Team Building Event', 'Annual Team Building Activity', CURRENT_DATE + INTERVAL '45 days', 'Event' FROM companies WHERE code = 'SANGEETHA'
ON CONFLICT DO NOTHING;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_branches_company ON branches(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_company ON employees(company_id);
CREATE INDEX IF NOT EXISTS idx_employees_branch ON employees(branch_id);
CREATE INDEX IF NOT EXISTS idx_calendar_company ON calendar_events(company_id);
CREATE INDEX IF NOT EXISTS idx_compliance_company ON compliance_submissions(company_id);
CREATE INDEX IF NOT EXISTS idx_license_company ON license_status(company_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_metadata_company ON dynamic_tables_metadata(company_id);
CREATE INDEX IF NOT EXISTS idx_dynamic_data_metadata ON dynamic_table_data(table_metadata_id);
