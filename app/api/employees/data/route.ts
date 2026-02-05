import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ""
);

const TABLE_NAME = "employees";

export async function GET() {
  try {
    // Fetch all rows - Supabase defaults to 1000, use range to get more
    const { data, error } = await supabase
      .from(TABLE_NAME)
      .select("*", { count: "exact" })
      .range(0, 99999);

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Employees data GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { rows } = body;

    if (!rows || !Array.isArray(rows)) {
      return NextResponse.json(
        { error: "rows array is required" },
        { status: 400 }
      );
    }

    const cleanRows = rows.map((row: Record<string, unknown>) => {
      const { id, created_at, updated_at, ...rest } = row as Record<string, unknown>;
      return rest;
    });

    const { data, error } = await supabase
      .from(TABLE_NAME)
      .insert(cleanRows)
      .select();

    if (error) {
      return NextResponse.json(
        { error: error.message, inserted: 0, failed: rows.length },
        { status: 400 }
      );
    }

    return NextResponse.json({
      inserted: data?.length ?? rows.length,
      failed: 0,
    });
  } catch (error) {
    console.error("Employees data POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
