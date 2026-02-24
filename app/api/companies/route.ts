import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

// Helper to get a service role client dynamically
function getServiceSupabase() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL || "",
    process.env.SUPABASE_SERVICE_ROLE_KEY || "",
    {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
      },
    }
  );
}

export async function GET(request: NextRequest) {
  const supabase = getServiceSupabase();
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  try {
    if (code) {
      const { data, error } = await supabase
        .from("companies")
        .select("*")
        .eq("code", code.toUpperCase())
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data);
    }

    const { data, error } = await supabase.from("companies").select("*");

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data || []);
  } catch (error) {
    console.error("Companies API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  const supabase = getServiceSupabase();
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
       // Debugging: check if key is actually present
       if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
           console.error("Missing SUPABASE_SERVICE_ROLE_KEY in POST /api/companies");
       }
       return NextResponse.json({ error: error.message }, { status: 400 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error("Companies POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
