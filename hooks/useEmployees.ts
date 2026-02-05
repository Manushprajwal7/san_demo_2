import { useState, useEffect, useCallback } from "react";

interface Employee {
  id: string;
  name: string;
  department: string;
  table: string;
}

interface TableInfo {
  name: string;
  displayName: string;
  count: number;
}

interface UseEmployeesReturn {
  tables: TableInfo[];
  employees: Employee[];
  loading: boolean;
  error: string | null;
  fetchTables: () => Promise<void>;
  fetchEmployees: (tableName: string) => Promise<void>;
  submitCompliance: (
    data: any,
  ) => Promise<{ success: boolean; id?: string; error?: string }>;
}

export function useEmployees(): UseEmployeesReturn {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cachedTable, setCachedTable] = useState<string | null>(null);

  const fetchTables = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/employees");
      const data = await response.json();

      if (data.success) {
        setTables(data.tables);
        if (data.message) {
          console.log(`Tables info: ${data.message}`);
        }
      } else {
        setError(data.error || "Failed to fetch tables");
      }
    } catch (err) {
      setError("Network error while fetching tables");
      console.error("Error fetching tables:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchEmployees = useCallback(
    async (tableName: string) => {
      // Skip if already loaded for this table (caching)
      if (cachedTable === tableName && employees.length > 0) {
        console.log(`Using cached data for table: ${tableName}`);
        return;
      }

      try {
        setLoading(true);
        setError(null);

        const response = await fetch(`/api/employees?table=${tableName}`);
        const data = await response.json();

        if (data.success) {
          setEmployees(data.employees);
          setCachedTable(tableName);
          if (data.message) {
            console.log(`Table info: ${data.message}`);
          }
          if (data.columnInfo) {
            console.log("Column mapping:", data.columnInfo);
          }
        } else {
          setError(data.error || "Failed to fetch employees");
          setEmployees([]);
          setCachedTable(null);
        }
      } catch (err) {
        setError("Network error while fetching employees");
        setEmployees([]);
        setCachedTable(null);
        console.error("Error fetching employees:", err);
      } finally {
        setLoading(false);
      }
    },
    [cachedTable, employees.length],
  );

  const submitCompliance = useCallback(async (data: any) => {
    try {
      setLoading(true);
      setError(null);

      const response = await fetch("/api/employees", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (result.success) {
        return { success: true, id: result.id };
      } else {
        setError(result.error || "Failed to submit compliance");
        return { success: false, error: result.error };
      }
    } catch (err) {
      const errorMessage = "Network error while submitting compliance";
      setError(errorMessage);
      console.error("Error submitting compliance:", err);
      return { success: false, error: errorMessage };
    } finally {
      setLoading(false);
    }
  }, []);

  // Auto-fetch tables on mount
  useEffect(() => {
    fetchTables();
  }, [fetchTables]);

  return {
    tables,
    employees,
    loading,
    error,
    fetchTables,
    fetchEmployees,
    submitCompliance,
  };
}
