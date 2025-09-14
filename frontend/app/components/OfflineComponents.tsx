"use client";

import React from "react";
import { useOffline } from "@/app/context/OfflineContext";
import { useOfflineDataManager } from "@/app/hooks/useOfflineDataManager";
import {
  MdSignalWifi4Bar,
  MdSignalWifiOff,
  MdCloud,
  MdCloudOff,
  MdAccessTime,
  MdStorage,
  MdWarning,
} from "react-icons/md";

// Offline Status Indicator Component
export const OfflineStatusIndicator: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { isOnline, isOfflineMode } = useOffline();
  const { getOfflineDataSummary, lastSyncTime } = useOfflineDataManager();

  const summary = getOfflineDataSummary();
  const lastSyncDate = lastSyncTime ? new Date(lastSyncTime) : null;

  const getStatusColor = () => {
    if (!isOnline) return "text-red-500";
    if (isOfflineMode) return "text-yellow-500";
    return "text-green-500";
  };

  const getStatusText = () => {
    if (!isOnline) return "Offline";
    if (isOfflineMode) return "Offline Mode";
    return "Online";
  };

  const getStatusIcon = () => {
    if (!isOnline) return <MdSignalWifiOff className="w-4 h-4" />;
    if (isOfflineMode) return <MdCloudOff className="w-4 h-4" />;
    return <MdSignalWifi4Bar className="w-4 h-4" />;
  };

  return (
    <div className={`inline-flex items-center space-x-2 ${className}`}>
      <div className={`flex items-center space-x-1 ${getStatusColor()}`}>
        {getStatusIcon()}
        <span className="text-sm font-medium">{getStatusText()}</span>
      </div>

      {(isOfflineMode || !isOnline) && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <MdStorage className="w-3 h-3" />
          <span>
            {summary.totalAvailable}/{summary.totalPossible} cached
          </span>
        </div>
      )}

      {lastSyncDate && (
        <div className="flex items-center space-x-1 text-xs text-gray-500">
          <MdAccessTime className="w-3 h-3" />
          <span>Synced {lastSyncDate.toLocaleTimeString()}</span>
        </div>
      )}
    </div>
  );
};

