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
        const jsonData =
          XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet);

        if (jsonData.length === 0) {
          setErrors(["The file is empty or has no data rows."]);
          return;
        }

        // Normalize column names: lowercase, replace spaces/dots with underscores
        const normalizeColumnName = (name: string): string => {
          return name
            .toLowerCase()
            .trim()
            .replace(/\s+/g, "_")
            .replace(/\./g, "_")
            .replace(/_+/g, "_");
        };

        // Get file columns and create mapping
        const fileColumns = Object.keys(jsonData[0]);
        const columnMapping = new Map<string, string>();

        // Map file columns to expected columns
        expectedColumns.forEach((expectedCol) => {
          const normalizedExpected = normalizeColumnName(expectedCol);
          const matchingFileCol = fileColumns.find(
            (fileCol) => normalizeColumnName(fileCol) === normalizedExpected,
          );
          if (matchingFileCol) {
            columnMapping.set(expectedCol, matchingFileCol);
          }
        });

        // Check for missing columns
        const missing = expectedColumns.filter((c) => !columnMapping.has(c));
        const mapped = expectedColumns.filter((c) => columnMapping.has(c));

        const validationWarnings: string[] = [];

        if (missing.length > 0) {
          validationWarnings.push(
            `⚠️ Missing columns (will be set to NULL): ${missing.join(", ")}`,
          );
        }

        if (mapped.length > 0) {
          validationWarnings.push(`✅ Mapped columns: ${mapped.join(", ")}`);
        }

        // Show extra columns in file that won't be imported
        const extraColumns = fileColumns.filter(
          (fileCol) =>
            !expectedColumns.some(
              (expectedCol) =>
                normalizeColumnName(fileCol) ===
                normalizeColumnName(expectedCol),
            ),
        );

        if (extraColumns.length > 0) {
          validationWarnings.push(
            `ℹ️ Extra columns in file (will be ignored): ${extraColumns.join(", ")}`,
          );
        }

        // Filter rows to only include expected columns and validate types
        const cleanedRows = jsonData.map((row) => {
          const cleaned: Record<string, unknown> = {};
          tableInfo.columns.forEach((col) => {
            const fileColName = columnMapping.get(col.name);
            const val = fileColName ? row[fileColName] : undefined;

            // Handle empty values
            if (val === undefined || val === null || val === "") {
              cleaned[col.name] = null;
              return;
            }

            // Type conversion
            if (col.type === "number") {
              const numVal = Number(val);
              cleaned[col.name] = isNaN(numVal) ? null : numVal;
            } else if (col.type === "boolean") {
              if (typeof val === "boolean") {
                cleaned[col.name] = val;
              } else if (typeof val === "string") {
                cleaned[col.name] = ["true", "yes", "1"].includes(
                  val.toLowerCase(),
                );
              } else {
                cleaned[col.name] = Boolean(val);
              }
            } else if (col.type === "date") {
              // Handle date values
              if (typeof val === "number") {
                // Excel date serial number
                const date = XLSX.SSF.parse_date_code(val);
                cleaned[col.name] =
                  `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
              } else {
                cleaned[col.name] = String(val);
              }
            } else {
              cleaned[col.name] = String(val);
            }
          });
          return cleaned;
        });

        if (validationWarnings.length > 0) {
          setErrors(validationWarnings);
        }

        setParsedRows(cleanedRows);
        toast.success(`Parsed ${cleanedRows.length} rows successfully`);
      } catch (err) {
        setErrors([
          `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`,
        ]);
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
        `Import complete: ${data.inserted} inserted, ${data.failed} failed.`,
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
      <div className="space-y-3">
        <Label className="text-sm font-medium text-foreground">
          1. Select Target Table
        </Label>
        <Select
          value={selectedTable}
          onValueChange={(val) => {
            setSelectedTable(val);
            setParsedRows([]);
            setErrors([]);
            setResult(null);
            setFileName("");
            if (fileInputRef.current) {
              fileInputRef.current.value = "";
            }
          }}
        >
          <SelectTrigger>
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
          <p className="text-sm text-muted-foreground">
            No tables found. Create a table first in the Form Builder tab.
          </p>
        )}
      </div>

      {/* Step 2: Upload file */}
      {selectedTable && (
        <div className="space-y-3">
          <Label className="text-sm font-medium text-foreground">
            2. Upload Excel / CSV File
          </Label>
          <p className="text-sm text-muted-foreground leading-relaxed">
            Column names will be matched automatically (case-insensitive).
            Missing columns will be set to NULL.
          </p>
          <p className="text-xs text-muted-foreground font-mono bg-muted p-3 rounded-md">
            Expected columns:{" "}
            {getSelectedTableInfo()
              ?.columns.map((c) => c.name)
              .join(", ")}
          </p>
          <div className="flex items-center gap-3">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleFileChange}
              className="flex-1"
            />
            <Upload size={20} className="text-muted-foreground" />
          </div>
          {fileName && (
            <p className="text-sm text-foreground font-medium">📄 {fileName}</p>
          )}
        </div>
      )}

      {/* Validation warnings */}
      {errors.length > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
          <ul className="text-sm text-amber-800 space-y-1.5">
            {errors.map((err, i) => (
              <li key={i} className="leading-relaxed">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Step 3: Preview & Import */}
      {parsedRows.length > 0 && (
        <div className="space-y-4">
          <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
            <p className="text-sm text-foreground">
              <span className="font-semibold text-primary">
                {parsedRows.length}
              </span>{" "}
              rows parsed and ready to import
            </p>
          </div>
          <Button
            onClick={handleImport}
            disabled={importing}
            className="w-full font-medium"
          >
            {importing ? "Importing..." : `Import ${parsedRows.length} Rows`}
          </Button>
        </div>
      )}

      {/* Step 4: Results */}
      {result && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-5">
          <h4 className="font-semibold text-green-900 mb-3">Import Results</h4>
          <div className="flex gap-8 text-sm">
            <div>
              <span className="text-2xl font-bold text-green-700">
                {result.inserted}
              </span>
              <p className="text-green-600 mt-1">rows inserted</p>
            </div>
            <div>
              <span className="text-2xl font-bold text-red-700">
                {result.failed}
              </span>
              <p className="text-red-600 mt-1">rows failed</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
