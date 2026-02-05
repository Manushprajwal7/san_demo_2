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
  const [parsedRows, setParsedRows] = useState<Record<string, unknown>[]>([]);
  const [importFileName, setImportFileName] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
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

  const fetchData = async () => {
    if (!selectedTable) return;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notice?action=get-data&tableName=${encodeURIComponent(selectedTable)}`,
      );
      const data = await res.json();
      if (res.ok) {
        setTableData(Array.isArray(data) ? data : []);
      } else {
        toast.error(data.error || "Failed to fetch data");
        setTableData([]);
      }
    } catch {
      toast.error("Network error");
      setTableData([]);
    } finally {
      setLoading(false);
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
      phone: ["phone", "mobile", "contact", "phone_number"],
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

    const expectedColumns = tableInfo.columns.map((c) => c.name);

    const reader = new FileReader();
    reader.onload = (evt) => {
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
        const usedFileCols = new Set<string>();

        expectedColumns.forEach((expectedCol) => {
          const match = findMatchingFileColumn(
            expectedCol,
            fileColumns,
            usedFileCols,
          );
          if (match) {
            columnMapping.set(expectedCol, match);
          } else {
            const exact = fileColumns.find(
              (fc) =>
                !usedFileCols.has(fc) &&
                normalizeColumnName(fc) === normalizeColumnName(expectedCol),
            );
            if (exact) {
              columnMapping.set(expectedCol, exact);
              usedFileCols.add(exact);
            }
          }
        });

        const missing = expectedColumns.filter((c) => !columnMapping.has(c));
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

            if (col.type === "number") {
              const numVal = Number(val);
              cleaned[col.name] = isNaN(numVal) ? null : numVal;
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
              if (typeof val === "number") {
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

        setParsedRows(cleanedRows);
        toast.success(`Parsed ${cleanedRows.length} rows`);
      } catch (err) {
        setErrors([
          `Failed to parse file: ${err instanceof Error ? err.message : "Unknown error"}`,
        ]);
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const handleImportSubmit = async () => {
    if (parsedRows.length === 0 || !selectedTable) return;
    setImporting(true);
    try {
      const BATCH_SIZE = 50;
      let totalInserted = 0;
      let totalFailed = 0;

      for (let i = 0; i < parsedRows.length; i += BATCH_SIZE) {
        const batch = parsedRows.slice(i, i + BATCH_SIZE);
        const res = await fetch("/api/notice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            action: "bulk-insert",
            tableName: selectedTable,
            rows: batch,
          }),
        });

        const data = await res.json();

        if (!res.ok) {
          toast.error(
            data.error ||
              `Import failed at batch ${Math.floor(i / BATCH_SIZE) + 1}`,
          );
          setImporting(false);
          return;
        }

        totalInserted += data.inserted ?? 0;
        totalFailed += data.failed ?? 0;
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
            <Label className="text-xs font-medium text-slate-600">
              Select Table
            </Label>
            <p className="text-xs text-slate-500 mt-1 mb-2">
              Tables are created in Notice Builder. Create a table there first,
              then import data here.
            </p>
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
              <Button
                onClick={fetchData}
                variant="outline"
                size="sm"
                disabled={loading}
              >
                <RefreshCw
                  size={16}
                  className={loading ? "animate-spin" : ""}
                />
                Refresh
              </Button>
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
                {filteredAndSortedData.length} of {tableData.length} rows
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
          <div className="flex flex-wrap items-center gap-4">
            <Input
              ref={fileInputRef}
              type="file"
              accept=".csv,.xls,.xlsx"
              onChange={handleImportFile}
              className="max-w-xs"
            />
            <Upload size={20} className="text-slate-400" />
            {importFileName && (
              <span className="text-sm text-slate-600">
                📄 {importFileName}
              </span>
            )}
            {parsedRows.length > 0 && (
              <Button onClick={handleImportSubmit} disabled={importing}>
                {importing
                  ? "Importing..."
                  : `Import ${parsedRows.length} Rows`}
              </Button>
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
                    <TableRow key={idx} className="hover:bg-slate-50">
                      {allColumns.map((col) => (
                        <TableCell key={col} className="font-normal">
                          {row[col] === null || row[col] === undefined
                            ? "-"
                            : String(row[col])}
                        </TableCell>
                      ))}
                      <TableCell>
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
          </div>
        </Card>
      )}

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
