import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient, createBulkOperationClient } from "@/lib/supabase";
import { dbCache, cacheKeys, invalidateTableCache } from "@/lib/database-cache";
import { Readable } from "stream";
import { pipeline } from "stream/promises";
import { createGunzip, createGzip } from "zlib";
import * as XLSX from "xlsx";

const CHUNK_SIZE = 1000; // Increased chunk size for better performance
const UPLOAD_BATCH_SIZE = 50; // Increased batch size for bulk operations
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes cache

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

// Helper function to process data in chunks
async function* processInChunks<T>(
  data: T[],
  chunkSize: number
): AsyncGenerator<T[]> {
  for (let i = 0; i < data.length; i += chunkSize) {
    yield data.slice(i, i + chunkSize);
  }
}

// Optimized helper function to handle chunked upload with bulk client
export async function handleChunkedUpload(
  tableName: string,
  data: any[],
  onProgress?: (progress: number) => void
) {
  const supabase = createBulkOperationClient();
  const totalChunks = Math.ceil(data.length / CHUNK_SIZE);
  let processed = 0;
  let errors: string[] = [];

  // Process data in larger chunks with bulk client
  for await (const chunk of processInChunks(data, CHUNK_SIZE)) {
    try {
      const { error } = await supabase.from(tableName).insert(chunk);

      if (error) {
        console.error("Error inserting chunk:", error);
        errors.push(`Error inserting chunk: ${error.message}`);
      }

      processed++;
      const progress = Math.round((processed / totalChunks) * 100);
      if (onProgress) onProgress(progress);
    } catch (error) {
      console.error("Error processing chunk:", error);
      errors.push(
        `Error processing chunk: ${
          error instanceof Error ? error.message : "Unknown error"
        }`
      );
    }
  }

  return { success: errors.length === 0, errors };
}

