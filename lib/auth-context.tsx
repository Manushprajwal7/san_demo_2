"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

export type UserRole = "employee" | "manager" | "hr_admin" | "super_admin";

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  department?: string;
  position?: string;
  joinDate?: string;
  avatar?: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  register: (email: string, password: string, name: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Mock user database
const MOCK_USERS: Record<string, { password: string; user: User }> = {
  "employee@sangeetha.com": {
    password: "password123",
    user: {
      id: "emp-001",
      email: "employee@sangeetha.com",
      name: "Rajesh Kumar",
      role: "employee",
      department: "Sales",
      position: "Sales Executive",
      joinDate: "2022-01-15",
      avatar: "👨‍💼",
    },
  },
  "manager@sangeetha.com": {
    password: "password123",
    user: {
      id: "mgr-001",
      email: "manager@sangeetha.com",
      name: "Priya Sharma",
      role: "manager",
      department: "Sales",
      position: "Sales Manager",
      joinDate: "2020-06-01",
      avatar: "👩‍💼",
    },
  },
  "hr@sangeetha.com": {
    password: "password123",
    user: {
      id: "hr-001",
      email: "hr@sangeetha.com",
      name: "Amit Patel",
      role: "hr_admin",
      department: "Human Resources",
      position: "HR Manager",
      joinDate: "2019-03-10",
      avatar: "👨‍💻",
    },
  },
  "admin@sangeetha.com": {
    password: "password123",
    user: {
      id: "adm-001",
      email: "admin@sangeetha.com",
      name: "Vikram Singh",
      role: "super_admin",
      department: "Administration",
      position: "System Administrator",
      joinDate: "2018-01-01",
      avatar: "🧑‍💼",
    },
  },
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const savedUser = localStorage.getItem("hrms_user");
    if (savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch (error) {
        console.error("Failed to load user from localStorage");
      }
    }
    setIsLoading(false);
  }, []);

  const login = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 500));

      const mockUser = MOCK_USERS[email.toLowerCase()];
      if (!mockUser || mockUser.password !== password) {
        throw new Error("Invalid email or password");
      }

      setUser(mockUser.user);
      localStorage.setItem("hrms_user", JSON.stringify(mockUser.user));
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (email: string, password: string, name: string) => {
    setIsLoading(true);
    try {
      await new Promise((resolve) => setTimeout(resolve, 500));

      if (MOCK_USERS[email.toLowerCase()]) {
        throw new Error("Email already exists");
      }

      const newUser: User = {
        id: `emp-${Date.now()}`,
        email,
        name,
        role: "employee",
        department: "Unassigned",
        position: "Employee",
        joinDate: new Date().toISOString().split("T")[0],
      };

      MOCK_USERS[email.toLowerCase()] = {
        password,
        user: newUser,
      };

      setUser(newUser);
      localStorage.setItem("hrms_user", JSON.stringify(newUser));
    } finally {
      setIsLoading(false);
    }
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem("hrms_user");
  };

  return (
    <AuthContext.Provider value={{ user, isLoading, login, logout, register }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return context;
}
