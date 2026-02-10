import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { generateComplianceDocs } from '@/lib/compliance-service';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || ''
);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    let { branchId, formType, employeeIds, complianceId, act, formData, forms } = body;

    if (!complianceId || !act || !branchId) {
      return NextResponse.json(
        { error: 'Missing required fields: complianceId, act, branchId' },
        { status: 400 }
      );
    }

    // If formData is missing, try to fetch it from the database
    if (!formData || Object.keys(formData).length === 0) {
      const { data: dbData, error } = await supabase
        .from('compliance_form_data')
        .select('form_data')
        .eq('compliance_id', complianceId)
        .single();

      if (!error && dbData && dbData.form_data) {
        formData = dbData.form_data;
      } else {
        // Fallback to empty if not found, to allow generating blank forms if necessary
        // or forms populated only with branch/employee data.
        formData = {};
      }
    }

    // Map `formType` to `forms` array expected by generateComplianceDocs
    const formsList = Array.isArray(forms) ? forms : (formType ? [formType] : []);

    const result = await generateComplianceDocs({
      complianceId,
      act,
      forms: formsList,
      formData,
      branch: branchId,
      preferPdf: true,
      // If specific employees are requested, we might need to filter `manPowerData`.
      // The current `generateComplianceDocs` processes ALL employees in the branch for the given form.
      // If we want to filter, we'd need to update `generateComplianceDocs` or `lib/compliance-service.ts`.
      // For now, let's assume it generates for the whole branch as per existing logic, 
      // or we can pass `singleFormId` if it's a single form generation.
    });

    // Determine content type based on result
    const headers = new Headers();
    headers.set('Content-Type', result.contentType);
    headers.set('Content-Disposition', `attachment; filename="${result.filename}"`);

    return new NextResponse(result.buffer, {
      status: 200,
      headers,
    });

  } catch (error: any) {
    console.error('PDF Generation Error:', error);
    return NextResponse.json(
      { error: error.message || 'Failed to generate PDF' },
      { status: 500 }
    );
  }
}
