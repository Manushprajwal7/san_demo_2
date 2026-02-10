"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  downloadCompliancePDF,
  previewCompliancePDF,
  downloadComplianceFormsPDF
} from "@/lib/pdf-generator";
import {
  FileDown,
  Eye,
  FileText,
  Scale,
  Building2,
  Activity,
  RefreshCw,
  Plus,
  Loader2,
} from "lucide-react";

interface ComplianceSubmission {
  id: string;
  state?: string;
  district?: string;
  branch?: string;
  act?: string;
  forms?: string[];
  submitted_at?: string;
  status?: string;
  company_id?: number;
  created_at?: string;
}

interface DashboardData {
  totalSubmissions: number;
  byStatus: Record<string, number>;
  formsCount: number;
  actsCount: number;
  branchesCount: number;
  actNames: Record<string, string>;
  recentActivity: ComplianceSubmission[];
  submissions: ComplianceSubmission[];
}

export default function CompliancePage() {
  const { user } = useAuth();
  const [dashboard, setDashboard] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedCompliance, setSelectedCompliance] =
    useState<ComplianceSubmission | null>(null);
  const [showUploadForm, setShowUploadForm] = useState(false);

  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  
  const fetchDashboard = async () => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/compliance/dashboard");
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load dashboard");
      setDashboard(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load dashboard");
      setDashboard(null);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const getActName = (actId?: string) =>
    (actId && dashboard?.actNames?.[actId]) || actId || "—";

  const handleExportPDF = async (row: ComplianceSubmission, e: React.MouseEvent) => {
    e.stopPropagation(); // Avoid row click
    if (!row.id) return;
    try {
      setDownloadingId(row.id);
      await downloadComplianceFormsPDF({
        complianceId: row.id,
        act: row.act || '',
        forms: row.forms || [],
        branchId: row.branch || ''
      });
    } catch (err) {
      console.error(err);
      alert('Failed to download PDF. Please try again later.');
    } finally {
      setDownloadingId(null);
    }
  };

  const handlePreviewPDF = (row: ComplianceSubmission, e: React.MouseEvent) => {
    e.stopPropagation();
    const pdfData = {
      id: row.id,
      state: row.state ?? "Karnataka",
      district: row.district ?? "—",
      taluk: "—",
      employee: "—",
      forms: Array.isArray(row.forms) ? row.forms : [getActName(row.act)],
      submittedAt: row.submitted_at ?? new Date().toISOString(),
    };
    previewCompliancePDF(pdfData);
  };

  const getStatusColor = (status?: string) => {
    const s = (status ?? "generated").toLowerCase();
    switch (s) {
      case "pending":
        return "bg-yellow-50 border-l-4 border-yellow-500 text-yellow-900";
      case "submitted":
        return "bg-gray-50 border-l-4 border-gray-500 text-gray-900";
      case "approved":
        return "bg-green-50 border-l-4 border-green-500 text-green-900";
      case "rejected":
        return "bg-red-50 border-l-4 border-red-500 text-red-900";
      default:
        return "bg-blue-50 border-l-4 border-blue-500 text-blue-900";
    }
  };

  const getStatusBadge = (status?: string) => {
    const s = (status ?? "generated").toLowerCase();
    switch (s) {
      case "pending":
        return "bg-yellow-100 text-yellow-800";
      case "submitted":
        return "bg-gray-100 text-gray-800";
      case "approved":
        return "bg-green-100 text-green-800";
      case "rejected":
        return "bg-red-100 text-red-800";
      default:
        return "bg-blue-100 text-blue-800";
    }
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "—";
    try {
      const d = new Date(dateStr);
      return d.toLocaleDateString(undefined, {
        dateStyle: "medium",
      });
    } catch {
      return dateStr;
    }
  };

  if (loading && !dashboard) {
    return (
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8 flex items-center justify-center">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="h-10 w-10 animate-spin text-gray-500" />
            <p className="text-gray-600">Loading compliance dashboard…</p>
          </div>
        </main>
      </div>
    );
  }

  const submissions = dashboard?.submissions ?? [];
  const recentActivity = dashboard?.recentActivity ?? [];
  const byStatus = dashboard?.byStatus ?? {};

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="flex-1 p-8">
        <div className="max-w-6xl mx-auto space-y-8">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">
                Compliance Management
              </h1>
              <p className="text-gray-600 mt-2">
                Track and manage regulatory compliance submissions
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchDashboard}
                disabled={loading}
              >
                <RefreshCw
                  className={`h-4 w-4 mr-2 ${loading ? "animate-spin" : ""}`}
                />
                Refresh
              </Button>
              <Button
                className="bg-gray-700 hover:bg-gray-800 text-white"
                onClick={() => (window.location.href = "/dashboard/compliance/new")}
              >
                <Plus className="h-4 w-4 mr-2" />
                New Compliance
              </Button>
            </div>
          </div>

          {error && (
            <Card className="p-4 bg-red-50 border-red-200 text-red-800">
              {error}
            </Card>
          )}

          {/* Stats: Total, Forms, Acts, Branches */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card className="p-6 bg-gray-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-gray-200">
                  <FileText className="h-5 w-5 text-gray-600" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Total Submissions</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {dashboard?.totalSubmissions ?? 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-blue-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-blue-200">
                  <FileText className="h-5 w-5 text-blue-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Forms Available</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {dashboard?.formsCount ?? 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-indigo-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-indigo-200">
                  <Scale className="h-5 w-5 text-indigo-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Compliance Acts</p>
                  <p className="text-2xl font-bold text-indigo-900">
                    {dashboard?.actsCount ?? 0}
                  </p>
                </div>
              </div>
            </Card>
            <Card className="p-6 bg-emerald-50">
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-emerald-200">
                  <Building2 className="h-5 w-5 text-emerald-700" />
                </div>
                <div>
                  <p className="text-gray-600 text-sm">Branches</p>
                  <p className="text-2xl font-bold text-emerald-900">
                    {dashboard?.branchesCount ?? 0}
                  </p>
                </div>
              </div>
            </Card>
          </div>

          {/* Status breakdown */}
          {Object.keys(byStatus).length > 0 && (
            <Card className="p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4">
                Submissions by status
              </h2>
              <div className="flex flex-wrap gap-3">
                {Object.entries(byStatus).map(([status, count]) => (
                  <span
                    key={status}
                    className={`px-3 py-1.5 rounded-full text-sm font-medium ${getStatusBadge(status)}`}
                  >
                    {status.charAt(0).toUpperCase() + status.slice(1)}: {count}
                  </span>
                ))}
              </div>
            </Card>
          )}

          {/* Recent activity */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200 flex items-center gap-2">
              <Activity className="h-5 w-5 text-gray-600" />
              <h2 className="text-lg font-semibold text-gray-900">
                Recent activity
              </h2>
            </div>
            <div className="divide-y divide-gray-100 max-h-64 overflow-y-auto">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-gray-500">
                  No recent submissions. Create one from New Compliance.
                </div>
              ) : (
                recentActivity.map((row) => (
                  <div
                    key={row.id}
                    className="p-4 hover:bg-gray-50 flex items-center justify-between gap-4"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-900 truncate">
                        {getActName(row.act)} — {row.branch ?? "—"}
                      </p>
                      <p className="text-sm text-gray-500">
                        {row.state ?? "—"} · {row.district ?? "—"} ·{" "}
                        {formatDate(row.submitted_at)}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span
                        className={`px-2 py-0.5 rounded text-xs font-medium ${getStatusBadge(row.status)}`}
                      >
                        {row.status ?? "generated"}
                      </span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setSelectedCompliance(row)}
                      >
                        View
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Submissions list */}
          <Card className="overflow-hidden">
            <div className="p-4 border-b border-gray-200">
              <h2 className="text-lg font-semibold text-gray-900">
                All submissions
              </h2>
              <p className="text-sm text-gray-500 mt-1">
                {submissions.length} submission{submissions.length !== 1 ? "s" : ""} in total
              </p>
            </div>
            <div className="divide-y divide-gray-200">
              {submissions.length === 0 ? (
                <div className="p-12 text-center text-gray-500">
                  No compliance submissions yet. Use &quot;New Compliance&quot; to create and generate forms.
                </div>
              ) : (
                submissions.map((row) => (
                  <div
                    key={row.id}
                    className={`p-6 ${getStatusColor(row.status)} cursor-pointer hover:opacity-90 transition-opacity`}
                    onClick={() => setSelectedCompliance(row)}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2 flex-wrap">
                          <h3 className="text-lg font-bold text-gray-900">
                            {getActName(row.act)}
                          </h3>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${getStatusBadge(row.status)}`}
                          >
                            {(row.status ?? "generated").charAt(0).toUpperCase() +
                              (row.status ?? "generated").slice(1)}
                          </span>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">
                          {row.state ?? "—"} · {row.district ?? "—"} · Branch:{" "}
                          {row.branch ?? "—"}
                        </p>
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="opacity-75">State</p>
                            <p className="font-medium">{row.state ?? "—"}</p>
                          </div>
                          <div>
                            <p className="opacity-75">District</p>
                            <p className="font-medium">{row.district ?? "—"}</p>
                          </div>
                          <div>
                            <p className="opacity-75">Branch</p>
                            <p className="font-medium">{row.branch ?? "—"}</p>
                          </div>
                          <div>
                            <p className="opacity-75">Submitted</p>
                            <p className="font-medium">
                              {formatDate(row.submitted_at)}
                            </p>
                          </div>
                        </div>
                        {Array.isArray(row.forms) && row.forms.length > 0 && (
                          <p className="text-xs text-gray-500 mt-2">
                            Forms: {row.forms.join(", ")}
                          </p>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handlePreviewPDF(row, e)}
                          className="hover:bg-white/50"
                        >
                          <Eye className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={(e) => handleExportPDF(row, e)}
                          className="hover:bg-white/50"
                        >
                          <FileDown className={`h-4 w-4 ${downloadingId === row.id ? 'animate-bounce' : ''}`} />
                        </Button>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Detail modal */}
          {selectedCompliance && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-2xl max-h-[90vh] overflow-y-auto">
                <div className="p-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <h2 className="text-2xl font-bold text-gray-900">
                        {getActName(selectedCompliance.act)}
                      </h2>
                      <span
                        className={`inline-flex px-3 py-1 rounded-full text-xs font-semibold mt-2 ${getStatusBadge(selectedCompliance.status)}`}
                      >
                        {(selectedCompliance.status ?? "generated")
                          .charAt(0)
                          .toUpperCase() +
                          (selectedCompliance.status ?? "generated").slice(1)}
                      </span>
                    </div>
                    <button
                      onClick={() => setSelectedCompliance(null)}
                      className="text-gray-400 hover:text-gray-600 text-2xl"
                    >
                      ×
                    </button>
                  </div>

                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">ID</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedCompliance.id}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">State</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedCompliance.state ?? "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">District</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedCompliance.district ?? "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Branch</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {selectedCompliance.branch ?? "—"}
                      </p>
                    </div>
                    <div className="p-4 bg-gray-50 rounded-lg">
                      <p className="text-sm text-gray-600">Submitted</p>
                      <p className="font-medium text-gray-900 mt-1">
                        {formatDate(selectedCompliance.submitted_at)}
                      </p>
                    </div>
                    {Array.isArray(selectedCompliance.forms) &&
                      selectedCompliance.forms.length > 0 && (
                        <div className="p-4 bg-gray-50 rounded-lg col-span-2">
                          <p className="text-sm text-gray-600">Forms</p>
                          <p className="font-medium text-gray-900 mt-1">
                            {selectedCompliance.forms.join(", ")}
                          </p>
                        </div>
                      )}
                  </div>

                  <div className="flex gap-3 justify-end">
                    <Button
                      variant="outline"
                      onClick={() => setSelectedCompliance(null)}
                    >
                      Close
                    </Button>
                    <Button
                      variant="outline"
                      onClick={(e) => handlePreviewPDF(selectedCompliance, e)}
                    >
                      <Eye className="h-4 w-4 mr-2" />
                      Preview PDF
                    </Button>
                    <Button
                      className="bg-gray-700 hover:bg-gray-800 text-white"
                      onClick={(e) => handleExportPDF(selectedCompliance, e)}
                    >
                      <FileDown className={`h-4 w-4 mr-2 ${downloadingId === selectedCompliance.id ? 'animate-bounce' : ''}`} />
                      {downloadingId === selectedCompliance.id ? 'Downloading...' : 'Download PDF'}
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Upload form modal (placeholder) */}
          {showUploadForm && (
            <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
              <Card className="w-full max-w-md">
                <div className="p-8">
                  <h2 className="text-2xl font-bold text-gray-900 mb-6">
                    Submit documents
                  </h2>
                  <div className="space-y-6">
                    <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center cursor-pointer hover:border-gray-400">
                      <p className="text-sm text-gray-500">
                        Upload flow can be wired to your backend here.
                      </p>
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
                      Close
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
