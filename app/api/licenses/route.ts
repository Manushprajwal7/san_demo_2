import { NextRequest, NextResponse } from "next/server";
import { createServerSupabaseClient } from "@/lib/supabase";
import { dbCache, getCachedCompanyId } from "@/lib/database-cache";
import { withMetrics } from '@/lib/api-metrics';

const CACHE_TTL = 2 * 60 * 1000; // 2 minutes

export const GET = withMetrics('/api/licenses', async (request: NextRequest) => {
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

    const cacheKey = `licenses:${companyData.id}`;
    const cached = dbCache.get(cacheKey);
    if (cached) {
      return NextResponse.json(cached);
    }

    const { data, error } = await supabase
      .from("branch_status")
      .select("*")
      .eq("company_id", companyData.id)
      .order("created_at", { ascending: false });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    const result = data || [];
    dbCache.set(cacheKey, result, CACHE_TTL);

    return NextResponse.json(result);
  } catch (error) {
    console.error("Branch status API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const POST = withMetrics('/api/licenses', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { companyId, licenseType, expiryDate, status } = body;

    const { data, error } = await supabase
      .from("license_status")
      .insert({
        company_id: companyId,
        license_type: licenseType,
        expiry_date: expiryDate,
        status,
      })
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    // Invalidate cache
    dbCache.delete(`licenses:${companyId}`);

    return NextResponse.json(data);
  } catch (error) {
    console.error("Licenses POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const PATCH = withMetrics('/api/licenses', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient();
    const body = await request.json();
    const { id, status, expiryDate } = body;

    const { data, error } = await supabase
      .from("license_status")
      .update({
        status,
        expiry_date: expiryDate,
      })
      .eq("id", id)
      .select();

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Licenses PATCH error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});

export const DELETE = withMetrics('/api/licenses', async (request: NextRequest) => {
  try {
    const supabase = createServerSupabaseClient();
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "License ID required" },
        { status: 400 },
      );
    }

    const { error } = await supabase
      .from("license_status")
      .delete()
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Licenses DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
});
