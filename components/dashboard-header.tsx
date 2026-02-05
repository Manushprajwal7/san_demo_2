"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  return (
    <header className="bg-white border-b border-border/50 shadow-sm">
      <div className="max-w-7xl mx-auto px-8 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <h1 className="font-semibold text-base text-foreground leading-tight">
              Sangeetha Compliance Management Software
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <div className="text-right">
            <div className="font-medium text-sm text-foreground">
              {user?.name}
            </div>
            <div className="text-muted-foreground capitalize text-xs font-normal">
              {user?.role?.replace("_", " ")}
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            size="sm"
            className="font-medium"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
