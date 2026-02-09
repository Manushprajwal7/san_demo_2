"use client";

import { useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Building2,
    Search,
    Download,
    ArrowLeft,
    RefreshCw,
    CheckCircle2,
    AlertTriangle,
    Clock,
    Loader2,
    Filter,
} from "lucide-react";
import { DashboardHeader } from "@/components/dashboard-header";
import Link from "next/link";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

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
    branch_summary: BranchOverview[];
    total_branches: number;
    last_updated: string;
}

// License badge helper
function getLicenseBadge(status: "active" | "warning" | "expired") {
    switch (status) {
        case "active":
            return (
                <Badge className="bg-green-100 text-green-700 border-green-200 gap-1">
                    <CheckCircle2 className="h-3 w-3" /> Active
                </Badge>
            );
        case "warning":
            return (
                <Badge className="bg-yellow-100 text-yellow-700 border-yellow-200 gap-1">
                    <AlertTriangle className="h-3 w-3" /> Expiring
                </Badge>
            );
        case "expired":
            return (
                <Badge className="bg-red-100 text-red-700 border-red-200 gap-1">
                    <Clock className="h-3 w-3" /> Expired
                </Badge>
            );
    }
}

export default function BranchSummaryPage() {
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [utilizationFilter, setUtilizationFilter] = useState<string>("all");

    // Fetch data
    const { data, isLoading, error, refetch, isFetching } = useQuery<OverviewData>({
        queryKey: ["branch-summary"],
        queryFn: async () => {
            const response = await fetch("/api/dashboard-overview");
            if (!response.ok) throw new Error("Failed to fetch data");
            return response.json();
        },
        staleTime: 5 * 60 * 1000,
        refetchOnWindowFocus: false,
    });

    // Filter branches
    const filteredBranches = useMemo(() => {
        if (!data?.branch_summary) return [];

        return data.branch_summary.filter((branch) => {
            // Search filter
            const matchesSearch = branch.name.toLowerCase().includes(searchTerm.toLowerCase());

            // Status filter
            const matchesStatus = statusFilter === "all" || branch.license_status === statusFilter;

            // Utilization filter
            let matchesUtilization = true;
            if (utilizationFilter === "high") {
                matchesUtilization = branch.utilization >= 80;
            } else if (utilizationFilter === "medium") {
                matchesUtilization = branch.utilization >= 50 && branch.utilization < 80;
            } else if (utilizationFilter === "low") {
                matchesUtilization = branch.utilization < 50;
            }

            return matchesSearch && matchesStatus && matchesUtilization;
        });
    }, [data?.branch_summary, searchTerm, statusFilter, utilizationFilter]);

    // Export to Excel
    const exportToExcel = () => {
        if (!filteredBranches.length) return;

        const excelData = filteredBranches.map((branch) => ({
            "Branch Name": branch.name,
            "Approved Manpower": branch.approved_manpower,
            "Current Employees": branch.current_employees,
            "Utilization (%)": branch.utilization,
            "License Status": branch.license_status,
            "License Expiry": branch.license_expiry || "N/A",
        }));

        const ws = XLSX.utils.json_to_sheet(excelData);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "Branch Summary");
        XLSX.writeFile(wb, `branch-summary-${new Date().toISOString().split("T")[0]}.xlsx`);
    };

    // Export to PDF
    const exportToPDF = () => {
        if (!filteredBranches.length) return;

        const doc = new jsPDF();

        doc.setFontSize(20);
        doc.text("Branch Summary Report", 14, 20);
        doc.setFontSize(10);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
        doc.text(`Total Branches: ${filteredBranches.length}`, 14, 34);

        const tableData = filteredBranches.map((branch) => [
            branch.name,
            branch.approved_manpower.toString(),
            branch.current_employees.toString(),
            `${branch.utilization}%`,
            branch.license_status,
        ]);

        autoTable(doc, {
            startY: 45,
            head: [["Branch", "Approved", "Current", "Utilization", "License Status"]],
            body: tableData,
        });

        doc.save(`branch-summary-${new Date().toISOString().split("T")[0]}.pdf`);
    };

    if (isLoading) {
        return (
            <div className="flex-1 flex flex-col">
                <DashboardHeader />
                <main className="p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        <div className="flex items-center justify-center py-20">
                            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
                            <span className="ml-3 text-lg text-gray-600">Loading branch data...</span>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    if (error) {
        return (
            <div className="flex-1 flex flex-col">
                <DashboardHeader />
                <main className="p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
                    <div className="max-w-7xl mx-auto">
                        <div className="text-center py-20">
                            <p className="text-red-500 text-lg">Failed to load branch data</p>
                            <Button onClick={() => refetch()} className="mt-4">
                                Try Again
                            </Button>
                        </div>
                    </div>
                </main>
            </div>
        );
    }

    return (
        <div className="flex-1 flex flex-col">
            <DashboardHeader />
            <main className="p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
                <div className="max-w-7xl mx-auto space-y-6">
                    {/* Header */}
                    <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                        <div className="flex items-center gap-4">
                            <Link href="/dashboard">
                                <Button variant="outline" size="icon">
                                    <ArrowLeft className="h-4 w-4" />
                                </Button>
                            </Link>
                            <div>
                                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                                    <Building2 className="h-7 w-7 text-blue-600" />
                                    Branch Summary
                                </h1>
                                <p className="text-gray-500 text-sm mt-1">
                                    Complete overview of all {data?.total_branches || 0} branches
                                </p>
                            </div>
                        </div>

                        <div className="flex items-center gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => refetch()}
                                disabled={isFetching}
                            >
                                <RefreshCw className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`} />
                                Refresh
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportToExcel}>
                                <Download className="h-4 w-4 mr-2" />
                                Excel
                            </Button>
                            <Button variant="outline" size="sm" onClick={exportToPDF}>
                                <Download className="h-4 w-4 mr-2" />
                                PDF
                            </Button>
                        </div>
                    </div>

                    {/* Filters */}
                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                        <CardContent className="pt-6">
                            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                                <div className="relative">
                                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                                    <Input
                                        placeholder="Search branches..."
                                        value={searchTerm}
                                        onChange={(e) => setSearchTerm(e.target.value)}
                                        className="pl-10"
                                    />
                                </div>

                                <Select value={statusFilter} onValueChange={setStatusFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="License Status" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Statuses</SelectItem>
                                        <SelectItem value="active">Active</SelectItem>
                                        <SelectItem value="warning">Expiring Soon</SelectItem>
                                        <SelectItem value="expired">Expired</SelectItem>
                                    </SelectContent>
                                </Select>

                                <Select value={utilizationFilter} onValueChange={setUtilizationFilter}>
                                    <SelectTrigger>
                                        <SelectValue placeholder="Utilization" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="all">All Utilization</SelectItem>
                                        <SelectItem value="high">High (≥80%)</SelectItem>
                                        <SelectItem value="medium">Medium (50-79%)</SelectItem>
                                        <SelectItem value="low">Low (&lt;50%)</SelectItem>
                                    </SelectContent>
                                </Select>

                                <div className="flex items-center text-sm text-gray-600">
                                    <Filter className="h-4 w-4 mr-2" />
                                    Showing {filteredBranches.length} of {data?.branch_summary?.length || 0} branches
                                </div>
                            </div>
                        </CardContent>
                    </Card>

                    {/* Table */}
                    <Card className="bg-white/80 backdrop-blur-sm shadow-lg border-0">
                        <CardHeader className="pb-3 border-b">
                            <CardTitle className="text-lg flex items-center gap-2">
                                <Building2 className="h-5 w-5 text-blue-600" />
                                All Branches
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-4">
                            {filteredBranches.length > 0 ? (
                                <div className="overflow-x-auto">
                                    <Table>
                                        <TableHeader>
                                            <TableRow className="bg-gray-50/80">
                                                <TableHead className="font-semibold">#</TableHead>
                                                <TableHead className="font-semibold">Branch</TableHead>
                                                <TableHead className="font-semibold text-center">Approved</TableHead>
                                                <TableHead className="font-semibold text-center">Current</TableHead>
                                                <TableHead className="font-semibold">Utilization</TableHead>
                                                <TableHead className="font-semibold text-center">License Status</TableHead>
                                                <TableHead className="font-semibold text-center">License Expiry</TableHead>
                                            </TableRow>
                                        </TableHeader>
                                        <TableBody>
                                            {filteredBranches.map((branch, index) => (
                                                <TableRow
                                                    key={branch.id}
                                                    className="hover:bg-blue-50/50 transition-colors"
                                                >
                                                    <TableCell className="text-gray-500">{index + 1}</TableCell>
                                                    <TableCell className="font-medium">{branch.name}</TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge variant="outline">{branch.approved_manpower}</Badge>
                                                    </TableCell>
                                                    <TableCell className="text-center">
                                                        <Badge
                                                            variant={branch.current_employees > 0 ? "default" : "secondary"}
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
                                                    <TableCell className="text-center text-sm text-gray-500">
                                                        {branch.license_expiry || "-"}
                                                    </TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                    </Table>
                                </div>
                            ) : (
                                <div className="py-12 text-center text-gray-500">
                                    <Building2 className="h-12 w-12 mx-auto mb-3 text-gray-300" />
                                    <p>No branches found matching your filters</p>
                                </div>
                            )}
                        </CardContent>
                    </Card>

                    {/* Footer */}
                    {data?.last_updated && (
                        <div className="text-center text-xs text-gray-400 pb-4">
                            Last updated: {new Date(data.last_updated).toLocaleString()}
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
}
