
"use client";

import React, { useState } from 'react';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import ClientPDFService from '@/lib/client-pdf-service';
import './pdf-generator.css';
import { X, FileText, Download, Eye, Check } from 'lucide-react';

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

interface ClientPDFGeneratorProps {
  employees: Employee[];
  formType: string;
  onClose: () => void;
}

const ClientPDFGenerator: React.FC<ClientPDFGeneratorProps> = ({ employees, formType, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [selectedEmployees, setSelectedEmployees] = useState<string[]>(employees.map(e => e.id));

  // Toggle employee selection
  const toggleEmployee = (employeeId: string) => {
    setSelectedEmployees(prev => 
      prev.includes(employeeId)
        ? prev.filter(id => id !== employeeId)
        : [...prev, employeeId]
    );
  };

  // Select all
  const selectAll = () => {
    setSelectedEmployees(employees.map(emp => emp.id));
  };

  // Clear selection
  const clearSelection = () => {
    setSelectedEmployees([]);
  };

  // Generate single PDF
  const handleGenerateSingle = async (employee: Employee) => {
    try {
      setIsGenerating(true);
      const html = ClientPDFService.generateEmployeeFormHTML(employee, formType);
      await ClientPDFService.generatePDF(html, `${formType}_${employee.name}.pdf`);
      toast.success(`PDF generated for ${employee.name}`);
    } catch (error: any) {
      toast.error(`Failed to generate PDF: ${error.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  // Generate merged PDF
  const handleGenerateAll = async () => {
    if (selectedEmployees.length === 0) {
      toast.error('Please select at least one employee');
      return;
    }

    setIsGenerating(true);
    setProgress(10);

    try {
      // Filter selected employees
      const selectedEmployeeData = employees.filter(emp => 
        selectedEmployees.includes(emp.id)
      );

      setProgress(30);
      
      const filename = `${formType}_forms_${new Date().toISOString().split('T')[0]}.pdf`;
      await ClientPDFService.generateMergedPDF(selectedEmployeeData, formType, filename);
      
      setProgress(100);
      toast.success(`Generated merged PDF for ${selectedEmployees.length} employees`);
      
    } catch (error: any) {
      console.error('PDF generation error:', error);
      toast.error(`Generation failed: ${error.message}`);
    } finally {
      setIsGenerating(false);
      setTimeout(() => setProgress(0), 1000);
    }
  };

  // Preview PDF
  const handlePreview = async (employee: Employee) => {
    try {
      await ClientPDFService.previewPDF(employee, formType);
    } catch (error) {
      toast.error('Preview failed');
    }
  };

  return (
    <div className="pdf-generator-modal">
      <ToastContainer position="top-right" autoClose={3000} />
      
      <div className="modal-content">
        <div className="modal-header">
          <h2>Generate PDF Forms</h2>
          <button className="close-btn" onClick={onClose}>
            <X size={24} />
          </button>
        </div>

        {/* Form Info */}
        <div className="form-info-card">
          <div className="form-icon">
            <FileText className="text-blue-600" size={32} />
          </div>
          <div>
            <h3>{ClientPDFService.formatFormTitle(formType)} Form</h3>
            <p className="text-gray-500 text-sm">Generate PDF documents for selected employees</p>
          </div>
          <div className="form-stats">
            <span className="stat">{employees.length} Employees</span>
            <span className="stat">{selectedEmployees.length} Selected</span>
          </div>
        </div>

        {/* Employee Selection */}
        <div className="selection-section">
          <div className="section-header">
            <h4>Select Employees</h4>
            <div className="selection-actions">
              <button onClick={selectAll} className="btn-secondary text-xs">
                Select All
              </button>
              <button onClick={clearSelection} className="btn-secondary text-xs">
                Clear All
              </button>
            </div>
          </div>
          
          <div className="employee-grid">
            {employees.map(employee => (
              <div 
                key={employee.id}
                className={`employee-card ${selectedEmployees.includes(employee.id) ? 'selected' : ''}`}
                onClick={() => toggleEmployee(employee.id)}
              >
                <div className="flex items-start pt-1">
                  <div className={`w-4 h-4 rounded border flex items-center justify-center ${selectedEmployees.includes(employee.id) ? 'bg-blue-600 border-blue-600' : 'border-gray-300'}`}>
                    {selectedEmployees.includes(employee.id) && <Check size={12} className="text-white" />}
                  </div>
                </div>
                
                <div className="card-content flex items-center">
                  <div className="employee-avatar">
                    {employee.name.charAt(0).toUpperCase()}
                  </div>
                  <div>
                    <h5 className="font-medium text-sm text-gray-900">{employee.name}</h5>
                    <p className="employee-details">
                      {typeof employee.department === 'string' ? employee.department : employee.department?.name} • {employee.position}
                    </p>
                  </div>
                </div>
                
                <div className="card-actions">
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handlePreview(employee);
                    }}
                    className="btn-preview flex items-center gap-1"
                    disabled={isGenerating}
                    title="Preview PDF"
                  >
                    <Eye size={12} /> Preview
                  </button>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGenerateSingle(employee);
                    }}
                    className="btn-single flex items-center gap-1"
                    disabled={isGenerating}
                    title="Download Single PDF"
                  >
                    <Download size={12} /> Single
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Generation Progress */}
        {isGenerating && (
          <div className="progress-section">
            <div className="progress-label flex justify-between text-sm font-medium text-gray-700 mb-2">
              <span>Generating PDFs...</span>
              <span>{Math.round(progress)}%</span>
            </div>
            <div className="progress-bar">
              <div 
                className="progress-fill"
                style={{ width: `${progress}%` }}
              />
            </div>
            <div className="progress-details mt-2">
              Processing {selectedEmployees.length} forms • 
              Estimated time: {Math.ceil(selectedEmployees.length * 2)} seconds
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="action-buttons">
          <button
            onClick={onClose}
            disabled={isGenerating}
            className="btn-cancel"
          >
            Cancel
          </button>
          
          <button
            onClick={handleGenerateAll}
            disabled={isGenerating || selectedEmployees.length === 0}
            className="btn-primary"
          >
            {isGenerating ? (
              <>
                <span className="spinner"></span>
                Generating...
              </>
            ) : (
              <>
                <Download size={18} />
                Generate {selectedEmployees.length} PDF{selectedEmployees.length !== 1 ? 's' : ''}
              </>
            )}
          </button>
        </div>

        {/* Features List */}
        <div className="features-section">
          <h4>Features:</h4>
          <ul>
            <li>✅ High-quality PDF generation in browser</li>
            <li>✅ Professional templates with watermarks</li>
            <li>✅ Merged single PDF for multiple employees</li>
            <li>✅ Individual preview before download</li>
            <li>✅ No server processing required</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ClientPDFGenerator;
