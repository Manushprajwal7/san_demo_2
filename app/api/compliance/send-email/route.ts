import { NextRequest, NextResponse } from 'next/server';
import { generateComplianceDocs } from '@/lib/compliance-service';
import nodemailer from 'nodemailer';
import { Resend } from 'resend';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { complianceId, act, forms, formData, branch: bodyBranch, formId: singleFormId, recipientEmail } = body;
    const branch = bodyBranch ?? formData?.branch;

    if (!recipientEmail || typeof recipientEmail !== 'string') {
      return NextResponse.json(
        { error: 'Recipient email is required' },
        { status: 400 }
      );
    }

    const recipients = recipientEmail.split(',').map((e) => e.trim()).filter(Boolean);
    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No valid recipient emails provided.' },
        { status: 400 }
      );
    }

    // Generate the documents using the shared service
    const result = await generateComplianceDocs({
      complianceId,
      act,
      forms,
      formData,
      branch,
      singleFormId,
      preferPdf: process.env.COMPLIANCE_PREFER_PDF === 'true',
    });

    const subject = `Compliance Forms for ${branch} - ${formData?.current_month || 'Generated'}`;
    const text = `Please find attached the generated compliance forms for branch: ${branch}.`;

    // Prefer Resend if API key is set (no Gmail password needed; works immediately)
    const resendApiKey = (process.env.RESEND_API_KEY ?? '').trim();
    if (resendApiKey) {
      const resend = new Resend(resendApiKey);
      const from = (process.env.EMAIL_FROM ?? process.env.EMAIL_USER ?? 'Compliance <onboarding@resend.dev>').trim();
      const attachmentBuffer = Buffer.isBuffer(result.buffer) ? result.buffer : Buffer.from(result.buffer as ArrayBuffer);

      const { data, error } = await resend.emails.send({
        from: from.includes('<') ? from : `Compliance <${from}>`,
        to: recipients,
        subject,
        text,
        attachments: [
          {
            filename: result.filename,
            content: attachmentBuffer,
          },
        ],
      });

      if (error) {
        console.error('Resend error:', error);
        return NextResponse.json(
          { error: 'Failed to send email: ' + (error.message || JSON.stringify(error)) },
          { status: 500 }
        );
      }

      return NextResponse.json({ message: 'Email sent successfully!', id: data?.id }, { status: 200 });
    }

    // Fallback: nodemailer with EMAIL_USER / EMAIL_PASS (Gmail requires App Password, not normal password)
    const emailUser = (process.env.EMAIL_USER ?? '').trim();
    const emailPass = (process.env.EMAIL_PASS ?? '').trim();
    if (!emailUser || !emailPass) {
      return NextResponse.json(
        {
          error:
            'Email not configured. Add RESEND_API_KEY to .env (recommended, free at resend.com) or set EMAIL_USER and EMAIL_PASS for SMTP.',
        },
        { status: 500 }
      );
    }

    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: Number(process.env.SMTP_PORT) || 465,
      secure: process.env.SMTP_SECURE !== 'false',
      auth: { user: emailUser, pass: emailPass },
    });

    const mailOptions = {
      from: emailUser,
      to: recipients.join(', '),
      subject,
      text,
      attachments: [
        {
          filename: result.filename,
          content: result.buffer,
          contentType: result.contentType,
        },
      ],
    };

    await transporter.sendMail(mailOptions);
    return NextResponse.json({ message: 'Email sent successfully!' }, { status: 200 });
  } catch (error: unknown) {
    console.error('Email sending error:', error);
    const message = error instanceof Error ? error.message : 'Internal server error';
    if (message.includes('Template error') || message.includes('No forms selected')) {
      return NextResponse.json({ error: message }, { status: 400 });
    }
    return NextResponse.json({ error: 'Failed to send email: ' + message }, { status: 500 });
  }
}
