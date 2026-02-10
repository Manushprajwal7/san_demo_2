import { NextRequest, NextResponse } from 'next/server';
import { generateComplianceDocs } from '@/lib/compliance-service';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complianceId, act, forms, formData, branch: bodyBranch, formId: singleFormId } = body;
    const branch = bodyBranch ?? formData?.branch;

    const result = await generateComplianceDocs({
      complianceId,
      act,
      forms,
      formData,
      branch,
      singleFormId,
      preferPdf: process.env.COMPLIANCE_PREFER_PDF === 'true'
    });

    return new NextResponse(new Uint8Array(result.buffer), {
      status: 200,
      headers: {
        'Content-Type': result.contentType,
        'Content-Disposition': `attachment; filename="${result.filename}"`,
      },
    });

  } catch (error: any) {
    console.error('Download error:', error);
    const message = error.message || 'Internal server error';
    const status = message.includes('Template error') || message.includes('Missing required') || message.includes('No forms selected') ? 400 : 500;
    
    return NextResponse.json(
      { error: message },
      { status }
    );
  }
}
