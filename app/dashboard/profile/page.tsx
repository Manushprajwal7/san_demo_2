"use client";

import React from "react";

import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useState } from "react";

export default function ProfilePage() {
  const { user } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: "+91 98765 43210",
    address: "123 Main Street, Bangalore",
    city: "Bangalore",
    state: "Karnataka",
    pincode: "560001",
    department: user?.department || "",
    position: user?.position || "",
    joinDate: user?.joinDate || "",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSave = () => {
    setIsEditing(false);
    // In a real app, this would save to the database
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="max-w-4xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">My Profile</h1>
              <p className="text-gray-600 mt-2">
                Manage your personal and professional information
              </p>
            </div>

            {/* Profile Header */}
            <Card className="p-8">
              <div className="flex items-start justify-between mb-8">
                <div className="flex items-center gap-6">
                  <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center text-4xl">
                    {user?.avatar || "👤"}
                  </div>
                  <div>
                    <h2 className="text-2xl font-bold text-gray-900">
                      {user?.name}
                    </h2>
                    <p className="text-gray-600 capitalize">
                      {user?.position} • {user?.department}
                    </p>
                    <p className="text-sm text-gray-500 mt-2">ID: {user?.id}</p>
                  </div>
                </div>
                <Button
                  onClick={() => setIsEditing(!isEditing)}
                  className="bg-gray-700 hover:bg-gray-800 text-white"
                >
                  {isEditing ? "Cancel" : "Edit Profile"}
                </Button>
              </div>
            </Card>

            {/* Personal Information */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Personal Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Phone
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Date of Joining
                  </label>
                  <input
                    type="text"
                    name="joinDate"
                    value={formData.joinDate}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Address
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    City
                  </label>
                  <input
                    type="text"
                    name="city"
                    value={formData.city}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    State
                  </label>
                  <input
                    type="text"
                    name="state"
                    value={formData.state}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Pincode
                  </label>
                  <input
                    type="text"
                    name="pincode"
                    value={formData.pincode}
                    onChange={handleChange}
                    disabled={!isEditing}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-50 disabled:bg-gray-100 disabled:text-gray-600"
                  />
                </div>
              </div>
            </Card>

            {/* Professional Information */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Professional Information
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Department
                  </label>
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Position
                  </label>
                  <input
                    type="text"
                    name="position"
                    value={formData.position}
                    disabled
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg bg-gray-100 text-gray-600"
                  />
                </div>
              </div>
              <p className="text-sm text-gray-600 mt-4">
                Contact HR Admin to request changes to your department or
                position.
              </p>
            </Card>

            {/* Documents */}
            <Card className="p-6">
              <h3 className="text-xl font-bold text-gray-900 mb-6">
                Documents
              </h3>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">Offer Letter</p>
                      <p className="text-xs text-gray-600">
                        Uploaded on 15 Jan 2022
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-gray-700 font-medium">
                    Download
                  </button>
                </div>
                <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">📄</span>
                    <div>
                      <p className="font-medium text-gray-900">
                        Experience Certificate
                      </p>
                      <p className="text-xs text-gray-600">
                        Uploaded on 20 Dec 2023
                      </p>
                    </div>
                  </div>
                  <button className="text-gray-600 hover:text-gray-700 font-medium">
                    Download
                  </button>
                </div>
              </div>
            </Card>

            {isEditing && (
              <div className="flex gap-4 justify-end">
                <Button
                  onClick={() => setIsEditing(false)}
                  variant="outline"
                  className="px-6"
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleSave}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-6"
                >
                  Save Changes
                </Button>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
