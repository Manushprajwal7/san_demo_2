"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface Compliance {
  id: string;
  name: string;
  description: string;
  dueDate: string;
  status: "pending" | "submitted" | "approved" | "rejected";
  department: string;
  submittedOn?: string;
  approvedOn?: string;
  notes?: string;
}

export default function CompliancePage() {
  const { user } = useAuth();
  const [complianceList] = useState<Compliance[]>([
    {
      id: "COMP-001",
      name: "Annual Compliance Report",
      description: "Submit annual compliance and audit report",
      dueDate: "2024-03-31",
      status: "submitted",
      department: "Finance",
      submittedOn: "2024-03-25",
      approvedOn: "2024-03-28",
    },
    {
      id: "COMP-002",
      name: "Employee Training Records",
      description: "Update employee training and certification records",
      dueDate: "2024-02-29",
      status: "approved",
      department: "HR",
      submittedOn: "2024-02-20",
      approvedOn: "2024-02-22",
    },
    {
      id: "COMP-003",
      name: "Safety Audit Report",
      description: "Conduct and submit safety audit for all departments",
      dueDate: "2024-03-15",
      status: "pending",
      department: "Operations",
    },
    {
      id: "COMP-004",
      name: "Data Privacy Compliance",
      description: "Submit GDPR and data privacy compliance documentation",
      dueDate: "2024-03-10",
      status: "rejected",
      department: "IT",
      notes:
        "Missing employee consent forms. Please resubmit with complete documentation.",
    },
    {
      id: "COMP-005",
      name: "Statutory Compliance Filing",
      description: "File statutory compliance documents with government",
      dueDate: "2024-04-30",
      status: "pending",
      department: "Legal",
    },
    {
      id: "COMP-006",
      name: "Environmental Compliance",
      description:
        "Submit environmental compliance and waste management report",
      dueDate: "2024-04-15",
      status: "pending",
      department: "Operations",
    },
  ]);

  const [selectedCompliance, setSelectedCompliance] =
    useState<Compliance | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900";
      case "submitted":
        return "bg-gray-50 border-l-4 border-gray-500 text-gray-900";
      case "approved":
        return "bg-green-50 border-l-4 border-green-500 text-green-900";
      case "rejected":
        return "bg-red-50 border-l-4 border-red-500 text-red-900";
      default:
        return "bg-gray-50 border-l-4 border-gray-500";
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-gray-100 text-gray-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const isOverdue = (dueDate: string) => new Date(dueDate) < new Date();

  const getDaysUntilDue = (dueDate: string) => {
    const due = new Date(dueDate);
    const today = new Date();
    const diff = due.getTime() - today.getTime();
    const days = Math.ceil(diff / (1000 * 60 * 60 * 24));
    return days;
  };

  const stats = {
    total: complianceList.length,
    pending: complianceList.filter((c) => c.status === "pending").length,
    approved: complianceList.filter((c) => c.status === "approved").length,
    rejected: complianceList.filter((c) => c.status === "rejected").length,
  };

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Compliance Management
              </h1>
              <p className="text-gray-600 mt-2">
                Track and manage regulatory compliance submissions
              </p>
            </div>
            <Button className="bg-gray-700 hover:bg-gray-800 text-white">
              New Compliance
            </Button>
          </div>

          {/* Compliance Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="p-6 bg-gray-50">
              <p className="text-gray-600 text-sm">Total Items</p>
              <p className="text-3xl font-bold text-gray-600 mt-2">
                {stats.total}
              </p>
            </Card>
            <Card className="p-6 bg-yellow-50">
              <p className="text-gray-600 text-sm">Pending</p>
              <p className="text-3xl font-bold text-yellow-600 mt-2">
                {stats.pending}
              </p>
            </Card>
            <Card className="p-6 bg-green-50">
              <p className="text-gray-600 text-sm">Approved</p>
              <p className="text-3xl font-bold text-green-600 mt-2">
                {stats.approved}
              </p>
            </Card>
            <Card className="p-6 bg-red-50">
              <p className="text-gray-600 text-sm">Rejected</p>
              <p className="text-3xl font-bold text-red-600 mt-2">
                {stats.rejected}
              </p>
            </Card>
          </div>

          {/* Compliance List */}
          <Card className="overflow-hidden">
            <div className="divide-y divide-gray-200">
              {complianceList.map((compliance) => {
                const daysUntil = getDaysUntilDue(compliance.dueDate);
                const overdue = isOverdue(compliance.dueDate);

                return (
                  <div
                    key={compliance.id}
                    className={`p-6 ${getStatusColor(
                      compliance.status
                    )} cursor-pointer hover:opacity-90 transition-opacity`}
                    onClick={() => setSelectedCompliance(compliance)}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h3 className="text-lg font-bold">
                            {compliance.name}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(
                              compliance.status
                            )}`}
                          >
                            {compliance.status.charAt(0).toUpperCase() +
                              compliance.status.slice(1)}
                          </span>
                        </div>
                        <p className="text-sm mb-3">{compliance.description}</p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="opacity-75">Department</p>
                            <p className="font-medium">
                              {compliance.department}
                            </p>
                          </div>
                          <div>
                            <p className="opacity-75">Due Date</p>
                            <p
                              className={`font-medium ${
                                overdue && compliance.status === "pending"
                                  ? "text-red-600"
                                  : ""
                              }`}
                            >
                              {compliance.dueDate}
                              {compliance.status === "pending" && (
                                <span
                                  className={`block text-xs mt-1 ${
                                    overdue ? "text-red-600" : ""
                                  }`}
                                >
                                  {overdue
                                    ? `Overdue by ${-daysUntil} days`
                                    : `${daysUntil} days remaining`}
                                </span>
                              )}
                            </p>
                          </div>
                          {compliance.submittedOn && (
                            <div>
                              <p className="opacity-75">Submitted</p>
                              <p className="font-medium">
                                {compliance.submittedOn}
                              </p>
                            </div>
                          )}
                          {compliance.approvedOn && (
                            <div>
                              <p className="opacity-75">Approved</p>
                              <p className="font-medium">
                                {compliance.approvedOn}
                              </p>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Compliance Details Modal */}
          {selectedCompliance && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {selectedCompliance.name}
                      </h2>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusBadge(
                          selectedCompliance.status
                        )}`}
                      >
                        {selectedCompliance.status.charAt(0).toUpperCase() +
                          selectedCompliance.status.slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCompliance(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="space-y-4 mb-6">
                    <p className="text-gray-600">
                      {selectedCompliance.description}
                    </p>

                    <div className="grid grid-cols-2 gap-4">
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedCompliance.department}
                        </p>
                      </div>
                      <div className="p-4 bg-gray-50 rounded-lg">
                        <p className="text-sm text-gray-600">Due Date</p>
                        <p className="font-medium text-gray-900 mt-1">
                          {selectedCompliance.dueDate}
                        </p>
                      </div>
                      {selectedCompliance.submittedOn && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Submitted On</p>
                          <p className="font-medium text-gray-900 mt-1">
                            {selectedCompliance.submittedOn}
                          </p>
                        </div>
                      )}
                      {selectedCompliance.approvedOn && (
                        <div className="p-4 bg-gray-50 rounded-lg">
                          <p className="text-sm text-gray-600">Approved On</p>
                          <p className="font-medium text-gray-900 mt-1">
                            {selectedCompliance.approvedOn}
                          </p>
                        </div>
                      )}
                    </div>

                    {selectedCompliance.notes && (
                      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                        <p className="font-medium text-red-900 mb-2">
                          Feedback:
                        </p>
                        <p className="text-red-800 text-sm">
                          {selectedCompliance.notes}
                        </p>
                      </div>
                    )}
                  </div>

                  {selectedCompliance.status === "pending" && (
                    <div className="flex gap-3 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedCompliance(null)}
                      >
                        Close
                      </Button>
                      <Button
                        onClick={() => setShowUploadForm(true)}
                        className="bg-gray-700 hover:bg-gray-800 text-white"
                      >
                        Submit Documents
                      </Button>
                    </div>
                  )}
                  {selectedCompliance.status !== "pending" && (
                    <Button
                      onClick={() => setSelectedCompliance(null)}
                      className="w-full bg-gray-300 text-gray-700"
                    >
                      Close
                    </Button>
                  )}
                </div>
              </Card>
            </div>
          )}

          {/* Upload Form Modal */}
          {showUploadForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Submit Documents
                  </h2>

                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
                      <div className="text-4xl mb-3">+</div>
                      <p className="font-medium text-gray-900">
                        Click to upload files
                      </p>
                      <p className="text-sm text-gray-600 mt-1">
                        or drag and drop
                      </p>
                      <p className="text-xs text-gray-500 mt-2">
                        PDF, DOC, DOCX, XLS, XLSX
                      </p>
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Comments (Optional)
                      </label>
                      <textarea
                        rows={3}
                        placeholder="Add any comments or notes about this submission..."
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg"
                      />
                    </div>
                  </div>

                  <div className="flex gap-3 mt-8 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setShowUploadForm(false)}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={() => {
                        setShowUploadForm(false);
                        setSelectedCompliance(null);
                      }}
                      className="bg-gray-700 hover:bg-gray-800 text-white"
                    >
                      Submit
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
