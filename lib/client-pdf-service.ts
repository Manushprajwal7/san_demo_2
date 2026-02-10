

interface Employee {
  id: string;
  name: string;
  department?: string | { name: string };
  position?: string;
  email?: string;
  phone?: string;
  hireDate?: string;
  employmentType?: string;
  branch?: string;
  manager?: string;
}

interface PdfFile {
  filename: string;
  blob: Blob;
  employee: string;
}

class ClientPDFService {
  // Generate employee form HTML
  static generateEmployeeFormHTML(employee: Employee, formType: string): string {
    return `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          /* Modern, professional styling */
          @import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Roboto:wght@300;400;500&display=swap');
          
          * { margin: 0; padding: 0; box-sizing: border-box; }
          
          body {
            font-family: 'Inter', sans-serif;
            line-height: 1.6;
            color: #1a1a1a;
            background: #ffffff;
            padding: 20px;
          }
          
          .form-container {
            max-width: 210mm;
            margin: 0 auto;
            padding: 25mm;
            border: 1px solid #e1e5e9;
            border-radius: 8px;
            position: relative;
            background: white;
            box-shadow: 0 2px 10px rgba(0,0,0,0.05);
          }
          
          .header-section {
            text-align: center;
            margin-bottom: 30px;
            padding-bottom: 20px;
            border-bottom: 2px solid #3b82f6;
          }
          
          .company-logo-placeholder {
            width: 120px;
            height: 60px;
            background: linear-gradient(135deg, #3b82f6, #1d4ed8);
            margin: 0 auto 15px;
            border-radius: 4px;
            display: flex;
            align-items: center;
            justify-content: center;
            color: white;
            font-weight: bold;
          }
          
          .form-title {
            font-size: 24px;
            font-weight: 700;
            color: #1e40af;
            margin-bottom: 5px;
            text-transform: uppercase;
            letter-spacing: 0.5px;
          }
          
          .form-subtitle {
            font-size: 14px;
            color: #64748b;
            font-weight: 400;
          }
          
          .employee-section {
            margin-bottom: 25px;
          }
          
          .section-title {
            font-size: 16px;
            font-weight: 600;
            color: #334155;
            margin-bottom: 15px;
            padding-bottom: 8px;
            border-bottom: 1px solid #e2e8f0;
            display: flex;
            align-items: center;
          }
          
          .section-title:before {
            content: "•";
            color: #3b82f6;
            margin-right: 8px;
            font-size: 20px;
          }
          
          .info-grid {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 15px;
            margin-bottom: 20px;
          }
          
          .info-item {
            display: flex;
            flex-direction: column;
          }
          
          .info-label {
            font-size: 12px;
            font-weight: 500;
            color: #64748b;
            margin-bottom: 4px;
            text-transform: uppercase;
            letter-spacing: 0.3px;
          }
          
          .info-value {
            font-size: 14px;
            padding: 8px 12px;
            background: #f8fafc;
            border: 1px solid #e2e8f0;
            border-radius: 4px;
            color: #1e293b;
          }
          
          .signature-section {
            margin-top: 40px;
            padding-top: 25px;
            border-top: 2px solid #e2e8f0;
          }
          
          .signature-area {
            margin-top: 40px;
          }
          
          .signature-line {
            width: 250px;
            height: 1px;
            background: #1e293b;
            margin: 30px 0 5px;
          }
          
          .signature-label {
            font-size: 12px;
            color: #64748b;
            margin-top: 5px;
          }
          
          .footer {
            margin-top: 50px;
            padding-top: 20px;
            border-top: 1px solid #e2e8f0;
            font-size: 11px;
            color: #94a3b8;
            text-align: center;
          }
          
          .qr-code-placeholder {
            width: 80px;
            height: 80px;
            background: #f1f5f9;
            margin: 20px auto;
            display: flex;
            align-items: center;
            justify-content: center;
            color: #94a3b8;
            font-size: 10px;
          }
          
          .watermark {
            position: absolute;
            font-size: 120px;
            font-weight: 900;
            color: rgba(59, 130, 246, 0.03);
            transform: rotate(-45deg);
            z-index: 0;
            top: 40%;
            left: 15%;
            white-space: nowrap;
            pointer-events: none;
          }
          
          .form-id {
            position: absolute;
            top: 20px;
            right: 25px;
            font-size: 10px;
            color: #94a3b8;
            background: #f8fafc;
            padding: 4px 8px;
            border-radius: 3px;
            border: 1px solid #e2e8f0;
          }
          
          /* Print optimizations */
          @media print {
            body { padding: 0; }
            .form-container { 
              border: none; 
              box-shadow: none;
              padding: 0;
            }
            .watermark { opacity: 0.1; }
          }
        </style>
      </head>
      <body>
        <div class="form-container">
          <div class="watermark">${formType.toUpperCase()}</div>
          
          <div class="form-id">
            ID: ${formType.toUpperCase().substring(0, 3)}-${employee.id}-${Date.now().toString().slice(-6)}
          </div>
          
          <div class="header-section">
            <div class="company-logo-placeholder">
              COMPANY
            </div>
            <h1 class="form-title">${this.formatFormTitle(formType)}</h1>
            <div class="form-subtitle">Employee Compliance Form</div>
          </div>
          
          <div class="employee-section">
            <div class="section-title">Employee Information</div>
            <div class="info-grid">
              ${this.generateEmployeeInfoHTML(employee)}
            </div>
          </div>
          
          <div class="employee-section">
            <div class="section-title">Form Details</div>
            <div class="info-grid">
              <div class="info-item">
                <div class="info-label">Form Type</div>
                <div class="info-value">${this.formatFormTitle(formType)}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Generated Date</div>
                <div class="info-value">${new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Effective Date</div>
                <div class="info-value">${new Date().toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
              </div>
              <div class="info-item">
                <div class="info-label">Expiration Date</div>
                <div class="info-value">${new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</div>
              </div>
            </div>
          </div>
          
          ${this.generateFormSpecificHTML(formType, employee)}
          
          <div class="signature-section">
            <div class="section-title">Acknowledgement & Signature</div>
            <p style="margin-bottom: 20px; color: #475569; font-size: 14px;">
              I acknowledge that I have received, read, and understand the information contained in this 
              ${this.formatFormTitle(formType)} form. I agree to comply with all policies and procedures outlined herein.
            </p>
            
            <div class="signature-area">
              <div style="display: flex; justify-content: space-between; margin-top: 40px;">
                <div>
                  <div class="signature-line"></div>
                  <div class="signature-label">Employee Signature</div>
                  <div style="margin-top: 20px; font-size: 13px; color: #475569;">
                    Name: ${employee.name}<br>
                    Date: ____________________
                  </div>
                </div>
                
                <div>
                  <div class="signature-line"></div>
                  <div class="signature-label">Manager/Supervisor Signature</div>
                  <div style="margin-top: 20px; font-size: 13px; color: #475569;">
                    Name: ____________________<br>
                    Title: ____________________<br>
                    Date: ____________________
                  </div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="footer">
            <p>This document is electronically generated and valid without signature</p>
            <p>Generated by Compliance System • ${new Date().toLocaleString()}</p>
            <div class="qr-code-placeholder">
              QR Code<br>For Verification
            </div>
            <p style="margin-top: 10px; font-size: 10px; color: #cbd5e1;">
              Document ID: ${formType.toUpperCase()}-${employee.id}-${Date.now()}<br>
              Confidential - For Internal Use Only
            </p>
          </div>
        </div>
      </body>
      </html>
    `;
  }

