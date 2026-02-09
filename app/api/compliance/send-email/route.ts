import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import nodemailer from 'nodemailer';
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

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function isValidEmail(email: string): boolean {
  return EMAIL_REGEX.test(String(email).trim());
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      complianceId,
      act,
      formId,
      recipientEmail,
      formData,
      branch: bodyBranch,
      actName,
    } = body;

    const branch = bodyBranch ?? formData?.branch;

    if (!recipientEmail || !isValidEmail(recipientEmail)) {
      return NextResponse.json(
        { error: 'Valid recipient email is required.' },
        { status: 400 }
      );
    }

    if (!complianceId || !act || !formId || !formData || !branch) {
      return NextResponse.json(
        {
          error:
            'Missing required fields: complianceId, act, formId, formData, branch',
        },
        { status: 400 }
      );
    }

    const formIdStr = String(formId).trim();
    if (!isRegisteredForm(formIdStr)) {
      return NextResponse.json(
        { error: `Unknown form type: ${formIdStr}. Only registered forms can be sent.` },
        { status: 400 }
      );
    }

    const templatePath = getTemplatePath(formIdStr);
    if (!templatePath) {
      return NextResponse.json(
        { error: `Template not found for form ${formIdStr}` },
        { status: 404 }
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

    const docxBuffer = await processDocxTemplate(
      templatePath,
      formIdStr,
      branchData,
      manPowerData,
      formData
    );

    const pdfBuffer = await convertDocxToPdf(docxBuffer);
    if (!pdfBuffer) {
      return NextResponse.json(
        {
          error:
            'PDF conversion is not available. Install LibreOffice to enable email with PDF.',
        },
        { status: 503 }
      );
    }

    const smtpHost = process.env.SMTP_HOST;
    const smtpPort = process.env.SMTP_PORT;
    const smtpUser = process.env.SMTP_USER;
    const smtpPass = process.env.SMTP_PASS;
    const smtpFrom = process.env.SMTP_FROM || smtpUser || 'compliance@example.com';

    if (!smtpHost || !smtpPort) {
      return NextResponse.json(
        {
          error:
            'Email is not configured. Set SMTP_HOST and SMTP_PORT (and optionally SMTP_USER, SMTP_PASS, SMTP_FROM) in environment.',
        },
        { status: 503 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: smtpHost,
      port: Number(smtpPort),
      secure: process.env.SMTP_SECURE === 'true',
      auth:
        smtpUser && smtpPass
          ? { user: smtpUser, pass: smtpPass }
          : undefined,
    });

    const compliancePeriod = new Date().toISOString().slice(0, 7);
    const subject = `Compliance Form ${formIdStr} – ${branch} – ${compliancePeriod}`;
    const formLabel = actName || act || 'Compliance';
    const bodyText = `Please find attached the compliance form (PDF).\n\nForm: ${formIdStr}\nBranch: ${branch}\nCompliance: ${formLabel}\nPeriod: ${compliancePeriod}\n\nThis is an automated message.`;

    await transporter.sendMail({
      from: smtpFrom,
      to: String(recipientEmail).trim(),
      subject,
      text: bodyText,
      attachments: [
        {
          filename: `Form_${formIdStr}_${complianceId}.pdf`,
          content: pdfBuffer,
        },
      ],
    });

    return NextResponse.json({
      success: true,
      message: `Form ${formIdStr} (PDF) sent to ${recipientEmail}.`,
    });
  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : 'Failed to send email.',
      },
      { status: 500 }
    );
  }
}
