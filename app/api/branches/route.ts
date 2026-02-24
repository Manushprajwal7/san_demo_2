import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { dbCache, getCachedCompanyId } from "@/lib/database-cache";

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get("company");

  if (!company) {
    return NextResponse.json(
      { error: "Company parameter required" },
      { status: 400 },
    );
  }

  try {
    const supabase = createServerSupabaseClient();
    const companyData = await getCachedCompanyId(supabase, company);

    if (!companyData) {
      return NextResponse.json({ error: "Company not found" }, { status: 404 });
    }

    // Check cache
    const cacheKey = `branches:${companyData.id}`;
    const cached = dbCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { data, error } = await supabase
      .from("branches")
      .select("id, name, location, approved_manpower, actual_manpower, total_salary")
      .eq("company_id", companyData.id)
      .order("name", { ascending: true });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = data || [];
    dbCache.set(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Branches API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { companyId, name, location, approvedManpower } = body;

    const { data, error } = await supabase
      .from("branches")
      .insert({
        company_id: companyId,
        name,
        location,
        approved_manpower: approvedManpower,
        actual_manpower: 0,
        total_salary: 0,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Invalidate branches cache
    dbCache.delete(`branches:${companyId}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Branches POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PATCH(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { id, ...updateData } = body;

    const { data, error } = await supabase
      .from("branches")
      .update(updateData)
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Branches PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Branch ID required" },
        { status: 400 },
      );
    }

    const { error } = await supabase.from("branches").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Branches DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
