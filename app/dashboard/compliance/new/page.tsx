"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { INDIAN_STATES, District } from "@/lib/indian-states-data";
import { useEmployees } from "@/hooks/useEmployees";
import {
  downloadCompliancePDF,
  previewCompliancePDF,
} from "@/lib/pdf-generator";
import { FileDown, Eye, FileText } from "lucide-react";

const FORMS = [
  "Form A - Annual Return",
  "Form B - Balance Sheet",
  "Form C - Cash Flow Statement",
  "Form D - Director's Report",
  "Form E - Environmental Compliance",
  "Form F - Financial Statement",
  "Form G - GST Return",
  "Form H - HR Compliance",
  "Form I - Income Tax Return",
  "Form J - Joint Venture Report",
  "Form K - KYC Documentation",
  "Form L - Labor Compliance",
  "Form M - Management Report",
  "Form N - Notice Filing",
  "Form O - Operational Report",
  "Form P - Payroll Report",
  "Form Q - Quality Assurance",
  "Form R - Risk Assessment",
  "Form S - Safety Report",
  "Form T - Tax Filing",
  "Form U - Utility Report",
  "Form V - Vendor Report",
  "Form W - Waste Management",
  "Form X - Export Documentation",
  "Form Y - Year-end Report",
  "Form Z - Zone Compliance",
];

/** Map form display name to DOCX template path for filled-document generation */
const FORM_TO_TEMPLATE: Record<string, string> = {
  "Form A - Annual Return": "forms/Form_A.docx",
};