  static formatFormTitle(formType: string): string {
    return formType
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  static generateEmployeeInfoHTML(employee: Employee): string {
    const deptName = typeof employee.department === 'string' 
      ? employee.department 
      : employee.department?.name || 'N/A';

    const fields = [
      { label: 'Full Name', value: employee.name || 'N/A' },
      { label: 'Employee ID', value: employee.id || 'N/A' },
      { label: 'Department', value: deptName },
      { label: 'Position', value: employee.position || 'N/A' },
      { label: 'Email Address', value: employee.email || 'N/A' },
      { label: 'Phone Number', value: employee.phone || 'N/A' },
      { label: 'Hire Date', value: employee.hireDate ? 
        new Date(employee.hireDate).toLocaleDateString() : 'N/A' },
      { label: 'Employment Type', value: employee.employmentType || 'N/A' },
      { label: 'Location/Branch', value: employee.branch || 'N/A' },
      { label: 'Manager', value: employee.manager || 'N/A' }
    ];

    return fields.map(field => `
      <div class="info-item">
        <div class="info-label">${field.label}</div>
        <div class="info-value">${field.value}</div>
      </div>
    `).join('');
  }

  static generateFormSpecificHTML(formType: string, employee: Employee): string {
    const templates: Record<string, string> = {
      'nda': `
        <div class="employee-section">
          <div class="section-title">Non-Disclosure Agreement</div>
          <div style="color: #475569; font-size: 13px; line-height: 1.7;">
            <p>1. <strong>Confidential Information</strong>: Employee agrees to protect all proprietary information.</p>
            <p>2. <strong>Non-Disclosure</strong>: Employee will not disclose any confidential information.</p>
            <p>3. <strong>Return of Materials</strong>: Upon termination, all materials will be returned.</p>
            <p>4. <strong>Duration</strong>: This agreement remains in effect indefinitely.</p>
          </div>
        </div>
      `,
      'code_of_conduct': `
        <div class="employee-section">
          <div class="section-title">Code of Conduct</div>
          <div style="color: #475569; font-size: 13px; line-height: 1.7;">
            <p>• Maintain professional behavior at all times</p>
            <p>• Report any unethical behavior immediately</p>
            <p>• Protect company assets and information</p>
            <p>• Comply with all laws and regulations</p>
            <p>• Treat all colleagues with respect</p>
          </div>
        </div>
      `,
      'safety_agreement': `
        <div class="employee-section">
          <div class="section-title">Safety Agreement</div>
          <div style="color: #475569; font-size: 13px; line-height: 1.7;">
            <p>✓ Follow all safety procedures and protocols</p>
            <p>✓ Report any unsafe conditions immediately</p>
            <p>✓ Use personal protective equipment as required</p>
            <p>✓ Participate in safety training sessions</p>
            <p>✓ Maintain a clean and organized workspace</p>
          </div>
        </div>
      `
    };

    return templates[formType] || `
      <div class="employee-section">
        <div class="section-title">Compliance Requirements</div>
        <div style="color: #475569; font-size: 13px; line-height: 1.7;">
          <p>By signing this document, you acknowledge your responsibility to comply with 
          all company policies and procedures related to ${this.formatFormTitle(formType)}.</p>
        </div>
      </div>
    `;
  }

  // Generate single PDF
  static async generatePDF(htmlContent: string, filename: string = 'document.pdf'): Promise<boolean> {
    const element = document.createElement('div');
    element.innerHTML = htmlContent;
    document.body.appendChild(element);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true
      }
    };

