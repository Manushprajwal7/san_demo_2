"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { NoticeBuilder } from "@/components/notice/notice-builder";

export default function NoticePage() {
  return (
    <div className="flex-1 flex flex-col">
      <DashboardHeader />
      <main className="p-8">
        <div className="max-w-7xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-6">
            Notice Builder
          </h1>
          <NoticeBuilder />
        </div>
      </main>
    </div>
  );
}
