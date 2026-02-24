"use client";

import { memo } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import {
  Building2,
  Users,
  IndianRupee,
  Shield,
  TrendingUp,
  RefreshCw,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Loader2,
  UserCircle2,
  ChevronRight,
  ExternalLink,
} from "lucide-react";
import { RollingNumber } from "./rolling-number"; // Import rolling number
import { SimulatedChart } from "./simulated-chart"; // Import simulated chart

// Simulate currency format for rolling
const formatCurrency = (amount: number): string => {
  return `₹${amount.toLocaleString("en-IN")}`;
};

// Memoized KPI Card Component (Simulated)
const SimulatedKPICard = memo(
  ({
    title,
    icon: Icon,
    gradient,
    badge,
    badgeVariant,
    children,
  }: {
    title: string;
    icon: React.ElementType;
    gradient: string;
    badge?: string;
    badgeVariant?: "default" | "secondary" | "destructive" | "outline";
    children?: React.ReactNode;
  }) => (
    <Card className="relative overflow-hidden border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:scale-[1.02] bg-white">
      <div
        className={`absolute inset-0 opacity-5 bg-gradient-to-br ${gradient}`}
      />
      <CardContent className="p-5">
        <div className="flex items-start justify-between mb-3">
          <div
            className={`p-2.5 rounded-xl bg-gradient-to-br ${gradient} shadow-lg`}
          >
            <Icon className="h-5 w-5 text-white animate-pulse" />
          </div>
          {badge && (
            <Badge
              variant={badgeVariant || "secondary"}
              className="text-xs font-medium opacity-70"
            >
              {badge}
            </Badge>
          )}
        </div>
        <div className="space-y-1">
          <p className="text-3xl font-bold text-gray-900 tracking-tight">
            <RollingNumber prefix="" />
          </p>
          <p className="text-sm font-medium text-gray-600">{title}</p>
        </div>
        {children}
      </CardContent>
    </Card>
  )
);

SimulatedKPICard.displayName = "SimulatedKPICard";

export function SimulatedDashboard() {
  return (
    <div className="space-y-6">
      {/* Header with Title and Filters */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 tracking-tight">
            Overview Dashboard
          </h1>
          <p className="text-gray-500 mt-1">
            Quick snapshot of your organization
          </p>
        </div>

        <div className="flex items-center gap-3 flex-wrap">
          <span className="text-xs text-blue-600 flex items-center gap-1 font-medium">
            <Loader2 className="h-3 w-3 animate-spin" />
            Live Data Streaming...
          </span>
        </div>
      </div>

      <Separator />

      {/* KPI Cards Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        {/* Card 1 - Total Branches */}
        <SimulatedKPICard
          title="Total Branches"
          icon={Building2}
          gradient="from-blue-500 to-blue-600"
          badge="Scanning..."
        />

        {/* Card 2 - Total Employees */}
        <SimulatedKPICard
          title="Total Employees"
          icon={Users}
          gradient="from-emerald-500 to-teal-600"
        />

        {/* Card 3 - Monthly Payroll */}
        <SimulatedKPICard
          title="Monthly Payroll"
          icon={IndianRupee}
          gradient="from-amber-500 to-orange-600"
        />

        {/* Card 4 - Manpower Utilization */}
        <SimulatedKPICard
          title="Manpower Utilization"
          icon={TrendingUp}
          gradient="from-violet-500 to-purple-600"
        >
          <div className="mt-3">
             <div className="h-2 w-full bg-slate-100 overflow-hidden rounded-full">
                <div className="h-full bg-violet-500 w-1/2 animate-pulse" style={{ width: '60%' }}></div>
             </div>
          </div>
        </SimulatedKPICard>

        {/* Card 5 - Compliance Status */}
        <SimulatedKPICard
          title="Compliance Status"
          icon={Shield}
          gradient="from-gray-400 to-gray-500"
          badge="Checking..."
        />
      </div>

      {/* Charts Section - 2 Column Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Chart 1 - Branch-wise Employee Count (Top 15) */}
        <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <Building2 className="h-5 w-5 text-gray-500" />
                    Branch Activity
                </h3>
                <div className="h-[300px]">
                    <SimulatedChart type="bar" height={300} color="#3b82f6" />
                </div>
            </CardContent>
        </Card>

        {/* Chart 2 - Gender Distribution */}
        <Card className="border-0 shadow-lg bg-white">
            <CardContent className="p-6">
                <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                    <UserCircle2 className="h-5 w-5 text-gray-500" />
                    Demographics
                </h3>
                <div className="h-[300px]">
                    <SimulatedChart type="pie" height={300} />
                </div>
            </CardContent>
        </Card>
      </div>
      
      {/* Table Skeleton fallback */}
        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
             <div className="h-9 w-9 bg-gray-100 rounded-lg animate-pulse" />
             <div className="h-6 w-40 bg-gray-100 rounded animate-pulse" />
          </div>
          <div className="space-y-3">
             {[1,2,3].map(i => (
                 <div key={i} className="h-12 w-full bg-gray-50 rounded animate-pulse" style={{ opacity: 1 - (i * 0.2) }} />
             ))}
          </div>
        </Card>
    </div>
  );
}
