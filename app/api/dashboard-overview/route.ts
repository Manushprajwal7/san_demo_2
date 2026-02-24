import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { unstable_cache } from "next/cache";
import { withMetrics } from "@/lib/api-metrics";

// Initialize Supabase Client (outside handler to share connection if possible, strictly for service role here)
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

export interface BranchOverview {
  id: string;
  name: string;
  approved_manpower: number;
  current_employees: number;
  utilization: number;
  license_status: "active" | "warning" | "expired";
  license_expiry?: string;
}

export interface OverviewData {
  // KPI Data
  total_branches: number;
  active_branches: number;
  total_employees: number;
  male_count: number;
  female_count: number;
  monthly_payroll: number;
  employer_contributions: number;
  approved_manpower: number;
  current_manpower: number;
  manpower_utilization: number;
  compliance_status: "all_active" | "warning" | "critical";
  licenses_expiring_soon: number;

  // Chart Data
  branch_employee_data: { branch: string; employees: number }[];
  gender_distribution: { name: string; value: number; color: string }[];
  payroll_breakdown: { category: string; amount: number }[];

  // Summary Table
  branch_summary: BranchOverview[];

  // Meta
  last_updated: string;
}

// Cached Data Fetching Function
const getCachedDashboardData = unstable_cache(
  async (stateFilter: string, branchFilter: string) => {
    // 1. Fetch Branches (Parallelize KA and Regular)
    // Only fetch needed columns - using * to avoid missing column errors if schema varies
    const branchCols = "*";

    const [kaBranchesResult, regularBranchesResult] = await Promise.all([
      supabase.from("ka_branches").select(branchCols),
      supabase.from("branches").select("*"), // Fallback table might have different schema, keep * or inspect
    ]);

    let branches: any[] = [];
    if (kaBranchesResult.data && kaBranchesResult.data.length > 0) {
      branches = kaBranchesResult.data;
    } else if (regularBranchesResult.data) {
      branches = regularBranchesResult.data;
    }

    // 2. Apply Filters to Branches (In-Memory is fast for < few thousand rows)
    if (stateFilter && stateFilter !== "all" && stateFilter !== "all-states") {
      const searchState = stateFilter.toLowerCase();
      branches = branches.filter((b: any) => {
        const name = (
          b.name ||
          b.branch ||
          b.branch_name ||
          b.location ||
          ""
        ).toLowerCase();
        const geography = (b.geography || "").toLowerCase();
        const district = (b.district || "").toLowerCase();

        // Simplified state logic (can be expanded if needed to match original exactness)
        if (
          searchState === "karnataka" &&
          (geography.includes("karnataka") ||
            district.includes("bangalore") ||
            district.includes("mysore") ||
            name.includes("(ka)") ||
            name.includes("karnataka") ||
            name.includes("bengaluru"))
        )
          return true;
        if (
          searchState === "tamil-nadu" &&
          (geography.includes("tamil") ||
            name.includes("(tn)") ||
            name.includes("tamil") ||
            name.includes("chennai"))
        )
          return true;
        if (
          searchState === "andhra-pradesh" &&
          (geography.includes("andhra") ||
            name.includes("(ap)") ||
            name.includes("andhra") ||
            name.includes("vijayawada"))
        )
          return true;
        if (
          searchState === "telangana" &&
          (geography.includes("telangana") ||
            name.includes("(ts)") ||
            name.includes("telangana") ||
            name.includes("hyderabad"))
        )
          return true;
        if (
          searchState === "maharashtra" &&
          (geography.includes("maharashtra") ||
            name.includes("(mh)") ||
            name.includes("maharashtra") ||
            name.includes("mumbai") ||
            name.includes("pune"))
        )
          return true;

        return (
          name.includes(searchState.replace(/-/g, " ")) ||
          geography.includes(searchState.replace(/-/g, " "))
        );
      });
    }

    if (branchFilter && branchFilter !== "all") {
      branches = branches.filter((b: any) => b.id === branchFilter);
    }

    // Capture valid branch names for employee filtering
    // Normalize to lowercase for comparison, but keep original for display if needed
    const allowedBranchNames = new Set(
      branches
        .map((b: any) =>
          (
            b.name ||
            b.branch ||
            b.branch_name ||
            b.location ||
            ""
          ).trim(),
        )
        .filter((n: string) => n.length > 0),
    );

    // 3. Fetch Employees (Optimized)
    // We only need specific columns for aggregation, not the whole row.
    // 'branch_name' used for linking, 'gender' for stats, payroll fields for sums.
    const empCols =
      "branch_name, branchname, branch, location, gender, net_amount, net_salary, basic, hra, pf, employer_pf, esic, total_deductions";

    // Construct query
    let empQuery = supabase.from("man_power").select(empCols);

    // Apply database-level filter if we have a reduced set of branches
    // Note: If allowedBranchNames is HUGE, the URL might be too long.
    // If it's "All", we skip this filter and fetch all.
    const isFiltered = stateFilter !== "all" || branchFilter !== "all";

    if (
      isFiltered &&
      allowedBranchNames.size > 0 &&
      allowedBranchNames.size < 100
    ) {
      // If reasonable number of branches, filter in DB
      empQuery = empQuery.in("branch_name", Array.from(allowedBranchNames));
    }

    // Fetch Data in Parallel (Employees, Branch Statuses, Registry)
    const [empResult, branchStatusResult, registryResult] = await Promise.all([
      empQuery,
      supabase.from("branch_status").select("*"),
      supabase.from("notice_tables_registry").select("table_name, display_name"),
    ]);

    let allEmployees: any[] = empResult.data || [];

    // Filter employees in memory if we couldn't filter in DB (e.g. too many branches or fuzzy match needed)
    if (isFiltered && allowedBranchNames.size >= 100) {
      allEmployees = allEmployees.filter((emp: any) => {
        const empBranch = (
          emp.branch_name ||
          emp.branchname ||
          emp.branch ||
          emp.Location ||
          ""
        ).trim();
        return allowedBranchNames.has(empBranch); // Exact match check mostly
      });
    }

    // 4. Handle Registry Tables (Dynamic) - Limit this if possible
    // Only fetch if "All" is selected or if we really need them.
    // For performance, we might want to skip this or optimize it heavily.
    // We'll fetch them but only necessary columns.
    if (registryResult.data && registryResult.data.length > 0) {
      const registryPromises = registryResult.data.map(async (table) => {
        try {
          // Just fetch columns that map to our needs? most dynamic tables might not match schema.
          // We'll fetch all but limit potential impact?
          // Actually, the original code looked for 'branch_name' in them.
          // Let's try to select specific columns if they exist, or * if we must.
          // To be safe and compatible with dynamic schemas, we select * but typically these are small?
          // If they are large, this loop is the bottleneck.
          // We will filter by branch_name if column exists.
          let q = supabase.from(table.table_name).select("*");
          const { data } = await q;
          return (data || []).map((row: any) => ({
            ...row,
            _source_table: table.table_name,
            branch_name: row.branch_name || row.branch || row.location, // Normalize
          }));
        } catch (e) {
          return [];
        }
      });

      const dynamicRows = (await Promise.all(registryPromises)).flat();

      // Filter dynamic rows
      if (isFiltered) {
        const filteredDynamic = dynamicRows.filter((row: any) => {
          const b = (row.branch_name || "").trim();
          return allowedBranchNames.has(b);
        });
        allEmployees = [...allEmployees, ...filteredDynamic];
      } else {
        allEmployees = [...allEmployees, ...dynamicRows];
      }
    }

    // 5. Aggregate Data (In Memory)
    let maleCount = 0;
    let femaleCount = 0;
    let monthlyPayroll = 0;
    let employerContributions = 0;
    let basicTotal = 0;
    let hraTotal = 0;
    let pfTotal = 0;
    let deductionsTotal = 0;
    let totalEmployees = allEmployees.length;

    const branchEmployeeCounts: Record<string, number> = {};

    // Process employees loop once
    for (const emp of allEmployees) {
      // Gender
      const gender = (
        emp.gender ||
        emp.Gender ||
        emp.sex ||
        ""
      )
        .toString()
        .toLowerCase();
      if (gender.startsWith("m")) maleCount++;
      else if (gender.startsWith("f")) femaleCount++;

      // Payroll
      const net =
        parseFloat(
          emp.net_amount || emp.net_salary || emp.net || 0,
        ) || 0;
      const basic =
        parseFloat(emp.basic || emp.basic_salary || 0) || 0;
      const hra =
        parseFloat(emp.hra || emp.house_rent_allowance || 0) || 0;
      const pf = parseFloat(emp.pf || emp.provident_fund || 0) || 0;
      const ded =
        parseFloat(emp.total_deductions || emp.deductions || 0) || 0;
      const empPf = parseFloat(emp.employer_pf || 0) || 0;
      const esic = parseFloat(emp.esic || emp.employer_esic || 0) || 0;

      monthlyPayroll += net;
      employerContributions += empPf + esic;
      basicTotal += basic;
      hraTotal += hra;
      pfTotal += pf;
      deductionsTotal += ded;

      // Branch Counts
      const bName = (
        emp.branch_name ||
        emp.branchname ||
        emp.branch ||
        emp.Location ||
        "Unknown"
      ).trim();
      branchEmployeeCounts[bName] = (branchEmployeeCounts[bName] || 0) + 1;
    }

    // 6. Branch Summary & KPIs
    const branchStatuses = branchStatusResult.data || [];
    let totalBranches = branches.length;

    // If we have no branches but have employees (data inconsistency fallback)
    if (totalBranches === 0 && totalEmployees > 0) {
      totalBranches = Object.keys(branchEmployeeCounts).length;
    }

    let approvedManpower = 0;
    const branchSummary: BranchOverview[] = [];
    const today = new Date();
    const sixMonthsFromNow = new Date();
    sixMonthsFromNow.setMonth(today.getMonth() + 6);

    let licensesExpiringSoon = 0;
    let complianceStatus: "all_active" | "warning" | "critical" = "all_active";

    // Build Branch Summary
    if (branches.length > 0) {
      for (const b of branches) {
        const bName = (b.branch || b.name || b.branch_name || "Branch").trim();
        const approved = parseInt(
          b.approved_manpower || b.sanctioned_strength || 0,
        );
        approvedManpower += approved;

        const current =
          branchEmployeeCounts[bName] ||
          parseInt(b.male || 0) + parseInt(b.female || 0) ||
          parseInt(b.actual_manpower || 0);

        const utilization =
          approved > 0 ? Math.round((current / approved) * 100) : 0;

        // License Status
        let licenseStatus: "active" | "warning" | "expired" = "active";
        let licenseExpiry: string | undefined;

        let expiryDateStr = b.renewed_upto || b.valid_upto || b.expiry_date;
        if (!expiryDateStr) {
          const statusRecord = branchStatuses.find(
            (s: any) =>
              s.branch_id === b.id ||
              s.branch_name === bName ||
              s.branch === bName,
          );
          if (statusRecord)
            expiryDateStr = statusRecord.renewed_upto || statusRecord.valid_upto;
        }

        if (expiryDateStr) {
          const exp = new Date(expiryDateStr);
          if (!isNaN(exp.getTime())) {
            licenseExpiry = exp.toISOString().split("T")[0];
            if (exp < today) {
              licenseStatus = "expired";
              licensesExpiringSoon++;
              complianceStatus = "critical";
            } else if (exp < sixMonthsFromNow) {
              licenseStatus = "warning";
              licensesExpiringSoon++;
              if (complianceStatus !== "critical") complianceStatus = "warning";
            }
          }
        }

        branchSummary.push({
          id: b.id || bName,
          name: bName,
          approved_manpower: approved,
          current_employees: current,
          utilization,
          license_status: licenseStatus,
          license_expiry: licenseExpiry,
        });
      }
    } else {
      // Fallback from calculated counts
      Object.entries(branchEmployeeCounts).forEach(([bName, count], i) => {
        branchSummary.push({
          id: `gen-${i}`,
          name: bName,
          approved_manpower: 0,
          current_employees: count,
          utilization: 0,
          license_status: "active",
        });
      });
    }

    // Sort summary by employee count
    branchSummary.sort((a, b) => b.current_employees - a.current_employees);

    // Chart Data Construction
    const branchEmployeeData = branchSummary.map((b) => ({
      branch: b.name,
      employees: b.current_employees,
    }));
    const genderDistribution = [
      { name: "Male", value: maleCount, color: "#3b82f6" },
      { name: "Female", value: femaleCount, color: "#ec4899" },
    ];
    const payrollBreakdown = [
      {
        category: "Basic",
        amount: Math.round(basicTotal || monthlyPayroll * 0.5),
      },
      {
        category: "HRA",
        amount: Math.round(hraTotal || monthlyPayroll * 0.2),
      },
      {
        category: "PF",
        amount: Math.round(pfTotal || monthlyPayroll * 0.12),
      },
      {
        category: "Deductions",
        amount: Math.round(deductionsTotal || monthlyPayroll * 0.08),
      },
      { category: "Net", amount: Math.round(monthlyPayroll) },
    ];

    const currentManpower = totalEmployees;
    const manpowerUtilization =
      approvedManpower > 0
        ? Math.round((currentManpower / approvedManpower) * 100)
        : 0;

    const overviewData: OverviewData = {
      total_branches: totalBranches,
      active_branches: totalBranches, // Assuming all active for now
      total_employees: totalEmployees,
      male_count: maleCount,
      female_count: femaleCount,
      monthly_payroll: Math.round(monthlyPayroll),
      employer_contributions: Math.round(employerContributions),
      approved_manpower: approvedManpower,
      current_manpower: currentManpower,
      manpower_utilization: manpowerUtilization,
      compliance_status: complianceStatus,
      licenses_expiring_soon: licensesExpiringSoon,
      branch_employee_data: branchEmployeeData,
      gender_distribution: genderDistribution,
      payroll_breakdown: payrollBreakdown,
      branch_summary: branchSummary,
      last_updated: new Date().toISOString(),
    };

    return overviewData;
  },
  ["dashboard-overview-data"], // Cache key
  { revalidate: 60, tags: ["dashboard"] }, // Revalidate every 60 seconds
);

export const GET = withMetrics('/api/dashboard-overview', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);

    // Filter parameters
    const stateFilter = searchParams.get("state") || "all";
    const branchFilter = searchParams.get("branch") || "all";

    // Call cached function
    const data = await getCachedDashboardData(stateFilter, branchFilter);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Dashboard overview API error:", error);
    return NextResponse.json(
      {
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error",
      },
      { status: 500 },
    );
  }
});
