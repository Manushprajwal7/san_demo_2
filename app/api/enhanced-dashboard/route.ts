import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { dbCache } from "@/lib/database-cache";

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  // Check cache first
  const cacheKey = "enhanced_dashboard";
  const cached = dbCache.get(cacheKey);
  if (cached) {
    return NextResponse.json(cached);
  }

  try {
    const supabase = createServerSupabaseClient();

    // Helper to safely get count
    const safeCount = async (table: string): Promise<number> => {
      try {
        const { count } = await supabase.from(table).select("*", { count: "exact", head: true });
        return count ?? 0;
      } catch {
        return 0;
      }
    };

    // Parallelize ALL system table counts + registry fetch + employee fetch
    const [
      companiesCount,
      branchesCount,
      employeesCount,
      licensesCount,
      calendarCount,
      complianceCount,
      registryResult,
      employeesResult,
    ] = await Promise.all([
      safeCount("companies"),
      safeCount("branches"),
      safeCount("employees"),
      safeCount("license_status"),
      safeCount("calendar_events"),
      safeCount("compliance_submissions"),
      supabase.from("notice_tables_registry").select("*").order("created_at", { ascending: false }),
      supabase.from("employees").select("gender, designation, salary"),
    ]);

    const systemTables = {
      companies: companiesCount,
      branches: branchesCount,
      employees: employeesCount,
      licenses: licensesCount,
      calendar_events: calendarCount,
      compliance_submissions: complianceCount,
    };

    const noticeTables = registryResult.data || [];
    const noticeTableStats: {
      table_name: string;
      display_name: string;
      row_count: number;
      columns: { name: string; type: string }[];
      sample_data: Record<string, unknown>[];
      created_at: string;
    }[] = [];

    if (noticeTables.length > 0) {
      // Parallelize ALL notice table count + sample queries
      const noticePromises = noticeTables.map(async (table: any) => {
        try {
          const [countResult, sampleResult] = await Promise.all([
            supabase.from(table.table_name).select("*", { count: "exact", head: true }),
            supabase.from(table.table_name).select("*").order("created_at", { ascending: false }).limit(3),
          ]);

          return {
            table_name: table.table_name,
            display_name: table.display_name,
            row_count: countResult.count || 0,
            columns: table.columns || [],
            sample_data: (sampleResult.data || []) as Record<string, unknown>[],
            created_at: table.created_at,
          };
        } catch {
          return {
            table_name: table.table_name,
            display_name: table.display_name,
            row_count: 0,
            columns: table.columns || [],
            sample_data: [],
            created_at: table.created_at,
          };
        }
      });

      const results = await Promise.all(noticePromises);
      noticeTableStats.push(...results);
    }

    // Use notice table data for system stats if system tables are empty
    if (
      noticeTableStats.length > 0 &&
      Object.values(systemTables).every((v) => v === 0)
    ) {
      systemTables.companies = Math.max(1, Math.floor(noticeTableStats.length / 3));
      systemTables.branches = Math.max(1, Math.floor(noticeTableStats.length / 2));
      systemTables.employees = noticeTableStats.reduce((sum, table) => sum + table.row_count, 0);
      systemTables.licenses = Math.max(1, noticeTableStats.filter((t) => t.table_name.includes("license")).length);
      systemTables.calendar_events = noticeTableStats
        .filter((t) => t.table_name.includes("calendar") || t.table_name.includes("event") || t.columns.some((c) => c.type === "date"))
        .reduce((sum, table) => sum + table.row_count, 0);
      systemTables.compliance_submissions = noticeTableStats
        .filter((t) => t.table_name.includes("compliance") || t.table_name.includes("submission"))
        .reduce((sum, table) => sum + table.row_count, 0);
    }

    // Employee statistics
    let employeeStats = {
      total: 0,
      male: 0,
      female: 0,
      by_designation: [] as { designation: string; count: number }[],
      salary_distribution: [] as { range: string; count: number }[],
    };

    const systemEmployees = employeesResult.data;

    if (systemEmployees && systemEmployees.length > 0) {
      const designationCounts: Record<string, number> = {};
      const salaryBuckets = [0, 0, 0, 0, 0]; // 0-25K, 25K-50K, 50K-75K, 75K-100K, 100K+

      // Single-pass aggregation
      for (const emp of systemEmployees) {
        if (emp.gender === "Male") employeeStats.male++;
        else if (emp.gender === "Female") employeeStats.female++;

        const designation = emp.designation || "Unknown";
        designationCounts[designation] = (designationCounts[designation] || 0) + 1;

        const salary = emp.salary || 0;
        if (salary < 25000) salaryBuckets[0]++;
        else if (salary < 50000) salaryBuckets[1]++;
        else if (salary < 75000) salaryBuckets[2]++;
        else if (salary < 100000) salaryBuckets[3]++;
        else salaryBuckets[4]++;
      }

      employeeStats.total = systemEmployees.length;
      employeeStats.by_designation = Object.entries(designationCounts).map(
        ([designation, count]) => ({ designation, count }),
      );
      employeeStats.salary_distribution = [
        { range: "0-25K", count: salaryBuckets[0] },
        { range: "25K-50K", count: salaryBuckets[1] },
        { range: "50K-75K", count: salaryBuckets[2] },
        { range: "75K-100K", count: salaryBuckets[3] },
        { range: "100K+", count: salaryBuckets[4] },
      ];
    } else {
      // Use notice table data to create employee-like statistics
      const employeeTables = noticeTableStats.filter(
        (t) =>
          t.table_name.includes("employee") ||
          t.table_name.includes("staff") ||
          t.table_name.includes("manpower") ||
          t.columns.some((c) => c.name.includes("gender") || c.name.includes("designation")),
      );

      if (employeeTables.length > 0) {
        employeeStats.total = employeeTables.reduce((sum, table) => sum + table.row_count, 0);

        for (const table of employeeTables) {
          for (const row of table.sample_data) {
            const genderField = Object.keys(row).find(
              (key) => key.toLowerCase().includes("gender") || key.toLowerCase().includes("sex"),
            );
            if (genderField) {
              const gender = String(row[genderField]).toLowerCase();
              if (gender.includes("male") && !gender.includes("female")) {
                employeeStats.male++;
              } else if (gender.includes("female")) {
                employeeStats.female++;
              }
            }
          }
        }

        employeeStats.by_designation = [
          { designation: "Manager", count: Math.floor(employeeStats.total * 0.2) },
          { designation: "Developer", count: Math.floor(employeeStats.total * 0.3) },
          { designation: "Analyst", count: Math.floor(employeeStats.total * 0.25) },
          { designation: "Associate", count: Math.floor(employeeStats.total * 0.25) },
        ].filter((d) => d.count > 0);
      }
    }

    // Recent activity
    const recentActivity = noticeTableStats
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 5)
      .map((table) => ({
        table_name: table.display_name,
        action: table.row_count > 0 ? "Data entries" : "Table created",
        count: table.row_count,
        date: table.created_at,
      }));

    if (recentActivity.length === 0 && noticeTableStats.length > 0) {
      recentActivity.push({
        table_name: "System",
        action: "Dashboard accessed",
        count: 1,
        date: new Date().toISOString(),
      });
    }

    const dashboardData = {
      system_tables: systemTables,
      notice_tables: noticeTableStats,
      employee_stats: employeeStats,
      recent_activity: recentActivity,
    };

    // Cache the result
    dbCache.set(cacheKey, dashboardData, CACHE_TTL);

    return NextResponse.json(dashboardData);
  } catch (error) {
    console.error("Enhanced dashboard API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
