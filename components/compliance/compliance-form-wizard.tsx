"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { getRegisteredFormIds } from "@/lib/compliance-form-registry";
import { Building2, FileText, Download, ArrowRight } from "lucide-react";

const INDIAN_STATES = [
  "Karnataka", "Tamil Nadu", "Maharashtra", "Kerala", "Andhra Pradesh", 
  "Telangana", "Goa", "Gujarat", "Rajasthan", "Haryana",
  "Madhya Pradesh", "Uttar Pradesh", "Bihar", "West Bengal",
  "Odisha", "Assam", "Jharkhand", "Chhattisgarh", "Uttarakhand",
  "Himachal Pradesh", "Jammu & Kashmir", "Delhi", 
  "Chandigarh", "Puducherry"
];

const COMPLIANCE_ACTS = [
  { id: "shop_establishment", name: "Shop and Establishment Act", forms: getRegisteredFormIds() },
  { id: "bocw", name: "BOCW", forms: [] },
  { id: "minimum_wage", name: "Minimum Wage", forms: [] },
  { id: "payment_of_wage", name: "Payment of Wage", forms: [] },
  { id: "payment_of_gratuity", name: "Payment of Gratuity", forms: [] },
  { id: "child_labour", name: "Child Labour Act", forms: [] },
  { id: "provident_fund", name: "Provident Fund", forms: [] },
  { id: "employee_insurance", name: "Employee Insurance", forms: [] },
  { id: "professional_tax", name: "Professional Tax", forms: [] },
  { id: "income_tax", name: "Income Tax", forms: [] },
];

interface ComplianceFormData {
  state: string;
  district: string;
  branch: string;
  act: string;
  forms: string[];
}

interface ComplianceFormWizardProps {
  onSubmit?: (data: ComplianceFormData) => void;
}

