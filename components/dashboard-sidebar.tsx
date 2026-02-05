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
  FileOutput,
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
    label: "Notice Builder",
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
  {
    label: "Form Generator",
    href: "/dashboard/form-generator",
    icon: FileOutput,
    roles: [],
  },
];

export function DashboardSidebar() {
  const pathname = usePathname();
  const { user } = useAuth();

  // Show all items for demo purposes
  const visibleItems = NAV_ITEMS;

  return (
    <aside className="w-56 bg-sidebar border-r border-sidebar-border min-h-screen">
      <div className="p-6 border-b border-sidebar-border">
        <img
          src="/logo.png"
          alt="Company Logo"
          className="w-full max-w-[160px] mx-auto"
        />
      </div>
      <nav className="p-4 space-y-2 pt-6">
        {visibleItems.map((item) => {
          const IconComponent = item.icon;
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 text-sm font-medium ${
                isActive
                  ? "bg-sidebar-primary text-sidebar-primary-foreground shadow-sm"
                  : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
              }`}
            >
              <IconComponent size={20} strokeWidth={2} />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}
