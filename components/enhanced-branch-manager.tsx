"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Download,
  Plus,
  Edit,
  Trash2,
  CheckCircle,
  AlertCircle,
  XCircle,
  Search,
  Users,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { INDIAN_STATES } from "@/lib/indian-states-data";

interface Branch {
  id: number;
  company_id: number;
  name: string;
  location: string;
  state?: string;
  approved_manpower: number;
  actual_manpower: number;
  total_salary: number;
  created_at?: string;
}

interface EnhancedBranchManagerProps {
  company: { id: number; name: string; code: string } | null;
}

export default function EnhancedBranchManager({
  company,
}: EnhancedBranchManagerProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [existingBranches, setExistingBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [stateFilter, setStateFilter] = useState("all");
  const { toast } = useToast();

  const [formData, setFormData] = useState({
    name: "",
    location: "",
    state: "",
    approvedManpower: "",
  });

  useEffect(() => {
    if (company) {
      fetchBranches();
    }
  }, [company]);

  const fetchBranches = async () => {
    if (!company) return;

    try {
      setLoading(true);
      const response = await fetch(`/api/branches?company=${company.code}`);
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      setBranches(data);
      setExistingBranches(data);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getManpowerUtilization = (branch: Branch) => {
    if (branch.approved_manpower === 0) return 0;
    return Math.round((branch.actual_manpower / branch.approved_manpower) * 100);
  };

  const getUtilizationStatus = (utilization: number) => {
    if (utilization >= 90) return "Fully Utilized";
    if (utilization >= 70) return "Well Utilized";
    if (utilization >= 50) return "Moderately Utilized";
    return "Under Utilized";
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!company) return;

    try {
      const payload = {
        companyId: company.id,
        name: formData.name,
        location: formData.location,
        state: formData.state,
        approvedManpower: parseInt(formData.approvedManpower),
      };

      let response;
      if (editingBranch) {
        response = await fetch("/api/branches", {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            id: editingBranch.id,
            ...payload,
          }),
        });
      } else {
        response = await fetch("/api/branches", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (!response.ok) throw new Error("Failed to save branch");

      toast({
        title: "Success",
        description: `Branch ${editingBranch ? "updated" : "added"} successfully`,
      });

      setIsDialogOpen(false);
      setEditingBranch(null);
      setFormData({ name: "", location: "", state: "", approvedManpower: "" });
      fetchBranches();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to save branch",
        variant: "destructive",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this branch?")) return;

    try {
      const response = await fetch(`/api/branches?id=${id}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to delete branch");

      toast({
        title: "Success",
        description: "Branch deleted successfully",
      });

      fetchBranches();
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete branch",
        variant: "destructive",
      });
    }
  };

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch);
    setFormData({
      name: branch.name,
      location: branch.location,
      state: branch.state || "",
      approvedManpower: branch.approved_manpower.toString(),
    });
    setIsDialogOpen(true);
  };

  const exportToPDF = () => {
    if (!company) return;

    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("Branch Management Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Company: ${company.name}`, 14, 28);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 34);

    // Statistics
    const stats = getStatistics();
    doc.setFontSize(12);
    doc.text("Summary Statistics", 14, 45);
    doc.setFontSize(10);
    doc.text(`Total Branches: ${stats.total}`, 14, 52);
    doc.text(`Well Utilized: ${stats.wellUtilized}`, 14, 58);
    doc.text(`Moderately Utilized: ${stats.moderatelyUtilized}`, 14, 64);
    doc.text(`Under Utilized: ${stats.underUtilized}`, 14, 70);

    // Table
    const tableData = filteredBranches.map((branch) => [
      branch.name,
      branch.location,
      branch.state || "N/A",
      branch.approved_manpower.toString(),
      branch.actual_manpower.toString(),
      `${getManpowerUtilization(branch)}%`,
      getUtilizationStatus(getManpowerUtilization(branch)),
    ]);

    autoTable(doc, {
      startY: 80,
      head: [["Branch Name", "Location", "State", "Approved", "Actual", "Utilization", "Status"]],
      body: tableData,
    });

    doc.save(`branches-${company.code}-${new Date().toISOString().split("T")[0]}.pdf`);

    toast({
      title: "Success",
      description: "PDF report generated successfully",
    });
  };

  const exportToExcel = () => {
    if (!company) return;

    const excelData = filteredBranches.map((branch) => ({
      "Branch Name": branch.name,
      "Location": branch.location,
      "State": branch.state || "N/A",
      "Approved Manpower": branch.approved_manpower,
      "Actual Manpower": branch.actual_manpower,
      "Utilization %": getManpowerUtilization(branch),
      "Status": getUtilizationStatus(getManpowerUtilization(branch)),
      "Total Salary": branch.total_salary,
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Branches");

    // Add summary sheet
    const stats = getStatistics();
    const summaryData = [
      { Metric: "Total Branches", Value: stats.total },
      { Metric: "Well Utilized", Value: stats.wellUtilized },
      { Metric: "Moderately Utilized", Value: stats.moderatelyUtilized },
      { Metric: "Under Utilized", Value: stats.underUtilized },
    ];
    const summaryWs = XLSX.utils.json_to_sheet(summaryData);
    XLSX.utils.book_append_sheet(wb, summaryWs, "Summary");

    XLSX.writeFile(wb, `branches-${company?.code}-${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Success",
      description: "Excel report generated successfully",
    });
  };

  const getStatistics = () => {
    const total = branches.length;
    const wellUtilized = branches.filter((b) => getManpowerUtilization(b) >= 70).length;
    const moderatelyUtilized = branches.filter((b) => {
      const util = getManpowerUtilization(b);
      return util >= 50 && util < 70;
    }).length;
    const underUtilized = branches.filter((b) => getManpowerUtilization(b) < 50).length;

    return { total, wellUtilized, moderatelyUtilized, underUtilized };
  };

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = branch.name
      .toLowerCase()
      .includes(searchTerm.toLowerCase()) ||
      branch.location.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesState =
      stateFilter === "all" || branch.state === stateFilter;
    return matchesSearch && matchesState;
  });

  const stats = getStatistics();

  const getStatusIcon = (utilization: number) => {
    if (utilization >= 90) return <CheckCircle className="h-4 w-4" />;
    if (utilization >= 70) return <CheckCircle className="h-4 w-4" />;
    if (utilization >= 50) return <AlertCircle className="h-4 w-4" />;
    return <XCircle className="h-4 w-4" />;
  };

  const getStatusColor = (utilization: number) => {
    if (utilization >= 90) return "bg-green-100 text-green-800 border-green-200";
    if (utilization >= 70) return "bg-blue-100 text-blue-800 border-blue-200";
    if (utilization >= 50) return "bg-yellow-100 text-yellow-800 border-yellow-200";
    return "bg-red-100 text-red-800 border-red-200";
  };

  const getUtilizationColor = (utilization: number) => {
    if (utilization >= 90) return "text-green-600 font-semibold";
    if (utilization >= 70) return "text-blue-600 font-semibold";
    if (utilization >= 50) return "text-yellow-600 font-semibold";
    return "text-red-600 font-semibold";
  };

  if (!company) {
    return (
      <Card>
        <CardContent className="p-8 text-center">
          <p className="text-gray-500">Please select a company to view branches</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border-blue-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-900">
              Total Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-blue-900">{stats.total}</div>
              <Building2 className="h-8 w-8 text-blue-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 border-green-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-900">
              Well Utilized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-900">{stats.wellUtilized}</div>
              <CheckCircle className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-yellow-50 to-yellow-100 border-yellow-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-yellow-900">
              Moderately Utilized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-yellow-900">
                {stats.moderatelyUtilized}
              </div>
              <AlertCircle className="h-8 w-8 text-yellow-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-50 to-red-100 border-red-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-red-900">
              Under Utilized
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-red-900">{stats.underUtilized}</div>
              <XCircle className="h-8 w-8 text-red-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <CardTitle>Branch Management</CardTitle>
            <div className="flex flex-wrap gap-2">
              <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                <DialogTrigger asChild>
                  <Button
                    onClick={() => {
                      setEditingBranch(null);
                      setFormData({
                        name: "",
                        location: "",
                        state: "",
                        approvedManpower: "",
                      });
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Branch
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>
                      {editingBranch ? "Edit Branch" : "Add New Branch"}
                    </DialogTitle>
                  </DialogHeader>
                  <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                      <Label htmlFor="name">Branch Name</Label>
                      <Input
                        id="name"
                        value={formData.name}
                        onChange={(e) =>
                          setFormData({ ...formData, name: e.target.value })
                        }
                        placeholder="Enter branch name"
                        required
                      />
                    </div>

                    <div>
                      <Label htmlFor="state">State</Label>
                      <Select
                        value={formData.state}
                        onValueChange={(value) =>
                          setFormData({ ...formData, state: value })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select state" />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {INDIAN_STATES.map((state) => (
                            <SelectItem key={state.name} value={state.name}>
                              {state.name}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="location">Location/District</Label>
                      <Select
                        value={formData.location}
                        onValueChange={(value) =>
                          setFormData({ ...formData, location: value })
                        }
                        disabled={!formData.state}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder={formData.state ? "Select district" : "Select state first"} />
                        </SelectTrigger>
                        <SelectContent className="max-h-60">
                          {formData.state &&
                            INDIAN_STATES.find((s) => s.name === formData.state)?.districts.map((district) => (
                              <SelectItem key={district.name} value={district.name}>
                                {district.name}
                              </SelectItem>
                            ))}
                        </SelectContent>
                      </Select>
                    </div>

                    <div>
                      <Label htmlFor="approvedManpower">Approved Manpower</Label>
                      <Input
                        id="approvedManpower"
                        type="number"
                        value={formData.approvedManpower}
                        onChange={(e) =>
                          setFormData({ ...formData, approvedManpower: e.target.value })
                        }
                        placeholder="Enter approved manpower"
                        min="0"
                        required
                      />
                    </div>

                    <div className="flex justify-end gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => setIsDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button type="submit">
                        {editingBranch ? "Update" : "Add"} Branch
                      </Button>
                    </div>
                  </form>
                </DialogContent>
              </Dialog>

              <Button variant="outline" onClick={exportToPDF}>
                <Download className="h-4 w-4 mr-2" />
                Export PDF
              </Button>
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="h-4 w-4 mr-2" />
                Export Excel
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col md:flex-row gap-4 mb-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={stateFilter} onValueChange={setStateFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Filter by state" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All States</SelectItem>
                {INDIAN_STATES.map((state) => (
                  <SelectItem key={state.name} value={state.name}>
                    {state.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {loading ? (
            <div className="text-center py-8">Loading branches...</div>
          ) : filteredBranches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No branches found
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>State</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Actual</TableHead>
                    <TableHead>Utilization</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => {
                    const utilization = getManpowerUtilization(branch);
                    return (
                      <TableRow key={branch.id}>
                        <TableCell className="font-medium">
                          {branch.name}
                        </TableCell>
                        <TableCell>{branch.location}</TableCell>
                        <TableCell>{branch.state || "N/A"}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {branch.approved_manpower}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {branch.actual_manpower}
                          </div>
                        </TableCell>
                        <TableCell>
                          <span className={getUtilizationColor(utilization)}>
                            {utilization}%
                          </span>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant="outline"
                            className={`flex items-center gap-1 w-fit ${getStatusColor(utilization)}`}
                          >
                            {getStatusIcon(utilization)}
                            {getUtilizationStatus(utilization)}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleEdit(branch)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDelete(branch.id)}
                            >
                              <Trash2 className="h-4 w-4 text-red-600" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}