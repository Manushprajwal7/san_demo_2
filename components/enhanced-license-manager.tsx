"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
  Plus,
  Edit2,
  Trash2,
  FileText,
  Download,
  Calendar,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Filter,
  RefreshCw,
} from "lucide-react";
import { toast } from "sonner";
import jsPDF from "jspdf";
import "jspdf-autotable";
import * as XLSX from "xlsx";

interface License {
  id: string;
  license_type: string;
  expiry_date: string;
  status: string;
  company_id: string;
  created_at: string;
  updated_at: string;
}

const COLORS = ["#10b981", "#f59e0b", "#ef4444", "#6b7280"];

export default function EnhancedLicenseManager({
  company,
}: {
  company: string;
}) {
  const [licenses, setLicenses] = useState<License[]>([]);
  const [filteredLicenses, setFilteredLicenses] = useState<License[]>([]);
  const [companyId, setCompanyId] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchTerm, setSearchTerm] = useState("");

  const licenseTypes = [
    "PF License",
    "ESIC License",
    "PT License",
    "TDS License",
    "ESI License",
    "DPTA License",
    "Shop Act License",
    "Building License",
    "Trade License",
    "Fire Safety License",
    "Pollution Control License",
    "Labor License",
  ];

  const [formData, setFormData] = useState({
    licenseType: "",
    expiryDate: "",
    status: "Active",
  });

  const [reportData, setReportData] = useState({
    dateRange: "all",
    includeExpired: true,
    includeExpiring: true,
    includeActive: true,
    reportType: "summary",
  });

  useEffect(() => {
    loadData();
  }, [company]);

  useEffect(() => {
    filterLicenses();
  }, [licenses, filterStatus, searchTerm]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [licenseRes, companyRes] = await Promise.all([
        fetch(`/api/licenses?company=${company}`),
        fetch(`/api/companies?code=${company}`),
      ]);

      if (licenseRes.ok) {
        const licenseData = await licenseRes.json();
        setLicenses(licenseData);
      }
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompanyId(companyData.id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
      toast.error("Failed to load license data");
    } finally {
      setLoading(false);
    }
  };

  const filterLicenses = () => {
    let filtered = licenses;

    // Filter by status
    if (filterStatus !== "all") {
      filtered = filtered.filter((license) => license.status === filterStatus);
    }

    // Filter by search term
    if (searchTerm) {
      filtered = filtered.filter((license) =>
        license.license_type.toLowerCase().includes(searchTerm.toLowerCase()),
      );
    }

    setFilteredLicenses(filtered);
  };

  const handleAddLicense = () => {
    setFormData({ licenseType: "", expiryDate: "", status: "Active" });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleEditLicense = (license: License) => {
    setFormData({
      licenseType: license.license_type,
      expiryDate: license.expiry_date,
      status: license.status,
    });
    setEditingId(license.id);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.licenseType || !formData.expiryDate) {
      toast.error("Please fill all required fields");
      return;
    }

    try {
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId
        ? {
            id: editingId,
            status: formData.status,
            expiryDate: formData.expiryDate,
          }
        : {
            companyId,
            licenseType: formData.licenseType,
            expiryDate: formData.expiryDate,
            status: formData.status,
          };

      const response = await fetch("/api/licenses", {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadData();
        setIsOpen(false);
        toast.success(
          editingId
            ? "License updated successfully"
            : "License added successfully",
        );
      } else {
        toast.error("Failed to save license");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to save license");
    }
  };

  const handleDeleteLicense = async (id: string) => {
    if (!confirm("Are you sure you want to delete this license?")) return;

    try {
      const response = await fetch(`/api/licenses?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadData();
        toast.success("License deleted successfully");
      } else {
        toast.error("Failed to delete license");
      }
    } catch (error) {
      console.error("Error:", error);
      toast.error("Failed to delete license");
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "Active":
        return "bg-green-100 text-green-800 border-green-200";
      case "Expiring Soon":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
      case "Expired":
        return "bg-red-100 text-red-800 border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "Active":
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      case "Expiring Soon":
        return <AlertTriangle className="h-4 w-4 text-yellow-600" />;
      case "Expired":
        return <XCircle className="h-4 w-4 text-red-600" />;
      default:
        return null;
    }
  };

  const getDaysLeft = (expiryDate: string) => {
    const days = Math.floor(
      (new Date(expiryDate).getTime() - new Date().getTime()) /
        (1000 * 60 * 60 * 24),
    );
    return days;
  };

  const getStatusStats = () => {
    const stats = {
      active: licenses.filter((l) => l.status === "Active").length,
      expiring: licenses.filter((l) => l.status === "Expiring Soon").length,
      expired: licenses.filter((l) => l.status === "Expired").length,
      total: licenses.length,
    };
    return stats;
  };

  const getChartData = () => {
    const stats = getStatusStats();
    return [
      { name: "Active", value: stats.active, color: "#10b981" },
      { name: "Expiring Soon", value: stats.expiring, color: "#f59e0b" },
      { name: "Expired", value: stats.expired, color: "#ef4444" },
    ].filter((item) => item.value > 0);
  };

  const exportToPDF = () => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.width;

    // Header
    doc.setFontSize(20);
    doc.setTextColor(40, 40, 40);
    doc.text("License Management Report", pageWidth / 2, 20, {
      align: "center",
    });

    doc.setFontSize(12);
    doc.setTextColor(100, 100, 100);
    doc.text(
      `Generated on: ${new Date().toLocaleDateString()}`,
      pageWidth / 2,
      30,
      { align: "center" },
    );
    doc.text(`Company: ${company.toUpperCase()}`, pageWidth / 2, 40, {
      align: "center",
    });

    // Summary Statistics
    const stats = getStatusStats();
    doc.setFontSize(14);
    doc.setTextColor(40, 40, 40);
    doc.text("Summary Statistics", 20, 60);

    doc.setFontSize(10);
    doc.text(`Total Licenses: ${stats.total}`, 20, 75);
    doc.text(`Active: ${stats.active}`, 20, 85);
    doc.text(`Expiring Soon: ${stats.expiring}`, 20, 95);
    doc.text(`Expired: ${stats.expired}`, 20, 105);

    // License Table
    const tableData = filteredLicenses.map((license) => [
      license.license_type,
      new Date(license.expiry_date).toLocaleDateString(),
      license.status,
      getDaysLeft(license.expiry_date) > 0
        ? `${getDaysLeft(license.expiry_date)} days`
        : "Expired",
    ]);

    (doc as any).autoTable({
      head: [["License Type", "Expiry Date", "Status", "Days Left"]],
      body: tableData,
      startY: 120,
      styles: { fontSize: 9 },
      headStyles: { fillColor: [59, 130, 246] },
      alternateRowStyles: { fillColor: [248, 250, 252] },
    });

    doc.save(`license-report-${new Date().toISOString().split("T")[0]}.pdf`);
    toast.success("PDF report generated successfully");
  };

  const exportToExcel = () => {
    const exportData = filteredLicenses.map((license) => ({
      "License Type": license.license_type,
      "Expiry Date": new Date(license.expiry_date).toLocaleDateString(),
      Status: license.status,
      "Days Left":
        getDaysLeft(license.expiry_date) > 0
          ? getDaysLeft(license.expiry_date)
          : "Expired",
      "Created Date": new Date(license.created_at).toLocaleDateString(),
      "Last Updated": new Date(license.updated_at).toLocaleDateString(),
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Licenses");

    // Add summary sheet
    const stats = getStatusStats();
    const summaryData = [
      { Metric: "Total Licenses", Value: stats.total },
      { Metric: "Active Licenses", Value: stats.active },
      { Metric: "Expiring Soon", Value: stats.expiring },
      { Metric: "Expired Licenses", Value: stats.expired },
    ];

    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    XLSX.writeFile(
      wb,
      `license-report-${new Date().toISOString().split("T")[0]}.xlsx`,
    );
    toast.success("Excel report generated successfully");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="flex items-center gap-3 text-blue-600">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="text-lg font-medium">Loading license data...</span>
        </div>
      </div>
    );
  }

  const stats = getStatusStats();
  const chartData = getChartData();

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500 rounded-lg">
              <FileText className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-blue-900">{stats.total}</p>
              <p className="text-sm text-blue-700">Total Licenses</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-green-500 rounded-lg">
              <CheckCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-green-900">
                {stats.active}
              </p>
              <p className="text-sm text-green-700">Active</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-yellow-500 rounded-lg">
              <AlertTriangle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-yellow-900">
                {stats.expiring}
              </p>
              <p className="text-sm text-yellow-700">Expiring Soon</p>
            </div>
          </div>
        </Card>

        <Card className="p-4 bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-red-500 rounded-lg">
              <XCircle className="h-5 w-5 text-white" />
            </div>
            <div>
              <p className="text-2xl font-bold text-red-900">{stats.expired}</p>
              <p className="text-sm text-red-700">Expired</p>
            </div>
          </div>
        </Card>
      </div>

      {/* Charts */}
      {chartData.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="p-6 bg-white border-0 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              License Status Distribution
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <PieChart>
                <Pie
                  data={chartData}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, value }) => `${name}: ${value}`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </Card>

          <Card className="p-6 bg-white border-0 shadow-lg">
            <h3 className="text-lg font-bold text-gray-900 mb-4">
              License Status Overview
            </h3>
            <ResponsiveContainer width="100%" height={250}>
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
        </div>
      )}

      {/* Main License Management */}
      <Card className="p-6 bg-white border-0 shadow-lg">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">
              License Management
            </h2>
            <p className="text-gray-600">
              Manage and track all your business licenses
            </p>
          </div>
          <div className="flex gap-2">
            <Button
              onClick={() => setIsReportOpen(true)}
              variant="outline"
              className="gap-2"
            >
              <FileText className="h-4 w-4" />
              Generate Report
            </Button>
            <Button
              onClick={handleAddLicense}
              className="bg-blue-600 hover:bg-blue-700 gap-2"
            >
              <Plus className="h-4 w-4" />
              Add License
            </Button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="flex-1">
            <Input
              placeholder="Search licenses..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="max-w-sm"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="Active">Active</SelectItem>
              <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
              <SelectItem value="Expired">Expired</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={loadData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>

        {/* License Table */}
        {filteredLicenses.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow className="bg-gray-50">
                  <TableHead className="font-semibold">License Type</TableHead>
                  <TableHead className="font-semibold">Expiry Date</TableHead>
                  <TableHead className="font-semibold">Status</TableHead>
                  <TableHead className="font-semibold">Days Left</TableHead>
                  <TableHead className="font-semibold">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredLicenses.map((license) => {
                  const daysLeft = getDaysLeft(license.expiry_date);
                  return (
                    <TableRow key={license.id} className="hover:bg-gray-50">
                      <TableCell className="font-medium">
                        {license.license_type}
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {new Date(license.expiry_date).toLocaleDateString()}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          className={`${getStatusColor(license.status)} flex items-center gap-1 w-fit`}
                        >
                          {getStatusIcon(license.status)}
                          {license.status}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span
                          className={`font-semibold ${daysLeft < 0 ? "text-red-600" : daysLeft < 30 ? "text-yellow-600" : "text-green-600"}`}
                        >
                          {daysLeft > 0 ? `${daysLeft} days` : "Expired"}
                        </span>
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-2">
                          <Button
                            onClick={() => handleEditLicense(license)}
                            variant="outline"
                            size="sm"
                          >
                            <Edit2 className="h-4 w-4" />
                          </Button>
                          <Button
                            onClick={() => handleDeleteLicense(license.id)}
                            variant="destructive"
                            size="sm"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-12">
            <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              No licenses found
            </h3>
            <p className="text-gray-600 mb-4">
              {searchTerm || filterStatus !== "all"
                ? "No licenses match your current filters"
                : "Get started by adding your first license"}
            </p>
            {!searchTerm && filterStatus === "all" && (
              <Button
                onClick={handleAddLicense}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Your First License
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Add/Edit License Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingId ? "Edit License" : "Add New License"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 font-medium mb-2 block">
                License Type *
              </Label>
              <Select
                value={formData.licenseType}
                onValueChange={(v) =>
                  setFormData({ ...formData, licenseType: v })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select license type" />
                </SelectTrigger>
                <SelectContent>
                  {licenseTypes.map((type) => (
                    <SelectItem key={type} value={type}>
                      {type}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">
                Expiry Date *
              </Label>
              <Input
                type="date"
                value={formData.expiryDate}
                onChange={(e) =>
                  setFormData({ ...formData, expiryDate: e.target.value })
                }
              />
            </div>

            <div>
              <Label className="text-gray-700 font-medium mb-2 block">
                Status
              </Label>
              <Select
                value={formData.status}
                onValueChange={(v) => setFormData({ ...formData, status: v })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Active">Active</SelectItem>
                  <SelectItem value="Expiring Soon">Expiring Soon</SelectItem>
                  <SelectItem value="Expired">Expired</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {editingId ? "Update" : "Add"} License
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Report Generation Dialog */}
      <Dialog open={isReportOpen} onOpenChange={setIsReportOpen}>
        <DialogContent className="bg-white max-w-md">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              Generate License Report
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label className="text-gray-700 font-medium mb-2 block">
                Export Format
              </Label>
              <div className="flex gap-2">
                <Button
                  onClick={exportToPDF}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                >
                  <FileText className="h-4 w-4 mr-2" />
                  PDF Report
                </Button>
                <Button
                  onClick={exportToExcel}
                  className="flex-1 bg-green-600 hover:bg-green-700"
                >
                  <Download className="h-4 w-4 mr-2" />
                  Excel Report
                </Button>
              </div>
            </div>

            <div className="text-sm text-gray-600 bg-gray-50 p-3 rounded-lg">
              <p className="font-medium mb-1">Report will include:</p>
              <ul className="list-disc list-inside space-y-1">
                <li>License summary statistics</li>
                <li>Detailed license information</li>
                <li>Expiry dates and status</li>
                <li>Days remaining for each license</li>
              </ul>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button onClick={() => setIsReportOpen(false)} variant="outline">
                Cancel
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
