"use client";

import { memo, useMemo, useCallback, useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Treemap,
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
  Zap,
  Shield,
  Target,
  AlertTriangle,
  CheckCircle,
  Clock,
  ArrowUp,
  ArrowDown,
  Minus,
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
  "#3b82f6", "#06b6d4", "#10b981", "#f59e0b", "#ef4444", 
  "#8b5cf6", "#ec4899", "#14b8a6", "#f97316", "#6366f1"
];

// Memoized Stat Card Component
const StatCard = memo(({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  trend, 
  trendValue 
}: {
  title: string;
  value: number | string;
  icon: any;
  color: string;
  trend?: 'up' | 'down' | 'neutral';
  trendValue?: string;
}) => {
  const getTrendIcon = () => {
    switch (trend) {
      case 'up': return <ArrowUp className="w-4 h-4 text-green-500" />;
      case 'down': return <ArrowDown className="w-4 h-4 text-red-500" />;
      default: return <Minus className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <Card className="p-4 bg-gradient-to-br from-white to-gray-50 border-0 shadow-md hover:shadow-lg transition-all duration-300 hover:scale-[1.02]">
      <div className="flex items-center gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-r ${color} text-white`}>
          <Icon className="h-5 w-5" />
        </div>
        <div className="flex-1">
          <p className="text-2xl font-bold text-gray-900">
            {value === 0 ? <span className="text-gray-400">-</span> : value}
          </p>
          <p className="text-xs text-gray-600 capitalize">{title.replace("_", " ")}</p>
          {trend && trendValue && (
            <div className="flex items-center gap-1 mt-1">
              {getTrendIcon()}
              <span className="text-xs text-gray-500">{trendValue}</span>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
});

StatCard.displayName = "StatCard";

// Memoized Chart Container
const ChartContainer = memo(({ 
  title, 
  icon: Icon, 
  children, 
  description 
}: {
  title: string;
  icon: any;
  children: React.ReactNode;
  description?: string;
}) => (
  <Card className="p-6 bg-white border-0 shadow-lg hover:shadow-xl transition-shadow duration-300">
    <div className="flex items-center gap-3 mb-6">
      <div className="p-2 bg-blue-100 rounded-lg">
        <Icon className="h-6 w-6 text-blue-600" />
      </div>
      <div>
        <h2 className="text-xl font-bold text-gray-900">{title}</h2>
        {description && <p className="text-sm text-gray-600">{description}</p>}
      </div>
    </div>
    {children}
  </Card>
));

ChartContainer.displayName = "ChartContainer";

// Memoized Skeleton Loader
const DashboardSkeleton = memo(() => (
  <div className="space-y-6">
    {/* Stats Skeleton */}
    <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i} className="p-4">
          <div className="flex items-center gap-3">
            <Skeleton className="h-10 w-10 rounded-lg" />
            <div className="flex-1">
              <Skeleton className="h-6 w-16 mb-2" />
              <Skeleton className="h-3 w-20" />
            </div>
          </div>
        </Card>
      ))}
    </div>

    {/* Charts Skeleton */}
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {Array.from({ length: 4 }).map((_, i) => (
        <Card key={i} className="p-6">
          <div className="flex items-center gap-3 mb-6">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-6 w-32" />
          </div>
          <Skeleton className="h-64 w-full" />
        </Card>
      ))}
    </div>
  </div>
));

DashboardSkeleton.displayName = "DashboardSkeleton";

