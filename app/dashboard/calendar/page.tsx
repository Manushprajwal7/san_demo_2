"use client";

import EnhancedCalendarView from "@/components/enhanced-calendar-view";
import { DashboardHeader } from "@/components/dashboard-header";

export default function CalendarPage() {
  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8 bg-gradient-to-br from-gray-50 to-blue-50 min-h-screen">
        <div className="max-w-7xl mx-auto">
          <div className="mb-8">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Dynamic Calendar
            </h1>
            <p className="text-gray-600 text-lg">
              Select any table and date field to visualize your data on the
              calendar
            </p>
          </div>
          <EnhancedCalendarView />
        </div>
      </main>
    </div>
  );
}
