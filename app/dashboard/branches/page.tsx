"use client";

import EnhancedBranchManager from "@/components/enhanced-branch-manager";
import { useCompany } from "@/components/company-context";
import { DashboardHeader } from "@/components/dashboard-header";

export default function BranchesPage() {
  const { company } = useCompany();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Branch Management
            </h1>
            <p className="text-gray-600 text-lg">
              Track, manage, and generate reports for all your company branches
            </p>
          </div>
          <EnhancedBranchManager company={company} />
        </div>
      </main>
    </div>
  );
}
