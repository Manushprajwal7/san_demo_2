export interface FormTemplate {
  id: string;
  name: string;
  description: string;
  fields: FormField[];
}

export interface FormField {
  id: string;
  label: string;
  type: 'text' | 'number' | 'date' | 'select' | 'textarea' | 'checkbox';
  required?: boolean;
  options?: string[];
  placeholder?: string;
  validation?: {
    min?: number;
    max?: number;
    pattern?: string;
  };
}

export const SHOP_ESTABLISHMENT_FORMS: Record<string, FormTemplate> = {
  '1': {
    id: '1',
    name: 'Form 1 - Registration Application',
    description: 'Application for registration under Shop and Establishment Act',
    fields: [
      {
        id: 'establishment_name',
        label: 'Name of Establishment',
        type: 'text',
        required: true,
        placeholder: 'Enter establishment name'
      },
      {
        id: 'address',
        label: 'Complete Address',
        type: 'textarea',
        required: true,
        placeholder: 'Enter complete address'
      },
      {
        id: 'owner_name',
        label: 'Owner/Manager Name',
        type: 'text',
        required: true,
        placeholder: 'Enter owner or manager name'
      },
      {
        id: 'contact_number',
        label: 'Contact Number',
        type: 'text',
        required: true,
        placeholder: 'Enter contact number'
      },
      {
        id: 'email',
        label: 'Email Address',
        type: 'text',
        placeholder: 'Enter email address'
      },
      {
        id: 'nature_of_business',
        label: 'Nature of Business',
        type: 'select',
        required: true,
        options: [
          'Retail Trade',
          'Wholesale Trade',
          'Service',
          'Manufacturing',
          'Food Service',
          'Other'
        ]
      },
      {
        id: 'number_of_employees',
        label: 'Number of Employees',
        type: 'number',
        required: true,
        validation: { min: 1 }
      },
      {
        id: 'date_of_commencement',
        label: 'Date of Commencement',
        type: 'date',
        required: true
      }
    ]
  },
  '2': {
    id: '2',
    name: 'Form 2 - Renewal Application',
    description: 'Application for renewal of registration',
    fields: [
      {
        id: 'registration_number',
        label: 'Registration Number',
        type: 'text',
        required: true,
        placeholder: 'Enter existing registration number'
      },
      {
        id: 'date_of_issue',
        label: 'Date of Issue',
        type: 'date',
        required: true
      },
      {
        id: 'period_of_renewal',
        label: 'Period of Renewal',
        type: 'select',
        required: true,
        options: ['1 Year', '2 Years', '3 Years', '5 Years']
      },
      {
        id: 'current_employees',
        label: 'Current Number of Employees',
        type: 'number',
        required: true,
        validation: { min: 1 }
      },
      {
        id: 'changes_in_business',
        label: 'Any Changes in Business',
        type: 'textarea',
        placeholder: 'Describe any changes in business operations'
      }
    ]
  },
  '4': {
    id: '4',
    name: 'Form 4 - Employee Register',
    description: 'Register of employees maintained at establishment',
    fields: [
      {
        id: 'employee_name',
        label: 'Employee Name',
        type: 'text',
        required: true
      },
      {
        id: 'father_husband_name',
        label: 'Father/Husband Name',
        type: 'text',
        required: true
      },
      {
        id: 'date_of_birth',
        label: 'Date of Birth',
        type: 'date',
        required: true
      },
      {
        id: 'date_of_appointment',
        label: 'Date of Appointment',
        type: 'date',
        required: true
      },
      {
        id: 'designation',
        label: 'Designation',
        type: 'text',
        required: true
      },
      {
        id: 'wages_per_month',
        label: 'Wages per Month',
        type: 'number',
        required: true
      },
      {
        id: 'working_hours',
        label: 'Working Hours',
        type: 'text',
        placeholder: 'e.g., 9 AM to 6 PM'
      },
      {
        id: 'weekly_off',
        label: 'Weekly Off',
        type: 'select',
        options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      }
    ]
  },
  '5': {
    id: '5',
    name: 'Form 5 - Leave Register',
    description: 'Register of leave taken by employees',
    fields: [
      {
        id: 'employee_name',
        label: 'Employee Name',
        type: 'text',
        required: true
      },
      {
        id: 'leave_type',
        label: 'Type of Leave',
        type: 'select',
        required: true,
        options: ['Casual Leave', 'Sick Leave', 'Earned Leave', 'Maternity Leave', 'Other']
      },
      {
        id: 'from_date',
        label: 'From Date',
        type: 'date',
        required: true
      },
      {
        id: 'to_date',
        label: 'To Date',
        type: 'date',
        required: true
      },
      {
        id: 'number_of_days',
        label: 'Number of Days',
        type: 'number',
        required: true
      },
      {
        id: 'reason',
        label: 'Reason',
        type: 'textarea',
        placeholder: 'Enter reason for leave'
      }
    ]
  },
  '7': {
    id: '7',
    name: 'Form 7 - Notice of Closure',
    description: 'Notice of closure of establishment',
    fields: [
      {
        id: 'closure_date',
        label: 'Proposed Date of Closure',
        type: 'date',
        required: true
      },
      {
        id: 'reason_for_closure',
        label: 'Reason for Closure',
        type: 'select',
        required: true,
        options: [
          'Business Loss',
          'Retirement',
          'Health Issues',
          'Relocation',
          'Other Business',
          'Other'
        ]
      },
      {
        id: 'details_of_employees',
        label: 'Details of Employees',
        type: 'textarea',
        required: true,
        placeholder: 'Provide details of all employees and their settlements'
      },
      {
        id: 'liabilities_settled',
        label: 'All Liabilities Settled',
        type: 'checkbox',
        required: true
      }
    ]
  },
  '8': {
    id: '8',
    name: 'Form 8 - Notice of Change',
    description: 'Notice of change in ownership or management',
    fields: [
      {
        id: 'type_of_change',
        label: 'Type of Change',
        type: 'select',
        required: true,
        options: [
          'Change of Ownership',
          'Change of Management',
          'Change of Address',
          'Change of Business',
          'Other'
        ]
      },
      {
        id: 'effective_date',
        label: 'Effective Date of Change',
        type: 'date',
        required: true
      },
      {
        id: 'previous_owner_details',
        label: 'Previous Owner/Manager Details',
        type: 'textarea',
        required: true
      },
      {
        id: 'new_owner_details',
        label: 'New Owner/Manager Details',
        type: 'textarea',
        required: true
      }
    ]
  },
  'A': {
    id: 'A',
    name: 'Form A - Annual Return',
    description: 'Annual return of establishment',
    fields: [
      {
        id: 'financial_year',
        label: 'Financial Year',
        type: 'text',
        required: true,
        placeholder: 'e.g., 2023-2024'
      },
      {
        id: 'total_employees',
        label: 'Total Employees',
        type: 'number',
        required: true
      },
      {
        id: 'male_employees',
        label: 'Male Employees',
        type: 'number',
        required: true
      },
      {
        id: 'female_employees',
        label: 'Female Employees',
        type: 'number',
        required: true
      },
      {
        id: 'total_wages_paid',
        label: 'Total Wages Paid',
        type: 'number',
        required: true
      },
      {
        id: 'working_days',
        label: 'Number of Working Days',
        type: 'number',
        required: true
      }
    ]
  },
  'B': {
    id: 'B',
    name: 'Form B - Register of Wages',
    description: 'Register showing wages paid to employees',
    fields: [
      {
        id: 'month',
        label: 'Month',
        type: 'select',
        required: true,
        options: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
      },
      {
        id: 'year',
        label: 'Year',
        type: 'number',
        required: true
      },
      {
        id: 'total_wage_bill',
        label: 'Total Wage Bill',
        type: 'number',
        required: true
      },
      {
        id: 'deductions',
        label: 'Total Deductions',
        type: 'number',
        required: true
      },
      {
        id: 'net_wages_paid',
        label: 'Net Wages Paid',
        type: 'number',
        required: true
      }
    ]
  },
  'D': {
    id: 'D',
    name: 'Form D - Register of Holidays',
    description: 'Register of holidays and weekly offs',
    fields: [
      {
        id: 'year',
        label: 'Year',
        type: 'number',
        required: true
      },
      {
        id: 'national_holidays',
        label: 'National Holidays',
        type: 'textarea',
        placeholder: 'List national holidays with dates'
      },
      {
        id: 'festival_holidays',
        label: 'Festival Holidays',
        type: 'textarea',
        placeholder: 'List festival holidays with dates'
      },
      {
        id: 'weekly_off_day',
        label: 'Weekly Off Day',
        type: 'select',
        required: true,
        options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      }
    ]
  },
  'F': {
    id: 'F',
    name: 'Form F - Register of Overtime',
    description: 'Register showing overtime work and wages',
    fields: [
      {
        id: 'month',
        label: 'Month',
        type: 'select',
        required: true,
        options: [
          'January', 'February', 'March', 'April', 'May', 'June',
          'July', 'August', 'September', 'October', 'November', 'December'
        ]
      },
      {
        id: 'total_overtime_hours',
        label: 'Total Overtime Hours',
        type: 'number',
        required: true
      },
      {
        id: 'overtime_rate',
        label: 'Overtime Rate per Hour',
        type: 'number',
        required: true
      },
      {
        id: 'total_overtime_wages',
        label: 'Total Overtime Wages',
        type: 'number',
        required: true
      }
    ]
  },
  'H': {
    id: 'H',
    name: 'Form H - Register of Leave Account',
    description: 'Register showing leave balance of employees',
    fields: [
      {
        id: 'employee_name',
        label: 'Employee Name',
        type: 'text',
        required: true
      },
      {
        id: 'opening_balance_cl',
        label: 'Opening Balance - Casual Leave',
        type: 'number',
        required: true
      },
      {
        id: 'opening_balance_sl',
        label: 'Opening Balance - Sick Leave',
        type: 'number',
        required: true
      },
      {
        id: 'opening_balance_el',
        label: 'Opening Balance - Earned Leave',
        type: 'number',
        required: true
      },
      {
        id: 'leave_taken_cl',
        label: 'Leave Taken - Casual Leave',
        type: 'number',
        required: true
      },
      {
        id: 'leave_taken_sl',
        label: 'Leave Taken - Sick Leave',
        type: 'number',
        required: true
      },
      {
        id: 'leave_taken_el',
        label: 'Leave Taken - Earned Leave',
        type: 'number',
        required: true
      }
    ]
  },
  'P': {
    id: 'P',
    name: 'Form P - Notice of Working Hours',
    description: 'Notice displaying working hours and weekly offs',
    fields: [
      {
        id: 'opening_time',
        label: 'Opening Time',
        type: 'text',
        required: true,
        placeholder: 'e.g., 9:00 AM'
      },
      {
        id: 'closing_time',
        label: 'Closing Time',
        type: 'text',
        required: true,
        placeholder: 'e.g., 6:00 PM'
      },
      {
        id: 'lunch_break',
        label: 'Lunch Break',
        type: 'text',
        required: true,
        placeholder: 'e.g., 1:00 PM to 2:00 PM'
      },
      {
        id: 'weekly_off',
        label: 'Weekly Off',
        type: 'select',
        required: true,
        options: ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday']
      }
    ]
  },
  'Q': {
    id: 'Q',
    name: 'Form Q - Notice of Wages',
    description: 'Notice displaying wage rates and payment dates',
    fields: [
      {
        id: 'payment_date',
        label: 'Wage Payment Date',
        type: 'select',
        required: true,
        options: [
          '1st of every month', '5th of every month', '7th of every month',
          '10th of every month', '15th of every month', 'Last day of month'
        ]
      },
      {
        id: 'minimum_wage_rate',
        label: 'Minimum Wage Rate',
        type: 'number',
        required: true
      },
      {
        id: 'wage_period',
        label: 'Wage Period',
        type: 'select',
        required: true,
        options: ['Monthly', 'Weekly', 'Daily']
      }
    ]
  },
  'R': {
    id: 'R',
    name: 'Form R - Notice of Leave Rules',
    description: 'Notice displaying leave rules and entitlements',
    fields: [
      {
        id: 'casual_leave_per_year',
        label: 'Casual Leave per Year',
        type: 'number',
        required: true
      },
      {
        id: 'sick_leave_per_year',
        label: 'Sick Leave per Year',
        type: 'number',
        required: true
      },
      {
        id: 'earned_leave_per_year',
        label: 'Earned Leave per Year',
        type: 'number',
        required: true
      },
      {
        id: 'maternity_leave',
        label: 'Maternity Leave',
        type: 'number',
        required: true
      },
      {
        id: 'leave_encashment_rules',
        label: 'Leave Encashment Rules',
        type: 'textarea',
        placeholder: 'Describe leave encashment policy'
      }
    ]
  },
  'T': {
    id: 'T',
    name: 'Form T - Certificate of Registration',
    description: 'Certificate of registration issued to establishment',
    fields: [
      {
        id: 'registration_number',
        label: 'Registration Number',
        type: 'text',
        required: true
      },
      {
        id: 'date_of_issue',
        label: 'Date of Issue',
        type: 'date',
        required: true
      },
      {
        id: 'valid_upto',
        label: 'Valid Upto',
        type: 'date',
        required: true
      },
      {
        id: 'inspection_required',
        label: 'Inspection Required',
        type: 'checkbox'
      }
    ]
  }
};
