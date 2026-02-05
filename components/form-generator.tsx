"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import {
  Download,
  FileText,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";

interface Template {
  name: string;
  path: string;
  placeholderCount: number;
  placeholders: string[];
}

interface Table {
  name: string;
  displayName: string;
  count: number;
}

interface Employee {
  id: string;
  name: string;
  department: string;
}

interface PreviewData {
  placeholders: string[];
  columnMapping: Record<string, string>;
  employeeData: Record<string, string>;
  missingColumns: string[];
}

export function FormGenerator() {
  const [templates, setTemplates] = useState<Template[]>([]);
  const [tables, setTables] = useState<Table[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);

  const [selectedTemplate, setSelectedTemplate] = useState<string>("");
  const [selectedTable, setSelectedTable] = useState<string>("");
  const [selectedEmployee, setSelectedEmployee] = useState<string>("");

  const [preview, setPreview] = useState<PreviewData | null>(null);
  const [loading, setLoading] = useState(false);
  const [generating, setGenerating] = useState(false);

  // Load templates on mount
  useEffect(() => {
    loadTemplates();
    loadTables();
  }, []);

  // Load employees when table is selected
  useEffect(() => {
    if (selectedTable) {
      loadEmployees(selectedTable);
    }
  }, [selectedTable]);

  // Load preview when employee is selected
  useEffect(() => {
    if (selectedTemplate && selectedTable && selectedEmployee) {
      loadPreview();
    }
  }, [selectedTemplate, selectedTable, selectedEmployee]);

  const loadTemplates = async () => {
    try {
      const response = await fetch("/api/templates?validate=true");
      const data = await response.json();

      if (data.success) {
        setTemplates(data.templates);

        // Show warnings for templates with issues
        data.templates.forEach((template: any) => {
          if (template.validation?.warnings?.length > 0) {
            console.warn(
              `Template ${template.name} has warnings:`,
              template.validation.warnings,
            );
          }
        });
      }
    } catch (error) {
      console.error("Error loading templates:", error);
      toast.error("Failed to load templates");
    }
  };

  const loadTables = async () => {
    try {
      const response = await fetch("/api/employees");
      const data = await response.json();

      if (data.success) {
        setTables(data.tables || []);
      }
    } catch (error) {
      console.error("Error loading tables:", error);
      toast.error("Failed to load tables");
    }
  };

  const loadEmployees = async (tableName: string) => {
    try {
      setLoading(true);
      const response = await fetch(`/api/employees?table=${tableName}`);
      const data = await response.json();

      if (data.success) {
        setEmployees(data.employees || []);
      }
    } catch (error) {
      console.error("Error loading employees:", error);
      toast.error("Failed to load employees");
    } finally {
      setLoading(false);
    }
  };

  const loadPreview = async () => {
    try {
      setLoading(true);
      const response = await fetch(
        `/api/generate-form?templatePath=${selectedTemplate}&tableName=${selectedTable}&employeeId=${selectedEmployee}`,
      );
      const data = await response.json();

      if (data.success && data.preview) {
        setPreview(data.preview);
      }
    } catch (error) {
      console.error("Error loading preview:", error);
    } finally {
      setLoading(false);
    }
  };

  const generateForm = async () => {
    try {
      setGenerating(true);

      const response = await fetch("/api/generate-form", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          templatePath: selectedTemplate,
          tableName: selectedTable,
          employeeId: selectedEmployee,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to generate form");
      }

      // Get filename from Content-Disposition or build from template name
      const disposition = response.headers.get("Content-Disposition");
      const filenameMatch = disposition?.match(/filename="?([^";\n]+)"?/);
      const downloadFilename =
        filenameMatch?.[1]?.trim() ||
        (selectedTemplate
          ? `${selectedTemplate.replace(/^.*[/\\]/, "").replace(/\.docx$/i, "")}_filled.docx`
          : `Form_A_filled.docx`);

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = downloadFilename;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      const metadataHeader = response.headers.get("X-Metadata");
      const metadata = metadataHeader ? JSON.parse(metadataHeader) : null;

      toast.success("Form generated successfully!", {
        description: metadata
          ? `Filled ${metadata.filledFields.length} of ${metadata.placeholders.length} fields`
          : undefined,
      });
    } catch (error) {
      console.error("Error generating form:", error);
      toast.error(
        error instanceof Error ? error.message : "Failed to generate form",
      );
    } finally {
      setGenerating(false);
    }
  };

  const selectedTemplateData = templates.find(
    (t) => t.path === selectedTemplate,
  );
  const selectedEmployeeData = employees.find((e) => e.id === selectedEmployee);

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Form Generator</CardTitle>
          <CardDescription>
            Generate populated Word documents from templates using employee data
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Template Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Template</label>
            <Select
              value={selectedTemplate}
              onValueChange={setSelectedTemplate}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a template..." />
              </SelectTrigger>
              <SelectContent>
                {templates.map((template) => (
                  <SelectItem key={template.path} value={template.path}>
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>{template.name}</span>
                      <Badge variant="secondary">
                        {template.placeholderCount} fields
                      </Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Table Selection */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Select Data Table</label>
            <Select value={selectedTable} onValueChange={setSelectedTable}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a table..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map((table) => (
                  <SelectItem key={table.name} value={table.name}>
                    <div className="flex items-center gap-2">
                      <span>{table.displayName}</span>
                      <Badge variant="outline">{table.count} records</Badge>
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Employee Selection */}
          {selectedTable && (
            <div className="space-y-2">
              <label className="text-sm font-medium">Select Employee</label>
              <Select
                value={selectedEmployee}
                onValueChange={setSelectedEmployee}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue
                    placeholder={
                      loading ? "Loading..." : "Choose an employee..."
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {employees.map((employee) => (
                    <SelectItem key={employee.id} value={employee.id}>
                      <div className="flex flex-col">
                        <span>{employee.name}</span>
                        <span className="text-xs text-muted-foreground">
                          {employee.department}
                        </span>
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Preview Card */}
      {preview && selectedEmployeeData && (
        <Card>
          <CardHeader>
            <CardTitle>Preview</CardTitle>
            <CardDescription>
              Data that will be populated in the form for{" "}
              {selectedEmployeeData.name}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Statistics */}
            <div className="flex gap-4">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-green-600" />
                <span className="text-sm">
                  {Object.values(preview.employeeData).filter((v) => v).length}{" "}
                  fields filled
                </span>
              </div>
              <div className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <span className="text-sm">
                  {preview.placeholders.length -
                    Object.values(preview.employeeData).filter((v) => v)
                      .length}{" "}
                  fields empty
                </span>
              </div>
            </div>

            {/* Missing Columns Warning */}
            {preview.missingColumns.length > 0 && (
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  Some fields cannot be filled because columns are missing in
                  the database: {preview.missingColumns.join(", ")}
                </AlertDescription>
              </Alert>
            )}

            {/* Data Preview */}
            <div className="border rounded-lg p-4 max-h-96 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {preview.placeholders.map((placeholder) => {
                  const value = preview.employeeData[placeholder];
                  const hasValue = value && value.length > 0;

                  return (
                    <div key={placeholder} className="flex flex-col gap-1">
                      <span className="text-sm font-medium">{placeholder}</span>
                      <span
                        className={`text-sm ${hasValue ? "text-foreground" : "text-muted-foreground italic"}`}
                      >
                        {hasValue ? value : "(empty)"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Generate Button */}
            <Button
              onClick={generateForm}
              disabled={generating}
              className="w-full"
              size="lg"
            >
              {generating ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  Generate & Download Form
                </>
              )}
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Template Info */}
      {selectedTemplateData && !preview && (
        <Card>
          <CardHeader>
            <CardTitle>Template Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>
                <span className="text-sm font-medium">Placeholders:</span>
                <div className="flex flex-wrap gap-2 mt-2">
                  {selectedTemplateData.placeholders.map((placeholder) => (
                    <Badge key={placeholder} variant="outline">
                      {placeholder}
                    </Badge>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
