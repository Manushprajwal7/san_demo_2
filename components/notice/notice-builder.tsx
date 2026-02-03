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
      <Tabs defaultValue="builder">
        <TabsList>
          <TabsTrigger value="builder">Form Builder</TabsTrigger>
          <TabsTrigger value="import">Import Data</TabsTrigger>
        </TabsList>

        {/* Form Builder Tab */}
        <TabsContent value="builder" className="space-y-6 mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Define & Create */}
            <div className="space-y-6">
              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Define Fields
                </h3>
                <FieldDefinition onFieldsParsed={handleFieldsParsed} />
              </Card>

              <Card className="p-6">
                <h3 className="text-lg font-semibold mb-4">
                  Fields & Table Creation
                </h3>
                <FieldsTable
                  fields={fields}
                  onRemoveField={handleRemoveField}
                  onTableCreated={handleTableCreated}
                />
                {fields.length === 0 && (
                  <p className="text-sm text-gray-400 text-center py-4">
                    No fields defined yet. Use the field definition above.
                  </p>
                )}
              </Card>
            </div>

            {/* Right: Form & Data */}
            <div className="space-y-6">
              {/* Existing Tables Selector */}
              {tables.length > 0 && (
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    Existing Tables
                  </h3>
                  <div>
                    <Label className="text-sm font-medium">
                      Select a table to view its form
                    </Label>
                    <Select
                      value={activeTable}
                      onValueChange={handleSelectExistingTable}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Choose a table..." />
                      </SelectTrigger>
                      <SelectContent>
                        {tables.map((t) => (
                          <SelectItem
                            key={t.table_name}
                            value={t.table_name}
                          >
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
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {activeTableDisplayName} — Entry Form
                  </h3>
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
                <Card className="p-6">
                  <h3 className="text-lg font-semibold mb-4">
                    {activeTableDisplayName} — Data
                  </h3>
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
        <TabsContent value="import" className="mt-6">
          <Card className="p-6 max-w-2xl">
            <h3 className="text-lg font-semibold mb-4">
              Import from Excel / CSV
            </h3>
            <ExcelImport />
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
