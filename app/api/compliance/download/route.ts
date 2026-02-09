import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import JSZip from 'jszip';
import { isRegisteredForm } from '@/lib/compliance-form-registry';
import {
  convertDocxToPdf,
  getTemplatePath,
  processDocxTemplate,
} from '@/lib/compliance-docx';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complianceId, act, forms, formData, branch: bodyBranch, formId: singleFormId } = body;
    const branch = bodyBranch ?? formData?.branch;

    if (!complianceId || !act || !formData || !branch) {
      return NextResponse.json(
        { error: 'Missing required fields: complianceId, act, formData, branch' },
        { status: 400 }
      );
    }

    const formsList: string[] = Array.isArray(forms) ? forms.map((f: unknown) => String(f).trim()) : [];
    const formIdsToGenerate: string[] =
      singleFormId != null ? [String(singleFormId).trim()] : formsList;

    if (formIdsToGenerate.length === 0) {
      return NextResponse.json(
        { error: 'No forms selected. Select at least one form to generate.' },
        { status: 400 }
      );
    }

    const invalid = formIdsToGenerate.filter((id) => !isRegisteredForm(id));
    if (invalid.length > 0) {
      return NextResponse.json(
        {
          error: `Unknown form type(s): ${invalid.join(', ')}. Only registered forms can be generated.`,
        },
        { status: 400 }
      );
    }

    const { data: branchData, error: branchError } = await supabase
      .from('ka_branches')
      .select('*')
      .eq('branch', branch)
      .single();

    if (branchError) {
      console.error('Branch data fetch error:', branchError);
      return NextResponse.json(
        { error: 'Failed to fetch branch data for the selected branch' },
        { status: 500 }
      );
    }

    let manPowerData: Record<string, unknown>[] = [];
    const { data: manPowerRows, error: manPowerError } = await supabase
      .from('man_power')
      .select('*')
      .eq('branch_name', branch);

    if (!manPowerError && manPowerRows) {
      manPowerData = Array.isArray(manPowerRows) ? manPowerRows : [];
    }

    const docxBuffers: { formId: string; buffer: Buffer }[] = [];
    for (const formId of formIdsToGenerate) {
      const templatePath = getTemplatePath(formId);
      if (!templatePath) {
        return NextResponse.json(
          { error: `Template not found for form ${formId}` },
          { status: 404 }
        );
      }
      const filledDocx = await processDocxTemplate(
        templatePath,
        formId,
        branchData,
        manPowerData,
        formData
      );
      docxBuffers.push({ formId, buffer: filledDocx });
    }

    const preferPdf = process.env.COMPLIANCE_PREFER_PDF !== 'false';
    const pdfBuffers: { formId: string; buffer: Buffer }[] = [];
    for (const { formId, buffer } of docxBuffers) {
      if (preferPdf) {
        const pdf = await convertDocxToPdf(buffer);
        if (pdf) pdfBuffers.push({ formId, buffer: pdf });
      }
    }

    const usePdf = preferPdf && pdfBuffers.length === docxBuffers.length;

    if (formIdsToGenerate.length === 1) {
      const formId = formIdsToGenerate[0];
      const payload = usePdf
        ? (pdfBuffers[0]?.buffer ?? docxBuffers[0].buffer)
        : docxBuffers[0].buffer;
      const ext = usePdf ? 'pdf' : 'docx';
      const contentType = usePdf
        ? 'application/pdf'
        : 'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
      const filename = `Form_${formId}_${complianceId}.${ext}`;
      return new NextResponse(new Uint8Array(payload), {
        status: 200,
        headers: {
          'Content-Type': contentType,
          'Content-Disposition': `attachment; filename="${filename}"`,
        },
      });
    }

    const zip = new JSZip();
    for (let i = 0; i < formIdsToGenerate.length; i++) {
      const formId = formIdsToGenerate[i];
      const ext = usePdf ? 'pdf' : 'docx';
      const buffer = usePdf ? pdfBuffers[i]?.buffer : docxBuffers[i]?.buffer;
      if (buffer) zip.file(`Form_${formId}_${complianceId}.${ext}`, buffer);
    }
    const zipBuffer = await zip.generateAsync({ type: 'nodebuffer' });
    return new NextResponse(new Uint8Array(zipBuffer), {
      status: 200,
      headers: {
        'Content-Type': 'application/zip',
        'Content-Disposition': `attachment; filename="compliance-forms-${complianceId}.zip"`,
      },
    });
  } catch (error) {
    const err = error as { message?: string; properties?: { errors?: unknown[]; explanation?: string } };
    let message = err?.message || (error instanceof Error ? error.message : 'Internal server error');
    if (err?.properties?.errors && Array.isArray(err.properties.errors)) {
      const details = err.properties.errors
        .map((sub: { message?: string; properties?: { explanation?: string } }) =>
          sub?.properties?.explanation || sub?.message || ''
        )
        .filter(Boolean)
        .join('; ');
      if (details) message = `Template error: ${details}`;
    } else if (err?.properties?.explanation) {
      message = `Template error: ${err.properties.explanation}`;
    }
    console.error('Download error:', message, err?.properties ? JSON.stringify(err.properties) : '');
    const status = message.startsWith('Template error:') ? 400 : 500;
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
