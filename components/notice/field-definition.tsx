"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";

export interface FieldDef {
  name: string;
  type: string;
}

const SUPPORTED_TYPES = ["text", "number", "date", "boolean"];

interface FieldDefinitionProps {
  onFieldsParsed: (fields: FieldDef[]) => void;
}

export function FieldDefinition({ onFieldsParsed }: FieldDefinitionProps) {
  const [input, setInput] = useState("");
  const [errors, setErrors] = useState<string[]>([]);

  const handleApply = () => {
    const lines = input
      .split("\n")
      .map((l) => l.trim())
      .filter((l) => l.length > 0);

    if (lines.length === 0) {
      setErrors(["Please enter at least one field definition."]);
      return;
    }

    const parsed: FieldDef[] = [];
    const newErrors: string[] = [];

    lines.forEach((line, idx) => {
      const parts = line.split(":");
      if (parts.length !== 2) {
        newErrors.push(
          `Line ${idx + 1}: "${line}" — expected format column_name:datatype`
        );
        return;
      }

      const name = parts[0].trim().toLowerCase().replace(/\s+/g, "_");
      const type = parts[1].trim().toLowerCase();

      if (!name) {
        newErrors.push(`Line ${idx + 1}: column name cannot be empty`);
        return;
      }

      if (!/^[a-z_][a-z0-9_]*$/.test(name)) {
        newErrors.push(
          `Line ${idx + 1}: "${name}" — column name must start with a letter or underscore and contain only letters, numbers, underscores`
        );
        return;
      }

      if (!SUPPORTED_TYPES.includes(type)) {
        newErrors.push(
          `Line ${idx + 1}: "${type}" — unsupported type. Use: ${SUPPORTED_TYPES.join(", ")}`
        );
        return;
      }

      if (parsed.some((f) => f.name === name)) {
        newErrors.push(`Line ${idx + 1}: duplicate column name "${name}"`);
        return;
      }

      parsed.push({ name, type });
    });

    setErrors(newErrors);

    if (newErrors.length === 0 && parsed.length > 0) {
      onFieldsParsed(parsed);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <Label htmlFor="field-input" className="text-sm font-medium">
          Define Fields
        </Label>
        <p className="text-xs text-gray-500 mt-1 mb-2">
          Enter one field per line in the format:{" "}
          <code className="bg-gray-100 px-1 py-0.5 rounded">
            column_name:datatype
          </code>
        </p>
        <p className="text-xs text-gray-500 mb-2">
          Supported types: <strong>text</strong>, <strong>number</strong>,{" "}
          <strong>date</strong>, <strong>boolean</strong>
        </p>
        <Textarea
          id="field-input"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={`emp_id:text\nnotice_date:date\nreason:text\nis_approved:boolean`}
          rows={6}
          className="font-mono text-sm"
        />
      </div>

      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <p className="text-sm font-medium text-red-800 mb-1">
            Validation Errors:
          </p>
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      <Button onClick={handleApply} className="w-full">
        Apply Fields
      </Button>
    </div>
  );
}
