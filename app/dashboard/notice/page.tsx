"use client";

import { DashboardHeader } from "@/components/dashboard-header";
import { NoticeBuilder } from "@/components/notice/notice-builder";

export default function NoticePage() {
  return (
    <div className="flex-1 flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8">
            <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
              Notice Builder
            </h1>
            <p className="text-sm text-slate-600 mt-2">
              Create and manage dynamic forms for your organization
            </p>
          </div>
          <NoticeBuilder />
        </div>
      </main>
    </div>
  );
}
