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
  } catch (e) {
    console.error('LibreOffice conversion error:', e);
    return null;
  }
}

export async function processDocxTemplate(
  templatePath: string,
  formId: string,
  branchData: Record<string, unknown> | null,
  manPowerData: Record<string, unknown>[],
  formData: Record<string, unknown>,
  currentEmployee: Record<string, unknown> | null = null
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

  // If a specific employee is being processed, use their data
  if (currentEmployee) {
    Object.assign(context, rowToContext(currentEmployee));
  }

  // Still provide aggregates for branch-level tags
  if (manPowerData.length > 0) {
    // Only set these if not already set by currentEmployee (though unlikely to conflict)
    const totalManPower = manPowerData.reduce((sum, emp) => sum + Number(emp?.man_power ?? 0), 0);
    const totalMale = manPowerData.filter((e) => String(e?.gender ?? '').toLowerCase() === 'male').length;
    const totalFemale = manPowerData.filter((e) => String(e?.gender ?? '').toLowerCase() === 'female').length;
    
    if (!context['total_man_power']) context['total_man_power'] = String(totalManPower);
    if (!context['total_male_employees']) context['total_male_employees'] = String(totalMale);
    if (!context['total_female_employees']) context['total_female_employees'] = String(totalFemale);
    if (!context['total_employees']) context['total_employees'] = String(manPowerData.length);
    
    // Fallback: if no currentEmployee but we have data, maybe use the first one if it's a single return
    if (!currentEmployee && manPowerData.length === 1) {
      Object.assign(context, rowToContext(manPowerData[0]));
    }
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

export async function mergeDocx(buffers: Buffer[]): Promise<Buffer> {
  const validBuffers = buffers.filter(b => b.length > 0);
  if (validBuffers.length === 0) throw new Error('No buffers to merge');
  if (validBuffers.length === 1) return validBuffers[0];

  const firstZip = new PizZip(validBuffers[0]);
  const firstXml = firstZip.file('word/document.xml')?.asText();
  if (!firstXml) throw new Error('Invalid DOCX: missing word/document.xml');

  // Collect all unique namespaces from all docs
  const allNamespaces = new Set<string>();
  
  // Helper to extract namespaces
  const extractNamespaces = (xml: string) => {
    const match = xml.match(/<w:document([^>]+)>/);
    if (match && match[1]) {
      const nsAttrs = match[1].match(/xmlns:[a-zA-Z0-9]+="[^"]*"/g);
      if (nsAttrs) {
        nsAttrs.forEach(ns => allNamespaces.add(ns));
      }
    }
  };

  extractNamespaces(firstXml);

  let combinedBody = '';
  let finalSectPr = '';

  for (let i = 0; i < validBuffers.length; i++) {
    const zip = new PizZip(validBuffers[i]);
    const xml = zip.file('word/document.xml')?.asText();
    if (!xml) continue;

    if (i > 0) extractNamespaces(xml);

    const bodyMatch = xml.match(/<w:body>([\s\S]*?)<\/w:body>/);
    if (!bodyMatch) continue;

    let bodyContent = bodyMatch[1];
    
    // Find the final <w:sectPr>
    // Regex matches <w:sectPr ... /> OR <w:sectPr ...> ... </w:sectPr>
    // We use a simplified approach: extract the last occurrence of <w:sectPr
    const sectPrRegex = /<w:sectPr(?:[\s\S]*?<\/w:sectPr>|\s*\/?>)/g;
    const matches = bodyContent.match(sectPrRegex);
    const lastSectPr = matches ? matches[matches.length - 1] : '';

    if (i < validBuffers.length - 1) {
      if (lastSectPr) {
        const lastIndex = bodyContent.lastIndexOf(lastSectPr);
        if (lastIndex !== -1) {
          // Check if w:type is present, if not add it
          let modifiedSectPr = lastSectPr;
          if (!modifiedSectPr.includes('<w:type')) {
             modifiedSectPr = modifiedSectPr.replace('<w:sectPr', '<w:sectPr><w:type w:val="nextPage"/>');
             if (lastSectPr.endsWith('/>')) {
                modifiedSectPr = modifiedSectPr.replace('/>', '>');
                modifiedSectPr += '</w:sectPr>';
             }
          }
          
          bodyContent = 
            bodyContent.substring(0, lastIndex) + 
            `<w:p><w:pPr>${modifiedSectPr}</w:pPr></w:p>` + 
            bodyContent.substring(lastIndex + lastSectPr.length);
        }
      } else {
        //If no sectPr found, add a manual page break
        bodyContent += '<w:p><w:r><w:br w:type="page"/></w:r></w:p>';
      }
      combinedBody += bodyContent;
    } else {
      if (lastSectPr) {
        const lastIndex = bodyContent.lastIndexOf(lastSectPr);
        if (lastIndex !== -1) {
          bodyContent = 
            bodyContent.substring(0, lastIndex) + 
            bodyContent.substring(lastIndex + lastSectPr.length);
          finalSectPr = lastSectPr;
        }
      }
      combinedBody += bodyContent;
    }
  }

  const namespaceString = Array.from(allNamespaces).join(' ');
  const finalXml = `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>\n<w:document ${namespaceString}><w:body>${combinedBody}${finalSectPr}</w:body></w:document>`;
  
  (firstZip as any).file('word/document.xml', finalXml);
  
  return (firstZip as any).generate({
    type: 'nodebuffer',
    compression: 'DEFLATE',
  }) as Buffer;
}

export function getTemplatePath(formId: string, formsDir: string = FORMS_DIR): string | null {
  const fileName = getTemplateFileName(formId);
  if (!fileName) return null;
  const fullPath = path.join(formsDir, fileName);
  return fs.existsSync(fullPath) ? fullPath : null;
}
