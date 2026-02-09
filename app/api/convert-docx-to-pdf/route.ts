import { NextRequest, NextResponse } from 'next/server';
import path from 'path';
import { promisify } from 'util';
import { isAllowedDocxFile, sanitizeFileName } from '@/lib/file-utils';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file');

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { success: false, error: 'No file provided. Use form field "file".' },
        { status: 400 }
      );
    }

    const name = (file as File).name || 'document.docx';
    const validation = isAllowedDocxFile(name, file.size);
    if (!validation.ok) {
      return NextResponse.json(
        { success: false, error: validation.error },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const docxBuffer = Buffer.from(arrayBuffer);

    let libre: { convert: (buf: Buffer, ext: string, filter: undefined, cb: (err: Error | null, done: Buffer) => void) => void };
    try {
      libre = require('libreoffice-convert');
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'LibreOffice conversion is not available. Install LibreOffice on the server and ensure the libreoffice-convert package is installed.',
        },
        { status: 503 }
      );
    }

    const convertAsync = promisify(libre.convert);
    let pdfBuffer: Buffer;

    try {
      const done = await convertAsync(docxBuffer, '.pdf', undefined);
      pdfBuffer = Buffer.from(done);
    } catch (convErr) {
      const message = convErr instanceof Error ? convErr.message : 'Conversion failed';
      console.error('LibreOffice convert error:', convErr);
      return NextResponse.json(
        { success: false, error: `Conversion failed: ${message}. Ensure LibreOffice is installed.` },
        { status: 500 }
      );
    }

    const ext = path.extname(name).toLowerCase();
    const baseName = sanitizeFileName(path.basename(name, ext));
    const pdfFileName = `${baseName}.pdf`;

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${pdfFileName}"`,
        'Content-Length': String(pdfBuffer.length),
      },
    });
  } catch (err) {
    console.error('Convert DOCX to PDF error:', err);
    return NextResponse.json(
      {
        success: false,
        error: err instanceof Error ? err.message : 'Internal server error',
      },
      { status: 500 }
    );
  }
}
