"use client";

import { useState, useEffect } from "react";
import { FiWifiOff, FiRefreshCw } from "react-icons/fi";

export default function OfflineFallback() {
  const [isOnline, setIsOnline] = useState(true);

  useEffect(() => {
    // Set initial state
    setIsOnline(navigator.onLine);

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, []);

  if (isOnline) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center bg-black">
      <div className="text-center px-6 max-w-md">
        {/* Icon */}
        <div className="mb-8 flex justify-center">
          <div className="relative">
            <div className="w-32 h-32 bg-gradient-to-br from-yellow-400/20 to-yellow-500/10 rounded-full flex items-center justify-center">
              <FiWifiOff className="w-16 h-16 text-yellow-400" strokeWidth={1.5} />
            </div>
            {/* Pulse animation */}
            <div className="absolute inset-0 w-32 h-32 bg-yellow-400/20 rounded-full animate-ping" />
          </div>
        </div>

        {/* Title */}
        <h1 className="text-3xl md:text-4xl font-bold text-white mb-4">
          You're Offline
        </h1>

        {/* Message */}
        <p className="text-gray-400 text-lg mb-8">
          Please check your internet connection and try again.
        </p>

        {/* Retry Button */}
        <button
          onClick={() => window.location.reload()}
          className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-yellow-400 to-yellow-500 text-black font-semibold rounded-xl hover:from-yellow-500 hover:to-yellow-600 transition-all duration-300 shadow-lg hover:shadow-yellow-500/50"
        >
          <FiRefreshCw className="w-5 h-5" />
          Retry Connection
        </button>

        {/* Additional info */}
        <div className="mt-12 text-sm text-gray-500">
          <p>This application requires an active internet connection</p>
        </div>
      </div>
    </div>
  );
}
