"use client";

import { useState, useEffect, useMemo, useRef } from "react";
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
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Card } from "@/components/ui/card";
import { toast } from "sonner";
import {
  Search,
  Filter,
  Download,
  Trash2,
  Edit,
  RefreshCw,
  ChevronUp,
  ChevronDown,
  X,
  FileSpreadsheet,
  File,
  Upload,
  Calendar,
  ChevronRight,
  Bug,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";

interface TableInfo {
  id: string;
  table_name: string;
  display_name: string;
  columns: { name: string; type: string }[];
}

interface FilterRule {
  column: string;
  operator: string;
  value: string;
}

const DATE_COLUMNS = [
  "joining_date",
  "join_date",
  "created_at",
  "date_of_joining",
];

function getDateFromRow(row: Record<string, unknown>): Date | null {
  for (const col of DATE_COLUMNS) {
    const val = row[col];
    if (val) {
      const d = new Date(val as string);
      if (!isNaN(d.getTime())) return d;
    }
  }
  return null;
}

/** Normalize date values to ISO YYYY-MM-DD for PostgreSQL; invalid dates become null. */
function toISODate(val: string | number): string | null {
  if (val === undefined || val === null || val === "") return null;
  if (typeof val === "number") {
    const date = XLSX.SSF.parse_date_code(val);
    if (date.d === 0) return null; // e.g. Excel 1900-01-00
    return `${date.y}-${String(date.m).padStart(2, "0")}-${String(date.d).padStart(2, "0")}`;
  }
  const s = String(val).trim();
  if (!s) return null;
  // DD-MM-YYYY or DD/MM/YYYY
  const dmy = s.match(/^(\d{1,2})[-\/](\d{1,2})[-\/](\d{4})$/);
  if (dmy) {
    const [, d, m, y] = dmy;
    const day = parseInt(d!, 10);
    const month = parseInt(m!, 10);
    const year = parseInt(y!, 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) {
      return `${y}-${m!.padStart(2, "0")}-${d!.padStart(2, "0")}`;
    }
  }
  // Already YYYY-MM-DD
  const iso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (iso) {
    const [, y, m, d] = iso;
    const day = parseInt(d!, 10);
    const month = parseInt(m!, 10);
    if (day >= 1 && day <= 31 && month >= 1 && month <= 12) return s.slice(0, 10);
  }
  const date = new Date(s);
  if (!isNaN(date.getTime())) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, "0");
    const d = String(date.getDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }
  return null;
}

const MONTHS = [
  "All Months",
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];

