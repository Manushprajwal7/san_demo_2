"use client";

import { memo, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";
import { SimulatedDashboard } from "./simulated-dashboard";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from "@/components/ui/command";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
} from "recharts";
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
    Calendar,
    UserCircle2,
    ChevronRight,
    ExternalLink,
    MapPin,
    Check,
    ChevronsUpDown,
} from "lucide-react";

// Types
interface BranchOverview {
    id: string;
    name: string;
    approved_manpower: number;
    current_employees: number;
    utilization: number;
    license_status: "active" | "warning" | "expired";
    license_expiry?: string;
}

interface OverviewData {
    total_branches: number;
    active_branches: number;
    total_employees: number;
    male_count: number;
    female_count: number;
    monthly_payroll: number;
    employer_contributions: number;
    approved_manpower: number;
    current_manpower: number;
    manpower_utilization: number;
    compliance_status: "all_active" | "warning" | "critical";
    licenses_expiring_soon: number;
    branch_employee_data: { branch: string; employees: number }[];
    gender_distribution: { name: string; value: number; color: string }[];
    payroll_breakdown: { category: string; amount: number }[];
    branch_summary: BranchOverview[];
    last_updated: string;
}

// Month options for filter
const MONTHS = [
    { value: "01", label: "January" },
    { value: "02", label: "February" },
    { value: "03", label: "March" },
    { value: "04", label: "April" },
    { value: "05", label: "May" },
    { value: "06", label: "June" },
    { value: "07", label: "July" },
    { value: "08", label: "August" },
    { value: "09", label: "September" },
    { value: "10", label: "October" },
    { value: "11", label: "November" },
    { value: "12", label: "December" },
];

// Format currency in Indian format
const formatCurrency = (amount: number): string => {
    if (amount >= 10000000) {
        return `₹${(amount / 10000000).toFixed(2)} Cr`;
    } else if (amount >= 100000) {
        return `₹${(amount / 100000).toFixed(2)} L`;
    } else if (amount >= 1000) {
        return `₹${(amount / 1000).toFixed(1)}K`;
    }
    return `₹${amount.toLocaleString("en-IN")}`;
};

