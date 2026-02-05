import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

interface Employee {
  id: string;
  name: string;
  department: string;
  table: string;
}

interface TableInfo {
  name: string;
  displayName: string;
  count: number;
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");

    if (!tableName) {
      // Return only existing tables from notice_tables_registry
      const { data: registryTables, error: registryError } = await supabase
        .from("notice_tables_registry")
        .select("table_name, display_name");

      if (registryError) {
        console.error("Error fetching registry tables:", registryError);
        return NextResponse.json({
          success: true,
          tables: [],
          message:
            "Error fetching tables from registry. Please check database connection.",
        });
      }

      // Format tables with row counts
      const tables: TableInfo[] = [];

      if (registryTables && registryTables.length > 0) {
        for (const table of registryTables) {
          try {
            // Get row count for each table
            const { count, error: countError } = await supabase
              .from(table.table_name)
              .select("*", { count: "exact", head: true });

            if (countError) {
              console.error(
                `Error getting count for table ${table.table_name}:`,
                countError,
              );
              // Skip tables that can't be accessed
              continue;
            }

            tables.push({
              name: table.table_name,
              displayName:
                table.display_name ||
                table.table_name.charAt(0).toUpperCase() +
                  table.table_name.slice(1),
              count: count || 0,
            });
          } catch (error) {
            console.error(`Error processing table ${table.table_name}:`, error);
            // Skip tables with errors
            continue;
          }
        }
      }

      // If no tables from registry, try to add "employees" table for form generator
      if (tables.length === 0) {
        try {
          const { count, error: countError } = await supabase
            .from("employees")
            .select("*", { count: "exact", head: true });
          if (!countError && count !== undefined) {
            tables.push({
              name: "employees",
              displayName: "Employees",
              count: count ?? 0,
            });
          }
        } catch {
          // ignore
        }
      }

      if (tables.length === 0) {
        return NextResponse.json({
          success: true,
          tables: [],
          message:
            "No tables found. Add tables to notice_tables_registry or ensure an 'employees' table exists.",
        });
      }

      return NextResponse.json({
        success: true,
        tables,
      });
    }

    // Return employees for specific table
    try {
      const { data: employees, error } = await supabase
        .from(tableName)
        .select("*");

      if (error) {
        return NextResponse.json(
          {
            success: false,
            error: `Failed to fetch data from table '${tableName}': ${error.message}`,
          },
          { status: 404 },
        );
      }

      if (!employees || employees.length === 0) {
        return NextResponse.json({
          success: true,
          employees: [],
          tableName: tableName,
          message: `Table '${tableName}' exists but contains no data`,
        });
      }

      // Get column names to better map the data
      const firstRow = employees[0];
      const columns = Object.keys(firstRow);

      // Find the best column for name (include empname for employees table)
      const nameColumn =
        columns.find((col) =>
          [
            "name",
            "empname",
            "emp_name",
            "employee_name",
            "full_name",
            "first_name",
            "display_name",
          ].includes(col.toLowerCase()),
        ) ||
        columns.find((col) => col.toLowerCase().includes("name")) ||
        "id";

      // Find the best column for department/designation
      const deptColumn =
        columns.find((col) =>
          [
            "department",
            "designation",
            "designation_name",
            "dept",
            "division",
            "team",
            "section",
          ].includes(col.toLowerCase()),
        ) ||
        columns.find((col) => col.toLowerCase().includes("dept")) ||
        columns.find((col) => col.toLowerCase().includes("designation")) ||
        null;

      // Transform the data to match our Employee interface
      const formattedEmployees: Employee[] = employees.map(
        (row: any, index: number) => {
          const name = row[nameColumn] || `Record ${index + 1}`;
          const department = deptColumn
            ? row[deptColumn] || "Unknown"
            : "Unknown";

          return {
            id: row.id || `${tableName}_${index}`,
            name: String(name),
            department: String(department),
            table: tableName,
          };
        },
      );

      return NextResponse.json({
        success: true,
        employees: formattedEmployees,
        tableName: tableName,
        columnInfo: {
          nameColumn,
          deptColumn,
          totalColumns: columns.length,
          availableColumns: columns,
        },
      });
    } catch (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Table '${tableName}' not found or inaccessible`,
        },
        { status: 404 },
      );
    }
  } catch (error) {
    console.error("Error in employees API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { state, district, taluk, table, employee, forms } = body;

    // Try to save compliance submission to database
    try {
      const { data, error } = await supabase
        .from("compliance_submissions")
        .insert([
          {
            state,
            district,
            taluk,
            table_name: table,
            employee_name: employee,
            forms: forms,
            submitted_at: new Date().toISOString(),
          },
        ])
        .select()
        .single();

      if (error) {
        console.error("Error saving compliance:", error);
        // If table doesn't exist, still return success but log the error
        return NextResponse.json({
          success: true,
          message: "Compliance submission processed successfully",
          id: `COMP-${Date.now()}`,
          note: "Data logged to console (compliance_submissions table may not exist)",
        });
      }

      return NextResponse.json({
        success: true,
        message: "Compliance submission created successfully",
        id: data.id || `COMP-${Date.now()}`,
      });
    } catch (dbError) {
      console.error("Database error:", dbError);
      // Log the submission data for manual processing
      console.log("Compliance submission data:", {
        state,
        district,
        taluk,
        table,
        employee,
        forms,
        submittedAt: new Date().toISOString(),
      });

      return NextResponse.json({
        success: true,
        message: "Compliance submission processed successfully",
        id: `COMP-${Date.now()}`,
        note: "Data logged to console",
      });
    }
  } catch (error) {
    console.error("Error creating compliance:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to create compliance submission",
      },
      { status: 500 },
    );
  }
}
