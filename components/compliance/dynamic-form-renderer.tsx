"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { FormTemplate, FormField } from "@/lib/form-templates";
import { toast } from "sonner";
import { FileText, Download, Save, Eye, Building2, Users, MapPin, Phone, Mail } from "lucide-react";

interface DynamicFormRendererProps {
  templates: Record<string, FormTemplate>;
  selectedForms: string[];
  complianceData: {
    id?: string;
    state: string;
    district: string;
    branch: string;
    act: string;
    actName: string;
  };
  onSave?: (formData: Record<string, any>) => void;
  onPreview?: (formData: Record<string, any>) => void;
}

interface BranchData {
  id: string;
  branch: string;
  district: string;
  geography: string;
  asm: string;
  email: string;
  phone_no: string;
  address_i: string;
  name_of_the_manager: string;
  designation: string;
  contact_no: string;
  email_id: string;
  license_no: string;
  license_date: string;
  date_of_renewal: string;
  number_of_years_renewed: number;
  state_head: string;
  sales_head: string;
  approved_manpower: number;
  male: number;
  female: number;
  fee: number;
  opened_on: string;
  // Add other fields as needed
}

export default function DynamicFormRenderer({
  templates,
  selectedForms,
  complianceData,
  onSave,
  onPreview
}: DynamicFormRendererProps) {
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [activeForm, setActiveForm] = useState<string>(selectedForms[0] || "");
  const [isSaving, setIsSaving] = useState(false);
  const [branchData, setBranchData] = useState<BranchData | null>(null);
  const [loadingBranchData, setLoadingBranchData] = useState(false);

  // Fetch branch data when component mounts or compliance data changes
  useEffect(() => {
    const fetchBranchData = async () => {
      if (complianceData.branch && complianceData.state === "Karnataka") {
        setLoadingBranchData(true);
        try {
          const response = await fetch(`/api/employees?table=ka_branches&branch=${encodeURIComponent(complianceData.branch)}`);
          if (response.ok) {
            const data = await response.json();
            const branch = data.employees?.find((b: BranchData) => b.branch === complianceData.branch);
            if (branch) {
              setBranchData(branch);
              // Auto-fill form fields with branch data
              autoFillFormFields(branch);
            }
          } else {
            console.error('Failed to fetch branch data');
          }
        } catch (error) {
          console.error('Error fetching branch data:', error);
        } finally {
          setLoadingBranchData(false);
        }
      }
    };

    fetchBranchData();
  }, [complianceData.branch, complianceData.state]);

  // Auto-fill form fields with branch data
  const autoFillFormFields = (branch: BranchData) => {
    const autoFilledData: Record<string, any> = {};
    
    selectedForms.forEach((formId) => {
      // Common fields that apply to most forms
      autoFilledData[`${formId}_establishment_name`] = branch.branch || "";
      autoFilledData[`${formId}_address`] = branch.address_i || "";
      autoFilledData[`${formId}_owner_name`] = branch.name_of_the_manager || "";
      autoFilledData[`${formId}_contact_number`] = branch.contact_no || branch.phone_no || "";
      autoFilledData[`${formId}_email`] = branch.email_id || branch.email || "";
      autoFilledData[`${formId}_number_of_employees`] = branch.approved_manpower || 0;
      autoFilledData[`${formId}_male_employees`] = branch.male || 0;
      autoFilledData[`${formId}_female_employees`] = branch.female || 0;
      autoFilledData[`${formId}_total_employees`] = branch.approved_manpower || 0;
      autoFilledData[`${formId}_total_wages_paid`] = branch.approved_manpower ? branch.approved_manpower * 15000 : 0; // Estimate
      autoFilledData[`${formId}_date_of_commencement`] = branch.opened_on || "";
      autoFilledData[`${formId}_date_of_issue`] = branch.license_date || "";
      autoFilledData[`${formId}_registration_number`] = branch.license_no || "";
      autoFilledData[`${formId}_valid_upto`] = branch.date_of_renewal || "";
      
      // Form-specific fields
      if (formId === 'A' || formId === '1') {
        autoFilledData[`${formId}_financial_year`] = new Date().getFullYear().toString();
      }
      
      if (formId === 'B' || formId === '2') {
        autoFilledData[`${formId}_month`] = new Date().toLocaleString('default', { month: 'long' });
        autoFilledData[`${formId}_year`] = new Date().getFullYear();
      }
      
      if (formId === '4') {
        autoFilledData[`${formId}_designation`] = branch.designation || "";
        autoFilledData[`${formId}_wages_per_month`] = 15000; // Default estimate
        autoFilledData[`${formId}_weekly_off`] = "Sunday";
      }
    });

    setFormData(prev => ({ ...prev, ...autoFilledData }));
  };

  const handleFieldChange = (formId: string, fieldId: string, value: any) => {
    setFormData(prev => ({
      ...prev,
      [`${formId}_${fieldId}`]: value
    }));
  };

  const getFieldValue = (formId: string, fieldId: string) => {
    return formData[`${formId}_${fieldId}`] || "";
  };

  const renderField = (formId: string, field: FormField) => {
    const fieldId = `${formId}_${field.id}`;
    const value = getFieldValue(formId, field.id);

    switch (field.type) {
      case 'text':
        return (
          <Input
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full"
          />
        );

      case 'number':
        return (
          <Input
            id={fieldId}
            type="number"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.id, e.target.value)}
            min={field.validation?.min}
            max={field.validation?.max}
            required={field.required}
            className="w-full"
          />
        );

      case 'date':
        return (
          <Input
            id={fieldId}
            type="date"
            value={value}
            onChange={(e) => handleFieldChange(formId, field.id, e.target.value)}
            required={field.required}
            className="w-full"
          />
        );

      case 'textarea':
        return (
          <Textarea
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.id, e.target.value)}
            placeholder={field.placeholder}
            required={field.required}
            className="w-full min-h-[100px]"
          />
        );

      case 'select':
        return (
          <Select
            value={value}
            onValueChange={(newValue) => handleFieldChange(formId, field.id, newValue)}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder={`Select ${field.label}`} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={fieldId}
              checked={value || false}
              onCheckedChange={(checked) => handleFieldChange(formId, field.id, checked)}
            />
            <Label htmlFor={fieldId} className="text-sm">
              I confirm this information is correct
            </Label>
          </div>
        );

      default:
        return (
          <Input
            id={fieldId}
            value={value}
            onChange={(e) => handleFieldChange(formId, field.id, e.target.value)}
            placeholder={field.placeholder}
            className="w-full"
          />
        );
    }
  };

  const downloadSingleForm = async (formId: string) => {
    try {
      const response = await fetch('/api/compliance/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complianceId: complianceData.id || `COMP-${Date.now()}`,
          act: complianceData.act,
          forms: [formId],
          formId,
          formData: formData,
          state: complianceData.state,
          district: complianceData.district,
          branch: complianceData.branch,
        }),
      });

      if (!response.ok) {
        const body = await response.json().catch(() => ({}));
        const message = body?.error || response.statusText || `Failed to download Form ${formId}`;
        throw new Error(message);
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const ext = match?.[1]?.includes('.pdf') ? 'pdf' : 'docx';
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = match?.[1]?.trim() || `Form_${formId}_${complianceData.branch}_${Date.now()}.${ext}`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error(`Error downloading Form ${formId}:`, error);
      throw error;
    }
  };

  const handleSave = async () => {
    try {
      for (const formId of selectedForms) {
        await downloadSingleForm(formId);
      }
      if (onSave) {
        await onSave(formData);
      }
      toast.success(selectedForms.length > 1 ? "Forms downloaded." : "Form downloaded.");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Download failed.";
      toast.error(message);
    }
  };

  const handlePreview = () => {
    if (onPreview) {
      onPreview(formData);
    }
  };

  const getFormDataForForm = (formId: string) => {
    const formFields: Record<string, any> = {};
    Object.keys(formData).forEach(key => {
      if (key.startsWith(`${formId}_`)) {
        const fieldId = key.replace(`${formId}_`, '');
        formFields[fieldId] = formData[key];
      }
    });
    return formFields;
  };

  const isFormComplete = (formId: string) => {
    const template = templates[formId];
    if (!template) return false;

    return template.fields.every(field => {
      if (!field.required) return true;
      const value = getFieldValue(formId, field.id);
      return value !== "" && value !== null && value !== undefined;
    });
  };

  const isAllFormsComplete = selectedForms.every(formId => isFormComplete(formId));

  return (
    <div className="space-y-6">
      {/* Form Tabs */}
      <div className="border-b">
        <div className="flex space-x-1 overflow-x-auto">
          {selectedForms.map((formId) => {
            const template = templates[formId];
            const isComplete = isFormComplete(formId);
            
            return (
              <button
                key={formId}
                onClick={() => setActiveForm(formId)}
                className={`px-4 py-2 border-b-2 font-medium text-sm whitespace-nowrap transition-colors ${
                  activeForm === formId
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>Form {formId}</span>
                  {isComplete ? (
                    <Badge variant="default" className="bg-green-500 text-white text-xs">
                      ✓
                    </Badge>
                  ) : (
                    <Badge variant="outline" className="text-xs">
                      {getFormDataForForm(formId) && Object.keys(getFormDataForForm(formId)).length > 0 ? '⚠' : '○'}
                    </Badge>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Form Content */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Form Fields */}
        <div className="lg:col-span-2">
          {selectedForms.map((formId) => {
            const template = templates[formId];
            if (!template) return null;

            return (
              <Card
                key={formId}
                className={`${activeForm === formId ? 'block' : 'hidden lg:block'}`}
              >
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <FileText className="h-5 w-5 text-blue-600" />
                      <span>{template.name}</span>
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => downloadSingleForm(formId)}
                      disabled={!isFormComplete(formId)}
                      className="text-xs"
                    >
                      <Download className="h-3 w-3 mr-1" />
                      Download
                    </Button>
                  </div>
                  <p className="text-sm text-gray-600">{template.description}</p>
                </CardHeader>
                <CardContent className="space-y-4">
                  {template.fields.map((field) => {
                    const fieldValue = getFieldValue(formId, field.id);
                    const isAutoFilled = fieldValue !== "" && branchData;
                    
                    return (
                      <div key={field.id} className="space-y-2">
                        <div className="flex items-center justify-between">
                          <Label htmlFor={`${formId}_${field.id}`} className="text-sm font-medium">
                            {field.label}
                            {field.required && <span className="text-red-500 ml-1">*</span>}
                          </Label>
                          {isAutoFilled && (
                            <Badge variant="secondary" className="text-xs">
                              Auto-filled
                            </Badge>
                          )}
                        </div>
                        {renderField(formId, field)}
                        {isAutoFilled && (
                          <p className="text-xs text-blue-600">
                            ✨ Filled from branch data
                          </p>
                        )}
                      </div>
                    );
                  })}
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Branch Information */}
          {branchData && (
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center">
                  <Building2 className="h-5 w-5 text-blue-600 mr-2" />
                  Branch Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3 text-sm">
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="font-medium">Branch:</span>
                    <span className="ml-2">{branchData.branch}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <MapPin className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="font-medium">District:</span>
                    <span className="ml-2">{branchData.district}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Users className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="font-medium">Manager:</span>
                    <span className="ml-2">{branchData.name_of_the_manager}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="font-medium">Contact:</span>
                    <span className="ml-2">{branchData.contact_no}</span>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <div>
                    <span className="font-medium">Email:</span>
                    <span className="ml-2">{branchData.email_id}</span>
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-3 mt-3 pt-3 border-t">
                  <div>
                    <span className="font-medium">Manpower:</span>
                    <span className="ml-2">{branchData.approved_manpower}</span>
                  </div>
                  <div>
                    <span className="font-medium">Male/Female:</span>
                    <span className="ml-2">{branchData.male}/{branchData.female}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Loading State */}
          {loadingBranchData && (
            <Card>
              <CardContent className="p-6 text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                <p className="text-gray-600">Loading branch data...</p>
              </CardContent>
            </Card>
          )}

          {/* Compliance Info */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Compliance Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3 text-sm">
              <div>
                <span className="font-medium">State:</span>
                <span className="ml-2">{complianceData.state}</span>
              </div>
              <div>
                <span className="font-medium">District:</span>
                <span className="ml-2">{complianceData.district}</span>
              </div>
              <div>
                <span className="font-medium">Branch:</span>
                <span className="ml-2">{complianceData.branch}</span>
              </div>
              <div>
                <span className="font-medium">Act:</span>
                <span className="ml-2">{complianceData.actName}</span>
              </div>
            </CardContent>
          </Card>

          {/* Progress */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Progress</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {selectedForms.map((formId) => {
                const template = templates[formId];
                const isComplete = isFormComplete(formId);
                const fieldCount = template?.fields.length || 0;
                const completedFields = template?.fields.filter(field => {
                  if (!field.required) return true;
                  const value = getFieldValue(formId, field.id);
                  return value !== "" && value !== null && value !== undefined;
                }).length || 0;

                return (
                  <div key={formId} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium">Form {formId}</span>
                      <Badge variant={isComplete ? "default" : "outline"}>
                        {completedFields}/{fieldCount}
                      </Badge>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className={`h-2 rounded-full transition-all ${
                          isComplete ? 'bg-green-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${(completedFields / fieldCount) * 100}%` }}
                      />
                    </div>
                  </div>
                );
              })}
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="space-y-3">
            <Button
              onClick={handlePreview}
              variant="outline"
              className="w-full"
              disabled={!isAllFormsComplete}
            >
              <Eye className="mr-2 h-4 w-4" />
              Preview Forms
            </Button>
            <Button
              onClick={handleSave}
              className="w-full"
              disabled={!isAllFormsComplete || isSaving}
            >
              {isSaving ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Downloading Forms...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Download All Forms
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
