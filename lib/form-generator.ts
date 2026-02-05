import { createServerSupabaseClient } from "./supabase";
import {
  extractPlaceholders,
  loadTemplate,
  populateTemplate,
} from "./docx-processor";
import {
  mapPlaceholdersToColumns,
  resolvePlaceholderToColumn,
  transformDataForTemplate,
  validateColumns,
} from "./db-mapper";

export interface FormGenerationOptions {
  templatePath: string;
  tableName: string;
  employeeId: string | number;
}

export interface FormGenerationResult {
  success: boolean;
  buffer?: Buffer;
  error?: string;
  metadata?: {
    placeholders: string[];
    filledFields: string[];
    emptyFields: string[];
    employeeData: Record<string, any>;
  };
}

/**
 * Main function to generate populated form
 */
export async function generateForm(
  options: FormGenerationOptions,
): Promise<FormGenerationResult> {
  try {
    const { templatePath, tableName, employeeId } = options;

    // Step 1: Load template and extract placeholders
    console.log("Loading template:", templatePath);
    const templateBuffer = loadTemplate(templatePath);
    const placeholders = extractPlaceholders(templateBuffer);

    if (placeholders.length === 0) {
      return {
        success: false,
        error: "No placeholders found in template",
      };
    }

    console.log("Found placeholders:", placeholders);

    // Step 2: Map placeholders to database columns (with fallbacks for name/designation etc.)
    const placeholderMapping = mapPlaceholdersToColumns(placeholders);

    // Step 3: Resolve to actual table column names (table may use "name" instead of "empname", etc.)
    const supabase = createServerSupabaseClient();
    const validation = await validateColumns(supabase, tableName, Object.values(placeholderMapping));
    const resolvedMapping = resolvePlaceholderToColumn(
      placeholderMapping,
      validation.available,
    );
    let columnsToSelect = [...new Set(Object.values(resolvedMapping))].filter(Boolean);
    if (columnsToSelect.length === 0) {
      columnsToSelect = Object.values(placeholderMapping).filter(Boolean);
    }
    if (columnsToSelect.length === 0) {
      return {
        success: false,
        error: "No columns could be mapped from template placeholders. Check that the table has at least one row so column names can be detected.",
      };
    }

    console.log("Column mapping (resolved):", resolvedMapping);

    const { data: employeeData, error: fetchError } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(", "))
      .eq("id", employeeId)
      .single();

    if (fetchError) {
      return {
        success: false,
        error: `Failed to fetch employee data: ${fetchError.message}`,
      };
    }

    if (!employeeData) {
      return {
        success: false,
        error: `Employee with ID ${employeeId} not found in table ${tableName}`,
      };
    }

    console.log("Employee data fetched:", Object.keys(employeeData));

    // Step 4: Transform data for template (use resolved mapping so placeholder keys match template)
    const templateData = transformDataForTemplate(
      employeeData,
      resolvedMapping,
    );

    // Ensure every placeholder has a key (missing = empty string) so [[...]] is always replaced
    for (const p of placeholders) {
      if (!(p in templateData)) {
        templateData[p] = "";
      }
    }

    // Track filled vs empty fields
    const filledFields = Object.entries(templateData)
      .filter(([_, value]) => value && value.length > 0)
      .map(([key]) => key);

    const emptyFields = placeholders.filter(
      (placeholder) => !filledFields.includes(placeholder),
    );

    console.log("Filled fields:", filledFields.length);
    console.log("Empty fields:", emptyFields.length);

    // Step 5: Populate template
    const populatedBuffer = await populateTemplate(
      templateBuffer,
      templateData,
    );

    return {
      success: true,
      buffer: populatedBuffer,
      metadata: {
        placeholders,
        filledFields,
        emptyFields,
        employeeData: templateData,
      },
    };
  } catch (error) {
    console.error("Error generating form:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error occurred",
    };
  }
}

/**
 * Get preview data without generating the document
 */
export async function getFormPreview(options: FormGenerationOptions): Promise<{
  success: boolean;
  preview?: {
    placeholders: string[];
    columnMapping: Record<string, string>;
    employeeData: Record<string, any>;
    missingColumns: string[];
  };
  error?: string;
}> {
  try {
    const { templatePath, tableName, employeeId } = options;

    // Load template and extract placeholders
    const templateBuffer = loadTemplate(templatePath);
    const placeholders = extractPlaceholders(templateBuffer);

    const placeholderMapping = mapPlaceholdersToColumns(placeholders);
    const supabase = createServerSupabaseClient();
    const validation = await validateColumns(supabase, tableName, Object.values(placeholderMapping));
    const resolvedMapping = resolvePlaceholderToColumn(
      placeholderMapping,
      validation.available,
    );
    const columnsToSelect = [...new Set(Object.values(resolvedMapping))].filter(Boolean);

    const { data: employeeData, error: fetchError } = await supabase
      .from(tableName)
      .select(columnsToSelect.join(", "))
      .eq("id", employeeId)
      .single();

    if (fetchError || !employeeData) {
      return {
        success: false,
        error: "Failed to fetch employee data",
      };
    }

    const templateData = transformDataForTemplate(
      employeeData,
      resolvedMapping,
    );

    return {
      success: true,
      preview: {
        placeholders,
        columnMapping: resolvedMapping,
        employeeData: templateData,
        missingColumns: validation.missing,
      },
    };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : "Unknown error",
    };
  }
}
