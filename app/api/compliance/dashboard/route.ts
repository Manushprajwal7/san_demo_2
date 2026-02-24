import { NextResponse } from 'next/server';
import { createServerSupabaseClient } from '@/lib/supabase';
import { getRegisteredFormIds } from '@/lib/compliance-form-registry';
import { dbCache } from '@/lib/database-cache';

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

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET() {
  try {
    // Check cache
    const cacheKey = 'compliance_dashboard';
    const cached = dbCache.get<ComplianceDashboardData>(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = createServerSupabaseClient();
    const formIds = getRegisteredFormIds();
    const formsCount = formIds.filter((id) => id !== 'first_page').length;

    // Parallelize branch count and submissions fetch
    const [kaBranchesResult, branchesResult, submissionsResult] = await Promise.all([
      supabase.from('ka_branches').select('*', { count: 'exact', head: true }),
      supabase.from('branches').select('*', { count: 'exact', head: true }),
      supabase
        .from('compliance_submissions')
        .select('id, state, district, branch, act, forms, submitted_at, status, company_id, created_at')
        .order('submitted_at', { ascending: false })
        .limit(200),
    ]);

    const branchesCount = kaBranchesResult.count ?? branchesResult.count ?? 0;

    let submissions: ComplianceSubmissionRow[] = [];
    if (!submissionsResult.error && submissionsResult.data) {
      submissions = Array.isArray(submissionsResult.data) ? submissionsResult.data : [];
    }

    // Single-pass status aggregation
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

    dbCache.set(cacheKey, payload, CACHE_TTL);

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
