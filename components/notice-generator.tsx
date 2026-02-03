"use client";

import { useEffect, useState, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Plus, Upload, Trash2 } from "lucide-react";
import * as XLSX from "xlsx";
import { FormCard } from "./form-card";

export default function NoticeGenerator({ company }: { company: string }) {
  const [step, setStep] = useState("builder");
  const [tables, setTables] = useState<any[]>([]);
  const [tableName, setTableName] = useState("");
  const [fields, setFields] = useState<any[]>([{ name: "", type: "text" }]);
  const [selectedTable, setSelectedTable] = useState("");
  const [tableData, setTableData] = useState<any[]>([]);
  const [isCreating, setIsCreating] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [companyId, setCompanyId] = useState("");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [fieldDefinitionText, setFieldDefinitionText] = useState("");
  const [showGeneratedForm, setShowGeneratedForm] = useState(false);
  const [formData, setFormData] = useState<Record<string, any>>({});
  const [selectedFormTable, setSelectedFormTable] = useState<any>(null);

  useEffect(() => {
    const loadData = async () => {
      try {
        const { data: companies } = await supabase
          .from("companies")
          .select("*")
          .eq("code", company.toUpperCase());
        if (!companies?.length) return;

        const id = companies[0].id;
        setCompanyId(id);

        const { data: metadata } = await supabase
          .from("dynamic_tables_metadata")
          .select("*")
          .eq("company_id", id);
        setTables(metadata || []);
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, [company]);

  const addField = () => {
    setFields([...fields, { name: "", type: "text" }]);
  };

  const removeField = (index: number) => {
    setFields(fields.filter((_, i) => i !== index));
  };

  const updateField = (index: number, key: string, value: string) => {
    const newFields = [...fields];
    newFields[index][key] = value;
    setFields(newFields);
  };

  const createTable = async () => {
    if (!tableName || fields.some((f) => !f.name)) {
      alert("Please fill in all fields");
      return;
    }

    setIsCreating(true);
    try {
      // Create the table name
      const tableNameSlug = tableName.toLowerCase().replace(/\s+/g, "_");
      const tableNameWithPrefix = `custom_${tableNameSlug}`;

      console.log("=== TABLE CREATION ATTEMPT ===");
      console.log("Table name:", tableNameWithPrefix);
      console.log("Fields:", fields);

      // Try to create the actual database table first
      let tableCreated = false;
      let creationError = "";

      try {
        // Generate SQL for table creation
        let sql = `CREATE TABLE IF NOT EXISTS ${tableNameWithPrefix} (\n`;
        sql += "  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),\n";
        sql += "  created_at TIMESTAMP DEFAULT NOW(),\n";
        sql += "  updated_at TIMESTAMP DEFAULT NOW(),\n";

        fields.forEach((field, index) => {
          let fieldType = "TEXT";
          switch (field.type) {
            case "number":
              fieldType = "NUMERIC";
              break;
            case "date":
              fieldType = "DATE";
              break;
            case "boolean":
              fieldType = "BOOLEAN";
              break;
            default:
              fieldType = "TEXT";
          }

          sql += `  ${field.name} ${fieldType}${
            index < fields.length - 1 ? "," : ""
          }\n`;
        });

        sql += ");";

        console.log("SQL to execute:", sql);

        // Try to execute the SQL
        const { error: sqlError } = await supabase.rpc("exec_sql", {
          sql_statement: sql,
        });

        if (sqlError) {
          console.warn("Table creation failed:", sqlError);
          creationError = sqlError.message;
        } else {
          console.log("Table created successfully");
          tableCreated = true;

          // Force schema cache refresh
          await supabase.from(tableNameWithPrefix).select("id").limit(1);
        }
      } catch (error: any) {
        console.warn("Table creation exception:", error);
        creationError = error.message;
      }

      // Store metadata in our tracking table
      const metadata = {
        company_id: companyId,
        table_name: tableNameWithPrefix,
        display_name: tableName,
        fields: fields,
        actual_table_name: tableNameWithPrefix,
      };

      console.log("Inserting metadata:", metadata);

      const { data, error: metaError } = await supabase
        .from("dynamic_tables_metadata")
        .insert(metadata)
        .select();

      if (metaError) {
        console.error("Metadata insertion error:", metaError);
        throw new Error(`Failed to store form metadata: ${metaError.message}`);
      }

      if (data) {
        setTables([...tables, data[0]]);
        setTableName("");
        setFields([{ name: "", type: "text" }]);
        setFieldDefinitionText("");

        if (tableCreated) {
          alert(`Table "${tableName}" created successfully in Supabase database! 
                
The table is ready for data submission.`);
        } else {
          alert(`Form "${tableName}" registered successfully! 
                
Note: Table creation encountered an issue (${creationError}). 
Please run the schema cache fix script or create the table manually.
                
Table name: ${tableNameWithPrefix}
Fields: ${fields.map((f) => `${f.name} (${f.type})`).join(", ")}`);
        }
      }
    } catch (error: any) {
      console.error("=== TABLE CREATION ERROR ===");
      console.error("Error:", error);
      alert(`Failed to create table: ${error.message}`);
    } finally {
      setIsCreating(false);
    }
  };

  const loadTableData = async (tableId: string) => {
    try {
      setSelectedTable(tableId);
      const { data } = await supabase
        .from("dynamic_table_data")
        .select("*")
        .eq("table_metadata_id", tableId)
        .order("created_at", { ascending: false });
      setTableData(data || []);
    } catch (error) {
      console.error("Error loading table data:", error);
    }
  };

  const deleteRecord = async (recordId: string) => {
    try {
      await supabase.from("dynamic_table_data").delete().eq("id", recordId);
      setTableData(tableData.filter((r) => r.id !== recordId));
    } catch (error) {
      console.error("Error deleting record:", error);
    }
  };

  const exportToExcel = () => {
    const table = tables.find((t) => t.id === selectedTable);
    const headers = table.fields.map((f: any) => f.name).join(",");
    const rows = tableData.map((row) =>
      table.fields.map((f: any) => row.data[f.name] || "").join(","),
    );
    const csv = [headers, ...rows].join("\n");
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv),
    );
    element.setAttribute("download", `${table.display_name}.csv`);
    element.click();
  };

  const importExcelData = async (file: File) => {
    try {
      const reader = new FileReader();
      reader.onload = async (e) => {
        const data = new Uint8Array(e.target?.result as ArrayBuffer);
        const workbook = XLSX.read(data, { type: "array" });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const jsonData = XLSX.utils.sheet_to_json(worksheet);

        // Get the selected table structure
        const table = tables.find((t) => t.id === selectedTable);
        if (!table) {
          alert("Please select a table first");
          return;
        }

        // Validate columns match table fields
        const firstRow = jsonData[0] as Record<string, any>;
        const excelColumns = Object.keys(firstRow);
        const tableFieldNames = table.fields.map((f: any) => f.name);

        const missingFields = tableFieldNames.filter(
          (field: string) => !excelColumns.includes(field),
        );
        if (missingFields.length > 0) {
          alert(`Missing required columns: ${missingFields.join(", ")}`);
          return;
        }

        // Insert data into database
        const insertPromises = jsonData.map(async (row: any) => {
          const rowData = {} as Record<string, any>;
          table.fields.forEach((field: any) => {
            rowData[field.name] = row[field.name];
          });

          return supabase.from("dynamic_table_data").insert({
            table_metadata_id: selectedTable,
            data: rowData,
          });
        });

        await Promise.all(insertPromises);
        alert(`${jsonData.length} records imported successfully!`);
        loadTableData(selectedTable); // Refresh the data
      };

      reader.readAsArrayBuffer(file);
    } catch (error) {
      console.error("Error importing Excel:", error);
      alert("Failed to import Excel file");
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      importExcelData(file);
    }
  };

  const triggerFileSelect = () => {
    if (!selectedTable) {
      alert("Please select a table first");
      return;
    }
    fileInputRef.current?.click();
  };

  const parseFieldDefinitions = (text: string) => {
    const lines = text.trim().split("\n");
    const parsedFields: any[] = [];

    lines.forEach((line) => {
      const trimmedLine = line.trim();
      if (!trimmedLine) return;

      let fieldName = "";
      let dataType = "text";

      // Handle different formats:
      // 1. fieldName: dataType
      // 2. fieldName	dataType (tab separated)
      // 3. fieldName  dataType (multiple spaces)
      // 4. Just fieldName (infer type from name patterns)

      if (trimmedLine.includes(":")) {
        // Format: fieldName: dataType
        const parts = trimmedLine.split(":");
        fieldName = parts[0].trim();
        dataType = parts[1].trim().toLowerCase();
      } else if (trimmedLine.includes("\t")) {
        // Tab separated
        const parts = trimmedLine.split("\t");
        fieldName = parts[0].trim();
        if (parts.length > 1) {
          dataType = parts[1].trim().toLowerCase();
        }
      } else {
        // Space separated or just field name
        const parts = trimmedLine.split(/\s+/);
        fieldName = parts[0].trim();
        if (parts.length > 1) {
          dataType = parts[1].trim().toLowerCase();
        } else {
          // Try to infer type from field name
          const lowerName = fieldName.toLowerCase();
          if (
            lowerName.includes("date") ||
            lowerName.includes("dob") ||
            lowerName.includes("created") ||
            lowerName.includes("updated")
          ) {
            dataType = "date";
          } else if (
            lowerName.includes("count") ||
            lowerName.includes("amount") ||
            lowerName.includes("salary") ||
            lowerName.includes("id") ||
            lowerName.match(/\d+$/)
          ) {
            dataType = "number";
          } else if (
            lowerName.includes("active") ||
            lowerName.includes("enabled") ||
            lowerName.includes("flag")
          ) {
            dataType = "boolean";
          }
        }
      }

      // Map common data type names to our supported types
      let mappedType = "text";
      if (
        dataType.includes("number") ||
        dataType.includes("int") ||
        dataType.includes("float") ||
        dataType.includes("decimal") ||
        dataType.includes("double") ||
        dataType.includes("numeric")
      ) {
        mappedType = "number";
      } else if (
        dataType.includes("date") ||
        dataType.includes("datetime") ||
        dataType.includes("timestamp")
      ) {
        mappedType = "date";
      } else if (
        dataType.includes("bool") ||
        dataType.includes("boolean") ||
        dataType.includes("true") ||
        dataType.includes("false")
      ) {
        mappedType = "boolean";
      } else if (
        dataType.includes("text") ||
        dataType.includes("string") ||
        dataType.includes("varchar") ||
        dataType.includes("char")
      ) {
        mappedType = "text";
      }

      if (
        fieldName &&
        !fieldName.startsWith("#") &&
        !fieldName.startsWith("//")
      ) {
        // Avoid comment lines
        parsedFields.push({ name: fieldName, type: mappedType });
      }
    });

    return parsedFields;
  };

  const applyFieldDefinitions = () => {
    if (!fieldDefinitionText.trim()) {
      alert("Please enter field definitions");
      return;
    }

    const parsedFields = parseFieldDefinitions(fieldDefinitionText);
    if (parsedFields.length === 0) {
      alert("No valid fields found. Please use format: FieldName: DataType");
      return;
    }

    setFields(parsedFields);
    alert(`Parsed ${parsedFields.length} fields successfully!`);
  };

  const loadSampleFormat = () => {
    const sampleText = `employee_id: number
first_name: text
last_name: text
email: text
department: text
salary: number
hire_date: date
is_manager: boolean`;
    setFieldDefinitionText(sampleText);
  };

  const openGeneratedForm = (table: any) => {
    // Open form in same window (new page) with URL parameters
    const formUrl = `/dashboard/forms/${table.id}?data=${encodeURIComponent(
      JSON.stringify(table),
    )}`;

    // Navigate to the form page
    window.location.href = formUrl;
  };

  const deleteForm = async (table: any) => {
    // Show confirmation dialog
    const confirmed = window.confirm(
      `⚠️ DELETE FORM WARNING ⚠️
      
Are you sure you want to delete the form "${table.display_name}"?
      
This action will:
- Permanently delete the form structure
- Remove all associated data entries
- Cannot be undone
      
Type "DELETE" to confirm deletion:`,
    );

    if (!confirmed) {
      return;
    }

    // Double confirmation with typing
    const userInput = prompt('Please type "DELETE" to confirm:');

    if (userInput !== "DELETE") {
      alert('Deletion cancelled. You must type "DELETE" to confirm.');
      return;
    }

    try {
      // Show loading state
      const loadingAlert = alert("Deleting form... Please wait.");

      // Delete from metadata table
      const { error: metaError } = await supabase
        .from("dynamic_tables_metadata")
        .delete()
        .eq("id", table.id);

      if (metaError) {
        throw new Error(`Failed to delete form metadata: ${metaError.message}`);
      }

      // Also delete associated data
      const { error: dataError } = await supabase
        .from("dynamic_table_data")
        .delete()
        .eq("table_metadata_id", table.id);

      if (dataError) {
        console.warn("Failed to delete form data:", dataError);
        // Don't throw here as metadata deletion was successful
      }

      // Update local state
      setTables(tables.filter((t) => t.id !== table.id));

      alert(`Form "${table.display_name}" has been permanently deleted.`);
    } catch (error: any) {
      console.error("Error deleting form:", error);
      alert(`Failed to delete form: ${error.message}`);
    }
  };

  const handleFormInputChange = (fieldName: string, value: any) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const submitGeneratedForm = async () => {
    if (!selectedFormTable) return;

    try {
      // Insert into the actual database table
      const tableName =
        selectedFormTable.actual_table_name || selectedFormTable.table_name;

      console.log("=== FORM SUBMISSION DEBUG INFO ===");
      console.log("Table name:", tableName);
      console.log("Form data:", formData);
      console.log("Table structure:", selectedFormTable.fields);
      console.log("Selected form table:", selectedFormTable);

      // First, verify the table exists and get its structure
      try {
        const { data: tableInfo, error: tableError } = await supabase
          .from(tableName)
          .select("*")
          .limit(1);

        if (tableError && tableError.code !== "42P01") {
          // 42P01 = table doesn't exist
          console.warn("Table verification error:", tableError);
        }
      } catch (verifyError) {
        console.warn("Table verification failed:", verifyError);
      }

      // Filter formData to only include columns that exist in the table
      const filteredData = { ...formData };

      // Remove any fields that don't match the table schema
      Object.keys(filteredData).forEach((key) => {
        const fieldExists = selectedFormTable.fields.some(
          (field: any) => field.name.toLowerCase() === key.toLowerCase(),
        );

        if (!fieldExists) {
          console.warn(`Removing field '${key}' - not found in table schema`);
          delete filteredData[key];
        }
      });

      console.log("Filtered data:", filteredData);

      // Simple direct insert
      const { error, data } = await supabase
        .from(tableName)
        .insert([filteredData])
        .select();

      console.log("Supabase response:", { error, data });

      if (error) {
        console.error("=== INSERT ERROR ===");
        console.error("Error details:", error);
        console.error("Table name used:", tableName);
        console.error("Filtered data sent:", filteredData);

        // Handle specific error types
        if (error.code === "42P01") {
          // Table doesn't exist
          alert(
            `Table '${tableName}' doesn't exist. Please create it first or check the table name.`,
          );
        } else if (error.code === "PGRST204") {
          // Column doesn't exist
          alert(`Column mismatch error. The form fields don't match the table structure. 
                
Please verify:
1. Table '${tableName}' exists
2. Column names match exactly (case-sensitive)
3. Required columns are present

Check the browser console for detailed field information.`);
        } else {
          alert(
            `Failed to submit form data:\n${error.message}\n\nCheck console for details.`,
          );
        }
        return;
      }

      console.log("=== INSERT SUCCESS ===");
      console.log("Inserted data:", data);
      alert("Form submitted successfully to database table!");
      setShowGeneratedForm(false);
      setFormData({});
      setSelectedFormTable(null);
    } catch (error: any) {
      console.error("=== CATCH BLOCK ERROR ===");
      console.error("Error:", error);
      alert(`Failed to submit form: ${error.message}`);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!selectedTable) return;
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (!selectedTable) {
      alert("Please select a table first");
      return;
    }

    const files = e.dataTransfer.files;
    if (files.length > 0) {
      importExcelData(files[0]);
    }
  };

  return (
    <div className="space-y-6">
      <Tabs defaultValue="builder" className="w-full">
        <TabsList className="grid w-full grid-cols-3 bg-blue-100">
          <TabsTrigger value="builder">Form Builder</TabsTrigger>
          <TabsTrigger value="excel">Import Excel</TabsTrigger>
          <TabsTrigger value="manage">Manage Data</TabsTrigger>
        </TabsList>

        {/* Form Builder Tab */}
        <TabsContent value="builder">
          <Card className="p-6 bg-white border-0 shadow-md">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
              Dynamic Notice Form Builder
            </h2>
            <div className="space-y-6">
              <div>
                <Label className="text-blue-900 font-semibold mb-2">
                  Table Name
                </Label>
                <Input
                  placeholder="e.g., Employee Attendance"
                  value={tableName}
                  onChange={(e) => setTableName(e.target.value)}
                  className="border-blue-200 focus:border-blue-500 bg-blue-50"
                />
              </div>

              {/* Text-based Field Definition Section */}
              <div className="border border-blue-200 rounded-lg p-4 bg-blue-50">
                <Label className="text-blue-900 font-semibold mb-3 block">
                  Quick Field Definition (Paste format: FieldName: DataType)
                </Label>
                <Textarea
                  placeholder={`Enter fields in these formats:

Format 1 - Colon separated:
employee_id: number
first_name: text
hire_date: date

Format 2 - Tab separated:
employee_id	number
first_name	text
hire_date	date

Format 3 - Space separated:
employee_id number
first_name text
hire_date date

Format 4 - Field names only (auto-detected):
employee_id
first_name
hire_date
salary

Supported types: text, number, date, boolean, string, varchar, int, float, datetime, timestamp, bool`}
                  value={fieldDefinitionText}
                  onChange={(e) => setFieldDefinitionText(e.target.value)}
                  className="border-blue-200 bg-white mb-3 min-h-[150px]"
                />
                <Button
                  onClick={applyFieldDefinitions}
                  size="sm"
                  className="bg-blue-600 hover:bg-blue-700 mr-2"
                >
                  Apply Fields
                </Button>
                <Button
                  onClick={loadSampleFormat}
                  variant="outline"
                  size="sm"
                  className="border-blue-300 text-blue-700 hover:bg-blue-50"
                >
                  Load Sample
                </Button>
                <p className="text-xs text-blue-700 mt-2">
                  Tip: Copy column headers from Excel, paste database schema, or
                  manually enter field definitions. Supports multiple formats
                  including colon, tab, and space separation.
                </p>
              </div>

              <div>
                <div className="flex justify-between items-center mb-4">
                  <Label className="text-blue-900 font-semibold">Fields</Label>
                  <Button
                    onClick={addField}
                    size="sm"
                    className="bg-blue-600 hover:bg-blue-700 gap-2"
                  >
                    <Plus className="h-4 w-4" /> Add Field
                  </Button>
                </div>

                <div className="space-y-3">
                  {fields.map((field, index) => (
                    <div
                      key={index}
                      className="flex gap-3 items-end p-3 bg-blue-50 rounded-lg border border-blue-200"
                    >
                      <div className="flex-1">
                        <Label className="text-sm text-gray-700 mb-1">
                          Field Name
                        </Label>
                        <Input
                          placeholder="Field name"
                          value={field.name}
                          onChange={(e) =>
                            updateField(index, "name", e.target.value)
                          }
                          className="border-blue-200"
                        />
                      </div>
                      <div className="w-32">
                        <Label className="text-sm text-gray-700 mb-1">
                          Type
                        </Label>
                        <Select
                          value={field.type}
                          onValueChange={(v) => updateField(index, "type", v)}
                        >
                          <SelectTrigger className="border-blue-200">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="text">Text</SelectItem>
                            <SelectItem value="number">Number</SelectItem>
                            <SelectItem value="date">Date</SelectItem>
                            <SelectItem value="boolean">Boolean</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      {fields.length > 1 && (
                        <Button
                          onClick={() => removeField(index)}
                          variant="destructive"
                          size="sm"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <Button
                onClick={createTable}
                disabled={isCreating}
                className="w-full bg-blue-600 hover:bg-blue-700 py-2 h-10"
              >
                {isCreating ? "Creating..." : "Create Form/Table"}
              </Button>

              {tables.length > 0 && (
                <div>
                  <h3 className="font-semibold text-blue-900 mb-3">
                    Existing Forms/Tables:
                  </h3>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                    {tables.map((table) => (
                      <FormCard
                        key={table.id}
                        table={table}
                        onOpenForm={openGeneratedForm}
                        onViewData={(tableId) => loadTableData(tableId)}
                        onDelete={deleteForm}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          </Card>
        </TabsContent>

        {/* Excel Import Tab */}
        <TabsContent value="excel">
          <Card className="p-6 bg-white border-0 shadow-md">
            <h2 className="text-2xl font-bold text-blue-900 mb-6">
              Import Excel Data
            </h2>
            <div className="space-y-6">
              <div>
                <Label className="text-blue-900 font-semibold mb-3 block">
                  Select Table
                </Label>
                <Select value={selectedTable} onValueChange={setSelectedTable}>
                  <SelectTrigger className="border-blue-200 bg-blue-50">
                    <SelectValue placeholder="Choose a table to import data" />
                  </SelectTrigger>
                  <SelectContent>
                    {tables.map((table) => (
                      <SelectItem key={table.id} value={table.id}>
                        {table.display_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div
                className={`border-2 border-dashed rounded-lg p-8 text-center relative transition-colors ${
                  isDragging
                    ? "border-blue-500 bg-blue-100"
                    : selectedTable
                      ? "border-blue-300 bg-blue-50"
                      : "border-gray-300 bg-gray-100 opacity-50"
                }`}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
              >
                <Upload
                  className={`h-12 w-12 mx-auto mb-3 ${
                    selectedTable ? "text-blue-400" : "text-gray-400"
                  }`}
                />
                <p
                  className={`mb-2 ${
                    selectedTable ? "text-gray-700" : "text-gray-500"
                  }`}
                >
                  {isDragging
                    ? "Drop your file here"
                    : selectedTable
                      ? "Drag and drop your Excel file here"
                      : "Please select a table first"}
                </p>
                <p className="text-sm text-gray-600 mb-4">or</p>
                <Button
                  onClick={triggerFileSelect}
                  className={
                    selectedTable
                      ? "bg-blue-600 hover:bg-blue-700"
                      : "bg-gray-400 cursor-not-allowed"
                  }
                  disabled={!selectedTable}
                >
                  Choose File
                </Button>
                <p className="text-xs text-gray-600 mt-2">
                  CSV, XLS, XLSX format supported
                </p>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileSelect}
                  accept=".csv,.xlsx,.xls"
                  className="hidden"
                />
              </div>

              <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                <p className="text-sm text-blue-900">
                  <strong>Note:</strong> Column names in your Excel file must
                  exactly match the field names in the selected form. Please
                  select a table first before importing.
                </p>
              </div>
            </div>
          </Card>
        </TabsContent>

        {/* Manage Data Tab */}
        <TabsContent value="manage">
          <Card className="p-6 bg-white border-0 shadow-md">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-blue-900">
                Manage Form Data
              </h2>
              {selectedTable && (
                <Button
                  onClick={exportToExcel}
                  className="bg-green-600 hover:bg-green-700"
                >
                  Export to Excel
                </Button>
              )}
            </div>

            <div className="mb-6">
              <Label className="text-blue-900 font-semibold mb-3 block">
                Select Table
              </Label>
              <Select value={selectedTable} onValueChange={loadTableData}>
                <SelectTrigger className="border-blue-200 bg-blue-50">
                  <SelectValue placeholder="Choose a table to view/manage data" />
                </SelectTrigger>
                <SelectContent>
                  {tables.map((table) => (
                    <SelectItem key={table.id} value={table.id}>
                      {table.display_name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {selectedTable && tableData.length > 0 && (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-blue-100 border-b border-blue-300">
                      {tables
                        .find((t) => t.id === selectedTable)
                        ?.fields.map((field: any) => (
                          <th
                            key={field.name}
                            className="px-4 py-2 text-left text-blue-900 font-semibold"
                          >
                            {field.name}
                          </th>
                        ))}
                      <th className="px-4 py-2 text-left text-blue-900 font-semibold">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {tableData.map((row) => (
                      <tr
                        key={row.id}
                        className="border-b border-gray-200 hover:bg-blue-50"
                      >
                        {tables
                          .find((t) => t.id === selectedTable)
                          ?.fields.map((field: any) => (
                            <td key={field.name} className="px-4 py-2">
                              {row.data[field.name] || "-"}
                            </td>
                          ))}
                        <td className="px-4 py-2">
                          <Button
                            onClick={() => deleteRecord(row.id)}
                            variant="destructive"
                            size="sm"
                          >
                            Delete
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {selectedTable && tableData.length === 0 && (
              <div className="text-center py-8 text-gray-600">
                No data in this table yet
              </div>
            )}
          </Card>
        </TabsContent>
      </Tabs>

      {/* Generated Form Modal */}
      {showGeneratedForm && selectedFormTable && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-blue-900">
                  {selectedFormTable.display_name}
                </h2>
                <button
                  onClick={() => {
                    setShowGeneratedForm(false);
                    setSelectedFormTable(null);
                    setFormData({});
                  }}
                  className="text-gray-400 hover:text-gray-600 text-2xl"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                {selectedFormTable.fields.map((field: any) => (
                  <div key={field.name}>
                    <Label className="text-blue-900 font-semibold mb-2 block">
                      {field.name}{" "}
                      {field.required && (
                        <span className="text-red-500">*</span>
                      )}
                    </Label>
                    {field.type === "text" && (
                      <Input
                        placeholder={`Enter ${field.name}`}
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleFormInputChange(field.name, e.target.value)
                        }
                        className="border-blue-200"
                      />
                    )}
                    {field.type === "number" && (
                      <Input
                        type="number"
                        placeholder={`Enter ${field.name}`}
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleFormInputChange(field.name, e.target.value)
                        }
                        className="border-blue-200"
                      />
                    )}
                    {field.type === "date" && (
                      <Input
                        type="date"
                        value={formData[field.name] || ""}
                        onChange={(e) =>
                          handleFormInputChange(field.name, e.target.value)
                        }
                        className="border-blue-200"
                      />
                    )}
                    {field.type === "boolean" && (
                      <div className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          checked={formData[field.name] || false}
                          onChange={(e) =>
                            handleFormInputChange(field.name, e.target.checked)
                          }
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label className="text-gray-700">Yes</Label>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <div className="flex gap-3 mt-8 justify-end">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowGeneratedForm(false);
                    setSelectedFormTable(null);
                    setFormData({});
                  }}
                >
                  Cancel
                </Button>
                <Button
                  onClick={submitGeneratedForm}
                  className="bg-blue-600 hover:bg-blue-700"
                >
                  Submit Form
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}
    </div>
  );
}
