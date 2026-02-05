"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { FieldDef } from "./field-definition";

interface DynamicFormProps {
  tableName: string;
  columns: FieldDef[];
  onRowInserted: () => void;
}

export function DynamicForm({
  tableName,
  columns,
  onRowInserted,
}: DynamicFormProps) {
  const buildInitialData = () => {
    const data: Record<string, string | boolean> = {};
    columns.forEach((col) => {
      data[col.name] = col.type === "boolean" ? false : "";
    });
    return data;
  };

  const [formData, setFormData] =
    useState<Record<string, string | boolean>>(buildInitialData);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (name: string, value: string | boolean) => {
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Convert data types for submission
    const submitData: Record<string, unknown> = {};
    columns.forEach((col) => {
      const val = formData[col.name];
      if (col.type === "number") {
        submitData[col.name] = val === "" ? null : Number(val);
      } else if (col.type === "boolean") {
        submitData[col.name] = Boolean(val);
      } else {
        submitData[col.name] = val === "" ? null : val;
      }
    });

    setSubmitting(true);

    try {
      const res = await fetch("/api/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "insert-row",
          tableName,
          data: submitData,
        }),
      });

      const result = await res.json();

      if (!res.ok) {
        toast.error(result.error || "Failed to save data.");
        return;
      }

      toast.success("Row saved successfully!");
      setFormData(buildInitialData());
      onRowInserted();
    } catch {
      toast.error("Network error. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {columns.map((col) => (
          <div key={col.name} className="space-y-2">
            <Label
              htmlFor={`form-${col.name}`}
              className="text-sm font-medium capitalize text-foreground"
            >
              {col.name.replace(/_/g, " ")}
              <span className="text-muted-foreground text-xs font-normal ml-2">
                ({col.type})
              </span>
            </Label>

            {col.type === "boolean" ? (
              <div className="flex items-center gap-3 mt-2">
                <Switch
                  id={`form-${col.name}`}
                  checked={formData[col.name] as boolean}
                  onCheckedChange={(checked) => handleChange(col.name, checked)}
                />
                <span className="text-sm text-muted-foreground">
                  {formData[col.name] ? "Yes" : "No"}
                </span>
              </div>
            ) : (
              <Input
                id={`form-${col.name}`}
                type={
                  col.type === "number"
                    ? "number"
                    : col.type === "date"
                      ? "date"
                      : "text"
                }
                value={formData[col.name] as string}
                onChange={(e) => handleChange(col.name, e.target.value)}
                step={col.type === "number" ? "any" : undefined}
                placeholder={`Enter ${col.name.replace(/_/g, " ")} (optional)`}
              />
            )}
          </div>
        ))}
      </div>

      <Button
        type="submit"
        disabled={submitting}
        className="w-full font-medium"
      >
        {submitting ? "Saving..." : "Submit Entry"}
      </Button>
    </form>
  );
}