export default function ComplianceFormWizard({ onSubmit }: ComplianceFormWizardProps) {
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<ComplianceFormData>({
    state: "",
    district: "",
    branch: "",
    act: "",
    forms: []
  });
  
  const [karnatakaBranches, setKarnatakaBranches] = useState<string[]>([]);
  const [availableForms, setAvailableForms] = useState<string[]>([]);
  const [loadingBranches, setLoadingBranches] = useState(false);
  const { toast } = useToast();

  const selectedAct = COMPLIANCE_ACTS.find(act => act.id === formData.act);

  // Fetch Karnataka branches when component mounts or state changes to Karnataka
  useEffect(() => {
    const fetchKarnatakaBranches = async () => {
      if (formData.state === "Karnataka") {
        setLoadingBranches(true);
        try {
          const response = await fetch('/api/employees?table=ka_branches');
          if (response.ok) {
            const data = await response.json();
            const branches = data.employees?.map((branch: any) => branch.branch) || [];
            // Remove duplicates and filter out empty values
            const uniqueBranches = [...new Set(branches.filter(Boolean))];
            setKarnatakaBranches(uniqueBranches);
          } else {
            toast({
              title: "Error",
              description: "Failed to load Karnataka branches",
              variant: "destructive",
            });
          }
        } catch (error) {
          console.error('Error fetching branches:', error);
          toast({
            title: "Error",
            description: "Failed to load Karnataka branches",
            variant: "destructive",
          });
        } finally {
          setLoadingBranches(false);
        }
      }
    };

    fetchKarnatakaBranches();
  }, [formData.state, toast]);

  // Update available forms when act changes
  useEffect(() => {
    if (selectedAct) {
      setAvailableForms(selectedAct.forms);
      setFormData(prev => ({ ...prev, forms: [] }));
    } else {
      setAvailableForms([]);
    }
  }, [formData.act]);

  const handleStateChange = (state: string) => {
    setFormData(prev => ({ 
      ...prev, 
      state, 
      district: "", 
      branch: "", 
      act: "", 
      forms: [] 
    }));
    setStep(2);
  };

  const handleDistrictChange = (district: string) => {
    setFormData(prev => ({ 
      ...prev, 
      district, 
      branch: "", 
      act: "", 
      forms: [] 
    }));
    setStep(3);
  };

  const handleBranchChange = (branch: string) => {
    setFormData(prev => ({ 
      ...prev, 
      branch, 
      act: "", 
      forms: [] 
    }));
    setStep(4);
  };

  const handleActChange = (act: string) => {
    setFormData(prev => ({ 
      ...prev, 
      act, 
      forms: [] 
    }));
    setStep(5);
  };

  const handleFormToggle = (formId: string) => {
    setFormData(prev => ({
      ...prev,
      forms: prev.forms.includes(formId) 
        ? prev.forms.filter(f => f !== formId)
        : [...prev.forms, formId]
    }));
  };

  const handleSubmit = () => {
    if (onSubmit) {
      onSubmit(formData);
    }
  };

  const isStepValid = () => {
    switch (step) {
      case 1:
        return formData.state !== "";
      case 2:
        return formData.district !== "";
      case 3:
        return formData.branch !== "";
      case 4:
        return formData.act !== "";
      case 5:
        return formData.forms.length > 0;
      default:
        return false;
    }
  };

  const nextStep = () => {
    if (isStepValid()) {
      setStep(prev => Math.min(prev + 1, 5));
    } else {
      toast({
        title: "Validation Error",
        description: "Please complete the current step before proceeding",
        variant: "destructive",
      });
    }
  };

  const prevStep = () => {
    setStep(prev => Math.max(prev - 1, 1));
  };

  const renderStepContent = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select State</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
              {INDIAN_STATES.map((state) => (
                <Button
                  key={state}
                  variant={formData.state === state ? "default" : "outline"}
                  className="h-12 justify-start"
                  onClick={() => handleStateChange(state)}
                >
                  {state}
                </Button>
              ))}
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select District in {formData.state}</h3>
            {formData.state === "Karnataka" ? (
              <div>
                {loadingBranches ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Karnataka branches...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {karnatakaBranches.map((branch) => (
                      <Button
                        key={branch}
                        variant={formData.district === branch ? "default" : "outline"}
                        className="h-12 justify-start"
                        onClick={() => handleDistrictChange(branch)}
                      >
                        {branch}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">District selection is currently available for Karnataka only.</p>
                <p className="text-sm text-gray-500 mt-2">Please select Karnataka as the state to see available districts/branches.</p>
              </div>
            )}
          </div>
        );

      case 3:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select Branch in {formData.district}</h3>
            {formData.state === "Karnataka" ? (
              <div>
                {loadingBranches ? (
                  <div className="text-center py-8">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
                    <p className="text-gray-600">Loading Karnataka branches...</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                    {karnatakaBranches.map((branch) => (
                      <Button
                        key={branch}
                        variant={formData.branch === branch ? "default" : "outline"}
                        className="h-12 justify-start"
                        onClick={() => handleBranchChange(branch)}
                      >
                        {branch}
                      </Button>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="text-center py-8">
                <p className="text-gray-600">Branch selection is currently available for Karnataka only.</p>
                <p className="text-sm text-gray-500 mt-2">Please select Karnataka as the state to see available branches.</p>
              </div>
            )}
          </div>
        );

      case 4:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">Select Compliance Act</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {COMPLIANCE_ACTS.map((act) => (
                <Card 
                  key={act.id}
                  className={`cursor-pointer transition-all hover:shadow-md ${
                    formData.act === act.id 
                      ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-200' 
                      : 'hover:border-gray-300'
                  }`}
                  onClick={() => handleActChange(act.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center space-x-3">
                      <FileText className="h-8 w-8 text-blue-600" />
                      <div>
                        <h4 className="font-semibold text-gray-900">{act.name}</h4>
                        <p className="text-sm text-gray-600">
                          {act.forms.length > 0 ? `${act.forms.length} forms available` : 'No forms required'}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>
        );

      case 5:
        return (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold mb-4">
              Select Forms for {selectedAct?.name}
            </h3>
            {availableForms.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
                {availableForms.map((formId) => (
                  <Card 
                    key={formId}
                    className={`cursor-pointer transition-all hover:shadow-md ${
                      formData.forms.includes(formId) 
                        ? 'ring-2 ring-green-500 bg-green-50 border-green-200' 
                        : 'hover:border-gray-300'
                    }`}
                    onClick={() => handleFormToggle(formId)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          checked={formData.forms.includes(formId)}
                          onChange={() => handleFormToggle(formId)}
                        />
                        <div>
                          <h4 className="font-semibold text-gray-900">Form {formId}</h4>
                          <p className="text-sm text-gray-600">
                            {formData.forms.includes(formId) ? 'Selected' : 'Click to select'}
                          </p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-8 text-gray-500">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-400" />
                <p className="text-lg font-medium">No forms required</p>
                <p className="text-sm">This compliance act doesn't require any specific forms.</p>
              </div>
            )}

            {formData.forms.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Selected Forms</h4>
                <div className="flex flex-wrap gap-2">
                  {formData.forms.map((formId) => (
                    <Badge key={formId} variant="default" className="bg-blue-600 text-white">
                      Form {formId}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-3">
            <Building2 className="h-6 w-6 text-blue-600" />
            <span>Compliance Form Wizard</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {/* Progress Steps */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              {[1, 2, 3, 4, 5].map((stepNumber) => (
                <div key={stepNumber} className="flex items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-semibold ${
                      step >= stepNumber
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-200 text-gray-600'
                    }`}
                  >
                    {stepNumber}
                  </div>
                  {stepNumber < 5 && (
                    <div
                      className={`w-16 h-1 ${
                        step > stepNumber ? 'bg-blue-600' : 'bg-gray-200'
                      }`}
                    />
                  )}
                </div>
              ))}
            </div>
            <div className="mt-2 flex justify-between text-sm text-gray-600">
              <span>State</span>
              <span>District</span>
              <span>Branch</span>
              <span>Act</span>
              <span>Forms</span>
            </div>
          </div>

          {/* Step Content */}
          <div className="min-h-[400px]">
            {renderStepContent()}
          </div>

          {/* Navigation Buttons */}
          <div className="flex justify-between mt-8 pt-6 border-t">
            <Button
              variant="outline"
              onClick={prevStep}
              disabled={step === 1}
            >
              Previous
            </Button>
            
            {step < 5 ? (
              <Button onClick={nextStep} disabled={!isStepValid()}>
                {step === 4 ? "Select Forms" : "Next"}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleSubmit} disabled={formData.forms.length === 0}>
                <Download className="mr-2 h-4 w-4" />
                Generate Compliance Forms
              </Button>
            )}
          </div>

          {/* Summary */}
          {step === 5 && (
            <div className="mt-6 p-4 bg-gray-50 border border-gray-200 rounded-lg">
              <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                <div>
                  <span className="font-medium">State:</span> {formData.state}
                </div>
                <div>
                  <span className="font-medium">District:</span> {formData.district}
                </div>
                <div>
                  <span className="font-medium">Branch:</span> {formData.branch}
                </div>
                <div>
                  <span className="font-medium">Act:</span> {selectedAct?.name}
                </div>
                <div>
                  <span className="font-medium">Forms:</span> {formData.forms.join(', ') || 'None'}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
