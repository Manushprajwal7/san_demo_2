import { NextRequest, NextResponse } from "next/server";
import { generateForm, getFormPreview } from "@/lib/form-generator";

/**
 * POST /api/generate-form
 * Generate populated form document
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { templatePath, tableName, employeeId, preview } = body;

    // Validate required fields
    if (!templatePath || !tableName || !employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required fields: templatePath, tableName, employeeId",
        },
        { status: 400 },
      );
    }

    // If preview mode, return preview data only
    if (preview) {
      const result = await getFormPreview({
        templatePath,
        tableName,
        employeeId,
      });

      return NextResponse.json(result);
    }

    // Generate the form
    const result = await generateForm({
      templatePath,
      tableName,
      employeeId,
    });

    if (!result.success) {
      const errorMessage = result.error || "Form generation failed";
      return NextResponse.json(
        { success: false, error: errorMessage },
        { status: 400 },
      );
    }

    if (!result.buffer || result.buffer.length === 0) {
      return NextResponse.json(
        { success: false, error: "Generated document is empty" },
        { status: 500 },
      );
    }

    // Return the actual DOCX file for download (not PDF, not JSON)
    const templateName = templatePath.replace(/^.*[/\\]/, "").replace(/\.docx$/i, "") || "form";
    const fileName = `${templateName}_filled.docx`;

    return new NextResponse(new Uint8Array(result.buffer as Buffer), {
      headers: {
        "Content-Type":
          "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
        "Content-Disposition": `attachment; filename="${fileName}"`,
        "X-Metadata": JSON.stringify(result.metadata ?? {}),
      },
    });
  } catch (error) {
    console.error("Error in generate-form API:", error);
    return NextResponse.json(
      {
        success: false,
        error: error instanceof Error ? error.message : "Internal server error",
      },
      { status: 500 },
    );
  }
}

/**
 * GET /api/generate-form
 * Get form generation preview
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const templatePath = searchParams.get("templatePath");
    const tableName = searchParams.get("tableName");
    const employeeId = searchParams.get("employeeId");

    if (!templatePath || !tableName || !employeeId) {
      return NextResponse.json(
        {
          success: false,
          error: "Missing required parameters",
        },
        { status: 400 },
      );
    }

    const result = await getFormPreview({
      templatePath,
      tableName,
      employeeId,
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error("Error in generate-form preview:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to generate preview",
      },
      { status: 500 },
    );
  }
}
