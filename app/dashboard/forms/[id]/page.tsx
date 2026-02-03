"use client";

import { useState, useEffect } from "react";
import { useSearchParams, useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";

export default function FormPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const formId = params.id as string;
  const formDataParam = searchParams.get("data");

  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFormTable, setSelectedFormTable] = useState<any>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionSuccess, setSubmissionSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (formId) {
      // Try to get form data from URL parameters first
      if (formDataParam) {
        try {
          const parsedData = JSON.parse(decodeURIComponent(formDataParam));
          setSelectedFormTable(parsedData);
          setIsLoading(false);
          return;
        } catch (error) {
          console.error("Error parsing form data from URL:", error);
        }
      }

      // Fallback to fetching from database
      const loadForm = async () => {
        try {
          const { data, error } = await supabase
            .from("dynamic_tables_metadata")
            .select("*")
            .eq("id", formId)
            .single();

          if (error) throw error;
          setSelectedFormTable(data);
        } catch (error) {
          console.error("Error loading form:", error);
        } finally {
          setIsLoading(false);
        }
      };

      loadForm();
    } else {
      setIsLoading(false);
    }
  }, [formId, formDataParam]);

  // Add useEffect to load form data when component mounts
  useEffect(() => {
    if (selectedFormTable && !submissionSuccess) {
      // Pre-fill any default values or load existing data if needed
      const defaultData: Record<string, any> = {};
      selectedFormTable.fields.forEach((field: any) => {
        if (field.defaultValue !== undefined) {
          defaultData[field.name] = field.defaultValue;
        }
      });
      if (Object.keys(defaultData).length > 0) {
        setFormData(defaultData);
      }
    }
  }, [selectedFormTable, submissionSuccess]);

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading form...</p>
        </div>
      </div>
    );
  }

  if (!selectedFormTable) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="w-16 h-16 mx-auto"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
              ></path>
            </svg>
          </div>
          <h2 className="text-xl font-semibold text-gray-900 mb-2">
            Form Not Found
          </h2>
          <p className="text-gray-600 mb-6">
            The form you're looking for doesn't exist or has been deleted.
          </p>
          <Button
            onClick={() => (window.location.href = "/dashboard/notice")}
            className="bg-blue-600 hover:bg-blue-700"
          >
            Back to Forms
          </Button>
        </div>
      </div>
    );
  }

  const handleFormInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const submitForm = async () => {
    if (!selectedFormTable) return;

    setIsSubmitting(true);
    try {
      // Validate required fields
      const requiredFields = selectedFormTable.fields
        .filter((field: any) => field.required)
        .map((field: any) => field.name);

      const missingFields = requiredFields.filter(
        (fieldName: string) => !formData[fieldName],
      );

      if (missingFields.length > 0) {
        alert(`Please fill in required fields: ${missingFields.join(", ")}`);
        setIsSubmitting(false);
        return;
      }

      // Prepare data for insertion
      const preparedData = { ...formData };

      // Convert data types if needed
      selectedFormTable.fields.forEach((field: any) => {
        const fieldName = field.name;
        const fieldValue = formData[fieldName];

        if (
          fieldValue !== undefined &&
          fieldValue !== null &&
          fieldValue !== ""
        ) {
          switch (field.type) {
            case "number":
              preparedData[fieldName] = Number(fieldValue);
              break;
            case "boolean":
              preparedData[fieldName] =
                fieldValue === true ||
                fieldValue === "true" ||
                fieldValue === "1";
              break;
            case "date":
              if (fieldValue instanceof Date) {
                preparedData[fieldName] = fieldValue
                  .toISOString()
                  .split("T")[0];
              } else {
                preparedData[fieldName] = fieldValue;
              }
              break;
            default:
              preparedData[fieldName] = String(fieldValue);
          }
        }
      });

      // Insert into database
      const { error } = await supabase.from("dynamic_table_data").insert([
        {
          table_metadata_id: selectedFormTable.id,
          data: preparedData,
        },
      ]);

      if (error) {
        throw new Error(`Failed to submit form: ${error.message}`);
      }

      setSubmissionSuccess(true);
      setFormData({});
    } catch (error: any) {
      console.error("Error submitting form:", error);
      alert(`Failed to submit form: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        <Card className="p-6">
          <div className="mb-6">
            <h1 className="text-2xl font-bold text-gray-900">
              {selectedFormTable.display_name}
            </h1>
            <p className="text-gray-600 mt-2">
              Please fill out all required fields marked with *
            </p>
          </div>

          {submissionSuccess ? (
            <div className="text-center py-8">
              <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg
                  className="w-8 h-8 text-green-600"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M5 13l4 4L19 7"
                  ></path>
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 mb-2">
                Form Submitted Successfully!
              </h2>
              <p className="text-gray-600 mb-6">
                Your response has been recorded. Thank you for submitting the
                form.
              </p>
              <Button
                onClick={() => {
                  setSubmissionSuccess(false);
                  setFormData({});
                }}
                className="bg-blue-600 hover:bg-blue-700"
              >
                Submit Another Response
              </Button>
            </div>
          ) : (
            <div className="space-y-6">
              {selectedFormTable.fields.map((field: any) => (
                <div key={field.name}>
                  <Label className="text-gray-900 font-medium mb-2 block">
                    {field.name}
                    {field.required && (
                      <span className="text-red-500 ml-1">*</span>
                    )}
                    <span className="text-sm text-gray-500 font-normal ml-2">
                      ({field.type})
                    </span>
                  </Label>

                  {field.type === "text" && (
                    <Input
                      placeholder={`Enter ${field.name}`}
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleFormInputChange(field.name, e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500"
                      required={field.required}
                    />
                  )}

                  {field.type === "number" && (
                    <Input
                      type="number"
                      placeholder={`Enter ${field.name}`}
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleFormInputChange(field.name, e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500"
                      required={field.required}
                    />
                  )}

                  {field.type === "date" && (
                    <Input
                      type="date"
                      value={formData[field.name] || ""}
                      onChange={(e) =>
                        handleFormInputChange(field.name, e.target.value)
                      }
                      className="border-gray-300 focus:border-blue-500"
                      required={field.required}
                    />
                  )}

                  {field.type === "boolean" && (
                    <div className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={formData[field.name] || false}
                        onChange={(e) =>
                          handleFormInputChange(field.name, e.target.checked)
                        }
                        className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        id={field.name}
                      />
                      <Label htmlFor={field.name} className="text-gray-700">
                        Yes, this is correct
                      </Label>
                    </div>
                  )}
                </div>
              ))}

              <div className="flex gap-3 pt-4">
                <Button
                  onClick={submitForm}
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 hover:bg-blue-700"
                >
                  {isSubmitting ? "Submitting..." : "Submit Form"}
                </Button>
                <Button onClick={() => window.close()} variant="outline">
                  Close
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
