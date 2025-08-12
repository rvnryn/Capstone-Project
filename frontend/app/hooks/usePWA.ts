'use client';

import { useState, useEffect, useCallback } from 'react';
import { 
  pwaInstaller, 
  networkStatus, 
  offlineQueue, 
  pushNotifications,
  isPWA 
} from '@/app/utils/pwa';

export interface PWAHookReturn {
  // Installation
  canInstall: boolean;
  isInstalled: boolean;
  install: () => Promise<boolean>;
  
  // Network
  isOnline: boolean;
  
  // Offline queue
  addOfflineAction: (action: string, data: any) => string;
  getOfflineActions: () => any[];
  clearOfflineActions: () => void;
  
  // Notifications
  requestNotificationPermission: () => Promise<NotificationPermission>;
  hasNotificationPermission: boolean;
  
  // PWA status
  pwaFeatures: {
    serviceWorker: boolean;
    notifications: boolean;
    backgroundSync: boolean;
    installable: boolean;
  };
}

export const usePWA = (): PWAHookReturn => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [hasNotificationPermission, setHasNotificationPermission] = useState(false);
  const [pwaFeatures, setPwaFeatures] = useState({
    serviceWorker: false,
    notifications: false,
    backgroundSync: false,
    installable: false
  });

  useEffect(() => {
    // Initialize PWA status
    const initializePWA = () => {
      setIsInstalled(isPWA());
      setCanInstall(pwaInstaller.canInstall());
      setIsOnline(networkStatus.isOnline());
      
      if (typeof window !== 'undefined') {
        setHasNotificationPermission(
          'Notification' in window && Notification.permission === 'granted'
        );
        
        setPwaFeatures({
          serviceWorker: 'serviceWorker' in navigator,
          notifications: 'Notification' in window,
          backgroundSync: 'serviceWorker' in navigator && 'sync' in window.ServiceWorkerRegistration.prototype,
          installable: pwaInstaller.canInstall()
        });
      }
    };

    initializePWA();

    // Listen for network changes
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
    };

    networkStatus.addListener(handleNetworkChange);

    // Check install status periodically
    const installCheckInterval = setInterval(() => {
      setCanInstall(pwaInstaller.canInstall());
      setIsInstalled(pwaInstaller.isInstalled());
    }, 1000);

    return () => {
      networkStatus.removeListener(handleNetworkChange);
      clearInterval(installCheckInterval);
    };
  }, []);

  const install = useCallback(async (): Promise<boolean> => {
    return await pwaInstaller.install();
  }, []);

  const addOfflineAction = useCallback((action: string, data: any): string => {
    return offlineQueue.addAction(action, data);
  }, []);

  const getOfflineActions = useCallback(() => {
    return offlineQueue.getQueue();
  }, []);

  const clearOfflineActions = useCallback(() => {
    offlineQueue.clearQueue();
  }, []);

  const requestNotificationPermission = useCallback(async (): Promise<NotificationPermission> => {
    const permission = await pushNotifications.requestPermission();
    setHasNotificationPermission(permission === 'granted');
    return permission;
  }, []);

  return {
    canInstall,
    isInstalled,
    install,
    isOnline,
    addOfflineAction,
    getOfflineActions,
    clearOfflineActions,
    requestNotificationPermission,
    hasNotificationPermission,
    pwaFeatures
  };
};

// Utility hooks for specific PWA features
export const useOfflineQueue = () => {
  const { addOfflineAction, getOfflineActions, clearOfflineActions, isOnline } = usePWA();
  
  const syncWhenOnline = useCallback(async (syncFunction: (actions: any[]) => Promise<void>) => {
    if (isOnline) {
      const actions = getOfflineActions();
      if (actions.length > 0) {
        try {
          await syncFunction(actions);
          clearOfflineActions();
        } catch (error) {
          console.error('Failed to sync offline actions:', error);
        }
      }
    }
  }, [isOnline, getOfflineActions, clearOfflineActions]);

  return {
    addOfflineAction,
    getOfflineActions,
    clearOfflineActions,
    syncWhenOnline,
    isOnline
  };
};

export const useInstallPrompt = () => {
  const { canInstall, isInstalled, install } = usePWA();
  const [showPrompt, setShowPrompt] = useState(false);

  useEffect(() => {
    // Show install prompt if can install and not dismissed
    const dismissed = localStorage.getItem('pwa-install-dismissed') === 'true';
    setShowPrompt(canInstall && !isInstalled && !dismissed);
  }, [canInstall, isInstalled]);

  const handleInstall = useCallback(async () => {
    const success = await install();
    if (success) {
      setShowPrompt(false);
    }
    return success;
  }, [install]);

  const dismissPrompt = useCallback(() => {
    setShowPrompt(false);
    localStorage.setItem('pwa-install-dismissed', 'true');
  }, []);

  return {
    showPrompt,
    handleInstall,
    dismissPrompt,
    canInstall,
    isInstalled
  };
};
