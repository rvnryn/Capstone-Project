"use client";

import React from 'react';
import { usePWA, useOfflineQueue } from '@/app/hooks/usePWA';
import { PWACache } from '@/app/utils/pwaCache';
import { 
  MdWifiOff, 
  MdSync, 
  MdCheckCircle, 
  MdError, 
  MdInfo,
  MdCloudOff,
  MdCloudDone
} from 'react-icons/md';
import { FiWifiOff, FiWifi } from 'react-icons/fi';

interface OfflineDataDisplayProps {
  dataKey: string;
  dataType?: string;
  showDetails?: boolean;
  className?: string;
}

/**
 * 📊 Offline Data Display Component
 * Shows "Showing cached data" messages
 */
export const OfflineDataDisplay: React.FC<OfflineDataDisplayProps> = ({
  dataKey,
  dataType = "data",
  showDetails = true,
  className = ""
}) => {
  const { isOnline } = usePWA();
  const cachedData = PWACache.get(dataKey);
  const cacheAge = PWACache.getAge(dataKey);
  const isFresh = PWACache.isFresh(dataKey);

  if (isOnline && !cachedData) return null;

  return (
    <div className={`bg-gradient-to-r ${
      isOnline 
        ? 'from-blue-50 to-blue-100 border-blue-200' 
        : 'from-amber-50 to-orange-50 border-amber-200'
    } border rounded-lg p-4 mb-4 ${className}`}>
      <div className="flex items-start gap-3">
        <div className="flex-shrink-0 mt-0.5">
          {isOnline ? (
            <MdCloudDone className="text-blue-600 text-xl" />
          ) : (
            <MdCloudOff className="text-amber-600 text-xl" />
          )}
        </div>
        
        <div className="flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h4 className={`font-semibold text-sm ${
              isOnline ? 'text-blue-800' : 'text-amber-800'
            }`}>
              {isOnline ? `${dataType} Synced` : `Offline Mode - Cached ${dataType}`}
            </h4>
            
            {!isFresh && (
              <span className="px-2 py-0.5 text-xs bg-yellow-200 text-yellow-800 rounded-full">
                Stale
              </span>
            )}
          </div>
          
          <p className={`text-xs ${
            isOnline ? 'text-blue-700' : 'text-amber-700'
          }`}>
            {isOnline ? (
              `${dataType} is synchronized and up to date`
            ) : (
              `Viewing cached ${dataType}. Changes will sync when connection is restored.`
            )}
          </p>
          
          {showDetails && cachedData && (
            <div className={`text-xs mt-2 ${
              isOnline ? 'text-blue-600' : 'text-amber-600'
            }`}>
              <div className="flex flex-wrap gap-4">
                <span>
                  📅 Cached: {new Date(cachedData.lastUpdated).toLocaleString()}
                </span>
                {cacheAge !== null && (
                  <span>
                    ⏱️ Age: {cacheAge < 1 ? '< 1 min' : `${cacheAge} min`} ago
                  </span>
                )}
                <span>
                  📦 Version: {cachedData.version}
                </span>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface SyncStatusProps {
  className?: string;
  showDetails?: boolean;
}

/**
 * 🔄 Sync Status Component
 * Shows "Syncing..." or "X items pending" notifications
 */
export const SyncStatus: React.FC<SyncStatusProps> = ({
  className = "",
  showDetails = true
}) => {
  const { isOnline } = usePWA();
  const { getOfflineActions, syncWhenOnline } = useOfflineQueue();
  const queuedActions = getOfflineActions();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);

  // Handle sync process
  React.useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      setIsSyncing(true);
      
      const syncPromise = syncWhenOnline(async () => {
        // Simulate sync delay for better UX
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLastSyncTime(new Date());
      });

      syncPromise.finally(() => {
        setTimeout(() => setIsSyncing(false), 500);
      });
    }
  }, [isOnline, queuedActions.length, syncWhenOnline]);

  // Don't show if online and no pending actions
  if (isOnline && queuedActions.length === 0 && !isSyncing) {
    return lastSyncTime ? (
      <div className={`bg-green-50 border border-green-200 rounded-lg p-3 mb-4 ${className}`}>
        <div className="flex items-center gap-2">
          <MdCheckCircle className="text-green-600 text-lg" />
          <div>
            <p className="text-green-800 font-semibold text-sm">All Data Synced</p>
            <p className="text-green-700 text-xs">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </p>
          </div>
        </div>
      </div>
    ) : null;
  }

  return (
    <div className={`${
      isSyncing 
        ? 'bg-blue-50 border-blue-200' 
        : isOnline 
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200'
    } border rounded-lg p-3 mb-4 ${className}`}>
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isSyncing ? (
            <MdSync className="text-blue-600 text-lg animate-spin" />
          ) : isOnline ? (
            <MdInfo className="text-yellow-600 text-lg" />
          ) : (
            <FiWifiOff className="text-gray-600 text-lg" />
          )}
        </div>
        
        <div className="flex-1">
          <p className={`font-semibold text-sm ${
            isSyncing 
              ? 'text-blue-800' 
              : isOnline 
                ? 'text-yellow-800'
                : 'text-gray-800'
          }`}>
            {isSyncing 
              ? 'Syncing Data...' 
              : isOnline 
                ? `${queuedActions.length} Action${queuedActions.length !== 1 ? 's' : ''} Pending`
                : 'Offline - Data Queued for Sync'
            }
          </p>
          
          <p className={`text-xs ${
            isSyncing 
              ? 'text-blue-700' 
              : isOnline 
                ? 'text-yellow-700'
                : 'text-gray-700'
          }`}>
            {isSyncing 
              ? 'Synchronizing your changes with the server...'
              : isOnline 
                ? 'Actions will be processed shortly'
                : 'Changes will sync automatically when connection is restored'
            }
          </p>
          
          {showDetails && queuedActions.length > 0 && (
            <div className="mt-2">
              <details className="text-xs">
                <summary className={`cursor-pointer ${
                  isSyncing ? 'text-blue-600' : isOnline ? 'text-yellow-600' : 'text-gray-600'
                }`}>
                  View pending actions ({queuedActions.length})
                </summary>
                <div className="mt-1 pl-4 border-l-2 border-gray-300">
                  {queuedActions.slice(0, 5).map((action: any, index: number) => (
                    <div key={index} className="text-gray-600 text-xs py-1">
                      📝 {action.action} - {new Date(action.timestamp).toLocaleTimeString()}
                    </div>
                  ))}
                  {queuedActions.length > 5 && (
                    <div className="text-gray-500 text-xs">
                      ... and {queuedActions.length - 5} more
                    </div>
                  )}
                </div>
              </details>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

interface PWAStatusBarProps {
  dataKey?: string;
  dataType?: string;
  className?: string;
}

/**
 * Combined PWA Status Bar
 * Shows both offline data and sync status in a compact format
 */
export const PWAStatusBar: React.FC<PWAStatusBarProps> = ({
  dataKey,
  dataType = "data",
  className = ""
}) => {
  const { isOnline } = usePWA();
  const { getOfflineActions } = useOfflineQueue();
  const queuedActions = getOfflineActions();
  const cachedData = dataKey ? PWACache.get(dataKey) : null;

  if (isOnline && queuedActions.length === 0 && !cachedData) return null;

  return (
    <div className={`bg-gradient-to-r from-slate-50 to-slate-100 border border-slate-200 rounded-lg p-3 mb-4 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          {isOnline ? (
            <FiWifi className="text-green-600 text-sm" />
          ) : (
            <FiWifiOff className="text-amber-600 text-sm" />
          )}
          
          <span className="text-sm font-medium text-slate-700">
            {isOnline ? 'Online' : 'Offline'}
          </span>
          
          {queuedActions.length > 0 && (
            <span className="px-2 py-0.5 bg-blue-100 text-blue-800 text-xs rounded-full">
              {queuedActions.length} pending
            </span>
          )}
        </div>
        
        {cachedData && (
          <span className="text-xs text-slate-600">
            Cached {dataType}
          </span>
        )}
      </div>
    </div>
  );
};
