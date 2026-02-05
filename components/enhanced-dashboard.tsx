"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  AreaChart,
  Area,
} from "recharts";
import {
  Database,
  Users,
  Calendar,
  TrendingUp,
  Activity,
  FileText,
  BarChart3,
  PieChart as PieChartIcon,
  RefreshCw,
  Eye,
} from "lucide-react";
import { toast } from "sonner";

interface TableStats {
  table_name: string;
  display_name: string;
  row_count: number;
  columns: { name: string; type: string }[];
  sample_data: Record<string, any>[];
  created_at: string;
}

interface DashboardData {
  system_tables: {
    companies: number;
    branches: number;
    employees: number;
    licenses: number;
    calendar_events: number;
    compliance_submissions: number;
  };
  notice_tables: TableStats[];
  employee_stats: {
    total: number;
    male: number;
    female: number;
    by_designation: { designation: string; count: number }[];
    salary_distribution: { range: string; count: number }[];
  };
  recent_activity: {
    table_name: string;
    action: string;
    count: number;
    date: string;
  }[];
}

const COLORS = [
  "#3b82f6",
  "#06b6d4",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function EnhancedDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(
    null,
  );
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/enhanced-dashboard");
      if (response.ok) {
        const data = await response.json();
        setDashboardData(data);
      } else {
        toast.error("Failed to load dashboard data");
      }
    } catch (error) {
      console.error("Error loading dashboard data:", error);
      toast.error("Error loading dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const getTableIcon = (tableName: string) => {
    if (tableName.includes("employee")) return <Users className="h-5 w-5" />;
    if (tableName.includes("calendar") || tableName.includes("event"))
      return <Calendar className="h-5 w-5" />;
    if (tableName.includes("compliance") || tableName.includes("license"))
      return <FileText className="h-5 w-5" />;
    return <Database className="h-5 w-5" />;
  };

  const getTableColor = (index: number) => {
    const colorClasses = [
      "from-blue-500 to-blue-600",
      "from-cyan-500 to-cyan-600",
      "from-green-500 to-green-600",
      "from-yellow-500 to-yellow-600",
      "from-red-500 to-red-600",
      "from-purple-500 to-purple-600",
      "from-pink-500 to-pink-600",
    ];
    return colorClasses[index % colorClasses.length];
  };

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-center py-12">
          <div className="flex items-center gap-3 text-blue-600">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <span className="text-lg font-medium">
              Loading dashboard data...
            </span>
          </div>
        </div>
      </div>
    );
  }

  if (!dashboardData) {
    return (
      <div className="text-center py-12">
        <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <p className="text-gray-600">No dashboard data available</p>
        <Button onClick={fetchDashboardData} className="mt-4">
          <RefreshCw className="h-4 w-4 mr-2" />
          Retry
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {Object.entries(dashboardData.system_tables).map(
          ([key, value], index) => (
            <Card
              key={key}
              className="p-4 bg-gradient-to-br from-white to-gray-50 border-0 shadow-md hover:shadow-lg transition-shadow"
            >
              <div className="flex items-center gap-3">
                <div
                  className={`p-2 rounded-lg bg-gradient-to-r ${getTableColor(index)} text-white`}
                >
                  {getTableIcon(key)}
                </div>
                <div>
                  <p className="text-2xl font-bold text-gray-900">
                    {value === 0 ? (
                      <span className="text-gray-400">-</span>
                    ) : (
                      formatNumber(value)
                    )}
                  </p>
                  <p className="text-xs text-gray-600 capitalize">
                    {key.replace("_", " ")}
                  </p>
                </div>
              </div>
            </Card>
          ),
        )}
      </div>

      {/* Show message if no data */}
      {Object.values(dashboardData.system_tables).every((v) => v === 0) &&
        dashboardData.notice_tables.length === 0 && (
          <Card className="p-8 text-center bg-gradient-to-br from-blue-50 to-indigo-50 border-0 shadow-lg">
            <Database className="h-16 w-16 text-blue-400 mx-auto mb-4" />
            <h3 className="text-xl font-bold text-gray-900 mb-2">
              Welcome to Your Dashboard!
            </h3>
            <p className="text-gray-600 mb-4">
              Start by creating tables in the Notice Builder to see your data
              visualized here.
            </p>
            <div className="flex justify-center gap-4">
              <Button
                onClick={() => (window.location.href = "/dashboard/notice")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Database className="h-4 w-4 mr-2" />
                Create Your First Table
              </Button>
              <Button variant="outline" onClick={fetchDashboardData}>
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Data
              </Button>
            </div>
          </Card>
        )}

      {/* Employee Statistics */}
      {dashboardData.employee_stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="h-6 w-6 text-blue-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Employee Overview
              </h2>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-6">
              <div className="text-center p-4 bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg">
                <p className="text-3xl font-bold text-blue-600">
                  {dashboardData.employee_stats.total}
                </p>
                <p className="text-sm text-blue-700">Total Employees</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="text-center p-3 bg-gradient-to-br from-green-50 to-green-100 rounded-lg">
                  <p className="text-xl font-bold text-green-600">
                    {dashboardData.employee_stats.male}
                  </p>
                  <p className="text-xs text-green-700">Male</p>
                </div>
                <div className="text-center p-3 bg-gradient-to-br from-pink-50 to-pink-100 rounded-lg">
                  <p className="text-xl font-bold text-pink-600">
                    {dashboardData.employee_stats.female}
                  </p>
                  <p className="text-xs text-pink-700">Female</p>
                </div>
              </div>
            </div>

            <ResponsiveContainer width="100%" height={200}>
              <PieChart>
                <Pie
                  data={[
                    { name: "Male", value: dashboardData.employee_stats.male },
                    {
                      name: "Female",
                      value: dashboardData.employee_stats.female,
                    },
                  ]}
                  cx="50%"
                  cy="50%"
                  innerRadius={40}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  <Cell fill="#10b981" />
                  <Cell fill="#ec4899" />
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-purple-100 rounded-lg">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h2 className="text-xl font-bold text-gray-900">
                Designation Distribution
              </h2>
            </div>

            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={dashboardData.employee_stats.by_designation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="designation"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Notice Tables Overview */}
      <Card className="p-6 bg-white border-0 shadow-lg">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-indigo-100 rounded-lg">
              <Database className="h-6 w-6 text-indigo-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Dynamic Tables</h2>
          </div>
          <Badge variant="secondary" className="text-sm">
            {dashboardData.notice_tables.length} tables
          </Badge>
        </div>

        {dashboardData.notice_tables.length === 0 ? (
          <div className="text-center py-8">
            <Database className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-600">No dynamic tables created yet</p>
            <p className="text-sm text-gray-500 mt-2">
              Create tables in the Notice Builder to see them here
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {dashboardData.notice_tables.map((table, index) => (
              <Card
                key={table.table_name}
                className="p-4 border-l-4 border-l-blue-500 hover:shadow-md transition-shadow cursor-pointer"
                onClick={() =>
                  setSelectedTable(
                    selectedTable === table.table_name
                      ? null
                      : table.table_name,
                  )
                }
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    {getTableIcon(table.table_name)}
                    <h3 className="font-semibold text-gray-900 truncate">
                      {table.display_name}
                    </h3>
                  </div>
                  <Badge variant="outline" className="text-xs">
                    {table.row_count} rows
                  </Badge>
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Columns:</span>
                    <span className="font-medium">{table.columns.length}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Created:</span>
                    <span className="font-medium">
                      {new Date(table.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>

                {selectedTable === table.table_name && (
                  <div className="mt-4 pt-4 border-t border-gray-200">
                    <div className="space-y-3">
                      <div>
                        <p className="text-sm font-medium text-gray-700 mb-2">
                          Columns:
                        </p>
                        <div className="flex flex-wrap gap-1">
                          {table.columns.map((col) => (
                            <Badge
                              key={col.name}
                              variant="secondary"
                              className="text-xs"
                            >
                              {col.name} ({col.type})
                            </Badge>
                          ))}
                        </div>
                      </div>

                      {table.sample_data.length > 0 && (
                        <div>
                          <p className="text-sm font-medium text-gray-700 mb-2">
                            Sample Data:
                          </p>
                          <div className="bg-gray-50 rounded p-2 text-xs">
                            <pre className="overflow-auto max-h-32">
                              {JSON.stringify(table.sample_data[0], null, 2)}
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </Card>
            ))}
          </div>
        )}
      </Card>

      {/* Data Visualization */}
      {dashboardData.notice_tables.length > 0 && (
        <Card className="p-6 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-green-100 rounded-lg">
              <TrendingUp className="h-6 w-6 text-green-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">
              Table Statistics
            </h2>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart
                data={dashboardData.notice_tables.map((t) => ({
                  name: t.display_name,
                  rows: t.row_count,
                  columns: t.columns.length,
                }))}
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis
                  dataKey="name"
                  angle={-45}
                  textAnchor="end"
                  height={80}
                />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rows" fill="#3b82f6" name="Row Count" />
                <Bar dataKey="columns" fill="#06b6d4" name="Column Count" />
              </BarChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={dashboardData.notice_tables.map((t) => ({
                    name: t.display_name,
                    value: t.row_count,
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {dashboardData.notice_tables.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={COLORS[index % COLORS.length]}
                    />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </Card>
      )}

      {/* Recent Activity */}
      {dashboardData.recent_activity.length > 0 && (
        <Card className="p-6 bg-white border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-6">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Activity className="h-6 w-6 text-orange-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-900">Recent Activity</h2>
          </div>

          <div className="space-y-3">
            {dashboardData.recent_activity.map((activity, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center gap-3">
                  <div className="p-1 bg-blue-100 rounded">
                    <Database className="h-4 w-4 text-blue-600" />
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">
                      {activity.table_name}
                    </p>
                    <p className="text-sm text-gray-600">{activity.action}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-bold text-blue-600">{activity.count}</p>
                  <p className="text-xs text-gray-500">
                    {new Date(activity.date).toLocaleDateString()}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
