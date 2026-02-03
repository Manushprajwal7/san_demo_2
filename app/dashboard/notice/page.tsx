"use client";

import NoticeGenerator from "@/components/notice-generator";
import { useCompany } from "@/components/company-context";
import { DashboardHeader } from "@/components/dashboard-header";

export default function NoticePage() {
  const { company } = useCompany();

  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">Notice Generator</h1>
          <NoticeGenerator company={company} />
        </div>
      </main>
    </div>
  );
}
