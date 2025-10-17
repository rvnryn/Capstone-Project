"use client";

import React from "react";
import { FiWifiOff, FiRefreshCw, FiClock } from "react-icons/fi";
import { getCacheAge } from "../hooks/useOfflineReports";

export interface OfflineReportBannerProps {
  isFromCache: boolean;
  lastFetched: number | null;
  onRefresh?: () => void;
  reportType?: string;
  loading?: boolean;
}

export const OfflineReportBanner: React.FC<OfflineReportBannerProps> = ({
  isFromCache,
  lastFetched,
  onRefresh,
  reportType = "report",
  loading = false,
}) => {
  if (!isFromCache && !loading) return null;

  const cacheAge = getCacheAge(lastFetched);
  const isOnline = navigator.onLine;

  return (
    <div
      className={`w-full rounded-lg p-3 sm:p-4 mb-4 border transition-all duration-300 ${
        isFromCache
          ? "bg-blue-500/10 border-blue-500/30 text-blue-200"
          : "bg-gray-500/10 border-gray-500/30 text-gray-200"
      }`}
    >
      <div className="flex items-start sm:items-center justify-between gap-3 flex-col sm:flex-row">
        <div className="flex items-start gap-3 flex-1">
          <div
            className={`p-2 rounded-lg flex-shrink-0 ${
              isFromCache ? "bg-blue-500/20" : "bg-gray-500/20"
            }`}
          >
            {loading ? (
              <FiRefreshCw className="text-lg animate-spin" />
            ) : (
              <FiWifiOff className="text-lg" />
            )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <span className="font-semibold text-sm sm:text-base">
                {loading
                  ? "Loading..."
                  : isFromCache
                  ? `Viewing Cached ${reportType}`
                  : "Offline Mode"}
              </span>
              {isFromCache && !isOnline && (
                <span className="px-2 py-0.5 bg-orange-500/20 text-orange-300 text-xs rounded-full border border-orange-500/30">
                  Offline
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm opacity-80 flex items-center gap-2">
              {isFromCache && lastFetched && (
                <>
                  <FiClock className="text-sm" />
                  <span>Last updated: {cacheAge}</span>
                </>
              )}
              {!isFromCache && !loading && (
                <span>No internet connection. Cached data not available.</span>
              )}
            </p>

            {isFromCache && isOnline && (
              <p className="text-xs opacity-70 mt-1">
                You're online now. Refresh to get latest data.
              </p>
            )}
          </div>
        </div>

        {onRefresh && isOnline && !loading && (
          <button
            onClick={onRefresh}
            disabled={loading}
            className={`flex items-center gap-2 px-3 sm:px-4 py-2 rounded-lg font-medium text-xs sm:text-sm transition-all duration-200 w-full sm:w-auto justify-center ${
              loading
                ? "bg-gray-500/30 text-gray-400 cursor-not-allowed"
                : "bg-blue-500/20 hover:bg-blue-500/30 text-blue-200 border border-blue-500/30 hover:border-blue-500/50"
            }`}
          >
            <FiRefreshCw className={loading ? "animate-spin" : ""} />
            <span>Refresh</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default OfflineReportBanner;
