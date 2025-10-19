"use client";
import React from "react";
import { FaSpinner } from "react-icons/fa";
import { useGlobalLoading } from "@/app/context/GlobalLoadingContext";

export function GlobalLoadingOverlay() {
  const { loading, message } = useGlobalLoading();
  if (!loading) return null;
  return (
    <div className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-black/80 backdrop-blur-sm">
      <FaSpinner className="animate-spin text-yellow-400 text-5xl mb-4" />
      <span className="text-yellow-200 text-xl font-semibold">{message || "Loading..."}</span>
    </div>
  );
}
