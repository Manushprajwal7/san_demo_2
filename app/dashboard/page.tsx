"use client";

import EnhancedDashboard from "@/components/enhanced-dashboard";
import { DashboardHeader } from "@/components/dashboard-header";

export default function DashboardPage() {
  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Analytics Dashboard
            </h1>
            <p className="text-gray-600 text-lg">
              Comprehensive overview of all your data tables and statistics
            </p>
          </div>
          <EnhancedDashboard />
        </div>
      </main>
    </div>
  );
}