    try {
      // @ts-ignore - html2pdf types might not be perfect
      await html2pdf().set(opt).from(element).save();
      return true;
    } catch (error) {
      console.error('PDF generation failed:', error);
      throw error;
    } finally {
      document.body.removeChild(element);
    }
  }

  // Generate merged PDF for multiple employees
  static async generateMergedPDF(employees: Employee[], formType: string, filename: string = 'combined_forms.pdf'): Promise<void> {
    const container = document.createElement('div');
    
    // Generate HTML for each employee and append to container
    employees.forEach((employee, index) => {
      const html = this.generateEmployeeFormHTML(employee, formType);
      const wrapper = document.createElement('div');
      wrapper.innerHTML = html;
      
      // Add page break before every form except the first one
      if (index > 0) {
        wrapper.style.pageBreakBefore = 'always';
        // HTML2PDF specific page break class if needed, but CSS usually works
        wrapper.classList.add('html2pdf__page-break'); 
      }
      
      container.appendChild(wrapper);
    });

    document.body.appendChild(container);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: filename,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff',
        // Improve performance for large documents
        windowWidth: container.scrollWidth,
        windowHeight: container.scrollHeight
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait',
        compress: true 
      },
      // Pagebreak configuration
      pagebreak: { mode: ['avoid-all', 'css', 'legacy'] }
    };

    try {
      // @ts-ignore
      await html2pdf().set(opt).from(container).save();
    } catch (error) {
      console.error('Merged PDF generation failed:', error);
      throw error;
    } finally {
      document.body.removeChild(container);
    }
  }

  // Preview PDF in new tab
  static async previewPDF(employee: Employee, formType: string): Promise<void> {
    const html = this.generateEmployeeFormHTML(employee, formType);
    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);

    const opt = {
      margin: [10, 10, 10, 10],
      filename: `preview_${employee.name}.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 1.5,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
      },
      jsPDF: { 
        unit: 'mm', 
        format: 'a4', 
        orientation: 'portrait'
      }
    };

    // @ts-ignore
    const pdf = await html2pdf().set(opt).from(element).output('blob');
    document.body.removeChild(element);
    
    const pdfUrl = URL.createObjectURL(pdf as Blob);
    window.open(pdfUrl, '_blank');
    
    // Clean up URL after some time
    setTimeout(() => URL.revokeObjectURL(pdfUrl), 60000);
  }
}

export default ClientPDFService;
