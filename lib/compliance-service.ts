import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { isRegisteredForm } from '@/lib/compliance-form-registry';
import {
  convertDocxToPdf,
  getTemplatePath,
  processDocxTemplate,
  mergeDocx,
} from '@/lib/compliance-docx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export interface GenerateDocsOptions {
  complianceId: string;
  act: string;
  forms: string[];
  formData: Record<string, unknown>;
  branch: string;
  singleFormId?: string;
  preferPdf?: boolean;
}

export async function generateComplianceDocs(options: GenerateDocsOptions) {
  const { complianceId, act, forms, formData, branch, singleFormId, preferPdf = false } = options;

  if (!complianceId || !act || !formData || !branch) {
    throw new Error('Missing required fields: complianceId, act, formData, branch');
  }

  const formsList: string[] = Array.isArray(forms) ? [...new Set(forms.map((f: unknown) => String(f).trim()))] : [];
  const formIdsToGenerate: string[] =
    singleFormId != null ? [String(singleFormId).trim()] : formsList;

  if (formIdsToGenerate.length === 0) {
    throw new Error('No forms selected. Select at least one form to generate.');
  }

  const invalid = formIdsToGenerate.filter((id) => !isRegisteredForm(id));
  if (invalid.length > 0) {
    throw new Error(`Unknown form type(s): ${invalid.join(', ')}. Only registered forms can be generated.`);
  }

  const { data: branchData, error: branchError } = await supabase
    .from('ka_branches')
    .select('*')
    .eq('branch', branch)
    .single();

  if (branchError) {
    console.error('Branch data fetch error:', branchError);
    throw new Error('Failed to fetch branch data for the selected branch');
  }

  let manPowerData: Record<string, unknown>[] = [];
  const { data: manPowerRows, error: manPowerError } = await supabase
    .from('man_power')
    .select('*')
    .eq('branch_name', branch);

  if (!manPowerError && manPowerRows) {
    manPowerData = Array.isArray(manPowerRows) ? manPowerRows : [];
    // Deduplicate by PERSON (not by row id). Multiple man_power rows per person (e.g. monthly) must collapse to one.
    // Use employee_id first, then name fields. Do NOT use emp.id (row id) so we get one form per employee, not per row.
    const uniqueEmployees = new Map<string, Record<string, unknown>>();
    for (const emp of manPowerData) {
      const key =
        (emp.employee_id != null && String(emp.employee_id).trim() !== '')
          ? String(emp.employee_id).trim()
          : (emp.employee_name != null && String(emp.employee_name).trim() !== '')
            ? String(emp.employee_name).trim()
            : (emp.empname != null && String(emp.empname).trim() !== '')
              ? String(emp.empname).trim()
              : (emp.name != null && String(emp.name).trim() !== '')
                ? String(emp.name).trim()
                : null;
      const dedupeKey = key ?? `row_${emp.id}`;
      if (!uniqueEmployees.has(dedupeKey)) {
        uniqueEmployees.set(dedupeKey, emp);
      }
    }
    manPowerData = Array.from(uniqueEmployees.values());
  }

  const docxBuffers: { formId: string; buffer: Buffer; filename: string }[] = [];
  
  // If we have manpower data, generate forms grouped by employee
  if (manPowerData.length > 0) {
    // Generate First Page once at the beginning
    const firstPagePath = getTemplatePath('first_page');
    if (firstPagePath) {
      console.log(`Generating Cover Page`);
      // Use the first employee's data for context if available, otherwise just branch data
      const coverContext = manPowerData.length > 0 ? manPowerData[0] : null;
      
      const filledFirstPage = await processDocxTemplate(
        firstPagePath,
        'first_page',
        branchData,
        manPowerData,
        formData,
        coverContext
      );
      docxBuffers.push({ 
        formId: 'first_page', 
        buffer: filledFirstPage, 
        filename: `Cover_Page.docx` 
      });
    }

    // One form per employee per form type (employees × form types). Outer loop = employees, inner = form types.
    for (const employee of manPowerData) {
      const employeeName = String(
        employee?.employee_name ?? employee?.empname ?? employee?.name ?? 'Employee'
      ).replace(/[/\\?%*:|"<>]/g, '-');

      for (const formId of formIdsToGenerate) {
        const templatePath = getTemplatePath(formId);
        if (!templatePath) continue;

        console.log(`Generating Form ${formId} for employee ${employeeName}`);
        const filledDocx = await processDocxTemplate(
          templatePath,
          formId,
          branchData,
          manPowerData,
          formData,
          employee
        );
        docxBuffers.push({ 
          formId, 
          buffer: filledDocx, 
          filename: `${employeeName}_Form_${formId}_${complianceId}.docx` 
        });
      }
    }
  } else {
    // Fallback: regular generation if no manpower data
    for (const formId of formIdsToGenerate) {
      const templatePath = getTemplatePath(formId);
      if (!templatePath) {
        throw new Error(`Template not found for form ${formId}`);
      }
      const filledDocx = await processDocxTemplate(
        templatePath,
        formId,
        branchData,
        manPowerData,
        formData
      );
      docxBuffers.push({ 
        formId, 
        buffer: filledDocx, 
        filename: `Form_${formId}_${complianceId}.docx` 
      });
    }
  }

  const finalBuffers: { filename: string; buffer: Buffer; contentType: string }[] = [];

  for (const { buffer, filename } of docxBuffers) {
    if (preferPdf) {
      const pdf = await convertDocxToPdf(buffer);
      if (pdf) {
        finalBuffers.push({
          filename: filename.replace('.docx', '.pdf'),
          buffer: pdf,
          contentType: 'application/pdf'
        });
        continue;
      }
    }
    finalBuffers.push({
      filename,
      buffer,
      contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    });
  }

  if (finalBuffers.length === 1) {
    const { buffer, filename, contentType } = finalBuffers[0];
    return { buffer, filename, contentType };
  }

  // If we have multiple buffers and they are docx, merge them
  if (finalBuffers.every(b => b.filename.endsWith('.docx'))) {
    try {
      const mergedBuffer = await mergeDocx(finalBuffers.map(b => b.buffer));
      const filename = `Compliance_Forms_${complianceId}.docx`;
      return {
        buffer: mergedBuffer,
        filename,
        contentType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
      };
    } catch (mergeError) {
      console.error('Merge error, falling back to ZIP:', mergeError);
    }
  }

  const zip = new JSZip();
  for (const { filename, buffer } of finalBuffers) {
    zip.file(filename, buffer);
  }
  const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
  return {
    buffer: zipBuffer as Buffer,
    filename: `compliance-forms-${complianceId}.zip`,
    contentType: 'application/zip'
  };
}
