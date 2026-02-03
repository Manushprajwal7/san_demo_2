"use client";

import { useEffect, useState } from "react";
import {
  Table,
  TableHeader,
  TableBody,
  TableHead,
  TableRow,
  TableCell,
} from "@/components/ui/table";
import type { FieldDef } from "./field-definition";

interface DataPreviewProps {
  tableName: string;
  columns: FieldDef[];
  refreshKey: number;
}

export function DataPreview({
  tableName,
  columns,
  refreshKey,
}: DataPreviewProps) {
  const [rows, setRows] = useState<Record<string, unknown>[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const res = await fetch(
          `/api/notice?action=data&table=${encodeURIComponent(tableName)}`
        );
        const data = await res.json();

        if (res.ok && Array.isArray(data)) {
          setRows(data);
        } else {
          setRows([]);
        }
      } catch {
        setRows([]);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, refreshKey]);

  if (loading) {
    return (
      <div className="text-center py-8 text-gray-500 text-sm">
        Loading data...
      </div>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="text-center py-8 text-gray-400 text-sm">
        No data yet. Submit the form above to add rows.
      </div>
    );
  }

  const formatValue = (value: unknown, type: string): string => {
    if (value === null || value === undefined) return "—";
    if (type === "boolean") return value ? "Yes" : "No";
    return String(value);
  };

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow>
            {columns.map((col) => (
              <TableHead key={col.name} className="capitalize">
                {col.name.replace(/_/g, " ")}
              </TableHead>
            ))}
            <TableHead>Created At</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {rows.map((row, idx) => (
            <TableRow key={idx}>
              {columns.map((col) => (
                <TableCell key={col.name}>
                  {formatValue(row[col.name], col.type)}
                </TableCell>
              ))}
              <TableCell className="text-xs text-gray-500">
                {row.created_at
                  ? new Date(row.created_at as string).toLocaleString()
                  : "—"}
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}
