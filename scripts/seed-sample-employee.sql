-- Sample Employee Data for Testing Form Generator
-- This creates a test employee with all common fields populated

-- Note: Adjust table name and columns based on your actual schema
-- This is a template - modify column names to match your database

-- Example for a typical employees table
INSERT INTO employees (
  empname,
  designation_name,
  present_res_no,
  date_of_birth,
  aadhar_no,
  father_name,
  mother_name,
  gender,
  marital_status,
  blood_group,
  email,
  phone,
  emergency_contact,
  permanent_address,
  present_address,
  city,
  state,
  pincode,
  joining_date,
  department,
  employee_code,
  pan_no,
  uan_no,
  esic_no,
  bank_name,
  bank_account_no,
  ifsc_code,
  qualification,
  experience_years,
  previous_employer,
  salary,
  status
) VALUES (
  'Rajesh Kumar',
  'Senior Manager',
  'Flat 301, Green Valley Apartments, MG Road',
  '1985-06-15',
  '123456789012',
  'Suresh Kumar',
  'Lakshmi Devi',
  'Male',
  'Married',
  'O+',
  'rajesh.kumar@company.com',
  '+91-9876543210',
  '+91-9876543211',
  'House No. 45, Village Rampur, District Meerut, UP - 250001',
  'Flat 301, Green Valley Apartments, MG Road, Bangalore - 560001',
  'Bangalore',
  'Karnataka',
  '560001',
  '2015-03-01',
  'Operations',
  'EMP001',
  'ABCDE1234F',
  '123456789012',
  '1234567890',
  'State Bank of India',
  '12345678901234',
  'SBIN0001234',
  'MBA in Operations Management',
  '12',
  'ABC Corporation Ltd',
  '85000',
  'Active'
);

-- Add more sample employees if needed
INSERT INTO employees (
  empname,
  designation_name,
  present_res_no,
  date_of_birth,
  aadhar_no,
  department,
  employee_code,
  email,
  phone,
  status
) VALUES 
(
  'Priya Sharma',
  'HR Executive',
  'Apartment 205, Sunrise Complex',
  '1990-08-22',
  '987654321098',
  'Human Resources',
  'EMP002',
  'priya.sharma@company.com',
  '+91-9876543220',
  'Active'
),
(
  'Amit Patel',
  'Software Engineer',
  'House 12, Tech Park Road',
  '1992-03-10',
  '456789012345',
  'IT',
  'EMP003',
  'amit.patel@company.com',
  '+91-9876543230',
  'Active'
);

-- Verify the data
SELECT 
  empname,
  designation_name,
  employee_code,
  department,
  status
FROM employees
ORDER BY employee_code;

-- Check column names in your table
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'employees'
ORDER BY ordinal_position;
