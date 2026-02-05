import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const tableName = searchParams.get("table") || "employees";
    const { id: employeeId } = await params;

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

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;
    const body = await request.json();

    const { id: _id, created_at: _ca, ...updateData } = body;

    const { error } = await supabase
      .from("employees")
      .update(updateData)
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error updating employee:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  try {
    const supabase = createServerSupabaseClient();
    const { id } = await params;

    const { error } = await supabase
      .from("employees")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error deleting employee:", error);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 }
    );
  }
}
