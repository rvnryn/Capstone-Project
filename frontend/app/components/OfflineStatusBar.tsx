"use client";

import { useState, useEffect } from "react";
import { useGlobalOfflineSync } from "@/app/hooks/useGlobalOfflineSync";

export default function OfflineStatusBar() {
  const [isOnline, setIsOnline] = useState(true);
  const { getTotalPendingActions, syncAll } = useGlobalOfflineSync();
  const [pendingCount, setPendingCount] = useState(0);

  useEffect(() => {
    const updateOnlineStatus = () => {
      setIsOnline(navigator.onLine);
    };

    const updatePendingCount = () => {
      setPendingCount(getTotalPendingActions());
    };

    // Update on mount
    updateOnlineStatus();
    updatePendingCount();

    // Listen for online/offline events
    window.addEventListener("online", updateOnlineStatus);
    window.addEventListener("offline", updateOnlineStatus);

    // Update pending count periodically
    const interval = setInterval(updatePendingCount, 5000);

    return () => {
      window.removeEventListener("online", updateOnlineStatus);
      window.removeEventListener("offline", updateOnlineStatus);
      clearInterval(interval);
    };
  }, [getTotalPendingActions]);

  if (isOnline && pendingCount === 0) {
    return null; // Don't show anything when online with no pending actions
  }

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-50 px-4 py-2 text-sm font-medium text-center transition-all duration-300 ${
        isOnline ? "bg-blue-600 text-white" : "bg-yellow-600 text-white"
      }`}
    >
      <div className="flex items-center justify-center space-x-4">
        <div className="flex items-center space-x-2">
          <div
            className={`w-2 h-2 rounded-full ${
              isOnline ? "bg-green-400" : "bg-red-400"
            } animate-pulse`}
          />
          <span>{isOnline ? "Online" : "Offline Mode"}</span>
        </div>

        {pendingCount > 0 && (
          <>
            <span className="text-white/80">•</span>
            <div className="flex items-center space-x-2">
              <span>{pendingCount} changes pending sync</span>
              {isOnline && (
                <button
                  onClick={syncAll}
                  className="px-2 py-1 text-xs bg-white/20 hover:bg-white/30 rounded transition-colors"
                >
                  Sync Now
                </button>
              )}
            </div>
          </>
        )}

        {!isOnline && (
          <>
            <span className="text-white/80">•</span>
            <span className="text-white/90">
              Changes will sync automatically when back online
            </span>
          </>
        )}
      </div>
    </div>
  );
}
