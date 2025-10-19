"use client";
import React, { createContext, useContext, useState } from "react";

interface GlobalLoadingContextType {
  loading: boolean;
  setLoading: (value: boolean) => void;
  message?: string;
  setMessage: (msg: string) => void;
}

const GlobalLoadingContext = createContext<GlobalLoadingContextType | undefined>(undefined);

export function GlobalLoadingProvider({ children }: { children: React.ReactNode }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string>("Loading...");

  return (
    <GlobalLoadingContext.Provider value={{ loading, setLoading, message, setMessage }}>
      {children}
    </GlobalLoadingContext.Provider>
  );
}

export function useGlobalLoading() {
  const context = useContext(GlobalLoadingContext);
  if (!context) throw new Error("useGlobalLoading must be used within a GlobalLoadingProvider");
  return context;
}