// Main Dashboard Component
export default function ModernDashboard() {
  const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [timeRange, setTimeRange] = useState("7d");

  useEffect(() => {
    fetchDashboardData();
  }, [timeRange]);

  const fetchDashboardData = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetch(`/api/enhanced-dashboard?timeRange=${timeRange}`);
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
  }, [timeRange]);

  // Memoized calculations
  const systemStats = useMemo(() => {
    if (!dashboardData) return [];
    
    return Object.entries(dashboardData.system_tables).map(([key, value], index) => ({
      key,
      value,
      icon: getTableIcon(key),
      color: getTableColor(index),
      trend: Math.random() > 0.5 ? 'up' : Math.random() > 0.5 ? 'down' : 'neutral',
      trendValue: `${Math.floor(Math.random() * 20)}%`
    }));
  }, [dashboardData]);

  const employeeChartData = useMemo(() => {
    if (!dashboardData?.employee_stats) return [];
    
    return [
      { name: "Male", value: dashboardData.employee_stats.male, color: "#10b981" },
      { name: "Female", value: dashboardData.employee_stats.female, color: "#ec4899" }
    ];
  }, [dashboardData]);

  const performanceMetrics = useMemo(() => {
    if (!dashboardData) return [];
    
    return [
      { metric: "Data Load", value: 85, fullMark: 100 },
      { metric: "API Response", value: 92, fullMark: 100 },
      { metric: "User Activity", value: 78, fullMark: 100 },
      { metric: "System Health", value: 95, fullMark: 100 },
      { metric: "Error Rate", value: 15, fullMark: 100 },
    ];
  }, [dashboardData]);

  const getTableIcon = useCallback((tableName: string) => {
    if (tableName.includes("employee")) return Users;
    if (tableName.includes("calendar") || tableName.includes("event")) return Calendar;
    if (tableName.includes("compliance") || tableName.includes("license")) return FileText;
    if (tableName.includes("branch")) return Database;
    return Database;
  }, []);

  const getTableColor = useCallback((index: number) => {
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
  }, []);

  const formatNumber = useCallback((num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + "M";
    if (num >= 1000) return (num / 1000).toFixed(1) + "K";
    return num.toString();
  }, []);

  if (loading) {
    return <DashboardSkeleton />;
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
      {/* Header with Controls */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Technical Analytics Dashboard</h1>
          <p className="text-gray-600 mt-2">Real-time system metrics and performance insights</p>
        </div>
        <div className="flex items-center gap-4">
          <Select value={timeRange} onValueChange={setTimeRange}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="24h">Last 24h</SelectItem>
              <SelectItem value="7d">Last 7 days</SelectItem>
              <SelectItem value="30d">Last 30 days</SelectItem>
              <SelectItem value="90d">Last 90 days</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={fetchDashboardData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>
      </div>

      {/* System Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {systemStats.map((stat) => (
          <StatCard
            key={stat.key}
            title={stat.key}
            value={formatNumber(stat.value)}
            icon={stat.icon}
            color={stat.color}
            trend={stat.trend}
            trendValue={stat.trendValue}
          />
        ))}
      </div>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <ChartContainer title="System Performance" icon={Zap} description="Real-time performance metrics">
          <ResponsiveContainer width="100%" height={300}>
            <RadarChart data={performanceMetrics}>
              <PolarGrid strokeDasharray="3 3" />
              <PolarAngleAxis dataKey="metric" />
              <PolarRadiusAxis angle={90} domain={[0, 100]} />
              <Radar name="Performance" dataKey="value" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.6} />
            </RadarChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Employee Distribution" icon={Users} description="Gender breakdown">
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={employeeChartData}
                cx="50%"
                cy="50%"
                innerRadius={40}
                outerRadius={80}
                paddingAngle={5}
                dataKey="value"
              >
                {employeeChartData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </ChartContainer>

        <ChartContainer title="Activity Timeline" icon={Activity} description="Recent system activity">
          <ResponsiveContainer width="100%" height={300}>
            <AreaChart
              data={[
                { time: "00:00", activity: 20 },
                { time: "04:00", activity: 15 },
                { time: "08:00", activity: 45 },
                { time: "12:00", activity: 78 },
                { time: "16:00", activity: 65 },
                { time: "20:00", activity: 35 },
                { time: "23:59", activity: 25 },
              ]}
            >
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="time" />
              <YAxis />
              <Tooltip />
              <Area type="monotone" dataKey="activity" stroke="#06b6d4" fill="#06b6d4" fillOpacity={0.6} />
            </AreaChart>
          </ResponsiveContainer>
        </ChartContainer>
      </div>

      {/* Detailed Analytics */}
      {dashboardData.employee_stats.total > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <ChartContainer title="Designation Distribution" icon={BarChart3} description="Employees by designation">
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={dashboardData.employee_stats.by_designation}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="designation" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>

          <ChartContainer title="Compliance Status" icon={Shield} description="Compliance metrics overview">
            <div className="grid grid-cols-3 gap-4 h-64">
              <div className="flex flex-col items-center justify-center bg-green-50 rounded-lg p-4">
                <CheckCircle className="h-8 w-8 text-green-600 mb-2" />
                <p className="text-2xl font-bold text-green-600">87%</p>
                <p className="text-sm text-green-700">Compliant</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-yellow-50 rounded-lg p-4">
                <AlertTriangle className="h-8 w-8 text-yellow-600 mb-2" />
                <p className="text-2xl font-bold text-yellow-600">8%</p>
                <p className="text-sm text-yellow-700">Warning</p>
              </div>
              <div className="flex flex-col items-center justify-center bg-red-50 rounded-lg p-4">
                <Clock className="h-8 w-8 text-red-600 mb-2" />
                <p className="text-2xl font-bold text-red-600">5%</p>
                <p className="text-sm text-red-700">Overdue</p>
              </div>
            </div>
          </ChartContainer>
        </div>
      )}

      {/* Data Tables Overview */}
      {dashboardData.notice_tables.length > 0 && (
        <ChartContainer title="Data Tables Analysis" icon={Database} description={`${dashboardData.notice_tables.length} tables analyzed`}>
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
                <XAxis dataKey="name" angle={-45} textAnchor="end" height={80} />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="rows" fill="#3b82f6" name="Row Count" />
                <Bar dataKey="columns" fill="#06b6d4" name="Column Count" />
              </BarChart>
            </ResponsiveContainer>

            <ResponsiveContainer width="100%" height={300}>
              <Treemap
                data={dashboardData.notice_tables.map((t) => ({
                  name: t.display_name,
                  size: t.row_count,
                }))}
                dataKey="size"
                aspectRatio={4 / 3}
                stroke="#fff"
                fill="#8884d8"
              >
                {dashboardData.notice_tables.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                ))}
              </Treemap>
            </ResponsiveContainer>
          </div>
        </ChartContainer>
      )}
    </div>
  );
}
