"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { EmployeesDataViewer } from "@/components/employees/employees-data-viewer";

export default function EmployeesPage() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
              Employees
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              View, filter, import and export employee data
            </p>
          </div>
          <EmployeesDataViewer />
        </div>
      </main>
    </div>
  );
}