// Offline Data Banner Component
export const OfflineDataBanner: React.FC<{
  dataType: string;
  isFromCache: boolean;
  className?: string;
}> = ({ dataType, isFromCache, className = "" }) => {
  const { isOnline, isOfflineMode } = useOffline();

  if (isOnline && !isOfflineMode && !isFromCache) {
    return null; // Don't show banner when online with fresh data
  }

  return (
    <div
      className={`bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 ${className}`}
    >
      <div className="flex items-center space-x-2">
        <MdWarning className="w-4 h-4 text-yellow-600 flex-shrink-0" />
        <div className="flex-1">
          <p className="text-sm text-yellow-800">
            {isFromCache
              ? `Showing cached ${dataType} data. Some information may be outdated.`
              : `Currently viewing ${dataType} in offline mode.`}
          </p>
          {!isOnline && (
            <p className="text-xs text-yellow-700 mt-1">
              Connect to the internet to get the latest updates.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Offline Card Wrapper Component
export const OfflineCard: React.FC<{
  children: React.ReactNode;
  isFromCache?: boolean;
  lastUpdated?: string;
  dataType?: string;
  className?: string;
}> = ({
  children,
  isFromCache = false,
  lastUpdated,
  dataType = "data",
  className = "",
}) => {
  const { isOnline, isOfflineMode } = useOffline();

  const showOfflineIndicator = !isOnline || isOfflineMode || isFromCache;

  return (
    <div className={`relative ${className}`}>
      {children}

      {showOfflineIndicator && (
        <div className="absolute top-2 right-2">
          <div className="bg-gray-900 bg-opacity-75 text-white text-xs px-2 py-1 rounded-md flex items-center space-x-1">
            {isFromCache ? (
              <>
                <MdStorage className="w-3 h-3" />
                <span>Cached</span>
              </>
            ) : (
              <>
                <MdCloudOff className="w-3 h-3" />
                <span>Offline</span>
              </>
            )}
          </div>
        </div>
      )}

      {isFromCache && lastUpdated && (
        <div className="absolute bottom-2 right-2">
          <div className="bg-gray-700 bg-opacity-75 text-white text-xs px-2 py-1 rounded-md">
            Updated: {new Date(lastUpdated).toLocaleString()}
          </div>
        </div>
      )}
    </div>
  );
};

// Offline Loading Component
export const OfflineLoading: React.FC<{
  message?: string;
  showOfflineMessage?: boolean;
}> = ({ message = "Loading...", showOfflineMessage = true }) => {
  const { isOnline } = useOffline();

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      <p className="text-gray-600">{message}</p>

      {showOfflineMessage && !isOnline && (
        <div className="flex items-center space-x-2 text-yellow-600">
          <MdSignalWifiOff className="w-4 h-4" />
          <span className="text-sm">Loading from cache...</span>
        </div>
      )}
    </div>
  );
};

// Offline Error Component
export const OfflineError: React.FC<{
  error: string;
  onRetry?: () => void;
  showCacheOption?: boolean;
  onUseCachedData?: () => void;
}> = ({ error, onRetry, showCacheOption = false, onUseCachedData }) => {
  const { isOnline } = useOffline();

  return (
    <div className="flex flex-col items-center justify-center p-8 space-y-4">
      <div className="flex items-center justify-center w-16 h-16 bg-red-100 rounded-full">
        <MdWarning className="w-8 h-8 text-red-600" />
      </div>

      <div className="text-center">
        <h3 className="text-lg font-medium text-gray-900 mb-2">
          Unable to Load Data
        </h3>
        <p className="text-gray-600 mb-4">{error}</p>

        {!isOnline && (
          <p className="text-sm text-yellow-600 mb-4">
            You appear to be offline. Check your internet connection.
          </p>
        )}
      </div>

      <div className="flex space-x-3">
        {onRetry && (
          <button
            onClick={onRetry}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Try Again
          </button>
        )}

        {showCacheOption && onUseCachedData && (
          <button
            onClick={onUseCachedData}
            className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 transition-colors flex items-center space-x-2"
          >
            <MdStorage className="w-4 h-4" />
            <span>Use Cached Data</span>
          </button>
        )}
      </div>
    </div>
  );
};

// Offline Data Summary Component
export const OfflineDataSummary: React.FC<{ className?: string }> = ({
  className = "",
}) => {
  const { getOfflineDataSummary } = useOfflineDataManager();
  const summary = getOfflineDataSummary();

  const dataTypes = [
    { key: "inventory", label: "Inventory", available: summary.inventory },
    { key: "menu", label: "Menu", available: summary.menu },
    { key: "users", label: "Users", available: summary.users },
    { key: "sales", label: "Sales", available: summary.sales },
    { key: "dashboard", label: "Dashboard", available: summary.dashboard },
    { key: "suppliers", label: "Suppliers", available: summary.suppliers },
  ];

  return (
    <div className={`bg-white rounded-lg border p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-gray-900">
          Offline Data Status
        </h3>
        <div className="text-sm text-gray-500">
          {summary.completionPercentage.toFixed(0)}% Available
        </div>
      </div>

      <div className="space-y-3">
        {dataTypes.map((item) => (
          <div key={item.key} className="flex items-center justify-between">
            <span className="text-sm text-gray-700">{item.label}</span>
            <div className="flex items-center space-x-2">
              {item.available ? (
                <>
                  <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                  <span className="text-xs text-green-600">Available</span>
                </>
              ) : (
                <>
                  <div className="w-2 h-2 bg-gray-300 rounded-full"></div>
                  <span className="text-xs text-gray-500">Not Cached</span>
                </>
              )}
            </div>
          </div>
        ))}
      </div>

      {summary.lastSync && (
        <div className="mt-4 pt-4 border-t border-gray-200">
          <div className="flex items-center justify-between text-xs text-gray-500">
            <span>Last sync:</span>
            <span>{new Date(summary.lastSync).toLocaleString()}</span>
          </div>
        </div>
      )}
    </div>
  );
};

// Sync Button Component
export const SyncButton: React.FC<{
  onSync: () => void;
  isLoading?: boolean;
  className?: string;
}> = ({ onSync, isLoading = false, className = "" }) => {
  const { isOnline } = useOffline();

  return (
    <button
      onClick={onSync}
      disabled={!isOnline || isLoading}
      className={`flex items-center space-x-2 px-4 py-2 rounded-md transition-colors ${
        !isOnline
          ? "bg-gray-300 text-gray-500 cursor-not-allowed"
          : isLoading
          ? "bg-blue-400 text-white cursor-not-allowed"
          : "bg-blue-600 text-white hover:bg-blue-700"
      } ${className}`}
    >
      <MdCloud className={`w-4 h-4 ${isLoading ? "animate-spin" : ""}`} />
      <span>
        {isLoading ? "Syncing..." : !isOnline ? "Offline" : "Sync Data"}
      </span>
    </button>
  );
};
