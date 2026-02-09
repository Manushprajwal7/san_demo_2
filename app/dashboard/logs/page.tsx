"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Activity, Clock, User, FileText, Settings, Database } from "lucide-react";

interface LogEntry {
  id: string;
  timestamp: string;
  type: "info" | "warning" | "error" | "success";
  category: "user" | "system" | "compliance" | "employee" | "branch";
  message: string;
  details?: string;
  userId?: string;
  userName?: string;
}

const mockLogs: LogEntry[] = [
  {
    id: "1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
    type: "info",
    category: "user",
    message: "User logged in",
    userName: "John Doe",
    userId: "user_123"
  },
  {
    id: "2",
    timestamp: new Date(Date.now() - 1000 * 60 * 15).toISOString(),
    type: "success",
    category: "employee",
    message: "New employee record created",
    details: "Employee ID: EMP001, Name: Jane Smith",
    userName: "Admin User"
  },
  {
    id: "3",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
    type: "warning",
    category: "compliance",
    message: "Compliance document expiring soon",
    details: "Document: License ABC123 expires in 7 days",
    userName: "System"
  },
  {
    id: "4",
    timestamp: new Date(Date.now() - 1000 * 60 * 45).toISOString(),
    type: "error",
    category: "system",
    message: "Database connection failed",
    details: "Connection timeout after 30 seconds",
    userName: "System"
  },
  {
    id: "5",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
    type: "info",
    category: "branch",
    message: "Branch information updated",
    details: "Branch: Main Branch - Address updated",
    userName: "Manager User"
  },
  {
    id: "6",
    timestamp: new Date(Date.now() - 1000 * 60 * 120).toISOString(),
    type: "success",
    category: "user",
    message: "User profile updated",
    details: "Email and phone number updated",
    userName: "John Doe"
  }
];

const typeColors = {
  info: "bg-blue-100 text-blue-800 border-blue-200",
  success: "bg-green-100 text-green-800 border-green-200",
  warning: "bg-yellow-100 text-yellow-800 border-yellow-200",
  error: "bg-red-100 text-red-800 border-red-200"
};

const categoryIcons = {
  user: User,
  system: Settings,
  compliance: FileText,
  employee: User,
  branch: Database
};

export default function LogsPage() {
  const [logs, setLogs] = useState<LogEntry[]>(mockLogs);
  const [filter, setFilter] = useState<string>("all");

  const filteredLogs = filter === "all" 
    ? logs 
    : logs.filter(log => log.type === filter);

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInMinutes = Math.floor((now.getTime() - date.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "Just now";
    if (diffInMinutes < 60) return `${diffInMinutes} minutes ago`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)} hours ago`;
    return `${Math.floor(diffInMinutes / 1440)} days ago`;
  };

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">System Logs</h1>
          <p className="text-gray-600 mt-2">Monitor application activity and system events</p>
        </div>
        <div className="flex items-center gap-2">
          <Activity className="w-5 h-5 text-gray-500" />
          <span className="text-sm text-gray-500">Live Monitoring</span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Total Logs</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{logs.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Errors</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">
              {logs.filter(log => log.type === "error").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Warnings</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {logs.filter(log => log.type === "warning").length}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-gray-600">Success</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {logs.filter(log => log.type === "success").length}
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest system events and user actions</CardDescription>
            </div>
            <div className="flex gap-2">
              <select
                value={filter}
                onChange={(e) => setFilter(e.target.value)}
                className="px-3 py-1 border border-gray-300 rounded-md text-sm"
              >
                <option value="all">All Types</option>
                <option value="info">Info</option>
                <option value="success">Success</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
              </select>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <ScrollArea className="h-[600px]">
            <div className="space-y-4">
              {filteredLogs.map((log) => {
                const IconComponent = categoryIcons[log.category];
                return (
                  <div
                    key={log.id}
                    className="flex items-start gap-4 p-4 rounded-lg border border-gray-200 hover:bg-gray-50 transition-colors"
                  >
                    <div className="flex-shrink-0 mt-1">
                      <IconComponent className="w-5 h-5 text-gray-500" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge className={typeColors[log.type]}>
                          {log.type.toUpperCase()}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {log.category}
                        </Badge>
                        <div className="flex items-center gap-1 text-xs text-gray-500 ml-auto">
                          <Clock className="w-3 h-3" />
                          {formatTimestamp(log.timestamp)}
                        </div>
                      </div>
                      <p className="text-sm font-medium text-gray-900 mb-1">
                        {log.message}
                      </p>
                      {log.details && (
                        <p className="text-xs text-gray-600 mb-2">{log.details}</p>
                      )}
                      {log.userName && (
                        <p className="text-xs text-gray-500">
                          by <span className="font-medium">{log.userName}</span>
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>
        </CardContent>
      </Card>
    </div>
  );
}
