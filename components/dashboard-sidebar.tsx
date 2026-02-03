"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/lib/auth-context";
import {
  LayoutDashboard,
  Users,
  FileText,
  Calendar,
  ClipboardList,
  ShieldCheck,
} from "lucide-react";

interface NavItem {
  label: string;
  href: string;
  icon: React.ElementType;
  roles: string[];
}

const NAV_ITEMS: NavItem[] = [
  {
    label: "Dashboard",
    href: "/dashboard",
    icon: LayoutDashboard,
    roles: [],
  },
  {
    label: "Employees",
    href: "/dashboard/employees",
    icon: Users,
    roles: [],
  },
  {
    label: "Licenses",
    href: "/dashboard/licenses",
    icon: FileText,
    roles: [],
  },
  {
    label: "Calendar",
    href: "/dashboard/calendar",
    icon: Calendar,
    roles: [],
  },
  {
    label: "Notice Generator",
    href: "/dashboard/notice",
    icon: ClipboardList,
    roles: [],
  },
  {
    label: "Compliance",
    href: "/dashboard/compliance",
    icon: ShieldCheck,
    roles: [],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Show all items for demo purposes
  const visibleItems = NAV_ITEMS;

  return (
    <aside className="w-48 bg-gray-50 border-r border-gray-200 min-h-screen">
      <div className="p-4 border-b border-gray-200">
        <img
          src="/logo.png"
          alt="Company Logo"
          className="w-full max-w-[140px] mx-auto"
        />
      </div>
      <nav className="p-3 space-y-6 pt-6">
        {visibleItems.map((item) => {
          const IconComponent = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-2.5 px-3 py-2.5 rounded-lg transition-colors text-sm ${
                pathname === item.href
                  ? "bg-indigo-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              <IconComponent size={18} />
              <span className="font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
