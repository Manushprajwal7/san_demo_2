"use client";

import { useState } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import ComplianceFormWizard from "@/components/compliance/compliance-form-wizard";
import DynamicFormRenderer from "@/components/compliance/dynamic-form-renderer";
import { SHOP_ESTABLISHMENT_FORMS } from "@/lib/form-templates";
import { FileText, Download, CheckCircle, ArrowRight, Mail } from "lucide-react";

interface ComplianceData {
  state: string;
  district: string;
  branch: string;
  act: string;
  actName: string;
  forms: string[];
  submittedAt: string;
  id: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
function isValidEmail(email: string) {
  return EMAIL_REGEX.test(String(email).trim());
}

export default function NewCompliancePage() {
  const [complianceData, setComplianceData] = useState<ComplianceData | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [showForms, setShowForms] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [emailModalOpen, setEmailModalOpen] = useState(false);
  const [emailRecipient, setEmailRecipient] = useState("");
  const [emailFormId, setEmailFormId] = useState("");
  const [sendingEmail, setSendingEmail] = useState(false);
  const [emailError, setEmailError] = useState<string | null>(null);
  const [emailSuccess, setEmailSuccess] = useState<string | null>(null);

  const handleComplianceSubmit = async (data: any) => {
    setIsGenerating(true);
    
    try {
      // Here you would typically submit to your backend
      const response = await fetch('/api/compliance', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (response.ok) {
        const result = await response.json();
        setComplianceData({
          ...data,
          actName: COMPLIANCE_ACTS.find(act => act.id === data.act)?.name || data.act,
          submittedAt: new Date().toISOString(),
          id: result.id || `COMP-${Date.now()}`
        });
        setShowForms(true);
      } else {
        throw new Error('Failed to submit compliance');
      }
    } catch (error) {
      console.error('Error submitting compliance:', error);
      alert('Failed to submit compliance. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleSaveForms = async (formData: Record<string, any>) => {
    setIsGenerating(true);
    
    try {
      // Save form data to backend
      const response = await fetch('/api/compliance/forms', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          complianceId: complianceData?.id,
          formData: formData,
          act: complianceData?.act
        }),
      });

      if (response.ok) {
        setFormData(formData);
        alert('Forms saved successfully!');
      } else {
        throw new Error('Failed to save forms');
      }
    } catch (error) {
      console.error('Error saving forms:', error);
      alert('Failed to save forms. Please try again.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handlePreviewForms = (formData: Record<string, any>) => {
    setFormData(formData);
    // Here you could open a preview modal or navigate to preview page
    alert('Preview functionality would show the filled forms');
  };

  const handleDownloadForms = async () => {
    if (!complianceData) return;

    try {
      const response = await fetch('/api/compliance/download', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          complianceId: complianceData.id,
          act: complianceData.act,
          forms: complianceData.forms,
          formData: { ...formData, branch: complianceData.branch, state: complianceData.state, district: complianceData.district },
          branch: complianceData.branch,
          state: complianceData.state,
          district: complianceData.district,
        }),
      });

      if (!response.ok) {
        const err = await response.json().catch(() => ({}));
        throw new Error(err.error || 'Failed to download form');
      }

      const blob = await response.blob();
      const disposition = response.headers.get('Content-Disposition');
      const match = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = match ? match[1].trim() : `Form_${complianceData.forms?.[0] ?? 'compliance'}_${complianceData.id}.docx`;
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename.endsWith('.docx') ? filename : `${filename}.docx`;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading forms:', error);
      alert(error instanceof Error ? error.message : 'Failed to download form. Please try again.');
    }
  };

  const handleReset = () => {
    setComplianceData(null);
    setShowForms(false);
    setFormData({});
  };

  const handleOpenEmailModal = () => {
    setEmailError(null);
    setEmailSuccess(null);
    setEmailRecipient("");
    setEmailFormId(complianceData?.forms?.[0] ?? "");
    setEmailModalOpen(true);
  };

