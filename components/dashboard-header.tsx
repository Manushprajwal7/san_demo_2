"use client";

import { useAuth } from "@/lib/auth-context";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState, useEffect } from "react";
import { createClient } from "@/lib/supabase/client";
import { IndianStatesDropdown } from "./indian-states-dropdown";
import { BranchDropdown } from "./branch-dropdown";

const MONTHS = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function DashboardHeader() {
  const { user, logout } = useAuth();
  const router = useRouter();

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  const now = new Date();
  const [month, setMonth] = useState((now.getMonth() + 1).toString());
  const [year, setYear] = useState(now.getFullYear().toString());
  const [selectedState, setSelectedState] = useState("");
  const [selectedBranch, setSelectedBranch] = useState("");
  const [companyId, setCompanyId] = useState<string | null>(null);
  const supabase = createClient();

  const years = Array.from({ length: 11 }, (_, i) =>
    (now.getFullYear() - 5 + i).toString()
  );

  useEffect(() => {
    const fetchCompanyId = async () => {
      if (!user?.email) return;
      
      try {
        const { data, error } = await supabase
          .from('companies')
          .select('id')
          .eq('email', user.email)
          .single();
          
        if (data) {
          setCompanyId(data.id);
        }
      } catch (error) {
        console.error('Error fetching company ID:', error);
      }
    };

    fetchCompanyId();
  }, [user?.email]);

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

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <IndianStatesDropdown
              value={selectedState}
              onChange={setSelectedState}
              className="w-[200px]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <BranchDropdown
              companyId={companyId || undefined}
              value={selectedBranch}
              onChange={setSelectedBranch}
              className="w-[200px]"
            />
          </div>
          
          <div className="flex items-center gap-2">
            <Select value={month} onValueChange={setMonth}>
              <SelectTrigger className="w-[90px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {MONTHS.map((m, i) => (
                  <SelectItem key={m} value={(i + 1).toString()}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={year} onValueChange={setYear}>
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {years.map((y) => (
                  <SelectItem key={y} value={y}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
