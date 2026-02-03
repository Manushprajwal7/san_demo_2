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
    <header className="bg-white bg-opacity-90 text-black shadow-lg">
      <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="text-2xl font-bold">SM</div>
          <div>
            <h1 className="font-bold text-lg">Sangeetha Mobiles</h1>
            <p className="text-black text-sm">Compliance management</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-right text-sm">
            <div className="font-semibold">{user?.name}</div>
            <div className="text-indigo-100 capitalize text-xs">
              {user?.role?.replace("_", " ")}
            </div>
          </div>
          <Button
            onClick={handleLogout}
            variant="outline"
            className="bg-white hover:bg-gray-100 border-gray-400 text-black"
          >
            Logout
          </Button>
        </div>
      </div>
    </header>
  );
}
