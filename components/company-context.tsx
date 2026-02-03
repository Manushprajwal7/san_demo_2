"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

interface CompanyContextType {
  company: string;
  setCompany: (company: string) => void;
}

const CompanyContext = createContext<CompanyContextType | undefined>(undefined);

export function CompanyProvider({ children }: { children: React.ReactNode }) {
  const [company, setCompanyState] = useState("sangeetha");

  useEffect(() => {
    const savedCompany = localStorage.getItem("selectedCompany");
    if (savedCompany) {
      setCompanyState(savedCompany);
    }
  }, []);

  const setCompany = (newCompany: string) => {
    setCompanyState(newCompany);
    localStorage.setItem("selectedCompany", newCompany);
  };

  return (
    <CompanyContext.Provider value={{ company, setCompany }}>
      {children}
    </CompanyContext.Provider>
  );
}

export function useCompany() {
  const context = useContext(CompanyContext);
  if (!context) {
    throw new Error("useCompany must be used within CompanyProvider");
  }
  return context;
}
