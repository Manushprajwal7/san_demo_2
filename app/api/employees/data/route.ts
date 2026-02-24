import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { dbCache } from "@/lib/database-cache";
import { withMetrics } from "@/lib/api-metrics";

const TABLE_NAME = "employees";
const DEFAULT_LIMIT = 1000;
const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const GET = withMetrics('/api/employees/data', async (request: NextRequest) => {
  try {
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get("page") || "1", 10);
    const limit = Math.min(parseInt(searchParams.get("limit") || String(DEFAULT_LIMIT), 10), 5000);
    const from = (page - 1) * limit;
    const to = from + limit - 1;

    // Check cache
    const cacheKey = `employees_data:${page}:${limit}`;
    const cached = dbCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const supabase = createServerSupabaseClient();

    const { data, count, error } = await supabase
      .from(TABLE_NAME)
      .select("*", { count: "exact" })
      .range(from, to)
      .order("id", { ascending: true });

    if (error) {
      return NextResponse.json(
        { error: error.message },
        { status: 400 }
      );
    }

    const result = {
      data: data || [],
      pagination: {
        page,
        limit,
        total: count ?? 0,
        totalPages: Math.ceil((count ?? 0) / limit),
      },
    };

    dbCache.set(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Employees data GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
})

export const POST = withMetrics('/api/employees/data', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient();
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

    // Invalidate cache after insert
    const stats = dbCache.getStats();
    stats.keys
      .filter(key => key.startsWith("employees_data:"))
      .forEach(key => dbCache.delete(key));

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
})
