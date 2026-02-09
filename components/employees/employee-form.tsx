"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { CalendarIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmployeeFormData {
  ref_no?: string;
  empname?: string;
  month_name?: string;
  gender?: string;
  date_of_birth?: string;
  date_of_joining?: string;
  department?: string;
  sub_department?: string;
  designation_name?: string;
  title?: string;
  branch_name?: string;
  region?: string;
  father_name?: string;
  location?: string;
  present_res_no?: string;
  present_city?: string;
  present_pincode?: string;
  uan?: string;
  esi_number?: string;
  companyname?: string;
  [key: string]: any;
}

interface EmployeeFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
  initialData?: EmployeeFormData;
}

export function EmployeeForm({ onSuccess, onCancel, initialData }: EmployeeFormProps) {
  const [formData, setFormData] = useState<EmployeeFormData>(initialData || {});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleInputChange = (field: keyof EmployeeFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!onSuccess) return;

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/employees', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          table: 'man_power' // Default to man_power table
        }),
      });

      if (response.ok) {
        onSuccess();
        setFormData({});
      } else {
        const error = await response.json();
        console.error('Failed to add employee:', error);
      }
    } catch (error) {
      console.error('Error submitting employee form:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCancel = () => {
    setFormData({});
    onCancel?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Reference Number */}
        <div className="space-y-2">
          <Label htmlFor="ref_no">Reference Number</Label>
          <Input
            id="ref_no"
            value={formData.ref_no || ''}
            onChange={(e) => handleInputChange('ref_no', e.target.value)}
            placeholder="Enter reference number"
          />
        </div>

        {/* Employee Name */}
        <div className="space-y-2">
          <Label htmlFor="empname">Employee Name *</Label>
          <Input
            id="empname"
            value={formData.empname || ''}
            onChange={(e) => handleInputChange('empname', e.target.value)}
            placeholder="Enter employee name"
            required
          />
        </div>

        {/* Month Name */}
        <div className="space-y-2">
          <Label htmlFor="month_name">Month Name</Label>
          <Select
            value={formData.month_name || ''}
            onValueChange={(value) => handleInputChange('month_name', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select month" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="January">January</SelectItem>
              <SelectItem value="February">February</SelectItem>
              <SelectItem value="March">March</SelectItem>
              <SelectItem value="April">April</SelectItem>
              <SelectItem value="May">May</SelectItem>
              <SelectItem value="June">June</SelectItem>
              <SelectItem value="July">July</SelectItem>
              <SelectItem value="August">August</SelectItem>
              <SelectItem value="September">September</SelectItem>
              <SelectItem value="October">October</SelectItem>
              <SelectItem value="November">November</SelectItem>
              <SelectItem value="December">December</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Gender */}
        <div className="space-y-2">
          <Label htmlFor="gender">Gender *</Label>
          <Select
            value={formData.gender || ''}
            onValueChange={(value) => handleInputChange('gender', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select gender" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Male">Male</SelectItem>
              <SelectItem value="Female">Female</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Date of Birth */}
        <div className="space-y-2">
          <Label htmlFor="date_of_birth">Date of Birth</Label>
          <Input
            id="date_of_birth"
            type="date"
            value={formData.date_of_birth || ''}
            onChange={(e) => handleInputChange('date_of_birth', e.target.value)}
          />
        </div>

        {/* Date of Joining */}
        <div className="space-y-2">
          <Label htmlFor="date_of_joining">Date of Joining *</Label>
          <Input
            id="date_of_joining"
            type="date"
            value={formData.date_of_joining || ''}
            onChange={(e) => handleInputChange('date_of_joining', e.target.value)}
            required
          />
        </div>

        {/* Department */}
        <div className="space-y-2">
          <Label htmlFor="department">Department *</Label>
          <Select
            value={formData.department || ''}
            onValueChange={(value) => handleInputChange('department', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select department" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="IT">IT</SelectItem>
              <SelectItem value="HR">HR</SelectItem>
              <SelectItem value="Finance">Finance</SelectItem>
              <SelectItem value="Operations">Operations</SelectItem>
              <SelectItem value="Sales">Sales</SelectItem>
              <SelectItem value="Marketing">Marketing</SelectItem>
              <SelectItem value="Admin">Administration</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Sub Department */}
        <div className="space-y-2">
          <Label htmlFor="sub_department">Sub Department</Label>
          <Input
            id="sub_department"
            value={formData.sub_department || ''}
            onChange={(e) => handleInputChange('sub_department', e.target.value)}
            placeholder="Enter sub department"
          />
        </div>

        {/* Designation */}
        <div className="space-y-2">
          <Label htmlFor="designation_name">Designation *</Label>
          <Input
            id="designation_name"
            value={formData.designation_name || ''}
            onChange={(e) => handleInputChange('designation_name', e.target.value)}
            placeholder="Enter job designation"
            required
          />
        </div>

        {/* Title */}
        <div className="space-y-2">
          <Label htmlFor="title">Title</Label>
          <Input
            id="title"
            value={formData.title || ''}
            onChange={(e) => handleInputChange('title', e.target.value)}
            placeholder="Enter title"
          />
        </div>

        {/* Branch */}
        <div className="space-y-2">
          <Label htmlFor="branch_name">Branch *</Label>
          <Select
            value={formData.branch_name || ''}
            onValueChange={(value) => handleInputChange('branch_name', value)}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select branch" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Head Office">Head Office</SelectItem>
              <SelectItem value="Branch 1">Branch 1</SelectItem>
              <SelectItem value="Branch 2">Branch 2</SelectItem>
              <SelectItem value="Branch 3">Branch 3</SelectItem>
              <SelectItem value="Regional Office">Regional Office</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Region */}
        <div className="space-y-2">
          <Label htmlFor="region">Region</Label>
          <Input
            id="region"
            value={formData.region || ''}
            onChange={(e) => handleInputChange('region', e.target.value)}
            placeholder="Enter region"
          />
        </div>

        {/* Father's Name */}
        <div className="space-y-2">
          <Label htmlFor="father_name">Father's Name</Label>
          <Input
            id="father_name"
            value={formData.father_name || ''}
            onChange={(e) => handleInputChange('father_name', e.target.value)}
            placeholder="Enter father's name"
          />
        </div>

        {/* Location */}
        <div className="space-y-2">
          <Label htmlFor="location">Location</Label>
          <Input
            id="location"
            value={formData.location || ''}
            onChange={(e) => handleInputChange('location', e.target.value)}
            placeholder="Enter location"
          />
        </div>

        {/* Present Residence No */}
        <div className="space-y-2">
          <Label htmlFor="present_res_no">Present Residence No</Label>
          <Input
            id="present_res_no"
            value={formData.present_res_no || ''}
            onChange={(e) => handleInputChange('present_res_no', e.target.value)}
            placeholder="Enter present residence number"
          />
        </div>

        {/* Present City */}
        <div className="space-y-2">
          <Label htmlFor="present_city">Present City</Label>
          <Input
            id="present_city"
            value={formData.present_city || ''}
            onChange={(e) => handleInputChange('present_city', e.target.value)}
            placeholder="Enter present city"
          />
        </div>

        {/* Present Pincode */}
        <div className="space-y-2">
          <Label htmlFor="present_pincode">Present Pincode</Label>
          <Input
            id="present_pincode"
            value={formData.present_pincode || ''}
            onChange={(e) => handleInputChange('present_pincode', e.target.value)}
            placeholder="Enter present pincode"
          />
        </div>

        {/* UAN */}
        <div className="space-y-2">
          <Label htmlFor="uan">UAN Number</Label>
          <Input
            id="uan"
            value={formData.uan || ''}
            onChange={(e) => handleInputChange('uan', e.target.value)}
            placeholder="Enter UAN number"
          />
        </div>

        {/* ESI Number */}
        <div className="space-y-2">
          <Label htmlFor="esi_number">ESI Number</Label>
          <Input
            id="esi_number"
            value={formData.esi_number || ''}
            onChange={(e) => handleInputChange('esi_number', e.target.value)}
            placeholder="Enter ESI number"
          />
        </div>

        {/* Company Name */}
        <div className="space-y-2">
          <Label htmlFor="companyname">Company Name</Label>
          <Input
            id="companyname"
            value={formData.companyname || ''}
            onChange={(e) => handleInputChange('companyname', e.target.value)}
            placeholder="Enter company name"
          />
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end gap-3 pt-6 border-t">
        <Button
          type="button"
          variant="outline"
          onClick={handleCancel}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button
          type="submit"
          disabled={isSubmitting}
        >
          {isSubmitting ? 'Adding...' : 'Add Employee'}
        </Button>
      </div>
    </form>
  );
}
