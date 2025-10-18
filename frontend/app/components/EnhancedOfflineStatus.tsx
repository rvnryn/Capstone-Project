"use client";

import React, { useState, useEffect } from "react";
import { syncManager } from "../utils/offlineSync";
import { offlineUtils } from "../utils/offlineStorage";
import { motion, AnimatePresence } from "framer-motion";

export const EnhancedOfflineStatusBar: React.FC = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [pendingCount, setPendingCount] = useState(0);
  const [isSyncing, setIsSyncing] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [stats, setStats] = useState<any>(null);

  useEffect(() => {
    const updateStatus = async () => {
      setIsOnline(navigator.onLine);
      const count = await syncManager.getPendingCount();
      setPendingCount(count);
      setIsSyncing(syncManager.isSyncInProgress());

      if (showDetails) {
        const dbStats = await offlineUtils.getStats();
        setStats(dbStats);
      }
    };

    updateStatus();

    // Update every 5 seconds
    const interval = setInterval(updateStatus, 5000);

    // Listen for online/offline events
    const handleOnline = () => {
      setIsOnline(true);
      updateStatus();
    };

    const handleOffline = () => {
      setIsOnline(false);
      updateStatus();
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    // Listen for sync events
    const syncListener = () => {
      updateStatus();
    };

    syncManager.addSyncListener(syncListener);

    return () => {
      clearInterval(interval);
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
      syncManager.removeSyncListener(syncListener);
    };
  }, [showDetails]);

  const handleSync = async () => {
    if (isOnline && pendingCount > 0) {
      setIsSyncing(true);
      await syncManager.syncAllActions();
      setIsSyncing(false);
    }
  };

  // Don't show if online and no pending changes
  if (isOnline && pendingCount === 0 && !showDetails) {
    return null;
  }

  return (
    <>
      <motion.div
        initial={{ y: -100 }}
        animate={{ y: 0 }}
        className="fixed top-0 left-0 right-0 z-50 px-4 py-2"
      >
        <div
          className={`mx-auto max-w-7xl rounded-lg shadow-lg px-4 py-2 flex items-center justify-between ${
            isOnline
              ? pendingCount > 0
                ? "bg-yellow-500 text-yellow-900"
                : "bg-green-500 text-green-900"
              : "bg-red-500 text-white"
          }`}
        >
          <div className="flex items-center gap-3">
            {/* Status Icon */}
            <div className="flex items-center gap-2">
              {isOnline ? (
                <div className="w-2 h-2 bg-green-900 rounded-full animate-pulse" />
              ) : (
                <div className="w-2 h-2 bg-white rounded-full animate-pulse" />
              )}
              <span className="font-semibold">
                {isOnline ? "Online" : "Offline"}
              </span>
            </div>

            {/* Pending Changes */}
            {pendingCount > 0 && (
              <div className="flex items-center gap-2">
                <span className="text-sm">
                  {pendingCount} pending {pendingCount === 1 ? "change" : "changes"}
                </span>
              </div>
            )}

            {/* Syncing Indicator */}
            {isSyncing && (
              <div className="flex items-center gap-2">
                <div className="animate-spin rounded-full h-4 w-4 border-2 border-current border-t-transparent" />
                <span className="text-sm">Syncing...</span>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2">
            {/* Sync Button */}
            {isOnline && pendingCount > 0 && !isSyncing && (
              <button
                onClick={handleSync}
                className="px-3 py-1 rounded bg-white bg-opacity-20 hover:bg-opacity-30 text-sm font-medium transition-colors"
              >
                Sync Now
              </button>
            )}

            {/* Details Toggle */}
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="px-3 py-1 rounded bg-white bg-opacity-20 hover:bg-opacity-30 text-sm font-medium transition-colors"
            >
              {showDetails ? "Hide" : "Details"}
            </button>
          </div>
        </div>
      </motion.div>

      {/* Details Panel */}
      <AnimatePresence>
        {showDetails && (
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="fixed top-16 left-0 right-0 z-40 px-4"
          >
            <div className="mx-auto max-w-7xl rounded-lg shadow-xl bg-white dark:bg-gray-800 p-6">
              <h3 className="text-lg font-bold mb-4">Offline Storage Status</h3>

              {stats && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Menu Items
                    </div>
                    <div className="text-2xl font-bold">{stats.counts.menu || 0}</div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Inventory
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.counts.inventory || 0}
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Suppliers
                    </div>
                    <div className="text-2xl font-bold">
                      {stats.counts.suppliers || 0}
                    </div>
                  </div>

                  <div className="bg-gray-100 dark:bg-gray-700 p-4 rounded">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Pending Sync
                    </div>
                    <div className="text-2xl font-bold text-yellow-600">
                      {stats.pendingActions || 0}
                    </div>
                  </div>
                </div>
              )}

              <div className="mt-4 flex gap-2">
                <button
                  onClick={async () => {
                    await offlineUtils.downloadBackup();
                  }}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  Download Backup
                </button>

                <button
                  onClick={async () => {
                    if (
                      confirm(
                        "Are you sure you want to clear all offline data? This cannot be undone."
                      )
                    ) {
                      await offlineUtils.clearAllOfflineData();
                      const newStats = await offlineUtils.getStats();
                      setStats(newStats);
                    }
                  }}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                >
                  Clear All Data
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default EnhancedOfflineStatusBar;
