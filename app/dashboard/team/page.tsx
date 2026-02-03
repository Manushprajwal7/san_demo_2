"use client";

import { useState } from "react";
import { useAuth } from "@/lib/auth-context";
import { DashboardHeader } from "@/components/dashboard-header";
import { DashboardSidebar } from "@/components/dashboard-sidebar";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface TeamMember {
  id: string;
  name: string;
  email: string;
  position: string;
  department: string;
  joinDate: string;
  status: "present" | "absent" | "leave" | "remote";
  leaves: { used: number; remaining: number };
}

export default function TeamPage() {
  const { user } = useAuth();
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [filterStatus, setFilterStatus] = useState("all");

  const teamMembers: TeamMember[] = [
    {
      id: "emp-002",
      name: "Arjun Kumar",
      email: "arjun.kumar@sangeetha.com",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2023-03-15",
      status: "present",
      leaves: { used: 8, remaining: 12 },
    },
    {
      id: "emp-003",
      name: "Sneha Desai",
      email: "sneha.desai@sangeetha.com",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2022-06-01",
      status: "present",
      leaves: { used: 6, remaining: 14 },
    },
    {
      id: "emp-004",
      name: "Rohit Verma",
      email: "rohit.verma@sangeetha.com",
      position: "Senior Sales Executive",
      department: "Sales",
      joinDate: "2021-01-20",
      status: "leave",
      leaves: { used: 12, remaining: 8 },
    },
    {
      id: "emp-005",
      name: "Divya Iyer",
      email: "divya.iyer@sangeetha.com",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2023-09-10",
      status: "remote",
      leaves: { used: 4, remaining: 16 },
    },
    {
      id: "emp-006",
      name: "Vikas Singh",
      email: "vikas.singh@sangeetha.com",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2022-11-05",
      status: "absent",
      leaves: { used: 10, remaining: 10 },
    },
    {
      id: "emp-007",
      name: "Ananya Nair",
      email: "ananya.nair@sangeetha.com",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2023-05-18",
      status: "present",
      leaves: { used: 5, remaining: 15 },
    },
    {
      id: "emp-008",
      name: "Karthik Reddy",
      email: "karthik.reddy@sangeetha.com",
      position: "Junior Sales Executive",
      department: "Sales",
      joinDate: "2024-01-15",
      status: "present",
      leaves: { used: 2, remaining: 18 },
    },
    {
      id: "emp-009",
      name: "Priyanka Sharma",
      email: "priyanka.sharma@sangeetha.com",
      position: "Sales Executive",
      department: "Sales",
      joinDate: "2022-08-22",
      status: "present",
      leaves: { used: 9, remaining: 11 },
    },
  ];

  const filteredMembers =
    filterStatus === "all"
      ? teamMembers
      : teamMembers.filter((m) => m.status === filterStatus);

  const getStatusColor = (status: string) => {
    switch (status) {
      case "present":
        return "bg-green-100 text-green-800";
      case "absent":
        return "bg-red-100 text-red-800";
      case "leave":
        return "bg-yellow-100 text-yellow-800";
      case "remote":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "present":
        return "P";
      case "absent":
        return "A";
      case "leave":
        return "L";
      case "remote":
        return "R";
      default:
        return "?";
    }
  };

  return (
    <div className="flex min-h-screen bg-gray-100">
      <DashboardSidebar />
      <div className="flex-1 flex flex-col">
        <DashboardHeader />
        <main className="flex-1 p-8">
          <div className="max-w-6xl mx-auto space-y-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">Team Members</h1>
              <p className="text-gray-600 mt-2">
                Manage and track your team's attendance and performance
              </p>
            </div>

            {/* Status Summary */}
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {[
                {
                  label: "Present",
                  count: teamMembers.filter((m) => m.status === "present")
                    .length,
                  color: "bg-green-50",
                },
                {
                  label: "Absent",
                  count: teamMembers.filter((m) => m.status === "absent")
                    .length,
                  color: "bg-red-50",
                },
                {
                  label: "On Leave",
                  count: teamMembers.filter((m) => m.status === "leave").length,
                  color: "bg-yellow-50",
                },
                {
                  label: "Remote",
                  count: teamMembers.filter((m) => m.status === "remote")
                    .length,
                  color: "bg-blue-50",
                },
              ].map((stat, idx) => (
                <Card key={idx} className={`p-4 ${stat.color}`}>
                  <p className="text-gray-600 text-sm">{stat.label}</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stat.count}
                  </p>
                </Card>
              ))}
            </div>

            {/* Filter Buttons */}
            <div className="flex flex-wrap gap-2">
              {["all", "present", "absent", "leave", "remote"].map((status) => (
                <button
                  key={status}
                  onClick={() => setFilterStatus(status)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    filterStatus === status
                      ? "bg-indigo-600 text-white"
                      : "bg-white text-gray-700 hover:bg-gray-100 border border-gray-300"
                  }`}
                >
                  {status.charAt(0).toUpperCase() + status.slice(1)}
                </button>
              ))}
            </div>

            {/* Team Members Table */}
            <Card className="overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Name
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Position
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Leaves
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-semibold text-gray-900">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {filteredMembers.map((member) => (
                      <tr
                        key={member.id}
                        className="hover:bg-gray-50 transition-colors"
                      >
                        <td className="px-6 py-4">
                          <div>
                            <p className="font-medium text-gray-900">
                              {member.name}
                            </p>
                            <p className="text-sm text-gray-600">
                              {member.email}
                            </p>
                          </div>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {member.position}
                        </td>
                        <td className="px-6 py-4">
                          <span
                            className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold ${getStatusColor(
                              member.status
                            )}`}
                          >
                            <span>{getStatusIcon(member.status)}</span>
                            {member.status.charAt(0).toUpperCase() +
                              member.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-600">
                          {member.leaves.used}/
                          {member.leaves.used + member.leaves.remaining} days
                        </td>
                        <td className="px-6 py-4">
                          <button
                            onClick={() => setSelectedMember(member)}
                            className="text-indigo-600 hover:text-indigo-700 font-medium text-sm"
                          >
                            View Details
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Member Details Modal */}
            {selectedMember && (
              <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
                <Card className="w-full max-w-2xl">
                  <div className="p-8">
                    <div className="flex items-start justify-between mb-6">
                      <div>
                        <h2 className="text-2xl font-bold text-gray-900">
                          {selectedMember.name}
                        </h2>
                        <p className="text-gray-600 mt-1">
                          {selectedMember.position}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedMember(null)}
                        className="text-gray-400 hover:text-gray-600 text-2xl"
                      >
                        ×
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-6 mb-6">
                      <div>
                        <p className="text-sm text-gray-600">Email</p>
                        <p className="font-medium text-gray-900">
                          {selectedMember.email}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Department</p>
                        <p className="font-medium text-gray-900">
                          {selectedMember.department}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Join Date</p>
                        <p className="font-medium text-gray-900">
                          {selectedMember.joinDate}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Status</p>
                        <span
                          className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold mt-1 ${getStatusColor(
                            selectedMember.status
                          )}`}
                        >
                          {selectedMember.status.charAt(0).toUpperCase() +
                            selectedMember.status.slice(1)}
                        </span>
                      </div>
                    </div>

                    <div className="border-t border-gray-200 pt-6">
                      <p className="text-sm font-semibold text-gray-900 mb-3">
                        Leave Balance
                      </p>
                      <div className="bg-gray-50 p-4 rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-sm text-gray-600">Used</p>
                            <p className="text-2xl font-bold text-gray-900">
                              {selectedMember.leaves.used}
                            </p>
                          </div>
                          <div className="text-2xl">/</div>
                          <div className="text-right">
                            <p className="text-sm text-gray-600">Remaining</p>
                            <p className="text-2xl font-bold text-green-600">
                              {selectedMember.leaves.remaining}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="flex gap-3 mt-8 justify-end">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedMember(null)}
                      >
                        Close
                      </Button>
                      <Button className="bg-gray-700 hover:bg-gray-800 text-white">
                        Send Message
                      </Button>
                    </div>
                  </div>
                </Card>
              </div>
            )}
          </div>
        </main>
      </div>
    </div>
  );
}
