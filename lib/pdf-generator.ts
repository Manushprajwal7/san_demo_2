import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export interface ComplianceData {
  id: string;
  state: string;
  district: string;
  taluk: string;
  table?: string;
  employee: string;
  forms: string[];
  submittedAt?: string;
}

/**
 * Generate PDF for compliance submission
 */
export function generateCompliancePDF(data: ComplianceData): jsPDF {
  const doc = new jsPDF();

  // Add title
  doc.setFontSize(20);
  doc.setFont("helvetica", "bold");
  doc.text("Compliance Submission Report", 105, 20, { align: "center" });

  // Add submission ID and date
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Submission ID: ${data.id}`, 20, 35);

  const submittedDate = data.submittedAt
    ? new Date(data.submittedAt).toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : new Date().toLocaleString("en-IN", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });

  doc.text(`Date: ${submittedDate}`, 20, 42);

  // Add horizontal line
  doc.setLineWidth(0.5);
  doc.line(20, 48, 190, 48);

  // Location Information Section
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Location Information", 20, 58);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const locationData = [
    ["State", data.state],
    ["District", data.district],
    ["Taluk", data.taluk],
  ];

  autoTable(doc, {
    startY: 62,
    head: [],
    body: locationData,
    theme: "plain",
    styles: {
      fontSize: 11,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  // Employee Information Section
  const currentY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Employee Information", 20, currentY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");

  const employeeData = [["Employee Name", data.employee]];

  if (data.table) {
    employeeData.push(["Table/Department", data.table]);
  }

  autoTable(doc, {
    startY: currentY + 4,
    head: [],
    body: employeeData,
    theme: "plain",
    styles: {
      fontSize: 11,
      cellPadding: 3,
    },
    columnStyles: {
      0: { fontStyle: "bold", cellWidth: 50 },
      1: { cellWidth: 120 },
    },
  });

  // Forms Section
  const formsY = (doc as any).lastAutoTable.finalY + 10;

  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("Selected Forms", 20, formsY);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(`Total Forms: ${data.forms.length}`, 20, formsY + 7);

  // Create forms table
  const formsTableData = data.forms.map((form, index) => [
    (index + 1).toString(),
    form,
  ]);

  autoTable(doc, {
    startY: formsY + 12,
    head: [["#", "Form Name"]],
    body: formsTableData,
    theme: "striped",
    headStyles: {
      fillColor: [71, 85, 105], // Gray-700
      textColor: 255,
      fontStyle: "bold",
      fontSize: 11,
    },
    styles: {
      fontSize: 10,
      cellPadding: 4,
    },
    columnStyles: {
      0: { cellWidth: 15, halign: "center" },
      1: { cellWidth: 155 },
    },
  });

  // Add footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(9);
    doc.setFont("helvetica", "normal");
    doc.setTextColor(128, 128, 128);

    // Footer text
    doc.text("This is a system-generated document.", 105, 285, {
      align: "center",
    });

    // Page number
    doc.text(`Page ${i} of ${pageCount}`, 190, 285, { align: "right" });
  }

  return doc;
}

/**
 * Download compliance PDF
 */
export function downloadCompliancePDF(data: ComplianceData): void {
  const doc = generateCompliancePDF(data);
  const fileName = `Compliance_${data.id}_${Date.now()}.pdf`;
  doc.save(fileName);
}

/**
 * Preview compliance PDF in new tab
 */
export function previewCompliancePDF(data: ComplianceData): void {
  const doc = generateCompliancePDF(data);
  const pdfBlob = doc.output("blob");
  const url = URL.createObjectURL(pdfBlob);
  window.open(url, "_blank");
}


/**
 * Get compliance PDF as blob
 */
export function getCompliancePDFBlob(data: ComplianceData): Blob {
  const doc = generateCompliancePDF(data);
  return doc.output("blob");
}

/**
 * Download generated compliance forms (PDF/ZIP) from backend
 */
export async function downloadComplianceFormsPDF(data: {
  complianceId: string;
  act: string;
  forms: string[];
  branchId: string;
  formData?: Record<string, any>;
}): Promise<{ contentType: string }> {
  const response = await fetch('/api/compliance/generate-pdfs', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      complianceId: data.complianceId,
      act: data.act,
      forms: data.forms,
      branchId: data.branchId,
      formData: data.formData,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || 'Failed to generate PDF');
  }

  const blob = await response.blob();
  const disposition = response.headers.get('Content-Disposition');
  let filename = `Compliance_Forms_${data.complianceId}.pdf`;
  
  if (disposition) {
    const match = disposition.match(/filename="?([^";\n]+)"?/);
    if (match) {
      filename = match[1];
    }
  }

  const url = window.URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  window.URL.revokeObjectURL(url);
  document.body.removeChild(a);

  return { contentType: response.headers.get('Content-Type') || '' };
}
