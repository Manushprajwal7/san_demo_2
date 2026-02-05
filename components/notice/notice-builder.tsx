"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { FieldDefinition, type FieldDef } from "./field-definition";
import { FieldsTable } from "./fields-table";
import { DynamicForm } from "./dynamic-form";
import { DataPreview } from "./data-preview";
import { ExcelImport } from "./excel-import";
import { DataViewer } from "./data-viewer";

interface TableInfo {
  id: string;
  table_name: string;
  display_name: string;
  columns: FieldDef[];
}

export function NoticeBuilder() {
  const [fields, setFields] = useState<FieldDef[]>([]);
  const [activeTable, setActiveTable] = useState<string>("");
  const [activeTableColumns, setActiveTableColumns] = useState<FieldDef[]>([]);
  const [activeTableDisplayName, setActiveTableDisplayName] = useState("");
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [refreshKey, setRefreshKey] = useState(0);

  // Fetch existing tables on mount
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
      // silent fail
    }
  };

  const handleFieldsParsed = (parsed: FieldDef[]) => {
    setFields(parsed);
  };

  const handleRemoveField = (index: number) => {
    setFields((prev) => prev.filter((_, i) => i !== index));
  };

  const handleTableCreated = (tableName: string, displayName: string) => {
    // Set the newly created table as active for the form
    setActiveTable(tableName);
    setActiveTableColumns([...fields]);
    setActiveTableDisplayName(displayName);
    setFields([]);
    setRefreshKey((k) => k + 1);
    fetchTables();
  };

  const handleSelectExistingTable = (tableName: string) => {
    const table = tables.find((t) => t.table_name === tableName);
    if (table) {
      setActiveTable(table.table_name);
      setActiveTableColumns(table.columns);
      setActiveTableDisplayName(table.display_name);
      setRefreshKey((k) => k + 1);
    }
  };

  const handleRowInserted = () => {
    setRefreshKey((k) => k + 1);
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full max-w-2xl grid-cols-3 h-11">
          <TabsTrigger value="builder" className="text-sm font-semibold">
            Form Builder
          </TabsTrigger>
          <TabsTrigger value="import" className="text-sm font-semibold">
            Import Data
          </TabsTrigger>
          <TabsTrigger value="view" className="text-sm font-semibold">
            View Data
          </TabsTrigger>
        </TabsList>

        {/* Form Builder Tab */}
        <TabsContent value="builder" className="mt-8">
          <div className="grid grid-cols-12 gap-6">
            {/* Left: Define & Create - 7 columns */}
            <div className="col-span-7 space-y-6">
              <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-6 text-slate-900">
                  Define Fields
                </h2>
                <FieldDefinition onFieldsParsed={handleFieldsParsed} />
              </Card>

              <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                <h2 className="text-lg font-semibold mb-6 text-slate-900">
                  Fields & Table Creation
                </h2>
                <FieldsTable
                  fields={fields}
                  onRemoveField={handleRemoveField}
                  onTableCreated={handleTableCreated}
                />
                {fields.length === 0 && (
                  <p className="text-sm text-slate-500 text-center py-8">
                    No fields defined yet. Use the field definition above.
                  </p>
                )}
              </Card>
            </div>

            {/* Right: Form & Data - 5 columns */}
            <div className="col-span-5 space-y-6">
              {/* Existing Tables Selector */}
              {tables.length > 0 && (
                <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-6 text-slate-900">
                    Existing Tables
                  </h2>
                  <div className="space-y-3">
                    <Label className="text-xs font-medium text-slate-600">
                      Select a table to view its form
                    </Label>
                    <Select
                      value={activeTable}
                      onValueChange={handleSelectExistingTable}
                    >
                      <SelectTrigger className="w-full">
                        <SelectValue placeholder="Choose a table..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((t) => (
                          <SelectItem key={t.table_name} value={t.table_name}>
                            {t.display_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </Card>
              )}

              {/* Dynamic Form */}
              {activeTable && activeTableColumns.length > 0 && (
                <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-6 text-slate-900">
                    {activeTableDisplayName} — Entry Form
                  </h2>
                  <DynamicForm
                    key={activeTable}
                    tableName={activeTable}
                    columns={activeTableColumns}
                    onRowInserted={handleRowInserted}
                  />
                </Card>
              )}

              {/* Data Preview */}
              {activeTable && activeTableColumns.length > 0 && (
                <Card className="rounded-2xl bg-white p-6 shadow-sm border border-slate-200">
                  <h2 className="text-lg font-semibold mb-6 text-slate-900">
                    {activeTableDisplayName} — Data
                  </h2>
                  <DataPreview
                    tableName={activeTable}
                    columns={activeTableColumns}
                    refreshKey={refreshKey}
                  />
                </Card>
              )}
            </div>
          </div>
        </TabsContent>

        {/* Import Tab */}
        <TabsContent value="import" className="mt-8">
          <Card className="rounded-2xl bg-white p-6 max-w-3xl shadow-sm border border-slate-200">
            <h2 className="text-lg font-semibold mb-6 text-slate-900">
              Import from Excel / CSV
            </h2>
            <ExcelImport />
          </Card>
        </TabsContent>

        {/* View Data Tab */}
        <TabsContent value="view" className="mt-8">
          <DataViewer />
        </TabsContent>
      </Tabs>
    </div>
  );
}
