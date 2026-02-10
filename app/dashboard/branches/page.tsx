"use client";

import KABranchesViewer from "@/components/branches/ka-branches-viewer";
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
              View and manage all Karnataka branches with advanced filtering and reporting capabilities
            </p>
          </div>
          <KABranchesViewer company={company} />
        </div>
      </main>
    </div>
  );
}
