import { NextRequest, NextResponse } from "next/server";
import { readdirSync, statSync } from "fs";
import { join } from "path";
import {
  getTemplateMetadata,
  validateTemplate,
  loadTemplate,
} from "@/lib/docx-processor";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const validate = searchParams.get("validate") === "true";

    // Get all .docx files from forms directory
    const formsDir = join(process.cwd(), "forms");
    let files: string[] = [];

    try {
      files = readdirSync(formsDir).filter((file) => file.endsWith(".docx"));
    } catch (error) {
      return NextResponse.json({
        success: true,
        templates: [],
        message:
          "Forms directory not found. Please create 'forms' folder and add .docx templates.",
      });
    }

    if (files.length === 0) {
      return NextResponse.json({
        success: true,
        templates: [],
        message: "No .docx templates found in forms directory.",
      });
    }

    // Get metadata for each template
    const templates = [];

    for (const file of files) {
      try {
        const templatePath = `forms/${file}`;
        const metadata = getTemplateMetadata(templatePath);

        let validation = null;
        if (validate) {
          const buffer = loadTemplate(templatePath);
          validation = validateTemplate(buffer);
        }

        templates.push({
          name: file.replace(".docx", ""),
          path: templatePath,
          placeholderCount: metadata.placeholderCount,
          placeholders: metadata.placeholders,
          validation,
        });
      } catch (error) {
        console.error(`Error processing template ${file}:`, error);
        // Skip templates with errors
        continue;
      }
    }

    return NextResponse.json({
      success: true,
      templates,
    });
  } catch (error) {
    console.error("Error in templates API:", error);
    return NextResponse.json(
      {
        success: false,
        error: "Failed to load templates",
      },
      { status: 500 },
    );
  }
}
