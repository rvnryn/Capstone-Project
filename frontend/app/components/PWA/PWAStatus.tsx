"use client";

import React from 'react';
import { usePWA, useOfflineQueue } from '@/app/hooks/usePWA';
import { MdCheckCircle, MdSync, MdInfo } from 'react-icons/md';
import { FiWifiOff } from 'react-icons/fi';

interface PwaStatusProps {
  className?: string;
  showDetails?: boolean;
}

export const PwaStatus: React.FC<PwaStatusProps> = ({ className = '', showDetails = true }) => {
  const { isOnline } = usePWA();
  const { getOfflineActions, syncWhenOnline } = useOfflineQueue();
  const queuedActions = getOfflineActions();
  const [isSyncing, setIsSyncing] = React.useState(false);
  const [lastSyncTime, setLastSyncTime] = React.useState<Date | null>(null);

  React.useEffect(() => {
    if (isOnline && queuedActions.length > 0) {
      setIsSyncing(true);
      const syncPromise = syncWhenOnline(async () => {
        await new Promise(resolve => setTimeout(resolve, 1000));
        setLastSyncTime(new Date());
      });
      syncPromise.finally(() => {
        setTimeout(() => setIsSyncing(false), 500);
      });
    }
  }, [isOnline, queuedActions.length, syncWhenOnline]);

  if (!isOnline && queuedActions.length === 0) {
    return null;
  }

  return (
    <div
      className={`${isSyncing
        ? 'bg-blue-50 border-blue-200'
        : isOnline
          ? 'bg-yellow-50 border-yellow-200'
          : 'bg-gray-50 border-gray-200'} border rounded-lg p-3 mb-4 ${className}`}
      role="status"
      aria-live="polite"
    >
      <div className="flex items-center gap-3">
        <div className="flex-shrink-0">
          {isSyncing ? (
            <MdSync className="text-blue-600 text-lg animate-spin" aria-hidden="true" />
          ) : isOnline ? (
            <MdInfo className="text-yellow-600 text-lg" aria-hidden="true" />
          ) : (
            <FiWifiOff className="text-gray-600 text-lg" aria-hidden="true" />
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
          {lastSyncTime && (
            <p className="text-xs text-gray-400 mt-2">
              Last sync: {lastSyncTime.toLocaleTimeString()}
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

// Backwards-compatible alias: some files import PWAStatusBar
export const PWAStatusBar = PwaStatus;


