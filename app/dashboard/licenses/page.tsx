"use client";

import EnhancedLicenseManager from "@/components/enhanced-license-manager";
import { useCompany } from "@/components/company-context";
import { DashboardHeader } from "@/components/dashboard-header";

export default function LicensesPage() {
  const { company } = useCompany();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              License Management
            </h1>
            <p className="text-gray-600 text-lg">
              Track, manage, and generate reports for all your business licenses
            </p>
          </div>
          <EnhancedLicenseManager company={company} />
        </div>
      </main>
    </div>
  );
}