// Memoized KPI Card Component
const KPICard = memo(
    ({
        title,
        value,
        subtitle,
        icon: Icon,
        gradient,
        badge,
        badgeVariant,
        children,
    }: {
        title: string;
        value: string | number;
        subtitle?: string;
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
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    {badge && (
                        <Badge
                            variant={badgeVariant || "secondary"}
                            className="text-xs font-medium"
                        >
                            {badge}
                        </Badge>
                    )}
                </div>
                <div className="space-y-1">
                    <p className="text-3xl font-bold text-gray-900 tracking-tight">
                        {value}
                    </p>
                    <p className="text-sm font-medium text-gray-600">{title}</p>
                    {subtitle && (
                        <p className="text-xs text-gray-500 mt-1">{subtitle}</p>
                    )}
                </div>
                {children}
            </CardContent>
        </Card>
    )
);

KPICard.displayName = "KPICard";

// Chart Card Component
const ChartCard = memo(
    ({
        title,
        icon: Icon,
        children,
        className,
    }: {
        title: string;
        icon: React.ElementType;
        children: React.ReactNode;
        className?: string;
    }) => (
        <Card
            className={`border-0 shadow-lg bg-white hover:shadow-xl transition-shadow duration-300 ${className}`}
        >
            <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-3 text-lg">
                    <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-600">
                        <Icon className="h-5 w-5 text-white" />
                    </div>
                    {title}
                </CardTitle>
            </CardHeader>
            <CardContent>{children}</CardContent>
        </Card>
    )
);

ChartCard.displayName = "ChartCard";

// Skeleton Loader
const DashboardSkeleton = memo(() => (
    <div className="space-y-6">
        <div className="flex justify-between items-center">
            <Skeleton className="h-10 w-64" />
            <div className="flex gap-3">
                <Skeleton className="h-10 w-36" />
                <Skeleton className="h-10 w-36" />
            </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
            {Array.from({ length: 5 }).map((_, i) => (
                <Card key={i} className="p-5">
                    <Skeleton className="h-10 w-10 rounded-xl mb-3" />
                    <Skeleton className="h-8 w-20 mb-2" />
                    <Skeleton className="h-4 w-28" />
                </Card>
            ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 2 }).map((_, i) => (
                <Card key={i} className="p-6">
                    <Skeleton className="h-6 w-48 mb-4" />
                    <Skeleton className="h-64 w-full" />
                </Card>
            ))}
        </div>
    </div>
));

DashboardSkeleton.displayName = "DashboardSkeleton";

// Main Dashboard Overview Component
interface DashboardOverviewProps {
    selectedState?: string;
    selectedBranch?: string;
    selectedMonth?: string;
    selectedYear?: string;
}

export default function DashboardOverview({
    selectedState = "all",
    selectedBranch = "all",
    selectedMonth,
    selectedYear,
}: DashboardOverviewProps) {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear().toString();
    const currentMonth = (currentDate.getMonth() + 1).toString().padStart(2, "0");

    // Use props if provided, otherwise default to current (but props are expected)
    const year = selectedYear || currentYear;
    const month = selectedMonth ? selectedMonth.padStart(2, "0") : currentMonth;

    // For now, map single month selection to from/to range for the API
    const fromMonth = month;
    const toMonth = month;

    // Fetch overview data
    const {
        data: overviewData,
        isLoading,
        isFetching,
        error,
        refetch,
    } = useQuery<OverviewData>({
        queryKey: ["dashboardOverview", selectedState, selectedBranch, year, fromMonth, toMonth],
        queryFn: async () => {
            const params = new URLSearchParams({
                state: selectedState,
                branch: selectedBranch,
                year: year,
                fromMonth: fromMonth,
                toMonth: toMonth,
            });
            const response = await fetch(`/api/dashboard-overview?${params.toString()}`);
            if (!response.ok) {
                throw new Error("Failed to fetch dashboard data");
            }
            return response.json();
        },
        staleTime: 2 * 60 * 1000,
        gcTime: 10 * 60 * 1000,
        retry: 2,
        refetchOnWindowFocus: false,
    });

    // Compliance status icon and color

    // Compliance status icon and color
    const getComplianceDisplay = (status: string) => {
        switch (status) {
            case "all_active":
                return {
                    icon: CheckCircle2,
                    text: "All Licenses Active",
                    color: "text-green-600",
                    bg: "bg-green-50",
                    badgeVariant: "default" as const,
                };
            case "warning":
                return {
                    icon: AlertTriangle,
                    text: "Expiring Soon",
                    color: "text-yellow-600",
                    bg: "bg-yellow-50",
                    badgeVariant: "secondary" as const,
                };
            case "critical":
                return {
                    icon: Clock,
                    text: "Action Required",
                    color: "text-red-600",
                    bg: "bg-red-50",
                    badgeVariant: "destructive" as const,
                };
            default:
                return {
                    icon: Shield,
                    text: "Unknown",
                    color: "text-gray-600",
                    bg: "bg-gray-50",
                    badgeVariant: "outline" as const,
                };
        }
    };

    // License status badge
    const getLicenseBadge = (status: "active" | "warning" | "expired") => {
        switch (status) {
            case "active":
                return (
                    <Badge className="bg-green-100 text-green-700 hover:bg-green-100">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Active
                    </Badge>
                );
            case "warning":
                return (
                    <Badge className="bg-yellow-100 text-yellow-700 hover:bg-yellow-100">
                        <AlertTriangle className="h-3 w-3 mr-1" />
                        Expiring
                    </Badge>
                );
            case "expired":
                return (
                    <Badge className="bg-red-100 text-red-700 hover:bg-red-100">
                        <Clock className="h-3 w-3 mr-1" />
                        Expired
                    </Badge>
                );
        }
    };



    // Loading state
    if (isLoading && !overviewData) {
        return <SimulatedDashboard />;
    }

    // Error state
    if (error) {
        return (
            <div className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-red-100 mb-4">
                    <AlertTriangle className="h-10 w-10 text-red-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                    Failed to Load Dashboard
                </h3>
                <p className="text-gray-600 mb-4">Please try again</p>
                <Button onClick={() => refetch()} variant="outline">
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Retry
                </Button>
            </div>
        );
    }

    if (!overviewData) {
        return <DashboardSkeleton />;
    }

    const complianceDisplay = getComplianceDisplay(overviewData.compliance_status);
    const ComplianceIcon = complianceDisplay.icon;

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
                    {isFetching && (
                        <span className="text-xs text-gray-500 flex items-center gap-1">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            Updating...
                        </span>
                    )}

                    <Button
                        onClick={() => refetch()}
                        variant="outline"
                        size="sm"
                        disabled={isFetching}
                        className="bg-white"
                    >
                        <RefreshCw
                            className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
                        />
                        Refresh
                    </Button>
                </div>
            </div>

            <Separator />

            {/* KPI Cards Row */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
                {/* Card 1 - Total Branches */}
                <KPICard
                    title="Total Branches"
                    value={overviewData.total_branches}
                    icon={Building2}
                    gradient="from-blue-500 to-blue-600"
                    badge="🟢 All Operational"
                    badgeVariant="secondary"
                    subtitle={`${overviewData.active_branches} Active`}
                />

                {/* Card 2 - Total Employees */}
                <KPICard
                    title="Total Employees"
                    value={overviewData.total_employees}
                    icon={Users}
                    gradient="from-emerald-500 to-teal-600"
                >
                    <div className="flex items-center gap-3 mt-3 pt-3 border-t border-gray-100">
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-blue-500" />
                            <span className="text-xs text-gray-600">
                                Male: {overviewData.male_count}
                            </span>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <div className="w-2.5 h-2.5 rounded-full bg-pink-500" />
                            <span className="text-xs text-gray-600">
                                Female: {overviewData.female_count}
                            </span>
                        </div>
                    </div>
                </KPICard>

                {/* Card 3 - Monthly Payroll */}
                <KPICard
                    title="Monthly Payroll"
                    value={formatCurrency(overviewData.monthly_payroll)}
                    icon={IndianRupee}
                    gradient="from-amber-500 to-orange-600"
                    subtitle="Employer PF & ESIC included"
                >
                    {overviewData.employer_contributions > 0 && (
                        <p className="text-xs text-gray-500 mt-1">
                            +{formatCurrency(overviewData.employer_contributions)} contributions
                        </p>
                    )}
                </KPICard>

                {/* Card 4 - Manpower Utilization */}
                <KPICard
                    title="Manpower Utilization"
                    value={`${overviewData.manpower_utilization}%`}
                    icon={TrendingUp}
                    gradient="from-violet-500 to-purple-600"
                    subtitle={`${overviewData.approved_manpower} / ${overviewData.current_manpower}`}
                >
                    <div className="mt-3">
                        <Progress
                            value={overviewData.manpower_utilization}
                            className="h-2"
                        />
                    </div>
                </KPICard>

                {/* Card 5 - Compliance Status */}
                <KPICard
                    title="Compliance Status"
                    value={
                        overviewData.compliance_status === "all_active"
                            ? "Active"
                            : overviewData.licenses_expiring_soon
                    }
                    icon={Shield}
                    gradient={
                        overviewData.compliance_status === "all_active"
                            ? "from-green-500 to-emerald-600"
                            : overviewData.compliance_status === "warning"
                                ? "from-yellow-500 to-amber-600"
                                : "from-red-500 to-rose-600"
                    }
                    badge={complianceDisplay.text}
                    badgeVariant={complianceDisplay.badgeVariant}
                >
                    <div className={`flex items-center gap-2 mt-2 p-2 rounded-lg ${complianceDisplay.bg}`}>
                        <ComplianceIcon className={`h-4 w-4 ${complianceDisplay.color}`} />
                        <span className={`text-xs font-medium ${complianceDisplay.color}`}>
                            {overviewData.compliance_status === "all_active"
                                ? "All licenses valid"
                                : `${overviewData.licenses_expiring_soon} license(s) need attention`}
                        </span>
                    </div>
                </KPICard>
            </div>

            {/* Charts Section - 2 Column Grid */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Chart 1 - Branch-wise Employee Count (Top 15) */}
                <ChartCard title="Branch-wise Employee Count (Top 15)" icon={Building2}>
                    {overviewData.branch_employee_data.length > 0 ? (
                        <ResponsiveContainer width="100%" height={320}>
                            <BarChart
                                data={[...overviewData.branch_employee_data]
                                    .sort((a, b) => b.employees - a.employees)
                                    .slice(0, 15)}
                                margin={{ top: 10, right: 30, left: 0, bottom: 60 }}
                            >
                                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                                <XAxis
                                    dataKey="branch"
                                    angle={-35}
                                    textAnchor="end"
                                    height={60}
                                    tick={{ fontSize: 12, fill: "#666" }}
                                />
                                <YAxis
                                    width={45}
                                    tick={{ fontSize: 10, fill: "#666" }}
                                    domain={[0, 'auto']}
                                    allowDataOverflow={false}
                                />
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <Bar
                                    dataKey="employees"
                                    fill="url(#branchGradient)"
                                    radius={[6, 6, 0, 0]}
                                    barSize={40}
                                    maxBarSize={100}
                                />
                                <defs>
                                    <linearGradient id="branchGradient" x1="0" y1="0" x2="0" y2="1">
                                        <stop offset="0%" stopColor="#3b82f6" />
                                        <stop offset="100%" stopColor="#1d4ed8" />
                                    </linearGradient>
                                </defs>
                            </BarChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <Users className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No employee data available</p>
                            </div>
                        </div>
                    )}
                </ChartCard>

                {/* Chart 2 - Gender Distribution */}
                <ChartCard title="Gender Distribution" icon={UserCircle2}>
                    {overviewData.total_employees > 0 ? (
                        <ResponsiveContainer width="100%" height={280}>
                            <PieChart>
                                <Pie
                                    data={overviewData.gender_distribution}
                                    cx="50%"
                                    cy="50%"
                                    innerRadius={60}
                                    outerRadius={100}
                                    paddingAngle={4}
                                    dataKey="value"
                                    label={({ name, percent }) =>
                                        `${name}: ${(percent * 100).toFixed(0)}%`
                                    }
                                    labelLine={{ stroke: "#666", strokeWidth: 1 }}
                                >
                                    {overviewData.gender_distribution.map((entry, index) => (
                                        <Cell key={`cell-${index}`} fill={entry.color} />
                                    ))}
                                </Pie>
                                <Tooltip
                                    contentStyle={{
                                        borderRadius: "8px",
                                        border: "none",
                                        boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
                                    }}
                                />
                                <Legend
                                    verticalAlign="bottom"
                                    height={36}
                                    iconType="circle"
                                />
                            </PieChart>
                        </ResponsiveContainer>
                    ) : (
                        <div className="h-64 flex items-center justify-center text-gray-500">
                            <div className="text-center">
                                <UserCircle2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                <p>No gender data available</p>
                            </div>
                        </div>
                    )}
                </ChartCard>
            </div>

            {/* Bottom Section - Branch Summary Table */}
            <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                <CardHeader className="pb-3 border-b">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                            <div className="p-2 rounded-lg bg-gradient-to-br from-blue-500 to-blue-600">
                                <Building2 className="h-5 w-5 text-white" />
                            </div>
                            <CardTitle className="text-lg">Branch Summary</CardTitle>
                            <Badge variant="secondary" className="ml-2">
                                {overviewData.branch_summary.length} branches
                            </Badge>
                        </div>
                        {overviewData.branch_summary.length > 20 && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => window.location.href = '/dashboard/branch-summary'}
                                className="flex items-center gap-2 hover:bg-blue-50"
                            >
                                Show All
                                <ExternalLink className="h-4 w-4" />
                            </Button>
                        )}
                    </div>
                </CardHeader>
                <CardContent className="pt-4">
                    {overviewData.branch_summary.length > 0 ? (
                        <div className="overflow-x-auto">
                            <Table>
                                <TableHeader>
                                    <TableRow className="bg-gray-50/80">
                                        <TableHead className="font-semibold">Branch</TableHead>
                                        <TableHead className="font-semibold text-center">
                                            Approved
                                        </TableHead>
                                        <TableHead className="font-semibold text-center">
                                            Current
                                        </TableHead>
                                        <TableHead className="font-semibold">Utilization</TableHead>
                                        <TableHead className="font-semibold text-center">
                                            License Status
                                        </TableHead>
                                    </TableRow>
                                </TableHeader>
                                <TableBody>
                                    {overviewData.branch_summary.slice(0, 20).map((branch) => (
                                        <TableRow
                                            key={branch.id}
                                            className="hover:bg-blue-50/50 transition-colors"
                                        >
                                            <TableCell className="font-medium">{branch.name}</TableCell>
                                            <TableCell className="text-center">
                                                <Badge variant="outline">{branch.approved_manpower}</Badge>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                <Badge
                                                    variant={
                                                        branch.current_employees > 0 ? "default" : "secondary"
                                                    }
                                                >
                                                    {branch.current_employees}
                                                </Badge>
                                            </TableCell>
                                            <TableCell>
                                                <div className="flex items-center gap-3 min-w-[140px]">
                                                    <Progress
                                                        value={branch.utilization}
                                                        className="h-2 flex-1"
                                                    />
                                                    <span
                                                        className={`text-sm font-medium min-w-[45px] ${branch.utilization >= 80
                                                            ? "text-green-600"
                                                            : branch.utilization >= 50
                                                                ? "text-yellow-600"
                                                                : "text-red-600"
                                                            }`}
                                                    >
                                                        {branch.utilization}%
                                                    </span>
                                                </div>
                                            </TableCell>
                                            <TableCell className="text-center">
                                                {getLicenseBadge(branch.license_status)}
                                            </TableCell>
                                        </TableRow>
                                    ))}
                                </TableBody>
                            </Table>

                            {/* Show More Button at bottom */}
                            {overviewData.branch_summary.length > 20 && (
                                <div className="mt-4 pt-4 border-t flex items-center justify-center">
                                    <Button
                                        variant="default"
                                        onClick={() => window.location.href = '/dashboard/branch-summary'}
                                        className="flex items-center gap-2 bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700"
                                    >
                                        View All {overviewData.branch_summary.length} Branches
                                        <ChevronRight className="h-4 w-4" />
                                    </Button>
                                </div>
                            )}
                        </div>
                    ) : (
                        <div className="py-12 text-center text-gray-500">
                            <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                            <p>No branch data available</p>
                            <p className="text-sm mt-1">Add branches to see the summary</p>
                        </div>
                    )}
                </CardContent>
            </Card>

            {/* Last Updated Footer */}
            <div className="text-center text-xs text-gray-400 pb-4">
                Last updated: {new Date(overviewData.last_updated).toLocaleString()}
            </div>
        </div>
    );
}