export function EmployeesDataViewer() {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filters, setFilters] = useState<FilterRule[]>([]);
  const [sortColumn, setSortColumn] = useState<string>("");
  const [sortDirection, setSortDirection] = useState<"asc" | "desc">("asc");
  const [editingRow, setEditingRow] = useState<Record<string, unknown> | null>(
    null,
  );
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>("0");
  const [selectedYear, setSelectedYear] = useState<string>(
    new Date().getFullYear().toString(),
  );
  const [importing, setImporting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [isDownloading, setIsDownloading] = useState(false);
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [importDebugLog, setImportDebugLog] = useState<string[]>([]);
  const [chunkSize, setChunkSize] = useState(100); // Default chunk size
  const [totalRowCount, setTotalRowCount] = useState(0);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRowDetail, setSelectedRowDetail] = useState<Record<string, unknown> | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const tableInfo = useMemo(
    () => tables.find((t) => t.table_name === selectedTable),
    [tables, selectedTable],
  );

  const allColumns = useMemo(() => {
    if (tableData.length === 0) return [];
    return Object.keys(tableData[0]);
  }, [tableData]);

  useEffect(() => {
    fetchTables();
  }, []);

  useEffect(() => {
    if (selectedTable) {
      fetchData();
    } else {
      setTableData([]);
      setTotalRowCount(0);
    }
  }, [selectedTable]);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/notice?action=tables");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTables(data);
        if (data.length > 0 && !selectedTable) {
          setSelectedTable(data[0].table_name);
        }
      }
    } catch {
      toast.error("Failed to fetch tables");
    }
  };

  const fetchData = async (useChunked = false) => {
    if (!selectedTable) return;

    if (useChunked) {
      await fetchDataChunked();
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(
        `/api/employees?table=${encodeURIComponent(selectedTable)}&offset=0&limit=100`,
      );
      const data = await res.json();
      if (res.ok) {
        setTableData(Array.isArray(data.employees) ? data.employees : []);
        setTotalRowCount(data.pagination?.totalItems ?? 0);
      } else {
        toast.error(data.error || "Failed to fetch data");
        setTableData([]);
        setTotalRowCount(0);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error("Network error");
      setTableData([]);
      setTotalRowCount(0);
    } finally {
      setLoading(false);
    }
  };

  const loadMore = async () => {
    if (!selectedTable || loadingMore || tableData.length >= totalRowCount) return;
    setLoadingMore(true);
    try {
      const res = await fetch(
        `/api/employees?table=${encodeURIComponent(selectedTable)}&offset=${tableData.length}&limit=50`,
      );
      const data = await res.json();
      if (res.ok && Array.isArray(data.employees)) {
        setTableData((prev) => [...prev, ...data.employees]);
      }
    } catch (error) {
      console.error("Load more error:", error);
      toast.error("Failed to load more rows");
    } finally {
      setLoadingMore(false);
    }
  };

  const fetchDataChunked = async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    setIsDownloading(true);
    setDownloadProgress(0);
    
    try {
      // First, get the total count
      const countRes = await fetch(
        `/api/employees?table=${encodeURIComponent(selectedTable)}&chunk=1&chunkSize=1`,
      );
      
      if (!countRes.ok) {
        const error = await countRes.json();
        throw new Error(error.error || 'Failed to fetch data count');
      }
      
      const countData = await countRes.json();
      const totalItems = countData.pagination?.totalItems || 0;
      
      if (totalItems === 0) {
        setTableData([]);
        return;
      }
      
      const totalChunks = Math.ceil(totalItems / chunkSize);
      let allData: Record<string, unknown>[] = [];
      
      // Fetch data in chunks
      for (let i = 1; i <= totalChunks; i++) {
        const res = await fetch(
          `/api/employees?table=${encodeURIComponent(selectedTable)}&chunk=${i}&chunkSize=${chunkSize}`,
        );
        
        if (!res.ok) {
          const error = await res.json();
          console.error(`Error fetching chunk ${i}:`, error);
          continue;
        }
        
        const data = await res.json();
        if (data.employees && Array.isArray(data.employees)) {
          allData = [...allData, ...data.employees];
        }
        
        // Update progress
        const progress = Math.round((i / totalChunks) * 100);
        setDownloadProgress(progress);
      }
      
      setTableData(allData);
      setTotalRowCount(allData.length);
    } catch (error) {
      console.error("Chunked fetch error:", error);
      toast.error(error instanceof Error ? error.message : "Failed to fetch data in chunks");
    } finally {
      setLoading(false);
      setIsDownloading(false);
      setDownloadProgress(0);
    }
  };

  const addFilter = () => {
    if (allColumns.length > 0) {
      setFilters([
        ...filters,
        { column: allColumns[0], operator: "equals", value: "" },
      ]);
    }
  };

  const removeFilter = (index: number) => {
    setFilters(filters.filter((_, i) => i !== index));
  };

  const updateFilter = (
    index: number,
    field: keyof FilterRule,
    value: string,
  ) => {
    const newFilters = [...filters];
    newFilters[index][field] = value;
    setFilters(newFilters);
  };

  const filteredAndSortedData = useMemo(() => {
    let result = [...tableData];

    if (selectedMonth !== "0" && selectedYear) {
      const monthNum = parseInt(selectedMonth, 10);
      const yearNum = parseInt(selectedYear, 10);
      if (!isNaN(monthNum) && !isNaN(yearNum)) {
        result = result.filter((row) => {
          const d = getDateFromRow(row);
          if (!d) return false;
          return d.getMonth() + 1 === monthNum && d.getFullYear() === yearNum;
        });
      }
    }

    if (searchTerm) {
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val ?? "")
            .toLowerCase()
            .includes(searchTerm.toLowerCase()),
        ),
      );
    }

    filters.forEach((filter) => {
      if (filter.value) {
        result = result.filter((row) => {
          const cellValue = String(row[filter.column] ?? "").toLowerCase();
          const filterValue = filter.value.toLowerCase();
          switch (filter.operator) {
            case "equals":
              return cellValue === filterValue;
            case "contains":
              return cellValue.includes(filterValue);
            case "starts_with":
              return cellValue.startsWith(filterValue);
            case "ends_with":
              return cellValue.endsWith(filterValue);
            case "greater_than":
              return Number(row[filter.column]) > Number(filter.value);
            case "less_than":
              return Number(row[filter.column]) < Number(filter.value);
            default:
              return true;
          }
        });
      }
    });

    if (sortColumn) {
      result.sort((a, b) => {
        const aVal = a[sortColumn];
        const bVal = b[sortColumn];
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        const comparison = String(aVal).localeCompare(String(bVal), undefined, {
          numeric: true,
        });
        return sortDirection === "asc" ? comparison : -comparison;
      });
    }

    return result;
  }, [
    tableData,
    searchTerm,
    filters,
    sortColumn,
    sortDirection,
    selectedMonth,
    selectedYear,
  ]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleExportExcel = () => {
    if (filteredAndSortedData.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      const cleanData = filteredAndSortedData.map((row) => {
        const cleanRow: Record<string, string | number> = {};
        allColumns.forEach((col) => {
          const value = row[col];
          cleanRow[col] = value === null || value === undefined ? "" : value;
        });
        return cleanRow;
      });
      const ws = XLSX.utils.json_to_sheet(cleanData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, selectedTable || "Data");
      XLSX.writeFile(
        wb,
        `${selectedTable}_export_${new Date().toISOString().slice(0, 10)}.xlsx`,
      );
      toast.success("Excel file exported successfully");
    } catch (error) {
      console.error("Excel export error:", error);
      toast.error("Failed to export Excel file");
    }
  };

  const handleExportPDF = () => {
    if (filteredAndSortedData.length === 0) {
      toast.error("No data to export");
      return;
    }
    try {
      const doc = new jsPDF({
        orientation: allColumns.length > 6 ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(tableInfo?.display_name || selectedTable || "Data", 14, 15);
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Records: ${filteredAndSortedData.length}`, 14, 27);
      const headers = allColumns;
      const rows = filteredAndSortedData.map((row) =>
        allColumns.map((col) => {
          const val = row[col];
          if (val === null || val === undefined) return "-";
          if (typeof val === "object") return JSON.stringify(val);
          return String(val);
        }),
      );
      doc.autoTable({
        head: [headers],
        body: rows,
        startY: 32,
        styles: {
          fontSize: 8,
          cellPadding: 2,
          overflow: "linebreak",
          cellWidth: "wrap",
        },
        headStyles: {
          fillColor: [37, 99, 235],
          textColor: 255,
          fontStyle: "bold",
          halign: "center",
        },
        alternateRowStyles: { fillColor: [249, 250, 251] },
        margin: { top: 32 },
        theme: "grid",
      });
      doc.save(
        `${selectedTable}_export_${new Date().toISOString().slice(0, 10)}.pdf`,
      );
      toast.success("PDF file exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF file");
    }
  };

  const normalizeColumnName = (name: string): string =>
    name
      .toLowerCase()
      .trim()
      .replace(/\s+/g, "_")
      .replace(/\./g, "_")
      .replace(/-/g, "_")
      .replace(/_+/g, "_");

  // Common aliases: table column -> possible Excel header variations
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
      join_date: ["join_date", "joining_date", "join date", "joining date"],
      department: ["department", "dept", "division"],
      employee_code: [
        "employee_code",
        "emp_code",
        "employee code",
        "emp id",
        "emp_id",
      ],
      email: ["email", "e-mail", "email_address"],
      // Phone / contact fields
      phone: ["phone", "mobile", "contact", "phone_number", "phone no", "mobile no", "contact no"],
      phone_no: [
        "phone_no",
        "phone no",
        "phone number",
        "mobile",
        "mobile no",
        "mobile_no",
        "contact",
        "contact no",
        "contact_no",
        "phone",
      ],
      phone_number: [
        "phone_number",
        "phone number",
        "phone no",
        "phone_no",
        "mobile",
        "mobile no",
        "mobile_no",
        "contact",
        "contact no",
        "contact_no",
      ],
      contact_no: [
        "contact_no",
        "contact no",
        "contact",
        "contactno",
        "contact_number",
        "contactnumber",
        "secondary_contact",
        "alt_phone",
      ],
      online_login: [
        "online_login",
        "online login",
        "onlinelogin",
        "online_access",
        "onlineaccess",
        "login",
        "web_login",
        "portal_login",
        "can_login",
      ],
      slo_officer_name: [
        "slo_officer_name",
        "slo officer name",
        "slo_officer",
        "slo officer",
        "sloofficername",
        "slo_name",
        "officer_name",
        "slo",
        "officer",
      ],
      salary: ["salary", "pay", "ctc"],
      status: ["status", "state"],
    };
    if (aliases[n]) return [n, ...aliases[n]];
    return [n, colName];
  };

  const findMatchingFileColumn = (
    expectedCol: string,
    fileColumns: string[],
    usedFileCols: Set<string>,
  ): string | null => {
    const possible = getPossibleNamesForColumn(expectedCol);
    const normalizedPossible = new Set(possible.map(normalizeColumnName));

    for (const fileCol of fileColumns) {
      if (usedFileCols.has(fileCol)) continue;
      const n = normalizeColumnName(fileCol);
      if (normalizedPossible.has(n)) {
        usedFileCols.add(fileCol);
        return fileCol;
      }
      if (n === normalizeColumnName(expectedCol)) {
        usedFileCols.add(fileCol);
        return fileCol;
      }
    }
    return null;
  };

  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !tableInfo) return;

    setImportFileName(file.name);
    setParsedRows([]);
    setErrors([]);
    setImportDebugLog([]);
    setUploadProgress(0);

    const expectedColumns = tableInfo.columns.map((c) => c.name);

    const reader = new FileReader();
    reader.onload = async (evt) => {
      try {
        const data = new Uint8Array(evt.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const sheet = workbook.Sheets[workbook.SheetNames[0]];
        const jsonData = XLSX.utils.sheet_to_json<Record<string, unknown>>(
          sheet,
          { defval: "" },
        );

        if (jsonData.length === 0) {
          setErrors(["The file is empty or has no data rows."]);
          return;
        }

        const fileColumns = Object.keys(jsonData[0]);
        const columnMapping = new Map<string, string>();
        const matchSource = new Map<string, "exact" | "alias">();
        const usedFileCols = new Set<string>();

        // First pass: exact normalized match (e.g. "Contact No" -> contact_no)
        // so shared aliases don't steal the wrong column (e.g. phone_no taking "Contact No")
        expectedColumns.forEach((expectedCol) => {
          const expectedNorm = normalizeColumnName(expectedCol);
          const exact = fileColumns.find(
            (fc) =>
              !usedFileCols.has(fc) &&
              normalizeColumnName(fc) === expectedNorm,
          );
          if (exact) {
            columnMapping.set(expectedCol, exact);
            matchSource.set(expectedCol, "exact");
            usedFileCols.add(exact);
          }
        });

        // Second pass: alias match for any expected column still unmapped
        expectedColumns.forEach((expectedCol) => {
          if (columnMapping.has(expectedCol)) return;
          const match = findMatchingFileColumn(
            expectedCol,
            fileColumns,
            usedFileCols,
          );
          if (match) {
            columnMapping.set(expectedCol, match);
            matchSource.set(expectedCol, "alias");
          }
        });

        const missing = expectedColumns.filter((c) => !columnMapping.has(c));

        // --- Detailed debug log ---
        const debugLines: string[] = [];
        debugLines.push("═══ FILE COLUMNS (raw from Excel) ═══");
        fileColumns.forEach((fc, i) => {
          debugLines.push(`  ${i + 1}. "${fc}"  →  normalized: "${normalizeColumnName(fc)}"`);
        });
        debugLines.push("");
        debugLines.push("═══ EXPECTED COLUMNS (table schema) & MATCH RESULT ═══");
        expectedColumns.forEach((expectedCol) => {
          const fileCol = columnMapping.get(expectedCol);
          const source = matchSource.get(expectedCol);
          const possible = getPossibleNamesForColumn(expectedCol);
          const possibleNorm = possible.map(normalizeColumnName).join(", ");
          if (fileCol && source) {
            debugLines.push(`  ✓ ${expectedCol}  →  "${fileCol}" (${source})`);
          } else {
            debugLines.push(`  ✗ ${expectedCol}  →  NO MATCH`);
            debugLines.push(`      Tried normalized names: [ ${possibleNorm} ]`);
            debugLines.push(`      Available file columns (normalized): [ ${fileColumns.map((fc) => normalizeColumnName(fc)).join(", ")} ]`);
          }
        });
        debugLines.push("");
        debugLines.push("═══ UNMAPPED FILE COLUMNS (in Excel but no expected column) ═══");
        const mappedFileCols = new Set(columnMapping.values());
        const unmappedFileCols = fileColumns.filter((fc) => !mappedFileCols.has(fc));
        if (unmappedFileCols.length === 0) {
          debugLines.push("  (none)");
        } else {
          unmappedFileCols.forEach((fc) => {
            debugLines.push(`  - "${fc}" (normalized: "${normalizeColumnName(fc)}")`);
          });
        }
        setImportDebugLog(debugLines);

        const validationWarnings: string[] = [];
        if (missing.length > 0) {
          validationWarnings.push(
            `⚠️ Unmapped (will be NULL): ${missing.join(", ")}`,
          );
        }
        validationWarnings.push(
          `✅ Mapped: ${[...columnMapping.keys()].join(", ")}`,
        );
        validationWarnings.push(`📄 Rows to import: ${jsonData.length}`);
        setErrors(validationWarnings);

        const cleanedRows = jsonData.map((row) => {
          const cleaned: Record<string, unknown> = {};
          tableInfo.columns.forEach((col) => {
            const fileColName = columnMapping.get(col.name);
            const val = fileColName ? row[fileColName] : undefined;

            if (val === undefined || val === null || val === "") {
              cleaned[col.name] = null;
              return;
            }

            // Phone/mobile/contact: always store as string to preserve leading zeros
            if (/phone|mobile|contact/i.test(col.name)) {
              const s = String(val).trim();
              const digits = s.replace(/^\+/, "").replace(/\D/g, "");
              cleaned[col.name] = digits ? (s.startsWith("+") ? "+" : "") + digits : null;
              return;
            }

            if (col.type === "number") {
              const numVal = Number(val);
              cleaned[col.name] = Number.isFinite(numVal) ? numVal : null;
            } else if (col.type === "boolean") {
              if (typeof val === "boolean") cleaned[col.name] = val;
              else if (typeof val === "string") {
                cleaned[col.name] = ["true", "yes", "1"].includes(
                  val.toLowerCase(),
                );
              } else {
                cleaned[col.name] = Boolean(val);
              }
            } else if (col.type === "date") {
              cleaned[col.name] = toISODate(val as string | number);
            } else {
              cleaned[col.name] = String(val);
            }
          });
          return cleaned;
        });

        setParsedRows(cleanedRows);
        toast.success(`Parsed ${cleanedRows.length} rows`);
      } catch (err) {
        console.error("File parsing error:", err);
        setErrors([
          `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`,
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const uploadChunk = async (chunk: any[], index: number, totalChunks: number): Promise<{ success: boolean; error?: string }> => {
    try {
      const formData = new FormData();
      formData.append('table', selectedTable);
      formData.append('chunk', JSON.stringify(chunk));
      formData.append('chunkIndex', index.toString());
      formData.append('totalChunks', totalChunks.toString());
      
      const response = await fetch('/api/employees', {
        method: 'POST',
        body: formData,
      });
      
      if (!response.ok) {
        const error = await response.json();
        return { success: false, error: error.error || 'Failed to upload chunk' };
      }
      
      return { success: true };
    } catch (error) {
      console.error('Chunk upload error:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : 'Unknown error during upload' 
      };
    }
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0 || !selectedTable) return;
    setImporting(true);
    setUploadProgress(0);
    
    try {
      const CHUNK_SIZE = 100; // Process 100 rows at a time
      const totalChunks = Math.ceil(parsedRows.length / CHUNK_SIZE);
      let successfulChunks = 0;
      let failedChunks = 0;
      let totalInserted = 0;
      let totalFailed = 0;

      // Process chunks in parallel (3 at a time)
      const chunkPromises = [];
      
      for (let i = 0; i < totalChunks; i++) {
        const chunk = parsedRows.slice(i * CHUNK_SIZE, (i + 1) * CHUNK_SIZE);
        
        // Process chunk with a small delay to avoid overwhelming the server
        const chunkPromise = new Promise<void>(async (resolve) => {
          try {
            // Add a small delay between chunks (100ms per chunk)
            await new Promise(resolve => setTimeout(resolve, 100 * i));
            
            const { success, error } = await uploadChunk(chunk, i, totalChunks);
            
            if (success) {
              successfulChunks++;
              totalInserted += chunk.length;
            } else {
              failedChunks++;
              totalFailed += chunk.length;
              console.error(`Chunk ${i + 1} failed:`, error);
            }
            
            // Update progress
            const progress = Math.round(((i + 1) / totalChunks) * 100);
            setUploadProgress(progress);
            
            resolve();
          } catch (error) {
            console.error(`Error processing chunk ${i + 1}:`, error);
            failedChunks++;
            totalFailed += chunk.length;
            resolve();
          }
        });
        
        chunkPromises.push(chunkPromise);
        
        // Process 3 chunks in parallel
        if (chunkPromises.length >= 3) {
          await Promise.all(chunkPromises);
          chunkPromises.length = 0; // Clear the array
        }
      }
      
      // Process any remaining chunks
      if (chunkPromises.length > 0) {
        await Promise.all(chunkPromises);
      }

      toast.success(
        `Import complete: ${totalInserted} inserted, ${totalFailed} failed`,
      );
      setParsedRows([]);
      setImportFileName("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      fetchData();
    } catch {
      toast.error("Network error during import");
    } finally {
      setImporting(false);
    }
  };

  const handleUpdate = async () => {
    if (!editingRow || !editingRow.id || !selectedTable) return;
    try {
      const res = await fetch("/api/notice", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "update-row",
          tableName: selectedTable,
          rowId: editingRow.id,
          data: editingRow,
        }),
      });

      if (res.ok) {
        toast.success("Row updated successfully");
        fetchData();
        setEditingRow(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update row");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleDelete = async (rowId: string) => {
    if (!selectedTable) return;
    try {
      const res = await fetch("/api/notice", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          action: "delete-row",
          tableName: selectedTable,
          rowId,
        }),
      });

      if (res.ok) {
        toast.success("Row deleted successfully");
        fetchData();
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete row");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const years = useMemo(() => {
    const y = new Date().getFullYear();
    return Array.from({ length: 11 }, (_, i) => (y - 5 + i).toString());
  }, []);

  return (
    <div className="space-y-6">
      {/* Table selector + Month/Year + Actions */}
      <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div>
            <div className="flex justify-between items-center">
              <div>
                <Label className="text-xs font-medium text-slate-600">
                  Select Table
                </Label>
                <p className="text-xs text-slate-500 mt-1 mb-2">
                  Tables are created in Notice Builder. Create a table there first,
                  then import data here.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-slate-600 whitespace-nowrap">
                  Chunk Size:
                </Label>
                <Select 
                  value={chunkSize.toString()} 
                  onValueChange={(v) => setChunkSize(Number(v))}
                >
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="50">50</SelectItem>
                    <SelectItem value="100">100</SelectItem>
                    <SelectItem value="250">250</SelectItem>
                    <SelectItem value="500">500</SelectItem>
                    <SelectItem value="1000">1000</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Select
              value={selectedTable}
              onValueChange={(v) => {
                setSelectedTable(v);
                setSearchTerm("");
                setFilters([]);
                setParsedRows([]);
                setImportFileName("");
                if (fileInputRef.current) fileInputRef.current.value = "";
              }}
            >
              <SelectTrigger>
                <SelectValue placeholder="Choose a table (create in Notice Builder first)..." />
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
              <p className="text-sm text-amber-600 mt-2">
                No tables found. Go to Notice Builder to create a table first.
              </p>
            )}
          </div>

          {selectedTable && (
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <div className="flex items-center gap-2">
                <Calendar size={18} className="text-slate-500" />
                <Label className="text-xs font-medium text-slate-600">
                  Month
                </Label>
                <Select value={selectedMonth} onValueChange={setSelectedMonth}>
                  <SelectTrigger className="w-[140px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {MONTHS.map((m, i) => (
                      <SelectItem key={m} value={i.toString()}>
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex items-center gap-2">
                <Label className="text-xs font-medium text-slate-600">
                  Year
                </Label>
                <Select value={selectedYear} onValueChange={setSelectedYear}>
                  <SelectTrigger className="w-[100px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {years.map((y) => (
                      <SelectItem key={y} value={y}>
                        {y}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="relative">
                <Button
                  onClick={() => fetchData(parsedRows.length > 0 || tableData.length > 1000)}
                  variant="outline"
                  size="sm"
                  disabled={loading}
                  className="relative overflow-hidden"
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-blue-100 opacity-20 transition-all duration-300"
                    style={{ 
                      width: isDownloading ? `${downloadProgress}%` : '0%',
                      backgroundColor: isDownloading ? 'rgba(59, 130, 246, 0.2)' : 'transparent'
                    }}
                  />
                  <div className="relative z-10 flex items-center">
                    <RefreshCw
                      size={16}
                      className={loading ? "animate-spin" : ""}
                    />
                    <span className="ml-2">
                      {isDownloading ? `Loading... ${downloadProgress}%` : 'Refresh'}
                    </span>
                  </div>
                </Button>
                {isDownloading && (
                  <div className="absolute -bottom-6 left-0 right-0 text-xs text-center text-blue-600">
                    Downloading data in chunks...
                  </div>
                )}
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="outline"
                    size="sm"
                    disabled={filteredAndSortedData.length === 0}
                  >
                    <Download size={16} />
                    Export
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-48">
                  <DropdownMenuItem onClick={handleExportExcel}>
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <File size={16} className="mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              <div className="ml-auto text-sm text-slate-600">
                {filteredAndSortedData.length} of {totalRowCount > 0 ? totalRowCount : tableData.length} rows
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Import Excel */}
      {selectedTable && tableInfo && (
        <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <h3 className="text-base font-semibold text-slate-900 mb-4">
            Import from Excel
          </h3>
          <p className="text-xs text-slate-600 mb-3">
            Expected columns: {tableInfo.columns.map((c) => c.name).join(", ")}
          </p>
          <div className="space-y-4">
            <div className="flex flex-wrap items-center gap-4">
              <Input
                ref={fileInputRef}
                type="file"
                accept=".csv,.xls,.xlsx"
                onChange={handleImportFile}
                className="max-w-xs"
                disabled={importing}
              />
              <Upload size={20} className="text-slate-400" />
              {importFileName && (
                <span className="text-sm text-slate-600">
                  📄 {importFileName}
                </span>
              )}
              {parsedRows.length > 0 && (
                <Button 
                  onClick={handleImportSubmit} 
                  disabled={importing}
                  className="relative overflow-hidden"
                >
                  <div 
                    className="absolute left-0 top-0 h-full bg-green-100 opacity-20 transition-all duration-300"
                    style={{ 
                      width: `${uploadProgress}%`,
                      backgroundColor: importing ? 'rgba(16, 185, 129, 0.2)' : 'transparent'
                    }}
                  />
                  <span className="relative z-10">
                    {importing ? `Uploading... ${uploadProgress}%` : `Import ${parsedRows.length} Rows`}
                  </span>
                </Button>
              )}
            </div>
            
            {importing && (
              <div className="w-full bg-gray-100 rounded-full h-2.5">
                <div 
                  className="bg-green-600 h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
            )}
          </div>
          {errors.length > 0 && (
            <div className="mt-4 bg-amber-50 border border-amber-200 rounded-lg p-4">
              <ul className="text-sm text-amber-800 space-y-1">
                {errors.map((err, i) => (
                  <li key={i}>{err}</li>
                ))}
              </ul>
            </div>
          )}
          {importDebugLog.length > 0 && (
            <Collapsible className="mt-4">
              <CollapsibleTrigger className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-900">
                <Bug size={16} className="text-slate-500" />
                Show detailed import log (debug)
                <ChevronRight size={16} className="transition-transform [[data-state=open]_&]:rotate-90" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <pre className="mt-2 p-4 bg-slate-900 text-slate-100 text-xs rounded-lg overflow-auto max-h-80 font-mono whitespace-pre-wrap break-all">
                  {importDebugLog.join("\n")}
                </pre>
              </CollapsibleContent>
            </Collapsible>
          )}
        </Card>
      )}

      {/* Search and Filters */}
      {selectedTable && (
        <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="flex-1 relative">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <Input
                  placeholder="Search across all columns..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Button onClick={addFilter} variant="outline" size="sm">
                <Filter size={16} />
                Add Filter
              </Button>
            </div>
            {filters.length > 0 && (
              <div className="space-y-3 pt-2">
                <Label className="text-xs font-medium text-slate-600">
                  Active Filters
                </Label>
                {filters.map((filter, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Select
                      value={filter.column}
                      onValueChange={(val) =>
                        updateFilter(index, "column", val)
                      }
                    >
                      <SelectTrigger className="w-[180px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {allColumns.map((col) => (
                          <SelectItem key={col} value={col}>
                            {col.replace(/_/g, " ")}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <Select
                      value={filter.operator}
                      onValueChange={(val) =>
                        updateFilter(index, "operator", val)
                      }
                    >
                      <SelectTrigger className="w-[160px]">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="equals">Equals</SelectItem>
                        <SelectItem value="contains">Contains</SelectItem>
                        <SelectItem value="starts_with">Starts with</SelectItem>
                        <SelectItem value="ends_with">Ends with</SelectItem>
                        <SelectItem value="greater_than">
                          Greater than
                        </SelectItem>
                        <SelectItem value="less_than">Less than</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      placeholder="Filter value..."
                      value={filter.value}
                      onChange={(e) =>
                        updateFilter(index, "value", e.target.value)
                      }
                      className="flex-1"
                    />
                    <Button
                      onClick={() => removeFilter(index)}
                      variant="ghost"
                      size="icon"
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Data Table */}
      {selectedTable && (
        <Card className="rounded-2xl bg-white shadow-sm border border-slate-200 overflow-hidden">
          <div className="overflow-x-auto">
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw size={24} className="animate-spin text-primary" />
              </div>
            ) : filteredAndSortedData.length === 0 ? (
              <div className="text-center py-12 text-slate-500">
                No data found. Import from Excel or add data in Notice Builder.
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {allColumns.map((col) => (
                      <TableHead
                        key={col}
                        className="font-semibold cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort(col)}
                      >
                        <div className="flex items-center gap-2">
                          {col.replace(/_/g, " ")}
                          {sortColumn === col &&
                            (sortDirection === "asc" ? (
                              <ChevronUp size={14} />
                            ) : (
                              <ChevronDown size={14} />
                            ))}
                        </div>
                      </TableHead>
                    ))}
                    <TableHead className="font-semibold w-[120px]">
                      Actions
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAndSortedData.map((row, idx) => (
                    <TableRow
                      key={row.id ?? idx}
                      className="hover:bg-slate-50 cursor-pointer"
                      onClick={() => setSelectedRowDetail(row)}
                    >
                      {allColumns.map((col) => (
                        <TableCell key={col} className="font-normal">
                          {row[col] === null || row[col] === undefined
                            ? "-"
                            : String(row[col])}
                        </TableCell>
                      ))}
                      <TableCell onClick={(e) => e.stopPropagation()}>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setEditingRow({ ...row })}
                            variant="ghost"
                            size="icon"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 w-8"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            onClick={() => setDeleteConfirm(String(row.id))}
                            variant="ghost"
                            size="icon"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50 h-8 w-8"
                          >
                            <Trash2 size={14} />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            {!loading && filteredAndSortedData.length > 0 && tableData.length < totalRowCount && (
              <div className="p-4 border-t border-slate-200 flex justify-center">
                <Button
                  variant="outline"
                  onClick={loadMore}
                  disabled={loadingMore}
                  className="min-w-[140px]"
                >
                  {loadingMore ? (
                    <RefreshCw size={16} className="animate-spin mr-2" />
                  ) : null}
                  {loadingMore ? "Loading…" : "Load more"}
                </Button>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Row detail dialog — full row contents */}
      <Dialog open={!!selectedRowDetail} onOpenChange={() => setSelectedRowDetail(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Row details</DialogTitle>
            <DialogDescription>All columns for this row</DialogDescription>
          </DialogHeader>
          {selectedRowDetail && (
            <div className="grid gap-3 py-4">
              {Object.entries(selectedRowDetail).map(([key, value]) => (
                <div key={key} className="flex gap-3 border-b border-slate-100 pb-2 last:border-0">
                  <span className="font-medium text-slate-600 shrink-0 w-[180px]">
                    {key.replace(/_/g, " ")}
                  </span>
                  <span className="text-slate-900 break-words">
                    {value === null || value === undefined ? "—" : String(value)}
                  </span>
                </div>
              ))}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setSelectedRowDetail(null)}>
              Close
            </Button>
            <Button
              onClick={() => {
                if (selectedRowDetail) setEditingRow({ ...selectedRowDetail });
                setSelectedRowDetail(null);
              }}
            >
              Edit row
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingRow} onOpenChange={() => setEditingRow(null)}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>
              Update the values for this row
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {editingRow &&
              allColumns
                .filter((c) => c !== "id")
                .map((col) => (
                  <div key={col} className="space-y-2">
                    <Label className="text-xs font-medium text-slate-600 capitalize">
                      {col.replace(/_/g, " ")}
                    </Label>
                    <Input
                      type={
                        [
                          "joining_date",
                          "join_date",
                          "date_of_birth",
                          "created_at",
                        ].includes(col)
                          ? "date"
                          : "text"
                      }
                      value={String(editingRow[col] ?? "")}
                      onChange={(e) =>
                        setEditingRow({ ...editingRow, [col]: e.target.value })
                      }
                    />
                  </div>
                ))}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingRow(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdate}>Save Changes</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <Dialog
        open={!!deleteConfirm}
        onOpenChange={() => setDeleteConfirm(null)}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Deletion</DialogTitle>
            <DialogDescription>
              Are you sure you want to delete this row? This action cannot be
              undone.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={() => deleteConfirm && handleDelete(deleteConfirm)}
            >
              Delete
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
