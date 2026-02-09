"use client";

import { useState } from "react";
import dynamic from "next/dynamic";
import { DashboardHeader } from "@/components/dashboard-header";
import { Skeleton } from "@/components/ui/skeleton";
import { Card } from "@/components/ui/card";

const DashboardOverview = dynamic(
  () => import("@/components/dashboard-overview").then((m) => m.default),
  {
    loading: () => (
      <div className="space-y-6">
        {/* Header Skeleton */}
        <div className="flex justify-between items-center">
          <div>
            <Skeleton className="h-9 w-56 mb-2" />
            <Skeleton className="h-5 w-72" />
          </div>
          <div className="flex gap-3">
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-36" />
            <Skeleton className="h-10 w-24" />
          </div>
        </div>

        {/* KPI Cards Skeleton */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Card key={i} className="p-5 border-0 shadow-lg">
              <Skeleton className="h-10 w-10 rounded-xl mb-3" />
              <Skeleton className="h-9 w-24 mb-2" />
              <Skeleton className="h-4 w-32" />
            </Card>
          ))}
        </div>

        {/* Charts Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {Array.from({ length: 2 }).map((_, i) => (
            <Card key={i} className="p-6 border-0 shadow-lg">
              <div className="flex items-center gap-3 mb-4">
                <Skeleton className="h-9 w-9 rounded-lg" />
                <Skeleton className="h-6 w-48" />
              </div>
              <Skeleton className="h-72 w-full rounded-lg" />
            </Card>
          ))}
        </div>

        {/* Table Skeleton */}
        <Card className="p-6 border-0 shadow-lg">
          <div className="flex items-center gap-3 mb-4">
            <Skeleton className="h-9 w-9 rounded-lg" />
            <Skeleton className="h-6 w-40" />
          </div>
          <div className="space-y-3">
            <Skeleton className="h-10 w-full" />
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-14 w-full" />
            ))}
          </div>
        </Card>
      </div>
    ),
    ssr: false,
  }
);

export default function DashboardPage() {
  const now = new Date();
  const currentYear = now.getFullYear().toString();
  const currentMonth = (now.getMonth() + 1).toString();

  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [selectedMonth, setSelectedMonth] = useState(currentMonth);
  const [selectedYear, setSelectedYear] = useState(currentYear);

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader
        selectedState={selectedState}
        onStateChange={setSelectedState}
        selectedBranch={selectedBranch}
        onBranchChange={setSelectedBranch}
        selectedMonth={selectedMonth}
        onMonthChange={setSelectedMonth}
        selectedYear={selectedYear}
        onYearChange={setSelectedYear}
      />
      <main className="p-8 bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <DashboardOverview
            selectedState={selectedState || "all"}
            selectedBranch={selectedBranch || "all"}
            selectedMonth={selectedMonth}
            selectedYear={selectedYear}
          />
        </div>
      </main>
    </div>
  );
}
