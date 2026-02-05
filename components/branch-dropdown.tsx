"use client";

import { useEffect, useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { createClient } from "@/lib/supabase/client";

interface Branch {
  id: string;
  name: string;
  location?: string;
}

interface BranchDropdownProps {
  companyId?: string;
  value?: string;
  onChange: (branchId: string) => void;
  className?: string;
}

export function BranchDropdown({
  companyId,
  value,
  onChange,
  className = "",
}: BranchDropdownProps) {
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedBranch, setSelectedBranch] = useState(value || "");
  const supabase = createClient();

  useEffect(() => {
    const fetchBranches = async () => {
      if (!companyId) {
        setBranches([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        const { data, error } = await supabase
          .from("branches")
          .select("id, name, location")
          .eq("company_id", companyId)
          .order("name");

        if (error) {
          console.error("Error fetching branches:", error);
          return;
        }

        setBranches(data || []);
      } catch (error) {
        console.error("Error in fetchBranches:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchBranches();
  }, [companyId]);

  const handleChange = (branchId: string) => {
    setSelectedBranch(branchId);
    onChange(branchId);
  };

  if (loading) {
    return (
      <div className={`w-[280px] h-10 bg-gray-100 rounded-md animate-pulse ${className}`} />
    );
  }

  return (
    <Select value={selectedBranch} onValueChange={handleChange}>
      <SelectTrigger className={`w-[280px] ${className}`}>
        <SelectValue placeholder="Select a branch" />
      </SelectTrigger>
      <SelectContent>
        {branches.length > 0 ? (
          branches.map((branch) => (
            <SelectItem key={branch.id} value={branch.id}>
              {branch.name} {branch.location ? `(${branch.location})` : ""}
            </SelectItem>
          ))
        ) : (
          <div className="px-3 py-2 text-sm text-gray-500">
            No branches found
          </div>
        )}
      </SelectContent>
    </Select>
  );
}

export default BranchDropdown;
