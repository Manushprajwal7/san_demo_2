"use client";

import CalendarView from "@/components/calendar-view";
import { useCompany } from "@/components/company-context";
import { DashboardHeader } from "@/components/dashboard-header";

export default function CalendarPage() {
  const { company } = useCompany();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Calendar</h1>
          <CalendarView company={company} />
        </div>
      </main>
    </div>
  );
}
