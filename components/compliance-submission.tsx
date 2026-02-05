"use client";

import { useState, useEffect } from "react";
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
import { INDIAN_STATES, State, District } from "@/lib/indian-states-data";

interface Employee {
  id: string;
  name: string;
  department: string;
}

interface ComplianceSubmissionProps {
  onClose: () => void;
  onSubmit: (data: any) => void;
}

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

const EMPLOYEES: Employee[] = [
  { id: "1", name: "Rajesh Kumar", department: "Finance" },
  { id: "2", name: "Priya Sharma", department: "HR" },
  { id: "3", name: "Amit Singh", department: "Operations" },
  { id: "4", name: "Sunita Patel", department: "Legal" },
  { id: "5", name: "Vikram Reddy", department: "IT" },
  { id: "6", name: "Meera Joshi", department: "Compliance" },
  { id: "7", name: "Arjun Nair", department: "Finance" },
  { id: "8", name: "Kavya Iyer", department: "HR" },
  { id: "9", name: "Rohit Gupta", department: "Operations" },
  { id: "10", name: "Anjali Verma", department: "Legal" },
];

export function ComplianceSubmission({
  onClose,
  onSubmit,
}: ComplianceSubmissionProps) {
  const [selectedState, setSelectedState] = useState<string>("");
  const [selectedDistrict, setSelectedDistrict] = useState<string>("");
  const [selectedTaluk, setSelectedTaluk] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");
  const [selectedForms, setSelectedForms] = useState<string[]>([]);

  const [availableDistricts, setAvailableDistricts] = useState<District[]>([]);
  const [availableTaluks, setAvailableTaluks] = useState<string[]>([]);

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

  const handleFormToggle = (form: string) => {
    setSelectedForms((prev) =>
      prev.includes(form) ? prev.filter((f) => f !== form) : [...prev, form],
    );
  };

  const handleSubmit = () => {
    const data = {
      state: selectedState,
      district: selectedDistrict,
      taluk: selectedTaluk,
      employee: selectedEmployee,
      forms: selectedForms,
    };
    onSubmit(data);
  };

  const isFormValid =
    selectedState &&
    selectedDistrict &&
    selectedTaluk &&
    selectedEmployee &&
    selectedForms.length > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="p-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-2xl font-bold text-gray-900">
              New Compliance Submission
            </h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 text-2xl"
            >
              ×
            </button>
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
                      selectedState ? "Choose a district" : "Select state first"
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
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Choose an employee" />
                </SelectTrigger>
                <SelectContent className="max-h-60">
                  {EMPLOYEES.map((employee) => (
                    <SelectItem key={employee.id} value={employee.name}>
                      {employee.name} - {employee.department}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
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
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSubmit}
              disabled={!isFormValid}
              className="bg-gray-700 hover:bg-gray-800 text-white disabled:bg-gray-300"
            >
              Create Compliance
            </Button>
          </div>
        </div>
      </Card>
    </div>
  );
}
