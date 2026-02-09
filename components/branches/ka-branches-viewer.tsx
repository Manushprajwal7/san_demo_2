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
  Search,
  Users,
  Phone,
  Mail,
  Calendar,
  MapPin,
  Filter,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

interface KABranch {
  id: string;
  branch: string;
  address_i: string;
  phone_no: string;
  email: string;
  asm: string;
  geography: string;
  district: string;
  state_head: string;
  sales_head: string;
  opened_on: string;
  license_no: string;
  license_date: string;
  fee: number;
  approved_manpower: number;
  male: number;
  female: number;
  managing_director: string;
  name_of_the_manager: string;
  designation: string;
  contact_no: string;
  email_id: string;
  date_of_renewal: string;
  renewed_upto: string;
  number_of_years_renewed: number;
  online_login: string;
  user_id: string;
  password: string;
  circle_no: string;
  mobile_number: string;
  slo_officer_name: string;
  address: string;
  manpower_cost: number;
  created_at?: string;
  updated_at?: string;
}

interface KABranchesViewerProps {
  company?: { id: number; name: string; code: string } | null;
}

export default function KABranchesViewer({ company }: KABranchesViewerProps) {
  const [branches, setBranches] = useState<KABranch[]>([]);
  const [allBranches, setAllBranches] = useState<KABranch[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [districtFilter, setDistrictFilter] = useState("all");
  const [geographyFilter, setGeographyFilter] = useState("all");
  const [asmFilter, setAsmFilter] = useState("all");
  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const { toast } = useToast();

  useEffect(() => {
    fetchBranches();
  }, []);

  const fetchBranches = async (page: number = 1, append: boolean = false) => {
    try {
      if (!append) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }

      const offset = (page - 1) * 50;
      const response = await fetch(`/api/employees?table=ka_branches&offset=${offset}&limit=50`);
      if (!response.ok) throw new Error("Failed to fetch branches");
      const data = await response.json();
      
      const newBranches = data.employees || [];
      
      if (append) {
        setBranches(prev => [...prev, ...newBranches]);
        setAllBranches(prev => [...prev, ...newBranches]);
      } else {
        setBranches(newBranches);
        setAllBranches(newBranches);
      }
      
      // Check if there are more branches to load
      setHasMore(newBranches.length === 50);
      setCurrentPage(page);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load branches",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  };

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchBranches(currentPage + 1, true);
    }
  };

  const resetAndFetch = () => {
    setCurrentPage(1);
    setHasMore(true);
    fetchBranches(1, false);
  };

  const toggleRowExpansion = (id: string) => {
    const newExpanded = new Set(expandedRows);
    if (newExpanded.has(id)) {
      newExpanded.delete(id);
    } else {
      newExpanded.add(id);
    }
    setExpandedRows(newExpanded);
  };

  const getUniqueValues = (field: keyof KABranch) => {
    const values = [...new Set(allBranches.map(branch => branch[field]).filter(Boolean))];
    return values.sort();
  };

  // Reset pagination when filters change
  useEffect(() => {
    resetAndFetch();
  }, [searchTerm, districtFilter, geographyFilter, asmFilter]);

  const filteredBranches = branches.filter((branch) => {
    const matchesSearch = 
      branch.branch?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.district?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.asm?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      branch.email?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesDistrict = districtFilter === "all" || branch.district === districtFilter;
    const matchesGeography = geographyFilter === "all" || branch.geography === geographyFilter;
    const matchesAsm = asmFilter === "all" || branch.asm === asmFilter;
    
    return matchesSearch && matchesDistrict && matchesGeography && matchesAsm;
  });

  const exportToPDF = () => {
    const doc = new jsPDF();
    
    // Header
    doc.setFontSize(20);
    doc.text("KA Branches Report", 14, 20);
    doc.setFontSize(10);
    doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 28);
    doc.text(`Total Branches: ${filteredBranches.length}`, 14, 34);

    // Table
    const tableData = filteredBranches.map((branch) => [
      branch.branch || "N/A",
      branch.district || "N/A",
      branch.asm || "N/A",
      branch.approved_manpower?.toString() || "0",
      branch.phone_no || "N/A",
      branch.email || "N/A",
    ]);

    autoTable(doc, {
      startY: 45,
      head: [["Branch", "District", "ASM", "Manpower", "Phone", "Email"]],
      body: tableData,
    });

    doc.save(`ka-branches-${new Date().toISOString().split("T")[0]}.pdf`);

    toast({
      title: "Success",
      description: "PDF report generated successfully",
    });
  };

  const exportToExcel = () => {
    const excelData = filteredBranches.map((branch) => ({
      "Branch Name": branch.branch || "N/A",
      "District": branch.district || "N/A",
      "Geography": branch.geography || "N/A",
      "ASM": branch.asm || "N/A",
      "State Head": branch.state_head || "N/A",
      "Sales Head": branch.sales_head || "N/A",
      "Phone": branch.phone_no || "N/A",
      "Email": branch.email || "N/A",
      "Address": branch.address_i || "N/A",
      "Approved Manpower": branch.approved_manpower || 0,
      "Male": branch.male || 0,
      "Female": branch.female || 0,
      "License No": branch.license_no || "N/A",
      "License Date": branch.license_date || "N/A",
      "Fee": branch.fee || 0,
      "Manager": branch.name_of_the_manager || "N/A",
      "Designation": branch.designation || "N/A",
      "Contact No": branch.contact_no || "N/A",
      "Date of Renewal": branch.date_of_renewal || "N/A",
      "Opened On": branch.opened_on || "N/A",
    }));

    const ws = XLSX.utils.json_to_sheet(excelData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "KA Branches");

    XLSX.writeFile(wb, `ka-branches-${new Date().toISOString().split("T")[0]}.xlsx`);

    toast({
      title: "Success",
      description: "Excel report generated successfully",
    });
  };

  const getStatistics = () => {
    const total = allBranches.length;
    const totalManpower = allBranches.reduce((sum, branch) => sum + (branch.approved_manpower || 0), 0);
    const totalMale = allBranches.reduce((sum, branch) => sum + (branch.male || 0), 0);
    const totalFemale = allBranches.reduce((sum, branch) => sum + (branch.female || 0), 0);
    const activeBranches = allBranches.filter(branch => branch.fee > 0).length;

    return { total, totalManpower, totalMale, totalFemale, activeBranches };
  };

  const stats = getStatistics();

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading branches...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
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
              Active Branches
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-green-900">{stats.activeBranches}</div>
              <Users className="h-8 w-8 text-green-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 border-purple-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-900">
              Total Manpower
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-purple-900">{stats.totalManpower}</div>
              <Users className="h-8 w-8 text-purple-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 border-orange-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-900">
              Male Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-orange-900">{stats.totalMale}</div>
              <Users className="h-8 w-8 text-orange-600" />
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-pink-50 to-pink-100 border-pink-200">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-pink-900">
              Female Employees
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="text-3xl font-bold text-pink-900">{stats.totalFemale}</div>
              <Users className="h-8 w-8 text-pink-600" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions and Filters */}
      <Card>
        <CardHeader>
          <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4">
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              KA Branches Management
            </CardTitle>
            <div className="flex flex-wrap gap-2">
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
          {/* Search and Filters */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search branches..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            
            <Select value={districtFilter} onValueChange={setDistrictFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by district" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Districts</SelectItem>
                {getUniqueValues('district').map((district) => (
                  <SelectItem key={district} value={district}>
                    {district}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={geographyFilter} onValueChange={setGeographyFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by geography" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All Geographies</SelectItem>
                {getUniqueValues('geography').map((geography) => (
                  <SelectItem key={geography} value={geography}>
                    {geography}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={asmFilter} onValueChange={setAsmFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Filter by ASM" />
              </SelectTrigger>
              <SelectContent className="max-h-60">
                <SelectItem value="all">All ASMs</SelectItem>
                {getUniqueValues('asm').map((asm) => (
                  <SelectItem key={asm} value={asm}>
                    {asm}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="flex items-center text-sm text-gray-600">
              <Filter className="h-4 w-4 mr-2" />
              {filteredBranches.length} of {branches.length} branches
            </div>
          </div>

          {filteredBranches.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              No branches found matching your filters
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Branch Name</TableHead>
                    <TableHead>District</TableHead>
                    <TableHead>Geography</TableHead>
                    <TableHead>ASM</TableHead>
                    <TableHead>Manpower</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredBranches.map((branch) => (
                    <TableRow key={branch.id}>
                      <TableCell className="font-medium">
                        <div>
                          <div className="font-semibold">{branch.branch || "N/A"}</div>
                          {branch.opened_on && (
                            <div className="text-xs text-gray-500">
                              Opened: {new Date(branch.opened_on).toLocaleDateString()}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{branch.district || "N/A"}</TableCell>
                      <TableCell>{branch.geography || "N/A"}</TableCell>
                      <TableCell>{branch.asm || "N/A"}</TableCell>
                      <TableCell>
                        <div className="text-sm">
                          <div className="flex items-center gap-1">
                            <Users className="h-4 w-4 text-gray-400" />
                            {branch.approved_manpower || 0}
                          </div>
                          <div className="text-xs text-gray-500">
                            M: {branch.male || 0} | F: {branch.female || 0}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {branch.phone_no && (
                            <div className="flex items-center gap-1 mb-1">
                              <Phone className="h-3 w-3 text-gray-400" />
                              {branch.phone_no}
                            </div>
                          )}
                          {branch.email && (
                            <div className="flex items-center gap-1 text-xs text-gray-600 truncate max-w-[150px]">
                              <Mail className="h-3 w-3 text-gray-400" />
                              {branch.email}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={branch.fee > 0 ? "default" : "secondary"}
                          className={branch.fee > 0 ? "bg-green-100 text-green-800 border-green-200" : ""}
                        >
                          {branch.fee > 0 ? "Active" : "Inactive"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleRowExpansion(branch.id)}
                        >
                          {expandedRows.has(branch.id) ? (
                            <ChevronUp className="h-4 w-4" />
                          ) : (
                            <ChevronDown className="h-4 w-4" />
                          )}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>

              {/* Expanded Details */}
              {expandedRows.size > 0 && (
                <div className="border-t">
                  {Array.from(expandedRows).map((expandedId) => {
                    const branch = branches.find(b => b.id === expandedId);
                    if (!branch) return null;
                    
                    return (
                      <div key={expandedId} className="p-4 bg-gray-50 border-b">
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                          <div>
                            <Label className="font-semibold">Address</Label>
                            <p className="text-gray-600">{branch.address_i || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Manager</Label>
                            <p className="text-gray-600">{branch.name_of_the_manager || "N/A"}</p>
                            <p className="text-gray-500">{branch.designation || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Contact Details</Label>
                            <p className="text-gray-600">{branch.contact_no || "N/A"}</p>
                            <p className="text-gray-600">{branch.email_id || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">License Info</Label>
                            <p className="text-gray-600">No: {branch.license_no || "N/A"}</p>
                            <p className="text-gray-600">Date: {branch.license_date || "N/A"}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Renewal Info</Label>
                            <p className="text-gray-600">Date: {branch.date_of_renewal || "N/A"}</p>
                            <p className="text-gray-600">Years: {branch.number_of_years_renewed || 0}</p>
                          </div>
                          <div>
                            <Label className="font-semibold">Leadership</Label>
                            <p className="text-gray-600">State Head: {branch.state_head || "N/A"}</p>
                            <p className="text-gray-600">Sales Head: {branch.sales_head || "N/A"}</p>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}

              {/* Load More Button */}
              {hasMore && (
                <div className="border-t p-4 text-center">
                  <Button
                    onClick={loadMore}
                    disabled={loadingMore}
                    variant="outline"
                    className="min-w-32"
                  >
                    {loadingMore ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-600 mr-2"></div>
                        Loading...
                      </>
                    ) : (
                      <>
                        <Download className="h-4 w-4 mr-2" />
                        Load More ({branches.length} loaded)
                      </>
                    )}
                  </Button>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
