"use client";

import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { CompanyProvider } from "@/components/company-context";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <CompanyProvider>
      <div className="flex min-h-screen bg-gray-100">
        <DashboardSidebar />
        <div className="flex-1 flex flex-col overflow-y-auto h-screen">
          {children}
        </div>
      </div>
    </CompanyProvider>
  );
}
