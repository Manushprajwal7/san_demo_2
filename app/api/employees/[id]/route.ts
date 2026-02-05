import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table");

    if (!tableName) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameter: table",
        },
        { status: 400 },
      );
    }

    const employeeId = params.id;

    // Fetch employee data
    const { data: employee, error } = await supabase
      .from(tableName)
      .select("*")
      .eq("id", employeeId)
      .single();

    if (error) {
      return NextResponse.json(
        {
          success: false,
          error: `Failed to fetch employee: ${error.message}`,
        },
        { status: 404 },
      );
    }

    if (!employee) {
      return NextResponse.json(
        {
          success: false,
          error: `Employee with ID ${employeeId} not found in table ${tableName}`,
        },
        { status: 404 },
      );
    }

    return NextResponse.json({
      success: true,
      employee,
      tableName,
    });
  } catch (error) {
    console.error("Error fetching employee:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Internal server error",
      },
      { status: 500 },
    );
  }
}
