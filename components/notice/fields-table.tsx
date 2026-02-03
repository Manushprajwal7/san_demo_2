"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";
import type { FieldDef } from "./field-definition";

interface FieldsTableProps {
  fields: FieldDef[];
  onRemoveField: (index: number) => void;
  onTableCreated: (tableName: string, displayName: string) => void;
}

export function FieldsTable({
  fields,
  onRemoveField,
  onTableCreated,
}: FieldsTableProps) {
  const [tableName, setTableName] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleCreate = async () => {
    const sanitized = tableName
      .trim()
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    if (!sanitized) {
      setError("Please enter a valid table name.");
      return;
    }

    if (!displayName.trim()) {
      setError("Please enter a display name.");
      return;
    }

    if (fields.length === 0) {
      setError("No fields defined. Apply fields first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "create-table",
          tableName: sanitized,
          displayName: displayName.trim(),
          columns: fields,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Failed to create table.");
        return;
      }

      onTableCreated(sanitized, displayName.trim());
      setTableName("");
      setDisplayName("");
    } catch (err) {
      setError("Network error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (fields.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Column Name</TableHead>
            <TableHead>Datatype</TableHead>
            <TableHead className="w-16">Remove</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {fields.map((field, idx) => (
            <TableRow key={idx}>
              <TableCell className="font-mono text-sm">{field.name}</TableCell>
              <TableCell>
                <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800">
                  {field.type}
                </span>
              </TableCell>
              <TableCell>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveField(idx)}
                  className="text-red-500 hover:text-red-700 hover:bg-red-50"
                >
                  <Trash2 size={14} />
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <Label htmlFor="table-name" className="text-sm font-medium">
            Table Name
          </Label>
          <Input
            id="table-name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g. employee_notices"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Lowercase, underscores only. Used as the database table name.
          </p>
        </div>
        <div>
          <Label htmlFor="display-name" className="text-sm font-medium">
            Display Name
          </Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Employee Notices"
            className="mt-1"
          />
          <p className="text-xs text-gray-500 mt-1">
            Human-readable name shown in the UI.
          </p>
        </div>
      </div>

      {error && (
        <p className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-lg p-3">
          {error}
        </p>
      )}

      <Button onClick={handleCreate} disabled={loading} className="w-full">
        {loading ? "Creating..." : "Create Form / Table"}
      </Button>
    </div>
  );
}
