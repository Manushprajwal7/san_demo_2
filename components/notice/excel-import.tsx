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

    const expectedColumns = tableInfo.columns
      .map((c) => c.name)
      .filter((c) => !["id", "created_at", "updated_at"].includes(c));

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const sheet = workbook.Sheets[sheetName];

        const expandSheetRangeIfNeeded = () => {
          const cellAddresses = Object.keys(sheet).filter(
            (k) => !k.startsWith("!"),
          );
          if (cellAddresses.length === 0) return;

          let minR = Number.POSITIVE_INFINITY;
          let minC = Number.POSITIVE_INFINITY;
          let maxR = 0;
          let maxC = 0;

          for (const addr of cellAddresses) {
            const decoded = XLSX.utils.decode_cell(addr);
            if (decoded.r < minR) minR = decoded.r;
            if (decoded.c < minC) minC = decoded.c;
            if (decoded.r > maxR) maxR = decoded.r;
            if (decoded.c > maxC) maxC = decoded.c;
          }

          if (!Number.isFinite(minR) || !Number.isFinite(minC)) return;
          sheet["!ref"] = XLSX.utils.encode_range({
            s: { r: minR, c: minC },
            e: { r: maxR, c: maxC },
          });
        };

        expandSheetRangeIfNeeded();
        const normalizeColumnName = (name: string): string =>
          name
            .toLowerCase()
            .trim()
            .replace(/[\u200B-\u200D\uFEFF]/g, "")
            .replace(/[^a-z0-9]+/g, "_")
            .replace(/_+/g, "_")
            .replace(/^_+|_+$/g, "");

        const expectedNormalized = expectedColumns.map(normalizeColumnName);

        const aoa = XLSX.utils.sheet_to_json<unknown[]>(sheet, {
          header: 1,
          defval: "",
          blankrows: false,
        });

        const maxScan = Math.min(20, aoa.length);
        let headerRowIndex = 0;
        let bestScore = -1;

        for (let i = 0; i < maxScan; i++) {
          const row = Array.isArray(aoa[i]) ? aoa[i] : [];
          const normalizedCells = row
            .map((c) => normalizeColumnName(String(c ?? "")))
            .filter(Boolean);

          const score = normalizedCells.reduce((acc, cell) => {
            return acc + (expectedNormalized.includes(cell) ? 1 : 0);
          }, 0);

          if (score > bestScore) {
            bestScore = score;
            headerRowIndex = i;
          }
        }

        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          {
            defval: "",
            range: headerRowIndex,
            blankrows: false,
          },
        );

        if (jsonData.length === 0) {
          setErrors(["The file is empty or has no data rows."]);
          return;
        }

        const parseNumber = (
          val: unknown,
          columnName: string,
        ): number | string | null => {
          if (val === null || val === undefined || val === "") return null;

          // Check if this is a phone number field
          const isPhoneField = /phone|mobile|contact|tel/i.test(columnName);

          if (isPhoneField) {
            // For phone numbers, always treat as string to preserve leading zeros
            if (typeof val === "number") {
              // Convert number to string, preserving all digits
              return String(Math.floor(val));
            }
            const s = String(val).trim();
            // Remove any non-digit characters except + at the start
            const cleaned = s.replace(/[^\d+]/g, "");
            return cleaned || null;
          }

          // For regular numbers
          if (typeof val === "number") return Number.isFinite(val) ? val : null;
          const s = String(val).trim();
          if (!s) return null;
          const normalized = s.replace(/[₹,\s]/g, "");
          const num = Number(normalized);
          return Number.isFinite(num) ? num : null;
        };

        const parseDate = (val: unknown): string | null => {
          if (val === null || val === undefined || val === "") return null;
          if (val instanceof Date) return val.toISOString().slice(0, 10);
          if (typeof val === "number") {
            const date = XLSX.SSF.parse_date_code(val);
            return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
          }

          const s = String(val).trim();
          if (!s) return null;

          if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;

          const m = s.match(/^\s*(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{2,4})\s*$/);
          if (m) {
            const dd = Number(m[1]);
            const mm = Number(m[2]);
            const yyyy = Number(m[3].length === 2 ? `20${m[3]}` : m[3]);
            if (
              Number.isFinite(dd) &&
              Number.isFinite(mm) &&
              Number.isFinite(yyyy) &&
              yyyy > 1900 &&
              mm >= 1 &&
              mm <= 12 &&
              dd >= 1 &&
              dd <= 31
            ) {
              return `${yyyy}-${String(mm).padStart(2, "0")}-${String(dd).padStart(2, "0")}`;
            }
          }

          const d = new Date(s);
          if (!Number.isNaN(d.getTime())) return d.toISOString().slice(0, 10);
          return s;
        };

        const getPossibleNamesForColumn = (colName: string): string[] => {
          const n = normalizeColumnName(colName);
          const aliases: Record<string, string[]> = {
            empname: [
              "empname",
              "employee_name",
              "emp_name",
              "name",
              "employee name",
              "emp name",
              "full_name",
            ],
            name: ["name", "empname", "employee_name", "emp_name"],
            designation_name: [
              "designation_name",
              "designation",
              "designation name",
              "title",
              "job_title",
            ],
            designation: ["designation", "designation_name", "title"],
            joining_date: [
              "joining_date",
              "join_date",
              "joining date",
              "join date",
              "date_of_joining",
              "doj",
            ],
            join_date: [
              "join_date",
              "joining_date",
              "join date",
              "joining date",
            ],
            department: ["department", "dept", "division"],
            employee_code: [
              "employee_code",
              "emp_code",
              "employee code",
              "emp id",
              "emp_id",
            ],
            email: ["email", "e-mail", "email_address", "e_mail"],
            email_id: [
              "email_id",
              "email",
              "e-mail",
              "email_address",
              "emailid",
            ],
            phone: [
              "phone",
              "mobile",
              "contact",
              "phone_number",
              "mobile_number",
              "contact_number",
              "telephone",
              "tel",
            ],
            phone_no: [
              "phone_no",
              "phone",
              "phoneno",
              "phone_number",
              "contact",
              "mobile",
            ],
            contact_no: [
              "contact_no",
              "contact",
              "contactno",
              "contact_number",
              "contactnumber",
              "phone",
              "mobile",
              "phone_number",
              "secondary_contact",
              "alt_phone",
            ],
            mobile_number: [
              "mobile_number",
              "mobile",
              "mobilenumber",
              "phone",
              "contact",
              "phone_number",
            ],
            salary: ["salary", "pay", "ctc"],
            status: ["status", "state"],
            online_login: [
              "online_login",
              "onlinelogin",
              "online_access",
              "onlineaccess",
              "login",
              "has_login",
              "web_login",
              "portal_login",
              "can_login",
            ],
            user_id: ["user_id", "userid", "username", "user_name", "login_id"],
            password: ["password", "pwd", "pass"],
            slo_officer_name: [
              "slo_officer_name",
              "slo_officer",
              "sloofficername",
              "slo_name",
              "officer_name",
              "slo",
              "officer",
            ],
            circle_no: ["circle_no", "circleno", "circle_number", "circle"],
            license_no: [
              "license_no",
              "licenseno",
              "license_number",
              "licence_no",
            ],
            license_date: [
              "license_date",
              "licensedate",
              "license_issue_date",
              "licence_date",
            ],
            opened_on: ["opened_on", "openedon", "opening_date", "open_date"],
            date_of_renewal: [
              "date_of_renewal",
              "dateofrenewal",
              "renewal_date",
              "renewaldate",
            ],
            renewed_upto: [
              "renewed_upto",
              "renewedupto",
              "renewal_expiry",
              "valid_upto",
            ],
            number_of_years_renewed: [
              "number_of_years_renewed",
              "numberofyearsrenewed",
              "years_renewed",
              "renewal_years",
            ],
            approved_manpower: [
              "approved_manpower",
              "approvedmanpower",
              "approved_strength",
              "manpower",
            ],
            manpower_cost: [
              "manpower_cost",
              "manpowercost",
              "manpower_expense",
              "labor_cost",
            ],
            managing_director: [
              "managing_director",
              "managingdirector",
              "md",
              "director",
            ],
            name_of_the_manager: [
              "name_of_the_manager",
              "nameofthemanager",
              "manager_name",
              "manager",
            ],
            state_head: [
              "state_head",
              "statehead",
              "state_manager",
              "state_incharge",
            ],
            sales_head: [
              "sales_head",
              "saleshead",
              "sales_manager",
              "sales_incharge",
            ],
            address_i: [
              "address_i",
              "addressi",
              "address_1",
              "address1",
              "address",
            ],
            geography: ["geography", "region", "area", "zone"],
            district: ["district", "dist"],
            branch: ["branch", "branch_name", "location"],
            asm: ["asm", "area_sales_manager", "area_manager"],
            fee: ["fee", "fees", "amount", "charge"],
            male: ["male", "male_count", "males"],
            female: ["female", "female_count", "females"],
          };
          if (aliases[n]) return [n, ...aliases[n]];
          return [n, colName];
        };

        const fileColumns = Object.keys(jsonData[0]);
        const columnMapping = new Map<string, string>();
        const usedFileCols = new Set<string>();

        // First pass: exact normalized match (e.g. Contact_No -> contact_no)
        // so shared aliases (e.g. "contact") don't steal the wrong column
        expectedColumns.forEach((expectedCol) => {
          const expectedNorm = normalizeColumnName(expectedCol);
          const match = fileColumns.find(
            (fc) =>
              !usedFileCols.has(fc) &&
              normalizeColumnName(fc) === expectedNorm,
          );
          if (match) {
            columnMapping.set(expectedCol, match);
            usedFileCols.add(match);
          }
        });

        // Second pass: alias match for any expected column still unmapped
        expectedColumns.forEach((expectedCol) => {
          if (columnMapping.has(expectedCol)) return;
          const possible = getPossibleNamesForColumn(expectedCol);
          const normalizedPossible = new Set(possible.map(normalizeColumnName));
          const match = fileColumns.find(
            (fc) =>
              !usedFileCols.has(fc) &&
              normalizedPossible.has(normalizeColumnName(fc)),
          );
          if (match) {
            columnMapping.set(expectedCol, match);
            usedFileCols.add(match);
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
              const result = parseNumber(val, col.name);
              // If it's a phone field and we got a string back, keep it as string
              if (typeof result === "string") {
                cleaned[col.name] = result;
              } else {
                cleaned[col.name] = result;
              }
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
              cleaned[col.name] = parseDate(val);
            } else {
              cleaned[col.name] = String(val);
            }
          });
          return cleaned;
        });

        const nonEmptyRows = cleanedRows.filter((row) =>
          Object.values(row).some((v) => v !== null && v !== ""),
        );

        if (validationWarnings.length > 0) {
          setErrors(validationWarnings);
        }

        setParsedRows(nonEmptyRows);
        toast.success(`Parsed ${nonEmptyRows.length} rows successfully`);
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
