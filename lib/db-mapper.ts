/**
 * Convert placeholder name to database column name
 * Examples:
 * - "Empname" -> "empname"
 * - "Designation Name" -> "designation_name"
 * - "Present Res No" -> "present_res_no"
 * - "Date of Birth" -> "date_of_birth"
 */
export function placeholderToColumn(placeholder: string): string {
  return placeholder
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "_") // Replace spaces with underscores
    .replace(/[^a-z0-9_]/g, "") // Remove special characters except underscore
    .replace(/_+/g, "_") // Replace multiple underscores with single
    .replace(/^_|_$/g, ""); // Remove leading/trailing underscores
}

/**
 * Convert database column name to placeholder format
 * Examples:
 * - "empname" -> "Empname"
 * - "designation_name" -> "Designation Name"
 */
export function columnToPlaceholder(column: string): string {
  return column
    .split("_")
    .map((word) => word.charAt(0).toUpperCase() + word.slice(1))
    .join(" ");
}

/** Optional overrides for template typos (placeholder -> DB column) */
const PLACEHOLDER_ALIASES: Record<string, string> = {
  "Date Of Joiningll": "date_of_joining", // common typo in template
};

/**
 * For each "normalized" column name, alternative column names to try if the table
 * uses different names. First match in the table wins.
 */
export const COLUMN_ALTERNATIVES: Record<string, string[]> = {
  empname: ["empname", "name", "employee_name", "emp_name", "full_name"],
  designation_name: ["designation_name", "designation", "designation name"],
  present_res_no: ["present_res_no", "present_address", "address"],
  date_of_joining: ["date_of_joining", "joining_date", "doj", "date_of_join"],
  employee_code: ["employee_code", "emp_code", "code"],
  department: ["department", "dept", "division"],
};

/**
 * Map placeholders to database columns
 * Returns object with placeholder as key and column name as value
 */
export function mapPlaceholdersToColumns(
  placeholders: string[],
): Record<string, string> {
  const mapping: Record<string, string> = {};

  for (const placeholder of placeholders) {
    const trimmed = placeholder.trim();
    if (PLACEHOLDER_ALIASES[trimmed]) {
      mapping[trimmed] = PLACEHOLDER_ALIASES[trimmed];
    } else {
      mapping[trimmed] = placeholderToColumn(placeholder);
    }
  }

  return mapping;
}

/**
 * Resolve placeholder -> column using actual table columns.
 * If the mapped column is missing, try COLUMN_ALTERNATIVES so common names (name, designation) work.
 */
export function resolvePlaceholderToColumn(
  placeholderMapping: Record<string, string>,
  availableColumns: string[],
): Record<string, string> {
  const resolved: Record<string, string> = {};
  const availableSet = new Set(availableColumns.map((c) => c.toLowerCase()));

  for (const [placeholder, column] of Object.entries(placeholderMapping)) {
    const colLower = column.toLowerCase();
    if (availableSet.has(colLower)) {
      const actual = availableColumns.find((c) => c.toLowerCase() === colLower)!;
      resolved[placeholder] = actual;
      continue;
    }
    const alternatives = COLUMN_ALTERNATIVES[colLower] ?? [column];
    const found = alternatives.find((alt) =>
      availableColumns.some((c) => c.toLowerCase() === alt.toLowerCase()),
    );
    resolved[placeholder] = found
      ? availableColumns.find((c) => c.toLowerCase() === found.toLowerCase())!
      : column;
  }

  return resolved;
}

/**
 * Build SELECT query for fetching employee data
 * Only selects columns that match placeholders
 */
export function buildSelectQuery(
  tableName: string,
  columnNames: string[],
  employeeId: string | number,
): { query: string; columns: string[] } {
  // Remove duplicates and filter out empty strings
  const uniqueColumns = [...new Set(columnNames)].filter(
    (col) => col.length > 0,
  );

  return {
    query: `SELECT ${uniqueColumns.join(", ")} FROM ${tableName} WHERE id = $1`,
    columns: uniqueColumns,
  };
}

/**
 * Format database value for document
 * Handles dates, nulls, and special formatting
 */
export function formatValue(value: any, columnName: string): string {
  if (value === null || value === undefined) {
    return "";
  }

  // Handle dates
  if (value instanceof Date || columnName.includes("date")) {
    try {
      const date = new Date(value);
      if (!isNaN(date.getTime())) {
        return date.toLocaleDateString("en-IN", {
          day: "2-digit",
          month: "2-digit",
          year: "numeric",
        });
      }
    } catch (e) {
      // If date parsing fails, return as string
    }
  }

  // Handle booleans
  if (typeof value === "boolean") {
    return value ? "Yes" : "No";
  }

  // Handle numbers
  if (typeof value === "number") {
    return value.toString();
  }

  // Default: convert to string
  return String(value).trim();
}

/**
 * Transform database row to template data
 * Maps column names back to placeholder format
 */
export function transformDataForTemplate(
  dbRow: Record<string, any>,
  placeholderMapping: Record<string, string>,
): Record<string, string> {
  const templateData: Record<string, string> = {};

  // Reverse mapping: column -> placeholder
  const columnToPlaceholderMap: Record<string, string> = {};
  for (const [placeholder, column] of Object.entries(placeholderMapping)) {
    columnToPlaceholderMap[column] = placeholder;
  }

  // Transform each database column to placeholder format
  for (const [column, value] of Object.entries(dbRow)) {
    const placeholder = columnToPlaceholderMap[column];
    if (placeholder) {
      templateData[placeholder] = formatValue(value, column);
    }
  }

  return templateData;
}

/**
 * Validate that required columns exist in database
 */
export async function validateColumns(
  supabase: any,
  tableName: string,
  requiredColumns: string[],
): Promise<{ valid: boolean; missing: string[]; available: string[] }> {
  try {
    // Fetch one row to get column names
    const { data, error } = await supabase
      .from(tableName)
      .select("*")
      .limit(1)
      .single();

    if (error && error.code !== "PGRST116") {
      // PGRST116 = no rows
      throw error;
    }

    const availableColumns = data ? Object.keys(data) : [];
    const missing = requiredColumns.filter(
      (col) => !availableColumns.includes(col),
    );

    return {
      valid: missing.length === 0,
      missing,
      available: availableColumns,
    };
  } catch (error) {
    console.error("Error validating columns:", error);
    return {
      valid: false,
      missing: requiredColumns,
      available: [],
    };
  }
}
