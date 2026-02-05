"use client";

import { useState, useEffect, useMemo } from "react";
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
  FileText,
  File,
} from "lucide-react";
import * as XLSX from "xlsx";
import { jsPDF } from "jspdf";
import "jspdf-autotable";
import {
  Document,
  Packer,
  Paragraph,
  Table as DocxTable,
  TableCell as DocxTableCell,
  TableRow as DocxTableRow,
  WidthType,
  AlignmentType,
  BorderStyle,
} from "docx";

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

export function DataViewer() {
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

  useEffect(() => {
    fetchTables();
  }, []);

  const fetchTables = async () => {
    try {
      const res = await fetch("/api/notice?action=tables");
      const data = await res.json();
      if (res.ok && Array.isArray(data)) {
        setTables(data);
      }
    } catch {
      toast.error("Failed to fetch tables");
    }
  };

  const fetchTableData = async (tableName: string) => {
    setLoading(true);
    try {
      const res = await fetch(
        `/api/notice?action=get-data&tableName=${tableName}`,
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

  const handleTableSelect = (tableName: string) => {
    setSelectedTable(tableName);
    setSearchTerm("");
    setFilters([]);
    setSortColumn("");
    fetchTableData(tableName);
  };

  const getSelectedTableInfo = (): TableInfo | undefined => {
    return tables.find((t) => t.table_name === selectedTable);
  };

  const addFilter = () => {
    const tableInfo = getSelectedTableInfo();
    if (tableInfo && tableInfo.columns.length > 0) {
      setFilters([
        ...filters,
        { column: tableInfo.columns[0].name, operator: "equals", value: "" },
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

    // Apply search
    if (searchTerm) {
      result = result.filter((row) =>
        Object.values(row).some((val) =>
          String(val).toLowerCase().includes(searchTerm.toLowerCase()),
        ),
      );
    }

    // Apply filters
    filters.forEach((filter) => {
      if (filter.value) {
        result = result.filter((row) => {
          const cellValue = String(row[filter.column] || "").toLowerCase();
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

    // Apply sorting
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
  }, [tableData, searchTerm, filters, sortColumn, sortDirection]);

  const handleSort = (column: string) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === "asc" ? "desc" : "asc");
    } else {
      setSortColumn(column);
      setSortDirection("asc");
    }
  };

  const handleExport = () => {
    if (filteredAndSortedData.length === 0) {
      toast.error("No data to export");
      return;
    }

    try {
      const tableInfo = getSelectedTableInfo();
      if (!tableInfo) return;

      // Clean data for export - remove null/undefined and convert to strings
      const cleanData = filteredAndSortedData.map((row) => {
        const cleanRow: Record<string, string | number> = {};
        tableInfo.columns.forEach((col) => {
          const value = row[col.name];
          cleanRow[col.name] =
            value === null || value === undefined ? "" : value;
        });
        return cleanRow;
      });

      const ws = XLSX.utils.json_to_sheet(cleanData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "Data");
      XLSX.writeFile(wb, `${selectedTable}_export.xlsx`);
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
      const tableInfo = getSelectedTableInfo();
      if (!tableInfo) return;

      const doc = new jsPDF({
        orientation: tableInfo.columns.length > 6 ? "landscape" : "portrait",
        unit: "mm",
        format: "a4",
      });

      // Add title
      doc.setFontSize(16);
      doc.setFont("helvetica", "bold");
      doc.text(tableInfo.display_name || selectedTable, 14, 15);

      // Add metadata
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Generated: ${new Date().toLocaleString()}`, 14, 22);
      doc.text(`Total Records: ${filteredAndSortedData.length}`, 14, 27);

      // Prepare table data
      const headers = tableInfo.columns.map((col) => col.name);
      const rows = filteredAndSortedData.map((row) =>
        tableInfo.columns.map((col) => {
          const val = row[col.name];
          if (val === null || val === undefined) return "-";
          if (typeof val === "object") return JSON.stringify(val);
          return String(val);
        }),
      );

      // Add table using autoTable
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
        alternateRowStyles: {
          fillColor: [249, 250, 251],
        },
        margin: { top: 32 },
        theme: "grid",
      });

      doc.save(`${selectedTable}_export.pdf`);
      toast.success("PDF file exported successfully");
    } catch (error) {
      console.error("PDF export error:", error);
      toast.error("Failed to export PDF file");
    }
  };

  const handleExportWord = async () => {
    if (filteredAndSortedData.length === 0) {
      toast.error("No data to export");
      return;
    }

    const tableInfo = getSelectedTableInfo();
    if (!tableInfo) return;

    try {
      // Create header row
      const headerRow = new DocxTableRow({
        children: tableInfo.columns.map(
          (col) =>
            new DocxTableCell({
              children: [
                new Paragraph({
                  text: col.name,
                  alignment: AlignmentType.CENTER,
                  style: "Strong",
                }),
              ],
              shading: {
                fill: "2563EB",
              },
              width: {
                size: Math.floor(10000 / tableInfo.columns.length),
                type: WidthType.DXA,
              },
            }),
        ),
      });

      // Create data rows
      const dataRows = filteredAndSortedData.map((row) => {
        return new DocxTableRow({
          children: tableInfo.columns.map((col) => {
            const value = row[col.name];
            let textValue = "";

            if (value === null || value === undefined) {
              textValue = "-";
            } else if (typeof value === "object") {
              textValue = JSON.stringify(value);
            } else {
              textValue = String(value);
            }

            return new DocxTableCell({
              children: [
                new Paragraph({
                  text: textValue,
                  alignment: AlignmentType.LEFT,
                }),
              ],
              width: {
                size: Math.floor(10000 / tableInfo.columns.length),
                type: WidthType.DXA,
              },
            });
          }),
        });
      });

      // Create table
      const table = new DocxTable({
        rows: [headerRow, ...dataRows],
        width: {
          size: 100,
          type: WidthType.PERCENTAGE,
        },
        borders: {
          top: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          bottom: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          left: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          right: { style: BorderStyle.SINGLE, size: 1, color: "CCCCCC" },
          insideHorizontal: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "EEEEEE",
          },
          insideVertical: {
            style: BorderStyle.SINGLE,
            size: 1,
            color: "EEEEEE",
          },
        },
      });

      // Create document
      const doc = new Document({
        sections: [
          {
            properties: {},
            children: [
              new Paragraph({
                text: tableInfo.display_name || selectedTable,
                heading: "Heading1",
                alignment: AlignmentType.CENTER,
                spacing: { after: 200 },
              }),
              new Paragraph({
                text: `Generated: ${new Date().toLocaleString()}`,
                spacing: { after: 100 },
              }),
              new Paragraph({
                text: `Total Records: ${filteredAndSortedData.length}`,
                spacing: { after: 300 },
              }),
              table,
            ],
          },
        ],
      });

      // Generate and download
      const blob = await Packer.toBlob(doc);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${selectedTable}_export.docx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);

      toast.success("Word document exported successfully");
    } catch (error) {
      console.error("Word export error:", error);
      toast.error("Failed to export Word document");
    }
  };

  const handleDelete = async (rowId: string) => {
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
        fetchTableData(selectedTable);
        setDeleteConfirm(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to delete row");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const handleUpdate = async () => {
    if (!editingRow) return;

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
        fetchTableData(selectedTable);
        setEditingRow(null);
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to update row");
      }
    } catch {
      toast.error("Network error");
    }
  };

  const tableInfo = getSelectedTableInfo();

  return (
    <div className="space-y-6">
      {/* Table Selection */}
      <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
        <div className="space-y-4">
          <div>
            <Label className="text-xs font-medium text-slate-600">
              Select Table
            </Label>
            <Select value={selectedTable} onValueChange={handleTableSelect}>
              <SelectTrigger className="mt-2">
                <SelectValue placeholder="Choose a table to view..." />
              </SelectTrigger>
              <SelectContent>
                {tables.map((t) => (
                  <SelectItem key={t.table_name} value={t.table_name}>
                    {t.display_name} ({t.table_name})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedTable && (
            <div className="flex items-center gap-3 pt-2">
              <Button
                onClick={() => fetchTableData(selectedTable)}
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
                  <DropdownMenuItem onClick={handleExport}>
                    <FileSpreadsheet size={16} className="mr-2" />
                    Export as Excel
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportPDF}>
                    <File size={16} className="mr-2" />
                    Export as PDF
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleExportWord}>
                    <FileText size={16} className="mr-2" />
                    Export as Word
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

            {/* Filter Rules */}
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
                        {tableInfo?.columns.map((col) => (
                          <SelectItem key={col.name} value={col.name}>
                            {col.name}
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
                      size="icon-sm"
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
                No data found
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow className="bg-slate-50">
                    {tableInfo?.columns.map((col) => (
                      <TableHead
                        key={col.name}
                        className="font-semibold cursor-pointer hover:bg-slate-100"
                        onClick={() => handleSort(col.name)}
                      >
                        <div className="flex items-center gap-2">
                          {col.name}
                          {sortColumn === col.name &&
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
                      {tableInfo?.columns.map((col) => (
                        <TableCell key={col.name} className="font-normal">
                          {row[col.name] === null || row[col.name] === undefined
                            ? "-"
                            : String(row[col.name])}
                        </TableCell>
                      ))}
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Button
                            onClick={() => setEditingRow(row)}
                            variant="ghost"
                            size="icon-sm"
                            className="text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                          >
                            <Edit size={14} />
                          </Button>
                          <Button
                            onClick={() => setDeleteConfirm(String(row.id))}
                            variant="ghost"
                            size="icon-sm"
                            className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Row</DialogTitle>
            <DialogDescription>
              Update the values for this row
            </DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-2 gap-4 py-4">
            {editingRow &&
              tableInfo?.columns.map((col) => (
                <div key={col.name} className="space-y-2">
                  <Label className="text-xs font-medium text-slate-600 capitalize">
                    {col.name.replace(/_/g, " ")}
                  </Label>
                  <Input
                    type={
                      col.type === "number"
                        ? "number"
                        : col.type === "date"
                          ? "date"
                          : "text"
                    }
                    value={String(editingRow[col.name] || "")}
                    onChange={(e) =>
                      setEditingRow({
                        ...editingRow,
                        [col.name]: e.target.value,
                      })
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

      {/* Delete Confirmation Dialog */}
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
