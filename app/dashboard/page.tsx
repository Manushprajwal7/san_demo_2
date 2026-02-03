"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { DashboardHeader } from "@/components/dashboard-header";
import { useCompany } from "@/components/company-context";
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

const COLORS = ["#0ea5e9", "#06b6d4", "#10b981", "#f59e0b", "#ef4444"];

export default function DashboardPage() {
  const { company } = useCompany();
  const [dashboardData, setDashboardData] = useState({
    licenses: [],
    branches: [],
    employees: 0,
    maleCount: 0,
    femaleCount: 0,
    totalSalary: 0,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        const response = await fetch(`/api/dashboard?company=${company}`);
        if (response.ok) {
          const data = await response.json();
          setDashboardData(data);
        }
      } catch (error) {
        console.error("Error loading dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [company]);

  const licenseChartData = dashboardData.licenses.map((l: any) => ({
    name: l.license_type,
    status: l.status,
  }));

  const branchData = dashboardData.branches.map((b: any) => ({
    name: b.name,
    approved: b.approved_manpower,
    actual: b.actual_manpower,
  }));

  const genderData = [
    { name: "Male", value: dashboardData.maleCount },
    { name: "Female", value: dashboardData.femaleCount },
  ];

  const licenseStatusCounts = {
    active: dashboardData.licenses.filter((l: any) => l.status === "Active")
      .length,
    expiring: dashboardData.licenses.filter(
      (l: any) => l.status === "Expiring Soon"
    ).length,
    expired: dashboardData.licenses.filter((l: any) => l.status === "Expired")
      .length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8">
        <div className="max-w-7xl mx-auto space-y-6">
          <div className="flex justify-between items-center">
            <h1 className="text-4xl font-bold text-gray-900">HRMS Dashboard</h1>
            <div className="text-sm text-gray-600">
              Company:{" "}
              <span className="font-semibold text-gray-800">
                {company.toUpperCase()}
              </span>
            </div>
          </div>

          {loading ? (
            <Card className="p-8 text-center">Loading...</Card>
          ) : (
            <div className="space-y-6">
              {/* License Status Summary */}
              <Card className="p-6 bg-white border-0 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  License Status Summary
                </h2>
                <div className="grid grid-cols-3 gap-4">
                  <div className="bg-gradient-to-br from-green-50 to-green-100 p-4 rounded-lg border border-green-200">
                    <p className="text-green-600 text-sm font-semibold">
                      Active
                    </p>
                    <p className="text-3xl font-bold text-green-700 mt-2">
                      {licenseStatusCounts.active}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-4 rounded-lg border border-yellow-200">
                    <p className="text-yellow-600 text-sm font-semibold">
                      Expiring Soon
                    </p>
                    <p className="text-3xl font-bold text-yellow-700 mt-2">
                      {licenseStatusCounts.expiring}
                    </p>
                  </div>
                  <div className="bg-gradient-to-br from-red-50 to-red-100 p-4 rounded-lg border border-red-200">
                    <p className="text-red-600 text-sm font-semibold">
                      Expired
                    </p>
                    <p className="text-3xl font-bold text-red-700 mt-2">
                      {licenseStatusCounts.expired}
                    </p>
                  </div>
                </div>
              </Card>

              {/* Branch-wise Summary */}
              <Card className="p-6 bg-white border-0 shadow-md">
                <h2 className="text-2xl font-bold text-gray-900 mb-4">
                  Branch-wise Summary
                </h2>
                <ResponsiveContainer width="100%" height={400}>
                  <BarChart data={branchData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Bar
                      dataKey="approved"
                      fill="#0ea5e9"
                      name="Approved Manpower"
                    />
                    <Bar
                      dataKey="actual"
                      fill="#06b6d4"
                      name="Actual Manpower"
                    />
                  </BarChart>
                </ResponsiveContainer>
              </Card>

              {/* Manpower Summary */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-6 bg-white border-0 shadow-md">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Manpower Summary
                  </h2>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-blue-50 rounded-lg">
                      <span className="text-gray-700 font-semibold">
                        Total Employees
                      </span>
                      <span className="text-2xl font-bold text-blue-600">
                        {dashboardData.employees}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-pink-50 rounded-lg">
                      <span className="text-gray-700 font-semibold">Male</span>
                      <span className="text-2xl font-bold text-pink-600">
                        {dashboardData.maleCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-purple-50 rounded-lg">
                      <span className="text-gray-700 font-semibold">
                        Female
                      </span>
                      <span className="text-2xl font-bold text-purple-600">
                        {dashboardData.femaleCount}
                      </span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-amber-50 rounded-lg">
                      <span className="text-gray-700 font-semibold">
                        Total Salary
                      </span>
                      <span className="text-2xl font-bold text-amber-600">
                        ₹{dashboardData.totalSalary.toLocaleString()}
                      </span>
                    </div>
                  </div>
                </Card>

                <Card className="p-6 bg-white border-0 shadow-md">
                  <h2 className="text-2xl font-bold text-gray-900 mb-4">
                    Gender Distribution
                  </h2>
                  <ResponsiveContainer width="100%" height={250}>
                    <PieChart>
                      <Pie
                        data={genderData}
                        cx="50%"
                        cy="50%"
                        labelLine={false}
                        label={({ name, value }) => `${name}: ${value}`}
                        outerRadius={80}
                        fill="#8884d8"
                        dataKey="value"
                      >
                        {genderData.map((entry, index) => (
                          <Cell
                            key={`cell-${index}`}
                            fill={COLORS[index % COLORS.length]}
                          />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </Card>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
