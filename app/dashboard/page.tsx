"use client";

import dynamic from "next/dynamic";
import { DashboardHeader } from "@/components/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";

const OptimizedDashboard = dynamic(
  () => import("@/components/optimized-dashboard").then((m) => m.default),
  {
    loading: () => (
      <div className="space-y-6">
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-24 rounded-xl" />
          ))}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-80 rounded-xl" />
          ))}
        </div>
      </div>
    ),
    ssr: false,
  }
);

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
          <OptimizedDashboard />
        </div>
      </main>
    </div>
  );
}
