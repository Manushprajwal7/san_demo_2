import PizZip from 'pizzip';
import Docxtemplater from 'docxtemplater';
import fs from 'fs';
import path from 'path';
import { getTemplateFileName } from '@/lib/compliance-form-registry';

const FORMS_DIR = path.join(process.cwd(), 'forms');

export function formatPlaceholderValue(val: unknown): string {
  if (val === null || val === undefined) return '';
  if (typeof val === 'object' && typeof (val as Date).toISOString === 'function') {
    return (val as Date).toISOString().split('T')[0];
  }
  if (typeof val === 'object') return JSON.stringify(val);
  return String(val);
}

export function rowToContext(row: Record<string, unknown> | null): Record<string, string> {
  if (!row || typeof row !== 'object') return {};
  const out: Record<string, string> = {};
  for (const [k, v] of Object.entries(row)) {
    const key = k.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    out[key] = formatPlaceholderValue(v);
  }
  return out;
}

export async function convertDocxToPdf(docxBuffer: Buffer): Promise<Buffer | null> {
  try {
    const libre = require('libreoffice-convert');
    const convertAsync = require('util').promisify(libre.convert);
    const pdfBuffer = await convertAsync(docxBuffer, '.pdf', undefined);
    return Buffer.from(pdfBuffer);
  } catch {
    return null;
  }
}

export async function processDocxTemplate(
  templatePath: string,
  formId: string,
  branchData: Record<string, unknown> | null,
  manPowerData: Record<string, unknown>[],
  formData: Record<string, unknown>
): Promise<Buffer> {
  const content = fs.readFileSync(templatePath);
  const zip = new PizZip(content);

  const doc = new Docxtemplater(zip, {
    paragraphLoop: true,
    linebreaks: true,
    delimiters: { start: '[[', end: ']]' },
    nullGetter: () => '',
  });

  const context: Record<string, string> = {};
  Object.assign(context, rowToContext(branchData));

  if (manPowerData.length > 0) {
    Object.assign(context, rowToContext(manPowerData[0]));
    const totalManPower = manPowerData.reduce((sum, emp) => sum + Number(emp?.man_power ?? 0), 0);
    const totalMale = manPowerData.filter((e) => String(e?.gender ?? '').toLowerCase() === 'male').length;
    const totalFemale = manPowerData.filter((e) => String(e?.gender ?? '').toLowerCase() === 'female').length;
    context['total_man_power'] = String(totalManPower);
    context['total_male_employees'] = String(totalMale);
    context['total_female_employees'] = String(totalFemale);
    context['total_employees'] = String(manPowerData.length);
  }

  for (const [key, value] of Object.entries(formData)) {
    if (key.startsWith(`${formId}_`)) {
      const fieldId = key.replace(`${formId}_`, '').toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
      context[fieldId] = formatPlaceholderValue(value);
    }
  }
  for (const [key, value] of Object.entries(formData)) {
    const k = key.toLowerCase().replace(/\s+/g, '_').replace(/-/g, '_');
    if (!(k in context)) context[k] = formatPlaceholderValue(value);
  }

  const currentDate = new Date();
  context['current_date'] = currentDate.toLocaleDateString();
  context['current_month'] = currentDate.toLocaleString('default', { month: 'long' });
  context['current_year'] = String(currentDate.getFullYear());
  context['financial_year'] = `${currentDate.getFullYear()}-${String(currentDate.getFullYear() + 1).slice(-2)}`;
  context['compliance_date'] = currentDate.toISOString().split('T')[0];

  // Ensure common variants exist so [[Branch Name]] or [[branch name]] resolve (Docxtemplater is case-sensitive)
  const expandedContext: Record<string, string | unknown[]> = { ...context };
  for (const [key, value] of Object.entries(context)) {
    const withSpaces = key.replace(/_/g, ' ');
    if (withSpaces !== key && !(withSpaces in expandedContext)) {
      expandedContext[withSpaces] = value;
    }
    const titleCase = key.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase());
    if (titleCase !== key && !(titleCase in expandedContext)) {
      expandedContext[titleCase] = value;
    }
  }

  // Loop tags [[#tag]] expect an array; return empty array so the loop renders 0 times instead of throwing
  const safeContext = new Proxy(expandedContext, {
    get(target, prop: string) {
      if (typeof prop !== 'string') return (target as Record<string, unknown>)[prop as keyof typeof target];
      if (prop in target) return (target as Record<string, unknown>)[prop];
      if (prop.startsWith('#')) return [];
      return '';
    },
  });

  try {
    doc.render(safeContext);
  } catch (err: unknown) {
    const e = err as {
      message?: string;
      properties?: {
        errors?: Array<{
          message?: string;
          properties?: { explanation?: string };
        }>;
        explanation?: string;
      };
    };
    const parts: string[] = [];
    if (e?.properties?.errors && Array.isArray(e.properties.errors)) {
      for (const sub of e.properties.errors) {
        const detail =
          (sub?.properties?.explanation as string) ||
          (sub?.message as string) ||
          (typeof sub === 'string' ? sub : '');
        if (detail) parts.push(detail);
      }
    }
    if (e?.properties?.explanation) parts.push(e.properties.explanation);
    const message =
      parts.length > 0
        ? `Template error: ${parts.join('; ')}`
        : e?.message || (err instanceof Error ? err.message : 'Template rendering failed');
    if (err instanceof Error) {
      err.message = message;
      throw err;
    }
    throw new Error(message);
  }

  const buf = doc.getZip().generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  });
  return buf as Buffer;
}

export function getTemplatePath(formId: string, formsDir: string = FORMS_DIR): string | null {
  const fileName = getTemplateFileName(formId);
  if (!fileName) return null;
  const fullPath = path.join(formsDir, fileName);
  return fs.existsSync(fullPath) ? fullPath : null;
}