// Optimized function to get table counts with caching
async function getCachedTableCount(supabase: any, tableName: string): Promise<number> {
  const cacheKey = cacheKeys.tableCount(tableName);
  const cached = dbCache.get<number>(cacheKey);
  
  if (cached !== null) {
    return cached;
  }

  try {
    const { count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact", head: true });

    if (error) {
      console.error(`Error counting ${tableName}:`, error);
      return -1;
    }

    const result = count || 0;
    dbCache.set(cacheKey, result, CACHE_DURATION);
    return result;
  } catch (error) {
    console.error(`Error getting count for ${tableName}:`, error);
    return -1;
  }
}

export async function GET(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");
    const chunk = searchParams.get("chunk");
    const chunkSize = parseInt(
      searchParams.get("chunkSize") || CHUNK_SIZE.toString(),
      10
    );
    const offset = parseInt(searchParams.get("offset") ?? "", 10);
    const limit = parseInt(searchParams.get("limit") ?? "", 10);

    if (!tableName) {
      // Check cache first for table registry
      const cacheKey = cacheKeys.tableRegistry();
      const cachedRegistry = dbCache.get(cacheKey);
      
      let registryTables;
      if (cachedRegistry !== null) {
        registryTables = cachedRegistry;
      } else {
        const { data: registryData, error: registryError } = await supabase
          .from("notice_tables_registry")
          .select("table_name, display_name");

        if (registryError) {
          console.error("Error fetching registry tables:", registryError);
          return NextResponse.json(
            {
              success: false,
              error: "Error fetching registry tables",
              tables: [],
            },
            { status: 500 }
          );
        }
        
        registryTables = registryData;
        dbCache.set(cacheKey, registryData, CACHE_DURATION);
      }

      // Format tables with optimized row counts
      const tables: TableInfo[] = [];

      if (registryTables && Array.isArray(registryTables) && registryTables.length > 0) {
        // Parallel count queries for better performance
        const countPromises = registryTables.map(async (table: any) => {
          const count = await getCachedTableCount(supabase, table.table_name);
          return {
            name: table.table_name,
            displayName: table.display_name || table.table_name,
            count,
          };
        });

        const results = await Promise.allSettled(countPromises);
        results.forEach((result: PromiseSettledResult<TableInfo>, index: number) => {
          if (result.status === 'fulfilled') {
            tables.push(result.value);
          } else {
            console.error(`Error processing table ${registryTables[index].table_name}:`, result.reason);
            tables.push({
              name: registryTables[index].table_name,
              displayName: registryTables[index].display_name || registryTables[index].table_name,
              count: -1,
            });
          }
        });
      }

      // If no tables from registry, try to add "employees" table for form generator
      if (tables.length === 0) {
        try {
          const count = await getCachedTableCount(supabase, "employees");
          if (count >= 0) {
            tables.push({
              name: "employees",
              displayName: "Employees",
              count,
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

    // Handle specific table data requests with optimized queries
    let from = 0;
    let to = 999; // Increased default page size for better performance
    let pageSize = 1000;

    if (chunk) {
      const page = parseInt(chunk) || 1;
      from = (page - 1) * chunkSize;
      to = from + chunkSize - 1;
      pageSize = chunkSize;
    } else if (!Number.isNaN(offset) && !Number.isNaN(limit) && limit > 0) {
      from = Math.max(0, offset);
      to = from + limit - 1;
      pageSize = limit;
    }

    // Optimized query with select only necessary columns and better indexing hint
    const { data, count, error } = await supabase
      .from(tableName)
      .select("*", { count: "exact" })
      .range(from, to)
      .order('id', { ascending: true }); // Add ordering for consistent pagination

    if (error) {
      console.error(`Error fetching from ${tableName}:`, error);
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch data: ${error.message}`,
        },
        { status: 500 }
      );
    }

    const totalItems = count ?? (data?.length ?? 0);
    const currentPage = Math.floor(from / pageSize) + 1;

    return NextResponse.json({
      success: true,
      employees: data || [],
      tableName,
      pagination: {
        currentPage,
        totalPages: Math.ceil(totalItems / pageSize),
        totalItems,
        chunkSize: pageSize,
      },
    });
  } catch (error) {
    console.error("Error in employees API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 }
    );
  }
}

interface EmployeeSubmissionData {
  ref_no?: string;
  empname?: string;
  month_name?: string;
  gender?: string;
  date_of_birth?: string;
  date_of_joining?: string;
  department?: string;
  sub_department?: string;
  designation_name?: string;
  title?: string;
  branch_name?: string;
  region?: string;
  father_name?: string;
  location?: string;
  present_res_no?: string;
  present_city?: string;
  present_pincode?: string;
  uan?: string;
  esi_number?: string;
  companyname?: string;
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const contentType = request.headers.get("content-type") || "";

    // Handle file upload or chunked JSON upload
    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      const tableName = formData.get("table") as string;
      const chunkPayload = formData.get("chunk") as string | null;

      // Chunked upload: frontend sends parsed rows as JSON (no file)
      if (chunkPayload && tableName) {
        try {
          const rows = JSON.parse(chunkPayload) as any[];
          if (!Array.isArray(rows) || rows.length === 0) {
            return NextResponse.json(
              { success: false, error: "Invalid or empty chunk" },
              { status: 400 }
            );
          }
          
          // Use bulk client for better performance
          const bulkSupabase = createBulkOperationClient();
          const { error } = await bulkSupabase.from(tableName).insert(rows);
          
          if (error) {
            console.error("Error inserting chunk:", error);
            return NextResponse.json(
              { success: false, error: error.message },
              { status: 500 }
            );
          }
          
          // Invalidate cache for this table after successful insert
          invalidateTableCache(tableName);
          
          return NextResponse.json({
            success: true,
            message: `Inserted ${rows.length} records`,
          });
        } catch (parseError) {
          console.error("Error parsing chunk:", parseError);
          return NextResponse.json(
            { success: false, error: "Invalid chunk JSON" },
            { status: 400 }
          );
        }
      }

      // Full file upload: file + table
      if (!file || !tableName) {
        return NextResponse.json(
          { success: false, error: "Missing file or table name" },
          { status: 400 }
        );
      }

      // Create a readable stream from the file
      const chunks = [];
      const reader = file.stream().getReader();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        chunks.push(value);
      }

      const fileData = new Uint8Array(
        chunks.reduce((acc, chunk) => acc + chunk.length, 0)
      );

      let offset = 0;
      for (const chunk of chunks) {
        fileData.set(chunk, offset);
        offset += chunk.length;
      }

      // Parse the Excel file
      const workbook = XLSX.read(fileData, { type: "array" });
      const firstSheet = workbook.Sheets[workbook.SheetNames[0]];
      const jsonData = XLSX.utils.sheet_to_json(firstSheet);

      if (!jsonData.length) {
        return NextResponse.json(
          { success: false, error: "No data found in the file" },
          { status: 400 }
        );
      }

      // Process the data in chunks
      const { success, errors } = await handleChunkedUpload(
        tableName,
        jsonData,
        (progress) => {
          // This would be sent via Server-Sent Events in a real implementation
          console.log(`Upload progress: ${progress}%`);
        }
      );

      // Invalidate cache for this table after upload attempt
      invalidateTableCache(tableName);

      if (!success) {
        return NextResponse.json(
          {
            success: false,
            error: "Error processing some records",
            details: errors,
          },
          { status: 500 }
        );
      }

      return NextResponse.json({
        success: true,
        message: `Successfully uploaded ${jsonData.length} records`,
      });
    }

    // Handle regular JSON data
    const body = await request.json();
    const { state, district, taluk, table, employee, forms } = body;
    
    // If employee data is sent directly (not wrapped in employee object), use it directly
    let employeeData: EmployeeSubmissionData = employee || {};
    
    // Check if the body itself contains employee data (direct submission from form)
    if (body.empname || body.department || body.designation_name || body.branch_name) {
      employeeData = body;
    }

    // Handle employee form submission
    if (employeeData.empname || employeeData.department || employeeData.designation_name || employeeData.branch_name) {
      try {
        const finalEmployeeData: any = {
          ...employeeData,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        // Remove undefined values and non-database fields
        Object.keys(finalEmployeeData).forEach(key => {
          if (finalEmployeeData[key] === undefined || key === 'table') {
            delete finalEmployeeData[key];
          }
        });

        const { data, error } = await supabase
          .from("man_power")
          .insert([finalEmployeeData])
          .select()
          .single();

        if (error) {
          console.error("Error adding employee:", error);
          return NextResponse.json(
            { success: false, error: error.message || "Failed to add employee" },
            { status: 500 }
          );
        }

        return NextResponse.json({
          success: true,
          message: "Employee added successfully",
          data: data,
        });
      } catch (dbError) {
        console.error("Database error:", dbError);
        return NextResponse.json(
          { success: false, error: "Failed to add employee to database" },
          { status: 500 }
        );
      }
    }

    // Invalidate cache for man_power table when employee is added
    if (employeeData.empname || employeeData.department || employeeData.designation_name || employeeData.branch_name) {
      invalidateTableCache('man_power');
    }

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
      { status: 500 }
    );
  }
}
