import PizZip from "pizzip";
import Docxtemplater from "docxtemplater";
import { readFileSync } from "fs";
import { join } from "path";

/** Max length for a valid placeholder name (avoids XML/font garbage from DOCX) */
const MAX_PLACEHOLDER_LENGTH = 60;

/** Substrings that indicate XML/Word internals, not real placeholders */
const INVALID_PLACEHOLDER_SUBSTRINGS = [
  "font",
  "ascii",
  "bookman",
  "w:r",
  "w:t",
  "w:p",
  "wp:",
  "xml",
  "wtwr",
  "wrpr",
];

function isValidPlaceholder(name: string): boolean {
  const trimmed = name.trim();
  if (trimmed.length === 0 || trimmed.length > MAX_PLACEHOLDER_LENGTH) return false;
  if (!/^[a-zA-Z0-9\s_\-]+$/.test(trimmed)) return false;
  const lower = trimmed.toLowerCase();
  if (INVALID_PLACEHOLDER_SUBSTRINGS.some((s) => lower.includes(s))) return false;
  if (/^w[rpt]/i.test(trimmed)) return false;
  return true;
}

/**
 * Strip Word XML tags from placeholder content (e.g. "</w:t><w:t>empname</w:t>" -> "empname")
 */
function stripXmlFromPlaceholder(raw: string): string {
  return raw
    .replace(/<[^>]+>/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Extract all placeholders from a DOCX template
 * Placeholders are in format [[PlaceholderName]]
 * Word often splits [[...]] across XML runs, so we strip tags from captured content before validating.
 */
export function extractPlaceholders(docxBuffer: Buffer): string[] {
  try {
    const zip = new PizZip(docxBuffer);
    const fullText = zip.file("word/document.xml")?.asText() || "";

    const regex = /\[\[([\s\S]*?)\]\]/g;
    const placeholders = new Set<string>();
    let match: RegExpExecArray | null;
    while ((match = regex.exec(fullText)) !== null) {
      if (match[1]) {
        const name = stripXmlFromPlaceholder(match[1]);
        if (name && isValidPlaceholder(name)) placeholders.add(name);
      }
    }

    return Array.from(placeholders);
  } catch (error) {
    console.error("Error extracting placeholders:", error);
    throw new Error("Failed to extract placeholders from DOCX template");
  }
}

/**
 * Load DOCX template from file system
 */
export function loadTemplate(templatePath: string): Buffer {
  try {
    const fullPath = join(process.cwd(), templatePath);
    return readFileSync(fullPath);
  } catch (error) {
    console.error("Error loading template:", error);
    throw new Error(`Template not found at: ${templatePath}`);
  }
}

/**
 * Populate DOCX template with data.
 * Replaces [[PlaceholderName]] with values from data (keys must match placeholder names exactly).
 * Uses Docxtemplater with custom delimiters [[ and ]] so Word's split XML runs are handled correctly.
 */
export async function populateTemplate(
  templateBuffer: Buffer,
  data: Record<string, any>,
): Promise<Buffer> {
  const cleanData: Record<string, string> = {};
  for (const [key, value] of Object.entries(data)) {
    cleanData[key] = value != null ? String(value) : "";
  }

  const zip = new PizZip(templateBuffer);
  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    nullGetter: () => "",
    delimiters: { start: "[[", end: "]]" },
  });

  doc.render(cleanData);

  const buffer = doc.getZip().generate({
    type: "nodebuffer",
    compression: "DEFLATE",
  });

  return buffer as Buffer;
}

/**
 * Get template metadata (placeholders and info)
 */
export function getTemplateMetadata(templatePath: string) {
  try {
    const buffer = loadTemplate(templatePath);
    const placeholders = extractPlaceholders(buffer);

    return {
      path: templatePath,
      placeholderCount: placeholders.length,
      placeholders,
    };
  } catch (error) {
    console.error("Error getting template metadata:", error);
    throw error;
  }
}

/**
 * Validate template structure and placeholders
 */
export function validateTemplate(templateBuffer: Buffer): {
  valid: boolean;
  placeholders: string[];
  errors: string[];
  warnings: string[];
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  let placeholders: string[] = [];

  try {
    // Try to extract placeholders
    placeholders = extractPlaceholders(templateBuffer);

    if (placeholders.length === 0) {
      warnings.push("No placeholders found in template");
    }

    // Check for common issues
    const zip = new PizZip(templateBuffer);
    const xmlContent = zip.file("word/document.xml")?.asText() || "";

    // Check for malformed placeholders
    const malformedRegex = /\[\[(?![^\]]*\]\])|(?<!\[\[)[^\[]*\]\]/g;
    const malformed = xmlContent.match(malformedRegex);
    if (malformed && malformed.length > 0) {
      warnings.push(
        `Found ${malformed.length} potentially malformed placeholder(s)`,
      );
    }

    // Check for duplicate placeholders
    const duplicates = placeholders.filter(
      (item, index) => placeholders.indexOf(item) !== index,
    );
    if (duplicates.length > 0) {
      warnings.push(`Duplicate placeholders found: ${duplicates.join(", ")}`);
    }

    return {
      valid: errors.length === 0,
      placeholders,
      errors,
      warnings,
    };
  } catch (error) {
    errors.push(
      `Failed to validate template: ${error instanceof Error ? error.message : "Unknown error"}`,
    );
    return {
      valid: false,
      placeholders,
      errors,
      warnings,
    };
  }
}
