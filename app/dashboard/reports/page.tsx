'use client';

import { useAuth } from '@/lib/auth-context';
import { DashboardHeader } from '@/components/dashboard-header';
import { DashboardSidebar } from '@/components/dashboard-sidebar';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

export default function ReportsPage() {
  const { user } = useAuth();
  const [selectedReport, setSelectedReport] = useState<string | null>(null);

  const reports = [
    {
      id: 'attendance',
      title: 'Attendance Report',
      description: 'Monthly attendance summary for all team members',
      data: {
        present: 156,
        absent: 12,
        leave: 24,
        percentage: 92,
      },
    },
    {
      id: 'performance',
      title: 'Performance Report',
      description: 'Team performance metrics and KPIs',
      data: {
        target: 100,
        achieved: 95,
        percentage: 95,
      },
    },
    {
      id: 'leaves',
      title: 'Leave Summary',
      description: 'Leave taken and pending requests',
      data: {
        taken: 45,
        pending: 12,
        approved: 156,
      },
    },
    {
      id: 'payroll',
      title: 'Payroll Report',
      description: 'Monthly payroll and salary details',
      data: {
        employees: 127,
        total: '₹45,67,000',
        processed: 125,
      },
    },
  ];

  const attendanceData = [
    { week: 'Week 1', percentage: 94 },
    { week: 'Week 2', percentage: 91 },
    { week: 'Week 3', percentage: 92 },
    { week: 'Week 4', percentage: 93 },
  ];

  const departmentData = [
    { name: 'Sales', percentage: 94 },
    { name: 'Marketing', percentage: 88 },
    { name: 'IT', percentage: 96 },
    { name: 'HR', percentage: 97 },
    { name: 'Finance', percentage: 90 },
  ];

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">Reports</h1>
                <p className="text-gray-600 mt-2">Generate and view reports for your team</p>
              </div>
              <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                Export Data
              </Button>
            </div>

            {/* Quick Report Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {reports.map((report) => (
                <Card
                  key={report.id}
                  className="p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  onClick={() => setSelectedReport(report.id)}
                >
                  <h3 className="font-bold text-gray-900 text-sm mb-2">{report.title}</h3>
                  <p className="text-xs text-gray-600 mb-4">{report.description}</p>
                  <button className="text-indigo-600 hover:text-indigo-700 font-medium text-sm">
                    View →
                  </button>
                </Card>
              ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Attendance Report */}
              <Card className="lg:col-span-2 p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Weekly Attendance</h2>
                <div className="space-y-6">
                  {attendanceData.map((week, idx) => (
                    <div key={idx}>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium text-gray-700">{week.week}</span>
                        <span className="text-sm font-bold text-gray-900">
                          {week.percentage}%
                        </span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div
                          className="bg-green-500 h-2 rounded-full"
                          style={{ width: `${week.percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ))}
                </div>
              </Card>

              {/* Key Metrics */}
              <Card className="p-6">
                <h2 className="text-xl font-bold text-gray-900 mb-6">Key Metrics</h2>
                <div className="space-y-4">
                  <div className="text-center p-4 bg-blue-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Total Employees</p>
                    <p className="text-3xl font-bold text-blue-600 mt-2">127</p>
                  </div>
                  <div className="text-center p-4 bg-green-50 rounded-lg">
                    <p className="text-gray-600 text-sm">Average Attendance</p>
                    <p className="text-3xl font-bold text-green-600 mt-2">92%</p>
                  </div>
                  <div className="text-center p-4 bg-purple-50 rounded-lg">
                    <p className="text-gray-600 text-sm">On Leave Today</p>
                    <p className="text-3xl font-bold text-purple-600 mt-2">8</p>
                  </div>
                </div>
              </Card>
            </div>

            {/* Department Performance */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">Department-wise Attendance</h2>
              <div className="space-y-6">
                {departmentData.map((dept, idx) => (
                  <div key={idx}>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium text-gray-700">{dept.name}</span>
                      <span className="text-sm font-bold text-gray-900">{dept.percentage}%</span>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-3">
                      <div
                        className={`h-3 rounded-full ${
                          dept.percentage >= 95
                            ? 'bg-green-500'
                            : dept.percentage >= 90
                              ? 'bg-yellow-500'
                              : 'bg-red-500'
                        }`}
                        style={{ width: `${dept.percentage}%` }}
                      ></div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>

            {/* Report Details Modal */}
            {selectedReport && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl p-8">
                  <div className="flex items-center justify-between mb-6">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {reports.find((r) => r.id === selectedReport)?.title}
                    </h2>
                    <button
                      onClick={() => setSelectedReport(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4">
                    {Object.entries(reports.find((r) => r.id === selectedReport)?.data || {}).map(
                      ([key, value]) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
                        >
                          <span className="text-gray-600 font-medium capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </span>
                          <span className="text-2xl font-bold text-gray-900">{value}</span>
                        </div>
                      )
                    )}
                  </div>

                  <div className="flex gap-4 mt-8 justify-end">
                    <Button variant="outline" onClick={() => setSelectedReport(null)}>
                      Close
                    </Button>
                    <Button className="bg-indigo-600 hover:bg-indigo-700 text-white">
                      Download Report
                    </Button>
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