export default function NewCompliancePage() {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedTaluk, setSelectedTaluk] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);
  const [submittedData, setSubmittedData] = useState<any>(null);
  const [downloadingDocx, setDownloadingDocx] = useState(false);

  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableTaluks, setAvailableTaluks] = useState<string[]>([]);

  // Use custom hook for employee management
  const {
    tables,
    employees,
    loading,
    error,
    fetchEmployees,
    submitCompliance,
  } = useEmployees();

  // Update districts when state changes
  useEffect(() => {
    if (selectedState) {
      const state = INDIAN_STATES.find((s) => s.name === selectedState);
      setAvailableDistricts(state?.districts || []);
      setSelectedDistrict("");
      setSelectedTaluk("");
      setAvailableTaluks([]);
    }
  }, [selectedState]);

  // Update taluks when district changes
  useEffect(() => {
    if (selectedDistrict) {
      const district = availableDistricts.find(
        (d) => d.name === selectedDistrict,
      );
      setAvailableTaluks(district?.taluks || []);
      setSelectedTaluk("");
    }
  }, [selectedDistrict, availableDistricts]);

  // Update employees when table changes
  useEffect(() => {
    if (selectedTable) {
      fetchEmployees(selectedTable);
      setSelectedEmployee("");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedTable]);

  const handleFormToggle = (form: string) => {
    setSelectedForms((prev) =>
      prev.includes(form) ? prev.filter((f) => f !== form) : [...prev, form],
    );
  };

  const handleSubmit = async () => {
    const data = {
      state: selectedState,
      district: selectedDistrict,
      taluk: selectedTaluk,
      table: selectedTable,
      employee: employees.find((e) => e.id === selectedEmployee)?.name ?? selectedEmployee,
      forms: selectedForms,
    };

    const result = await submitCompliance(data);

    if (result.success) {
      setSubmittedData({
        id: result.id,
        ...data,
        submittedAt: new Date().toISOString(),
      });

      const templatesToGenerate = selectedForms
        .map((formName) => ({ formName, path: FORM_TO_TEMPLATE[formName] }))
        .filter(({ path }) => !!path);

      if (templatesToGenerate.length > 0 && selectedTable && selectedEmployee) {
        setDownloadingDocx(true);
        try {
          for (const { formName, path } of templatesToGenerate) {
            const res = await fetch("/api/generate-form", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                templatePath: path,
                tableName: selectedTable,
                employeeId: selectedEmployee,
              }),
            });
            if (!res.ok) {
              const text = await res.text();
              let msg = `HTTP ${res.status}`;
              try {
                const j = JSON.parse(text);
                msg = j?.error || j?.message || msg;
              } catch {
                if (text) msg = text;
              }
              console.error(`Failed to generate ${formName}:`, msg);
              alert(`Could not generate ${formName}: ${msg}`);
              continue;
            }
            const disposition = res.headers.get("Content-Disposition");
            const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
            const filename =
              filenameMatch?.[1]?.trim() ||
              `${formName.replace(/\s+/g, "_")}_filled.docx`;
            const blob = await res.blob();
            const url = URL.createObjectURL(blob);
            const a = document.createElement("a");
            a.href = url;
            a.download = filename;
            document.body.appendChild(a);
            a.click();
            URL.revokeObjectURL(url);
            document.body.removeChild(a);
          }
        } finally {
          setDownloadingDocx(false);
        }
      }

      const docxMessage =
        templatesToGenerate.length > 0 ? " Filled Form A (DOCX) has been downloaded." : "";
      alert(
        result.id
          ? `Compliance submitted! ID: ${result.id}.${docxMessage}`
          : `Compliance submitted.${docxMessage}`
      );
    } else {
      alert(`Error: ${result.error}`);
    }
  };

  const handleDownloadPDF = () => {
    if (submittedData) {
      downloadCompliancePDF(submittedData);
    }
  };

  const handlePreviewPDF = () => {
    if (submittedData) {
      previewCompliancePDF(submittedData);
    }
  };

  const handleDownloadFilledDocx = async () => {
    const path = FORM_TO_TEMPLATE["Form A - Annual Return"];
    if (!path || !selectedTable || !selectedEmployee) return;
    setDownloadingDocx(true);
    try {
      const res = await fetch("/api/generate-form", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          templatePath: path,
          tableName: selectedTable,
          employeeId: selectedEmployee,
        }),
      });
      if (!res.ok) {
        const text = await res.text();
        let msg = "Failed to generate form";
        try {
          const j = JSON.parse(text);
          msg = j?.error || j?.message || msg;
        } catch {
          if (text) msg = text;
        }
        throw new Error(msg);
      }
      const disposition = res.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const filename = filenameMatch?.[1]?.trim() || "Form_A_filled.docx";
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (e) {
      console.error(e);
      const msg = e instanceof Error ? e.message : "Failed to download filled form.";
      alert(msg);
    } finally {
      setDownloadingDocx(false);
    }
  };

  const handleReset = () => {
    setSelectedState("");
    setSelectedDistrict("");
    setSelectedTaluk("");
    setSelectedTable("");
    setSelectedEmployee("");
    setSelectedForms([]);
    setSubmittedData(null);
  };

  const isFormValid =
    selectedState &&
    selectedDistrict &&
    selectedTaluk &&
    selectedTable &&
    selectedEmployee &&
    selectedForms.length > 0;

  return (
    <div className="flex-1 flex flex-col min-h-screen">
      <DashboardHeader />
      <main className="flex-1 p-8">
        <div className="max-w-4xl mx-auto">
          <Card className="p-8">
            <div className="flex items-center justify-between mb-6">
              <h1 className="text-2xl font-bold text-gray-900">
                New Compliance Submission
              </h1>
              <Button variant="outline" onClick={() => window.close()}>
                Close
              </Button>
            </div>

            <div className="space-y-6">
              {/* State Selection */}
              <div>
                <Label
                  htmlFor="state"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Select State *
                </Label>
                <Select value={selectedState} onValueChange={setSelectedState}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Choose a state" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {INDIAN_STATES.map((state) => (
                      <SelectItem key={state.name} value={state.name}>
                        {state.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* District Selection */}
              <div>
                <Label
                  htmlFor="district"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Select District *
                </Label>
                <Select
                  value={selectedDistrict}
                  onValueChange={setSelectedDistrict}
                  disabled={!selectedState}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        selectedState
                          ? "Choose a district"
                          : "Select state first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableDistricts.map((district) => (
                      <SelectItem key={district.name} value={district.name}>
                        {district.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Taluk Selection */}
              <div>
                <Label
                  htmlFor="taluk"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Select Taluk *
                </Label>
                <Select
                  value={selectedTaluk}
                  onValueChange={setSelectedTaluk}
                  disabled={!selectedDistrict}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        selectedDistrict
                          ? "Choose a taluk"
                          : "Select district first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {availableTaluks.map((taluk) => (
                      <SelectItem key={taluk} value={taluk}>
                        {taluk}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Table Selection */}
              <div>
                <Label
                  htmlFor="table"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Select Table Name *
                </Label>
                <Select
                  value={selectedTable}
                  onValueChange={setSelectedTable}
                  disabled={loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loading ? "Loading tables..." : "Choose a table"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.length > 0 ? (
                      tables.map((table) => (
                        <SelectItem key={table.name} value={table.name}>
                          {table.displayName} ({table.count} records)
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-gray-500">
                        No tables found
                      </div>
                    )}
                  </SelectContent>
                </Select>
                {tables.length === 0 && !loading && (
                  <p className="text-sm text-amber-600 mt-2">
                    ⚠️ No tables found. Please create tables first using the{" "}
                    <strong>Notice Builder</strong>.
                  </p>
                )}
                {error && (
                  <p className="text-sm text-red-600 mt-2">Error: {error}</p>
                )}
              </div>

              {/* Employee Selection */}
              <div>
                <Label
                  htmlFor="employee"
                  className="text-sm font-medium text-gray-700 mb-2 block"
                >
                  Select Employee *
                </Label>
                <Select
                  value={selectedEmployee}
                  onValueChange={setSelectedEmployee}
                  disabled={!selectedTable || loading}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue
                      placeholder={
                        loading
                          ? "Loading employees..."
                          : selectedTable
                            ? "Choose an employee"
                            : "Select table first"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {employees.map((employee) => (
                      <SelectItem key={employee.id} value={employee.id}>
                        {employee.name} - {employee.department}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {selectedTable && employees.length > 0 && (
                  <p className="text-sm text-gray-600 mt-1">
                    {employees.length} employees available in {selectedTable}{" "}
                    table
                  </p>
                )}
              </div>

              {/* Forms Selection */}
              <div>
                <Label className="text-sm font-medium text-gray-700 mb-4 block">
                  Select Forms * (Choose one or more)
                </Label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-60 overflow-y-auto border rounded-lg p-4">
                  {FORMS.map((form) => (
                    <div key={form} className="flex items-center space-x-2">
                      <Checkbox
                        id={form}
                        checked={selectedForms.includes(form)}
                        onCheckedChange={() => handleFormToggle(form)}
                      />
                      <Label htmlFor={form} className="text-sm cursor-pointer">
                        {form}
                      </Label>
                    </div>
                  ))}
                </div>
                {selectedForms.length > 0 && (
                  <p className="text-sm text-gray-600 mt-2">
                    Selected: {selectedForms.length} form
                    {selectedForms.length !== 1 ? "s" : ""}
                  </p>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex gap-3 mt-8 justify-end">
              <Button variant="outline" onClick={() => window.close()}>
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                disabled={!isFormValid || loading || downloadingDocx}
                className="bg-gray-700 hover:bg-gray-800 text-white disabled:bg-gray-300"
              >
                {loading
                  ? "Submitting..."
                  : downloadingDocx
                    ? "Downloading form..."
                    : "Create Compliance"}
              </Button>
            </div>

            {/* Success Message: filled DOCX downloaded; optional PDF summary */}
            {submittedData && (
              <div className="mt-6 p-6 bg-green-50 border border-green-200 rounded-lg">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-green-900 mb-2">
                      ✓ Compliance Submitted Successfully!
                    </h3>
                    <p className="text-sm text-green-700 mb-2">
                      Submission ID: <strong>{submittedData.id}</strong>
                    </p>
                    <p className="text-sm text-green-600 mb-4">
                      Your filled <strong>Form A (DOCX)</strong> has been
                      downloaded. Open it in Word to see [[Empname]], [[Designation
                      Name]], [[Present Res No]], [[Date Of Joining]] replaced
                      with employee data.
                    </p>

                    <div className="flex flex-wrap gap-3">
                      <Button
                        onClick={handleDownloadFilledDocx}
                        disabled={downloadingDocx}
                        className="bg-green-600 hover:bg-green-700 text-white"
                      >
                        <FileText className="mr-2 h-4 w-4" />
                        {downloadingDocx
                          ? "Generating..."
                          : "Download Form A (filled DOCX) again"}
                      </Button>
                      <Button
                        onClick={handlePreviewPDF}
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                      >
                        <Eye className="mr-2 h-4 w-4" />
                        Preview summary PDF
                      </Button>
                      <Button
                        onClick={handleDownloadPDF}
                        variant="outline"
                        className="border-green-600 text-green-700 hover:bg-green-50"
                      >
                        <FileDown className="mr-2 h-4 w-4" />
                        Download summary PDF
                      </Button>
                      <Button onClick={handleReset} variant="outline">
                        Create Another
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </Card>
        </div>
      </main>
    </div>
  );
}
