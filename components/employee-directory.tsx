"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
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
import { Textarea } from "@/components/ui/textarea";
import { Plus, Search, Edit2, Trash2, Download } from "lucide-react";

export default function EmployeeDirectory({ company }: { company: string }) {
  const [employees, setEmployees] = useState<any[]>([]);
  const [branches, setBranches] = useState<any[]>([]);
  const [filteredEmployees, setFilteredEmployees] = useState<any[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("all"); // Updated default value
  const [isOpen, setIsOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [companyId, setCompanyId] = useState("");
  const [loading, setLoading] = useState(true);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    gender: "Male",
    salary: "",
    designation: "",
    joinDate: "",
    branchId: "",
  });

  useEffect(() => {
    loadData();
  }, [company]);

  useEffect(() => {
    filterEmployees();
  }, [employees, searchTerm, selectedBranch]);

  const loadData = async () => {
    try {
      setLoading(true);
      const [empRes, branchRes, companyRes] = await Promise.all([
        fetch(`/api/employees?company=${company}`),
        fetch(`/api/branches?company=${company}`),
        fetch(`/api/companies?code=${company}`),
      ]);

      if (empRes.ok) setEmployees(await empRes.json());
      if (branchRes.ok) setBranches(await branchRes.json());
      if (companyRes.ok) {
        const companyData = await companyRes.json();
        setCompanyId(companyData.id);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setLoading(false);
    }
  };

  const filterEmployees = () => {
    let filtered = employees;

    if (selectedBranch !== "all") {
      filtered = filtered.filter((e: any) => e.branch_id === selectedBranch);
    }

    if (searchTerm) {
      filtered = filtered.filter(
        (e: any) =>
          e.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
          e.email.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    setFilteredEmployees(filtered);
  };

  const handleAddEmployee = () => {
    setFormData({
      name: "",
      email: "",
      gender: "Male",
      salary: "",
      designation: "",
      joinDate: "",
      branchId: branches[0]?.id || "",
    });
    setEditingId(null);
    setIsOpen(true);
  };

  const handleEditEmployee = (employee: any) => {
    setFormData({
      name: employee.name,
      email: employee.email,
      gender: employee.gender,
      salary: employee.salary,
      designation: employee.designation,
      joinDate: employee.join_date,
      branchId: employee.branch_id,
    });
    setEditingId(employee.id);
    setIsOpen(true);
  };

  const handleSubmit = async () => {
    if (!formData.name || !formData.email || !formData.branchId) {
      alert("Please fill required fields");
      return;
    }

    try {
      const url = editingId
        ? `/api/employees?id=${editingId}`
        : "/api/employees";
      const method = editingId ? "PATCH" : "POST";
      const payload = editingId
        ? {
            id: editingId,
            ...formData,
            branch_id: formData.branchId,
            join_date: formData.joinDate,
          }
        : {
            companyId,
            ...formData,
            branchId: formData.branchId,
            joinDate: formData.joinDate,
          };

      const response = await fetch(url, {
        method,
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        await loadData();
        setIsOpen(false);
        alert(editingId ? "Employee updated" : "Employee added");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to save employee");
    }
  };

  const handleDeleteEmployee = async (id: string) => {
    if (!confirm("Are you sure?")) return;

    try {
      const response = await fetch(`/api/employees?id=${id}`, {
        method: "DELETE",
      });
      if (response.ok) {
        await loadData();
        alert("Employee deleted");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Failed to delete employee");
    }
  };

  const exportToCSV = () => {
    const headers = [
      "Name",
      "Email",
      "Designation",
      "Salary",
      "Branch",
      "Status",
    ];
    const rows = filteredEmployees.map((e: any) => [
      e.name,
      e.email,
      e.designation,
      e.salary,
      branches.find((b: any) => b.id === e.branch_id)?.name,
      e.status,
    ]);

    const csv = [headers, ...rows].map((r) => r.join(",")).join("\n");
    const element = document.createElement("a");
    element.setAttribute(
      "href",
      "data:text/csv;charset=utf-8," + encodeURIComponent(csv)
    );
    element.setAttribute("download", "employees.csv");
    element.click();
  };

  if (loading) return <Card className="p-8 text-center">Loading...</Card>;

  return (
    <div className="space-y-6">
      <Card className="p-6 bg-white border-0 shadow-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-gray-900">
            Employee Directory
          </h2>
          <div className="flex gap-2">
            <Button
              onClick={handleAddEmployee}
              className="bg-gray-700 hover:bg-gray-800 gap-2"
            >
              <Plus className="h-4 w-4" /> Add Employee
            </Button>
            <Button
              onClick={exportToCSV}
              className="bg-green-600 hover:bg-green-700 gap-2"
              disabled={filteredEmployees.length === 0}
            >
              <Download className="h-4 w-4" /> Export
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search by name or email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 border-gray-200 bg-gray-50"
            />
          </div>

          <Select value={selectedBranch} onValueChange={setSelectedBranch}>
            <SelectTrigger className="border-gray-200 bg-gray-50">
              <SelectValue placeholder="All Branches" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Branches</SelectItem>{" "}
              {/* Updated value */}
              {branches.map((b: any) => (
                <SelectItem key={b.id} value={b.id}>
                  {b.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <div className="text-right text-sm text-gray-600 flex items-center justify-end">
            Total:{" "}
            <span className="font-bold ml-2 text-gray-900">
              {filteredEmployees.length}
            </span>
          </div>
        </div>

        {filteredEmployees.length > 0 ? (
          <div className="overflow-x-auto">
            <Table>
              <TableHeader className="bg-gray-100">
                <TableRow>
                  <TableHead className="text-gray-900 font-semibold">
                    Name
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold">
                    Email
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold">
                    Designation
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold">
                    Branch
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold">
                    Salary
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold">
                    Status
                  </TableHead>
                  <TableHead className="text-gray-900 font-semibold">
                    Actions
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEmployees.map((employee: any) => (
                  <TableRow key={employee.id} className="hover:bg-gray-50">
                    <TableCell className="font-medium">
                      {employee.name}
                    </TableCell>
                    <TableCell>{employee.email}</TableCell>
                    <TableCell>{employee.designation}</TableCell>
                    <TableCell>
                      {
                        branches.find((b: any) => b.id === employee.branch_id)
                          ?.name
                      }
                    </TableCell>
                    <TableCell>₹{employee.salary?.toLocaleString()}</TableCell>
                    <TableCell>
                      <span className="px-2 py-1 bg-green-100 text-green-800 rounded text-sm font-semibold">
                        {employee.status}
                      </span>
                    </TableCell>
                    <TableCell className="space-x-2">
                      <Button
                        onClick={() => handleEditEmployee(employee)}
                        variant="outline"
                        size="sm"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                      <Button
                        onClick={() => handleDeleteEmployee(employee.id)}
                        variant="destructive"
                        size="sm"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-8 text-gray-600">
            No employees found
          </div>
        )}
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent className="bg-white max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-gray-900">
              {editingId ? "Edit Employee" : "Add New Employee"}
            </DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label className="text-gray-900 font-semibold mb-2 block">
                  Name *
                </Label>
                <Input
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className="border-blue-200 bg-blue-50"
                />
              </div>
              <div>
                <Label className="text-blue-900 font-semibold mb-2 block">
                  Email *
                </Label>
                <Input
                  type="email"
                  value={formData.email}
                  onChange={(e) =>
                    setFormData({ ...formData, email: e.target.value })
                  }
                  className="border-blue-200 bg-blue-50"
                />
              </div>
              <div>
                <Label className="text-blue-900 font-semibold mb-2 block">
                  Designation
                </Label>
                <Input
                  value={formData.designation}
                  onChange={(e) =>
                    setFormData({ ...formData, designation: e.target.value })
                  }
                  className="border-blue-200 bg-blue-50"
                />
              </div>
              <div>
                <Label className="text-blue-900 font-semibold mb-2 block">
                  Salary
                </Label>
                <Input
                  type="number"
                  value={formData.salary}
                  onChange={(e) =>
                    setFormData({ ...formData, salary: e.target.value })
                  }
                  className="border-blue-200 bg-blue-50"
                />
              </div>
              <div>
                <Label className="text-blue-900 font-semibold mb-2 block">
                  Gender
                </Label>
                <Select
                  value={formData.gender}
                  onValueChange={(v) => setFormData({ ...formData, gender: v })}
                >
                  <SelectTrigger className="border-blue-200 bg-blue-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Male">Male</SelectItem>
                    <SelectItem value="Female">Female</SelectItem>
                    <SelectItem value="Other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label className="text-blue-900 font-semibold mb-2 block">
                  Branch *
                </Label>
                <Select
                  value={formData.branchId}
                  onValueChange={(v) =>
                    setFormData({ ...formData, branchId: v })
                  }
                >
                  <SelectTrigger className="border-blue-200 bg-blue-50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {branches.map((b: any) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2">
                <Label className="text-blue-900 font-semibold mb-2 block">
                  Join Date
                </Label>
                <Input
                  type="date"
                  value={formData.joinDate}
                  onChange={(e) =>
                    setFormData({ ...formData, joinDate: e.target.value })
                  }
                  className="border-blue-200 bg-blue-50"
                />
              </div>
            </div>

            <div className="flex gap-2 justify-end">
              <Button onClick={() => setIsOpen(false)} variant="outline">
                Cancel
              </Button>
              <Button
                onClick={handleSubmit}
                className="bg-gray-700 hover:bg-gray-800"
              >
                {editingId ? "Update" : "Add"} Employee
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