  const handleSendEmail = async () => {
    if (!complianceData) return;
    const email = emailRecipient.trim();
    if (!email) {
      setEmailError("Please enter recipient email.");
      return;
    }
    if (!isValidEmail(email)) {
      setEmailError("Please enter a valid email address.");
      return;
    }
    const formId = emailFormId || complianceData.forms?.[0];
    if (!formId) {
      setEmailError("No form selected.");
      return;
    }
    setSendingEmail(true);
    setEmailError(null);
    setEmailSuccess(null);
    try {
      const response = await fetch("/api/compliance/send-email", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          complianceId: complianceData.id,
          act: complianceData.act,
          formId,
          recipientEmail: email,
          formData: { ...formData, branch: complianceData.branch, state: complianceData.state, district: complianceData.district },
          branch: complianceData.branch,
          actName: complianceData.actName,
        }),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        setEmailError(data.error || "Failed to send email.");
        return;
      }
      setEmailSuccess(data.message || "Email sent successfully.");
      setTimeout(() => {
        setEmailModalOpen(false);
      }, 2000);
    } catch (err) {
      setEmailError(err instanceof Error ? err.message : "Failed to send email.");
    } finally {
      setSendingEmail(false);
    }
  };

  const COMPLIANCE_ACTS = [
    { id: "shop_establishment", name: "Shop and Establishment Act" },
    { id: "bocw", name: "BOCW" },
    { id: "minimum_wage", name: "Minimum Wage" },
    { id: "payment_of_wage", name: "Payment of Wage" },
    { id: "payment_of_gratuity", name: "Payment of Gratuity" },
    { id: "child_labour", name: "Child Labour Act" },
    { id: "provident_fund", name: "Provident Fund" },
    { id: "employee_insurance", name: "Employee Insurance" },
    { id: "professional_tax", name: "Professional Tax" },
    { id: "income_tax", name: "Income Tax" },
  ];

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-8 bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto">
          {!complianceData ? (
            <ComplianceFormWizard onSubmit={handleComplianceSubmit} />
          ) : !showForms ? (
            <Card className="p-8">
              <div className="text-center">
                <div className="mb-6">
                  <CheckCircle className="h-16 w-16 text-green-600 mx-auto mb-4" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 mb-4">
                  Compliance Setup Complete!
                </h1>
                
                <div className="bg-white border border-gray-200 rounded-lg p-6 mb-6 text-left">
                  <h2 className="text-lg font-semibold text-gray-900 mb-4">Compliance Summary</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="font-medium text-gray-600">State:</span>
                      <span className="ml-2 text-gray-900">{complianceData.state}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">District:</span>
                      <span className="ml-2 text-gray-900">{complianceData.district}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Branch:</span>
                      <span className="ml-2 text-gray-900">{complianceData.branch}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Compliance Act:</span>
                      <span className="ml-2 text-gray-900">{complianceData.actName}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Selected Forms:</span>
                      <div className="ml-2 mt-2">
                        <div className="flex flex-wrap gap-2">
                          {complianceData.forms.map((formId) => (
                            <Badge key={formId} variant="default" className="bg-blue-600 text-white">
                              Form {formId}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Submission ID:</span>
                      <span className="ml-2 text-gray-900">{complianceData.id}</span>
                    </div>
                    <div>
                      <span className="font-medium text-gray-600">Submitted At:</span>
                      <span className="ml-2 text-gray-900">
                        {new Date(complianceData.submittedAt).toLocaleString()}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button
                    onClick={() => setShowForms(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <FileText className="mr-2 h-4 w-4" />
                    Fill Forms
                  </Button>
                  <Button
                    onClick={handleReset}
                    variant="outline"
                  >
                    <ArrowRight className="mr-2 h-4 w-4" />
                    Create New Compliance
                  </Button>
                </div>
              </div>
            </Card>
          ) : (
            <div className="space-y-6">
              {/* Header */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <h1 className="text-2xl font-bold text-gray-900">
                        Fill Compliance Forms
                      </h1>
                      <p className="text-gray-600 mt-1">
                        {complianceData.actName} - {complianceData.forms.length} forms
                      </p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Badge variant="outline" className="text-sm">
                        ID: {complianceData.id}
                      </Badge>
                      <Button
                        onClick={handleDownloadForms}
                        disabled={Object.keys(formData).length === 0}
                        variant="outline"
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Dynamic Form Renderer */}
              <DynamicFormRenderer
                templates={complianceData.act === 'shop_establishment' ? SHOP_ESTABLISHMENT_FORMS : {}}
                selectedForms={complianceData.forms}
                complianceData={complianceData}
                onSave={handleSaveForms}
                onPreview={handlePreviewForms}
              />

              {/* Action Buttons */}
              <Card>
                <CardContent className="p-6">
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between flex-wrap gap-3">
                      <Button
                        onClick={handleReset}
                        variant="outline"
                      >
                        <ArrowRight className="mr-2 h-4 w-4" />
                        Start New Compliance
                      </Button>
                      <div className="flex flex-wrap gap-3">
                        <Button
                          onClick={() => setShowForms(false)}
                          variant="outline"
                        >
                          Back to Summary
                        </Button>
                        <Button
                          onClick={handleDownloadForms}
                          disabled={Object.keys(formData).length === 0}
                          className="bg-green-600 hover:bg-green-700 text-white"
                        >
                          <Download className="mr-2 h-4 w-4" />
                          Download All Forms
                        </Button>
                        <Button
                          onClick={handleOpenEmailModal}
                          disabled={Object.keys(formData).length === 0}
                          variant="outline"
                        >
                          <Mail className="mr-2 h-4 w-4" />
                          Send Form via Mail
                        </Button>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Send Form via Mail Dialog */}
              <Dialog open={emailModalOpen} onOpenChange={setEmailModalOpen}>
                <DialogContent className="sm:max-w-md">
                  <DialogHeader>
                    <DialogTitle>Send Form via Mail</DialogTitle>
                    <DialogDescription>
                      Enter recipient email. The selected form will be sent as a PDF attachment (DOCX is not sent).
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="grid gap-2">
                      <Label htmlFor="email-recipient">Recipient email</Label>
                      <Input
                        id="email-recipient"
                        type="email"
                        placeholder="recipient@example.com"
                        value={emailRecipient}
                        onChange={(e) => {
                          setEmailRecipient(e.target.value);
                          setEmailError(null);
                        }}
                      />
                    </div>
                    {complianceData && complianceData.forms?.length > 1 && (
                      <div className="grid gap-2">
                        <Label>Form to send</Label>
                        <Select value={emailFormId} onValueChange={setEmailFormId}>
                          <SelectTrigger>
                            <SelectValue placeholder="Select form" />
                          </SelectTrigger>
                          <SelectContent>
                            {complianceData.forms.map((f) => (
                              <SelectItem key={f} value={f}>
                                Form {f}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                    {emailError && (
                      <p className="text-sm text-red-600">{emailError}</p>
                    )}
                    {emailSuccess && (
                      <p className="text-sm text-green-600">{emailSuccess}</p>
                    )}
                  </div>
                  <DialogFooter>
                    <Button
                      variant="outline"
                      onClick={() => setEmailModalOpen(false)}
                      disabled={sendingEmail}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendEmail}
                      disabled={sendingEmail}
                    >
                      {sendingEmail ? "Sending…" : "Send PDF"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
