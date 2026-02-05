import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || "",
  process.env.SUPABASE_SERVICE_ROLE_KEY || "",
);

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get("action");

  try {
    if (action === "tables") {
      const { data, error } = await supabase
        .from("notice_tables_registry")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data || []);
    }

    if (action === "data") {
      const tableName = searchParams.get("table");
      if (!tableName) {
        return NextResponse.json(
          { error: "table parameter required" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase.rpc("get_notice_table_data", {
        p_table_name: tableName,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data || []);
    }

    if (action === "get-data") {
      const tableName = searchParams.get("tableName");
      if (!tableName) {
        return NextResponse.json(
          { error: "tableName parameter required" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase.rpc("get_notice_table_data", {
        p_table_name: tableName,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data || []);
    }

    if (action === "columns") {
      const tableName = searchParams.get("table");
      if (!tableName) {
        return NextResponse.json(
          { error: "table parameter required" },
          { status: 400 },
        );
      }

      const { data, error } = await supabase
        .from("notice_tables_registry")
        .select("columns")
        .eq("table_name", tableName)
        .single();

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(data?.columns || []);
    }

    return NextResponse.json(
      { error: "Invalid action parameter" },
      { status: 400 },
    );
  } catch (error) {
    console.error("Notice API GET error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === "create-table") {
      const { tableName, displayName, columns } = body;

      if (!tableName || !displayName || !columns || !Array.isArray(columns)) {
        return NextResponse.json(
          { error: "tableName, displayName, and columns are required" },
          { status: 400 },
        );
      }

      // Check if table already exists
      const { data: exists, error: checkError } = await supabase.rpc(
        "check_table_exists",
        {
          p_table_name: tableName,
        },
      );

      if (checkError) {
        return NextResponse.json(
          { error: checkError.message },
          { status: 400 },
        );
      }

      if (exists) {
        return NextResponse.json(
          {
            error: `Table "${tableName}" already exists. Choose a different name.`,
          },
          { status: 409 },
        );
      }

      // Create the actual PostgreSQL table via RPC
      const { error: createError } = await supabase.rpc("create_notice_table", {
        p_table_name: tableName,
        p_columns: columns,
      });

      if (createError) {
        return NextResponse.json(
          { error: createError.message },
          { status: 400 },
        );
      }

      // Register in the registry table
      const { data: registry, error: registryError } = await supabase
        .from("notice_tables_registry")
        .insert({
          table_name: tableName,
          display_name: displayName,
          columns,
        })
        .select()
        .single();

      if (registryError) {
        return NextResponse.json(
          { error: registryError.message },
          { status: 400 },
        );
      }

      return NextResponse.json(registry);
    }

    if (action === "insert-row") {
      const { tableName, data } = body;

      if (!tableName || !data) {
        return NextResponse.json(
          { error: "tableName and data are required" },
          { status: 400 },
        );
      }

      const { data: result, error } = await supabase.rpc("insert_notice_row", {
        p_table_name: tableName,
        p_data: data,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    if (action === "bulk-insert") {
      const { tableName, rows } = body;

      if (!tableName || !rows || !Array.isArray(rows)) {
        return NextResponse.json(
          { error: "tableName and rows array are required" },
          { status: 400 },
        );
      }

      const { data: result, error } = await supabase.rpc(
        "bulk_insert_notice_rows",
        {
          p_table_name: tableName,
          p_rows: rows,
        },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notice API POST error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tableName, rowId } = body;

    if (action === "delete-row") {
      if (!tableName || !rowId) {
        return NextResponse.json(
          { error: "tableName and rowId are required" },
          { status: 400 },
        );
      }

      const { error } = await supabase.rpc("delete_notice_row", {
        p_table_name: tableName,
        p_row_id: rowId,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notice API DELETE error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { action, tableName, rowId, data, rows } = body;

    // Some clients may accidentally call PUT during import. Support it to avoid 400s.
    if (action === "bulk-insert") {
      if (!tableName || !rows || !Array.isArray(rows)) {
        return NextResponse.json(
          {
            error: "tableName and rows array are required",
            received: {
              tableName: Boolean(tableName),
              rowsType: Array.isArray(rows) ? "array" : typeof rows,
            },
          },
          { status: 400 },
        );
      }

      const { data: result, error } = await supabase.rpc(
        "bulk_insert_notice_rows",
        {
          p_table_name: tableName,
          p_rows: rows,
        },
      );

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json(result);
    }

    if (action === "update-row") {
      const effectiveRowId = rowId || data?.id;
      if (!tableName || !effectiveRowId || !data) {
        return NextResponse.json(
          {
            error: "tableName, rowId (or data.id), and data are required",
            receivedKeys:
              data && typeof data === "object" && !Array.isArray(data)
                ? Object.keys(data)
                : null,
          },
          { status: 400 },
        );
      }

      const { error } = await supabase.rpc("update_notice_row", {
        p_table_name: tableName,
        p_row_id: effectiveRowId,
        p_data: data,
      });

      if (error) {
        return NextResponse.json({ error: error.message }, { status: 400 });
      }

      return NextResponse.json({ success: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("Notice API PUT error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 },
    );
  }
}
