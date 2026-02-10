import { NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { getRegisteredFormIds } from '@/lib/compliance-form-registry';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

const COMPLIANCE_ACT_IDS = [
  'shop_establishment',
  'bocw',
  'minimum_wage',
  'payment_of_wage',
  'payment_of_gratuity',
  'child_labour',
  'provident_fund',
  'employee_insurance',
  'professional_tax',
  'income_tax',
];

export const COMPLIANCE_ACT_NAMES: Record<string, string> = {
  shop_establishment: 'Shop and Establishment Act',
  bocw: 'BOCW',
  minimum_wage: 'Minimum Wage',
  payment_of_wage: 'Payment of Wage',
  payment_of_gratuity: 'Payment of Gratuity',
  child_labour: 'Child Labour Act',
  provident_fund: 'Provident Fund',
  employee_insurance: 'Employee Insurance',
  professional_tax: 'Professional Tax',
  income_tax: 'Income Tax',
};

export interface ComplianceSubmissionRow {
  id: string;
  state?: string;
  district?: string;
  branch?: string;
  act?: string;
  forms?: string[];
  submitted_at?: string;
  status?: string;
  company_id?: number;
  created_at?: string;
}

export interface ComplianceDashboardData {
  totalSubmissions: number;
  byStatus: Record<string, number>;
  formsCount: number;
  actsCount: number;
  branchesCount: number;
  actNames: Record<string, string>;
  recentActivity: ComplianceSubmissionRow[];
  submissions: ComplianceSubmissionRow[];
}

export async function GET() {
  try {
    const formIds = getRegisteredFormIds();
    const formsCount = formIds.filter((id) => id !== 'first_page').length;

    let branchesCount = 0;
    const { count: kaCount } = await supabase
      .from('ka_branches')
      .select('*', { count: 'exact', head: true });
    if (kaCount != null) {
      branchesCount = kaCount;
    } else {
      const { count: branchCount } = await supabase
        .from('branches')
        .select('*', { count: 'exact', head: true });
      branchesCount = branchCount ?? 0;
    }

    let submissions: ComplianceSubmissionRow[] = [];
    const { data: rows, error } = await supabase
      .from('compliance_submissions')
      .select('*')
      .order('submitted_at', { ascending: false })
      .limit(200);

    if (!error && rows) {
      submissions = Array.isArray(rows) ? rows : [];
    }

    const byStatus: Record<string, number> = {};
    for (const row of submissions) {
      const s = (row.status ?? 'generated').toLowerCase();
      byStatus[s] = (byStatus[s] ?? 0) + 1;
    }

    const recentActivity = submissions.slice(0, 15);

    const payload: ComplianceDashboardData = {
      totalSubmissions: submissions.length,
      byStatus,
      formsCount,
      actsCount: COMPLIANCE_ACT_IDS.length,
      branchesCount,
      actNames: COMPLIANCE_ACT_NAMES,
      recentActivity,
      submissions,
    };

    return NextResponse.json(payload);
  } catch (e) {
    console.error('Compliance dashboard API error:', e);
    return NextResponse.json(
      {
        totalSubmissions: 0,
        byStatus: {},
        formsCount: 0,
        actsCount: COMPLIANCE_ACT_IDS.length,
        branchesCount: 0,
        actNames: COMPLIANCE_ACT_NAMES,
        recentActivity: [],
        submissions: [],
        error: e instanceof Error ? e.message : 'Failed to load dashboard',
      },
      { status: 500 }
    );
  }
}
