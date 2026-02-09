"use client";

import { useState, useEffect } from "react";
import { DashboardHeader } from "@/components/dashboard-header";
import { EmployeesDataViewer } from "@/components/employees/employees-data-viewer";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Plus } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { EmployeeForm } from "@/components/employees/employee-form";
import { toast } from "sonner";

export default function EmployeesPage() {
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [refreshKey, setRefreshKey] = useState(0);

  const handleEmployeeAdded = () => {
    setIsAddDialogOpen(false);
    setRefreshKey(prev => prev + 1);
    toast.success("Employee added successfully");
  };

  return (
    <div className="flex-1 flex flex-col bg-background">
      <DashboardHeader />
      <main className="flex-1 p-8">
        <div className="max-w-[1600px] mx-auto">
          <div className="mb-8 flex justify-between items-center">
            <div>
              <h1 className="text-[28px] font-bold text-slate-900 tracking-tight">
                Employees
              </h1>
              <p className="text-sm text-slate-600 mt-2">
                View, filter, import and export employee data
              </p>
            </div>
            <Button 
              onClick={() => setIsAddDialogOpen(true)}
              className="flex items-center gap-2"
            >
              <Plus className="h-4 w-4" />
              Add Employee
            </Button>
          </div>
          <EmployeesDataViewer key={refreshKey} />
        </div>
      </main>
      
      {/* Add Employee Dialog */}
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Add New Employee</DialogTitle>
            <DialogDescription>
              Fill in the employee details below and click submit to add the employee to the database.
            </DialogDescription>
          </DialogHeader>
          <EmployeeForm 
            onSuccess={handleEmployeeAdded}
            onCancel={() => setIsAddDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
}
