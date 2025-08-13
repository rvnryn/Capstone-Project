import React from "react";
import { useLoading } from "../context/LoadingContext";

const GlobalLoader: React.FC = () => {
  const { isLoading } = useLoading();

  if (!isLoading) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="w-16 h-16 border-4 border-yellow-400 border-t-transparent rounded-full animate-spin"></div>
    </div>
  );
};

export default GlobalLoader;
