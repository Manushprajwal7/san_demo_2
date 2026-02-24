import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { dbCache } from "@/lib/database-cache";

const CACHE_TTL = 5 * 60 * 1000; // 5 minutes (companies rarely change)

export async function GET(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  try {
    if (code) {
      const cacheKey = `company_detail:${code.toUpperCase()}`;
      const cached = dbCache.get(cacheKey);
      if (cached) {
        return NextResponse.json(cached);
      }

      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      dbCache.set(cacheKey, data, CACHE_TTL);
      return NextResponse.json(data);
    }

    const cacheKey = "companies_list";
    const cached = dbCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { data, error } = await supabase.from("companies").select("id, name, code");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = data || [];
    dbCache.set(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = createServerSupabaseClient();
  try {
    const body = await request.json();
    const { name, code } = body;

    const { data, error } = await supabase
      .from("companies")
      .insert({
        name,
        code: code.toUpperCase(),
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Invalidate companies cache
    dbCache.delete("companies_list");

    return NextResponse.json(data);
  } catch (error) {
    console.error("Companies POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
