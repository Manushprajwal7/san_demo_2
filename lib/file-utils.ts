/**
 * Shared file validation and naming for DOCX/PDF conversion.
 */

export const ALLOWED_DOCX_EXTENSIONS = [".docx", ".doc"] as const;
export const MAX_DOCX_SIZE_BYTES = 25 * 1024 * 1024; // 25MB

export function getFileExtension(name: string): string {
  const i = name.lastIndexOf(".");
  return i >= 0 ? name.slice(i).toLowerCase() : "";
}

export function isAllowedDocxFile(name: string, size: number): { ok: true } | { ok: false; error: string } {
  const ext = getFileExtension(name);
  if (!ALLOWED_DOCX_EXTENSIONS.includes(ext as (typeof ALLOWED_DOCX_EXTENSIONS)[number])) {
    return { ok: false, error: "Only .docx or .doc files are allowed." };
  }
  if (size > MAX_DOCX_SIZE_BYTES) {
    return { ok: false, error: `File must be under ${MAX_DOCX_SIZE_BYTES / 1024 / 1024}MB.` };
  }
  return { ok: true };
}

/** Sanitize filename for safe download (alphanumeric, dots, underscores, hyphens). */
export function sanitizeFileName(name: string, maxLength = 100): string {
  const base = name.replace(/[^a-zA-Z0-9._-]/g, "_");
  return base.slice(0, maxLength) || "document";
}
