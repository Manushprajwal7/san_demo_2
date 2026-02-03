"use client";

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Upload } from "lucide-react";
import * as XLSX from "xlsx";

interface TableInfo {
  id: string;
  table_name: string;
  display_name: string;
  columns: { name: string; type: string }[];
}

export function ExcelImport() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [fileName, setFileName] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{
    inserted: number;
    failed: number;
  } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    const fetchTables = async () => {
      try {
        const res = await fetch("/api/notice?action=tables");
        const data = await res.json();
        if (res.ok && Array.isArray(data)) {
          setTables(data);
        }
      } catch {
        // silent fail
      }
    };

    fetchTables();
  }, []);

  const getSelectedTableInfo = (): TableInfo | undefined => {
    return tables.find((t) => t.table_name === selectedTable);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    setParsedRows([]);
    setErrors([]);
    setResult(null);

    const tableInfo = getSelectedTableInfo();
    if (!tableInfo) {
      setErrors(["Please select a target table first."]);
      return;
    }

    const expectedColumns = tableInfo.columns.map((c) => c.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet
        );

        if (jsonData.length === 0) {
          setErrors(["The file is empty or has no data rows."]);
          return;
        }

        // Validate column names
        const fileColumns = Object.keys(jsonData[0]);
        const missing = expectedColumns.filter(
          (c) => !fileColumns.includes(c)
        );
        const extra = fileColumns.filter(
          (c) => !expectedColumns.includes(c)
        );

        const validationErrors: string[] = [];

        if (missing.length > 0) {
          validationErrors.push(
            `Missing columns: ${missing.join(", ")}`
          );
        }

        if (extra.length > 0) {
          validationErrors.push(
            `Extra columns (will be ignored): ${extra.join(", ")}`
          );
        }

        if (missing.length > 0) {
          setErrors(validationErrors);
          return;
        }

        // Filter rows to only include expected columns and validate types
        const cleanedRows = jsonData.map((row) => {
          const cleaned: Record<string, unknown> = {};
          tableInfo.columns.forEach((col) => {
            const val = row[col.name];
            if (col.type === "number") {
              cleaned[col.name] =
                val === undefined || val === null || val === ""
                  ? null
                  : Number(val);
            } else if (col.type === "boolean") {
              if (typeof val === "boolean") {
                cleaned[col.name] = val;
              } else if (typeof val === "string") {
                cleaned[col.name] = ["true", "yes", "1"].includes(
                  val.toLowerCase()
                );
              } else {
                cleaned[col.name] = Boolean(val);
              }
            } else {
              cleaned[col.name] =
                val === undefined || val === null ? null : String(val);
            }
          });
          return cleaned;
        });

        if (validationErrors.length > 0) {
          setErrors(validationErrors);
        }

        setParsedRows(cleanedRows);
      } catch {
        setErrors(["Failed to parse file. Ensure it is a valid Excel or CSV file."]);
      }
    };

    reader.readAsArrayBuffer(file);
  };

  const handleImport = async () => {
    if (parsedRows.length === 0) return;

    setImporting(true);
    setResult(null);

    try {
      const res = await fetch("/api/notice", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "bulk-insert",
          tableName: selectedTable,
          rows: parsedRows,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast.error(data.error || "Import failed.");
        return;
      }

      setResult(data);
      toast.success(
        `Import complete: ${data.inserted} inserted, ${data.failed} failed.`
      );
      setParsedRows([]);
      setFileName("");
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
    } catch {
      toast.error("Network error during import.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Step 1: Select target table */}
      <div>
        <Label className="text-sm font-medium">1. Select Target Table</Label>
        <Select value={selectedTable} onValueChange={(val) => {
          setSelectedTable(val);
          setParsedRows([]);
          setErrors([]);
          setResult(null);
          setFileName("");
          if (fileInputRef.current) {
            fileInputRef.current.value = "";
          }
        }}>
          <SelectTrigger className="mt-1">
            <SelectValue placeholder="Choose a table..." />
          </SelectTrigger>
          <SelectContent>
            {tables.map((t) => (
              <SelectItem key={t.table_name} value={t.table_name}>
                {t.display_name} ({t.table_name})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        {tables.length === 0 && (
          <p className="text-xs text-gray-500 mt-1">
            No tables found. Create a table first in the Form Builder tab.
          </p>
        )}
      </div>

      {/* Step 2: Upload file */}
      {selectedTable && (
        <div>
          <Label className="text-sm font-medium">
            2. Upload Excel / CSV File
          </Label>
          <p className="text-xs text-gray-500 mt-1 mb-2">
            File columns must match:{" "}
            {getSelectedTableInfo()
              ?.columns.map((c) => c.name)
              .join(", ")}
          </p>
          <div className="flex items-center gap-3 mt-1">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Upload size={18} className="text-gray-400" />
          </div>
          {fileName && (
            <p className="text-xs text-gray-600 mt-1">
              File: {fileName}
            </p>
          )}
        </div>
      )}

      {/* Validation errors */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3">
          <ul className="text-sm text-red-600 space-y-1">
            {errors.map((err, i) => (
              <li key={i}>• {err}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 3: Preview & Import */}
      {parsedRows.length > 0 && (
        <div>
          <p className="text-sm text-gray-700 mb-3">
            <strong>{parsedRows.length}</strong> rows parsed and ready to
            import.
          </p>
          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full"
          >
            {importing
              ? "Importing..."
              : `Import ${parsedRows.length} Rows`}
          </Button>
        </div>
      )}

      {/* Step 4: Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h4 className="font-medium text-green-800 mb-2">Import Results</h4>
          <div className="flex gap-6 text-sm">
            <div>
              <span className="text-green-700 font-semibold">
                {result.inserted}
              </span>{" "}
              <span className="text-green-600">rows inserted</span>
            </div>
            <div>
              <span className="text-red-700 font-semibold">
                {result.failed}
              </span>{" "}
              <span className="text-red-600">rows failed</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
