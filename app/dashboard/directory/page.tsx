"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

interface Employee {
  id: string;
  name: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  joinDate: string;
  status: "active" | "inactive" | "on_leave";
  manager?: string;
}

export default function DirectoryPage() {
  const { user } = useAuth();
  const [searchTerm, setSearchTerm] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [selectedEmployee, setSelectedEmployee] = useState<Employee | null>(
    null
  );

  const employees: Employee[] = [
    {
      id: "emp-001",
      name: "Rajesh Kumar",
      email: "employee@sangeetha.com",
      phone: "+91 98765 43210",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2022-01-15",
      status: "active",
      manager: "Priya Sharma",
    },
    {
      id: "mgr-001",
      name: "Priya Sharma",
      email: "manager@sangeetha.com",
      phone: "+91 87654 32109",
      position: "Sales Manager",
      department: "Sales",
      joinDate: "2020-06-01",
      status: "active",
    },
    {
      id: "emp-002",
      name: "Arjun Kumar",
      email: "arjun.kumar@sangeetha.com",
      phone: "+91 97654 32108",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2023-03-15",
      status: "active",
      manager: "Priya Sharma",
    },
    {
      id: "emp-003",
      name: "Sneha Desai",
      email: "sneha.desai@sangeetha.com",
      phone: "+91 96543 21097",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2022-06-01",
      status: "on_leave",
      manager: "Priya Sharma",
    },
    {
      id: "emp-010",
      name: "Neha Sharma",
      email: "neha.sharma@sangeetha.com",
      phone: "+91 95432 10986",
      position: "Marketing Executive",
      department: "Marketing",
      joinDate: "2023-01-10",
      status: "active",
      manager: "Vikram Singh",
    },
    {
      id: "emp-011",
      name: "Rahul Patel",
      email: "rahul.patel@sangeetha.com",
      phone: "+91 94321 09875",
      position: "Software Engineer",
      department: "IT",
      joinDate: "2021-08-20",
      status: "active",
      manager: "Amit Patel",
    },
    {
      id: "hr-001",
      name: "Amit Patel",
      email: "hr@sangeetha.com",
      phone: "+91 93210 98764",
      position: "HR Manager",
      department: "Human Resources",
      joinDate: "2019-03-10",
      status: "active",
    },
    {
      id: "emp-012",
      name: "Sophia Khan",
      email: "sophia.khan@sangeetha.com",
      phone: "+91 92109 87653",
      position: "Finance Officer",
      department: "Finance",
      joinDate: "2020-05-15",
      status: "inactive",
      manager: "Vikram Singh",
    },
  ];

  const departments = ["all", ...new Set(employees.map((e) => e.department))];

  const filteredEmployees = employees.filter((emp) => {
    const matchesSearch =
      emp.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.phone.includes(searchTerm);
    const matchesDept = filterDept === "all" || emp.department === filterDept;
    return matchesSearch && matchesDept;
  });

  const getStatusColor = (status: string) => {
    switch (status) {
      case "active":
        return "bg-green-100 text-green-800";
      case "inactive":
        return "bg-red-100 text-red-800";
      case "on_leave":
        return "bg-yellow-100 text-yellow-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="max-w-7xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Employee Directory
                </h1>
                <p className="text-gray-600 mt-2">
                  Browse and manage all employees
                </p>
              </div>
              <Button className="bg-gray-700 hover:bg-gray-800 text-white">
                Add Employee
              </Button>
            </div>

            {/* Search and Filter */}
            <Card className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Search Employees
                  </label>
                  <Input
                    type="text"
                    placeholder="Search by name, email, or phone..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Filter by Department
                  </label>
                  <select
                    value={filterDept}
                    onChange={(e) => setFilterDept(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                  >
                    {departments.map((dept) => (
                      <option key={dept} value={dept}>
                        {dept.charAt(0).toUpperCase() + dept.slice(1)}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
            </Card>

            {/* Employee Count */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Total Employees",
                  value: employees.length,
                  color: "bg-gray-50",
                },
                {
                  label: "Active",
                  value: employees.filter((e) => e.status === "active").length,
                  color: "bg-green-50",
                },
                {
                  label: "On Leave",
                  value: employees.filter((e) => e.status === "on_leave")
                    .length,
                  color: "bg-yellow-50",
                },
                {
                  label: "Inactive",
                  value: employees.filter((e) => e.status === "inactive")
                    .length,
                  color: "bg-red-50",
                },
              ].map((stat, idx) => (
                <Card key={idx} className={`p-4 ${stat.color}`}>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-3xl font-bold text-gray-900 mt-2">
                    {stat.value}
                  </p>
                </Card>
              ))}
            </div>

            {/* Employees Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredEmployees.map((employee) => (
                <Card
                  key={employee.id}
                  className="p-6 hover:shadow-lg transition-shadow cursor-pointer"
                  onClick={() => setSelectedEmployee(employee)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex-1">
                      <h3 className="font-bold text-gray-900">
                        {employee.name}
                      </h3>
                      <p className="text-sm text-gray-600">
                        {employee.position}
                      </p>
                    </div>
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                        employee.status
                      )}`}
                    >
                      {employee.status === "on_leave"
                        ? "On Leave"
                        : employee.status.charAt(0).toUpperCase() +
                          employee.status.slice(1)}
                    </span>
                  </div>

                  <div className="space-y-2 text-sm text-gray-600">
                    <p>📧 {employee.email}</p>
                    <p>📱 {employee.phone}</p>
                    <p>🏢 {employee.department}</p>
                    <p>📅 Joined {employee.joinDate}</p>
                  </div>
                </Card>
              ))}
            </div>

            {filteredEmployees.length === 0 && (
              <Card className="p-8 text-center">
                <p className="text-gray-600">
                  No employees found matching your criteria.
                </p>
              </Card>
            )}

            {/* Employee Details Modal */}
            {selectedEmployee && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedEmployee.name}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {selectedEmployee.position}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedEmployee(null)}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedEmployee.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Phone</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedEmployee.phone}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedEmployee.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Join Date</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedEmployee.joinDate}
                        </p>
                      </div>
                      {selectedEmployee.manager && (
                        <div>
                          <p className="text-sm text-gray-600">Manager</p>
                          <p className="font-medium text-gray-900 mt-1">
                            {selectedEmployee.manager}
                          </p>
                        </div>
                      )}
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span
                          className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(
                            selectedEmployee.status
                          )}`}
                        >
                          {selectedEmployee.status === "on_leave"
                            ? "On Leave"
                            : selectedEmployee.status.charAt(0).toUpperCase() +
                              selectedEmployee.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedEmployee(null)}
                      >
                        Close
                      </Button>
                      <Button className="bg-gray-700 hover:bg-gray-800 text-white">
                        Edit Employee
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
