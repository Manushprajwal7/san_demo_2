"use client";

import React from "react";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface LeaveRequest {
  id: string;
  type: string;
  fromDate: string;
  toDate: string;
  days: number;
  reason: string;
  status: "pending" | "approved" | "rejected";
  appliedOn: string;
}

export default function LeaveManagementPage() {
  const { user } = useAuth();
  const [showForm, setShowForm] = useState(false);
  const [formData, setFormData] = useState({
    type: "casual",
    fromDate: "",
    toDate: "",
    reason: "",
  });

  const [leaveRequests] = useState<LeaveRequest[]>([
    {
      id: "LR001",
      type: "Casual Leave",
      fromDate: "2024-02-15",
      toDate: "2024-02-16",
      days: 2,
      reason: "Personal work",
      status: "approved",
      appliedOn: "2024-02-10",
    },
    {
      id: "LR002",
      type: "Sick Leave",
      fromDate: "2024-01-20",
      toDate: "2024-01-20",
      days: 1,
      reason: "Medical appointment",
      status: "approved",
      appliedOn: "2024-01-18",
    },
    {
      id: "LR003",
      type: "Earned Leave",
      fromDate: "2024-03-10",
      toDate: "2024-03-17",
      days: 5,
      reason: "Vacation",
      status: "pending",
      appliedOn: "2024-03-01",
    },
  ]);

  const leaveBalance = {
    casual: 8,
    sick: 10,
    earned: 12,
    other: 5,
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // In a real app, this would save to the database
    setShowForm(false);
    setFormData({ type: "casual", fromDate: "", toDate: "", reason: "" });
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-50 border-l-4 border-green-500 text-green-900";
      case "rejected":
        return "bg-red-50 border-l-4 border-red-500 text-red-900";
      case "pending":
        return "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900";
      default:
        return "bg-gray-50 border-l-4 border-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      case "pending":
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
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900">
                  Leave Management
                </h1>
                <p className="text-gray-600 mt-2">
                  Manage your leaves and view leave history
                </p>
              </div>
              <Button
                onClick={() => setShowForm(!showForm)}
                className="bg-gray-700 hover:bg-gray-800 text-white"
              >
                {showForm ? "Cancel" : "Apply for Leave"}
              </Button>
            </div>

            {/* Leave Balance Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">
                  Casual Leave
                </p>
                <p className="text-3xl font-bold text-gray-600 mt-2">
                  {leaveBalance.casual}
                </p>
                <p className="text-xs text-gray-500 mt-2">days remaining</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">Sick Leave</p>
                <p className="text-3xl font-bold text-green-600 mt-2">
                  {leaveBalance.sick}
                </p>
                <p className="text-xs text-gray-500 mt-2">days remaining</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">
                  Earned Leave
                </p>
                <p className="text-3xl font-bold text-gray-600 mt-2">
                  {leaveBalance.earned}
                </p>
                <p className="text-xs text-gray-500 mt-2">days remaining</p>
              </Card>
              <Card className="p-6">
                <p className="text-gray-600 text-sm font-medium">
                  Other Leaves
                </p>
                <p className="text-3xl font-bold text-purple-600 mt-2">
                  {leaveBalance.other}
                </p>
                <p className="text-xs text-gray-500 mt-2">days remaining</p>
              </Card>
            </div>

            {/* Application Form */}
            {showForm && (
              <Card className="p-8 bg-gray-50 border-l-4 border-gray-500">
                <h2 className="text-xl font-bold text-gray-900 mb-6">
                  Apply for Leave
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Leave Type
                      </label>
                      <select
                        name="type"
                        value={formData.type}
                        onChange={handleChange}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      >
                        <option value="casual">Casual Leave</option>
                        <option value="sick">Sick Leave</option>
                        <option value="earned">Earned Leave</option>
                        <option value="maternity">Maternity Leave</option>
                        <option value="other">Other</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Number of Days
                      </label>
                      <input
                        type="number"
                        value={
                          formData.fromDate && formData.toDate
                            ? Math.ceil(
                                (new Date(formData.toDate).getTime() -
                                  new Date(formData.fromDate).getTime()) /
                                  (1000 * 60 * 60 * 24)
                              ) + 1
                            : 0
                        }
                        disabled
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        From Date
                      </label>
                      <input
                        type="date"
                        name="fromDate"
                        value={formData.fromDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        To Date
                      </label>
                      <input
                        type="date"
                        name="toDate"
                        value={formData.toDate}
                        onChange={handleChange}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">
                      Reason for Leave
                    </label>
                    <textarea
                      name="reason"
                      value={formData.reason}
                      onChange={handleChange}
                      required
                      rows={3}
                      className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      placeholder="Please provide a reason for your leave request"
                    />
                  </div>

                  <div className="flex gap-4 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      type="submit"
                      className="bg-gray-700 hover:bg-gray-800 text-white"
                    >
                      Submit Request
                    </Button>
                  </div>
                </form>
              </Card>
            )}

            {/* Leave History */}
            <Card className="p-6">
              <h2 className="text-xl font-bold text-gray-900 mb-6">
                Leave History
              </h2>
              <div className="space-y-4">
                {leaveRequests.map((request) => (
                  <div
                    key={request.id}
                    className={`p-6 rounded-lg ${getStatusColor(
                      request.status
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-3">
                          <h3 className="font-bold text-lg">{request.type}</h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                              request.status
                            )}`}
                          >
                            {request.status.charAt(0).toUpperCase() +
                              request.status.slice(1)}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <p className="text-gray-600">Duration</p>
                            <p className="font-medium">
                              {request.fromDate} to {request.toDate}
                            </p>
                          </div>
                          <div>
                            <p className="text-gray-600">Days</p>
                            <p className="font-medium">{request.days} days</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Reason</p>
                            <p className="font-medium">{request.reason}</p>
                          </div>
                          <div>
                            <p className="text-gray-600">Applied On</p>
                            <p className="font-medium">{request.appliedOn}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </main>
      </div>
    </div>
  );
}
