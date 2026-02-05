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
    <div className="space-y-6">
      <div className="border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow className="bg-muted/50">
              <TableHead className="font-semibold">Column Name</TableHead>
              <TableHead className="font-semibold">Datatype</TableHead>
              <TableHead className="w-20 text-center font-semibold">
                Remove
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {fields.map((field, idx) => (
              <TableRow key={idx}>
                <TableCell className="font-mono text-sm font-medium">
                  {field.name}
                </TableCell>
                <TableCell>
                  <span className="inline-flex items-center px-2.5 py-1 rounded-md text-xs font-medium bg-primary/10 text-primary">
                    {field.type}
                  </span>
                </TableCell>
                <TableCell className="text-center">
                  <Button
                    variant="ghost"
                    size="icon-sm"
                    onClick={() => onRemoveField(idx)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 size={16} />
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <div className="space-y-2">
          <Label
            htmlFor="table-name"
            className="text-sm font-medium text-foreground"
          >
            Table Name
          </Label>
          <Input
            id="table-name"
            value={tableName}
            onChange={(e) => setTableName(e.target.value)}
            placeholder="e.g. employee_notices"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Lowercase, underscores only. Used as the database table name.
          </p>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="display-name"
            className="text-sm font-medium text-foreground"
          >
            Display Name
          </Label>
          <Input
            id="display-name"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            placeholder="e.g. Employee Notices"
          />
          <p className="text-xs text-muted-foreground leading-relaxed">
            Human-readable name shown in the UI.
          </p>
        </div>
      </div>

      {error && (
        <div className="text-sm text-destructive bg-destructive/10 border border-destructive/30 rounded-lg p-4">
          {error}
        </div>
      )}

      <Button
        onClick={handleCreate}
        disabled={loading}
        className="w-full font-medium"
      >
        {loading ? "Creating..." : "Create Form / Table"}
      </Button>
    </div>
  );
}
