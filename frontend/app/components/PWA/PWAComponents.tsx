'use client';

import { useState, useEffect } from 'react';
import { pwaInstaller, networkStatus, isPWA } from '@/app/utils/pwa';
import { FiDownload, FiWifi, FiWifiOff } from 'react-icons/fi';

// PWA Install Banner Component
export const PWAInstallBanner = () => {
  const [canInstall, setCanInstall] = useState(false);
  const [isInstalling, setIsInstalling] = useState(false);
  const [dismissed, setDismissed] = useState(false);

  useEffect(() => {
    // Check if already installed or can install
    if (isPWA() || dismissed) return;
    
    setCanInstall(pwaInstaller.canInstall());
    
    // Check periodically for install prompt
    const interval = setInterval(() => {
      setCanInstall(pwaInstaller.canInstall());
    }, 1000);

    return () => clearInterval(interval);
  }, [dismissed]);

  const handleInstall = async () => {
    setIsInstalling(true);
    const success = await pwaInstaller.install();
    
    if (success) {
      setCanInstall(false);
    }
    setIsInstalling(false);
  };

  const handleDismiss = () => {
    setDismissed(true);
    setCanInstall(false);
  };

  if (!canInstall || isPWA() || dismissed) return null;

  return (
    <div className="custom-pwa-banner fixed top-4 right-4 z-50 bg-gradient-to-r from-yellow-500 to-yellow-600 text-black p-4 rounded-xl shadow-lg max-w-sm">
      <div className="flex items-start gap-3">
        <FiDownload className="text-2xl mt-1 flex-shrink-0" />
        <div className="flex-1">
          <h3 className="font-semibold text-sm mb-1">Install Cardiac Delights</h3>
          <p className="text-xs opacity-90 mb-3">
            Install our app for a better experience with offline access and notifications.
          </p>
          <div className="flex gap-2">
            <button
              onClick={handleInstall}
              disabled={isInstalling}
              className="bg-black text-yellow-400 px-3 py-1 rounded-lg text-xs font-medium hover:bg-gray-800 disabled:opacity-50 transition-colors"
            >
              {isInstalling ? 'Installing...' : 'Install'}
            </button>
            <button
              onClick={handleDismiss}
              className="bg-yellow-600/20 text-black px-3 py-1 rounded-lg text-xs font-medium hover:bg-yellow-600/30 transition-colors"
            >
              Maybe Later
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

// Network Status Indicator
export const NetworkStatusIndicator = () => {
  const [isOnline, setIsOnline] = useState(true);
  const [showOfflineMessage, setShowOfflineMessage] = useState(false);

  useEffect(() => {
    setIsOnline(networkStatus.isOnline());
    
    const handleNetworkChange = (online: boolean) => {
      setIsOnline(online);
      if (!online) {
        setShowOfflineMessage(true);
      } else {
        // Show back online message briefly
        setShowOfflineMessage(true);
        setTimeout(() => setShowOfflineMessage(false), 3000);
      }
    };

    networkStatus.addListener(handleNetworkChange);
    
    return () => {
      networkStatus.removeListener(handleNetworkChange);
    };
  }, []);

  if (!showOfflineMessage) return null;

  return (
    <div className={`fixed bottom-4 left-4 right-4 z-50 p-4 rounded-xl shadow-lg transition-all duration-300 ${
      isOnline 
        ? 'bg-green-600 text-white' 
        : 'bg-red-600 text-white'
    }`}>
      <div className="flex items-center gap-3">
        {isOnline ? (
          <FiWifi className="text-xl flex-shrink-0" />
        ) : (
          <FiWifiOff className="text-xl flex-shrink-0" />
        )}
        <div className="flex-1">
          <h3 className="font-semibold text-sm">
            {isOnline ? 'Back Online!' : 'You\'re Offline'}
          </h3>
          <p className="text-xs opacity-90">
            {isOnline 
              ? 'Connection restored. Syncing data...' 
              : 'Some features may be limited. We\'ll sync when you\'re back online.'
            }
          </p>
        </div>
        <button 
          onClick={() => setShowOfflineMessage(false)}
          className="text-white/70 hover:text-white text-xs"
        >
          ✕
        </button>
      </div>
    </div>
  );
};

// PWA Features Status
export const PWAStatus = () => {
  const [status, setStatus] = useState({
    isInstalled: false,
    isOnline: true,
    hasNotificationPermission: false,
    hasServiceWorker: false
  });

  useEffect(() => {
    const updateStatus = () => {
      setStatus({
        isInstalled: isPWA(),
        isOnline: networkStatus.isOnline(),
        hasNotificationPermission: typeof window !== 'undefined' && 'Notification' in window && Notification.permission === 'granted',
        hasServiceWorker: typeof window !== 'undefined' && 'serviceWorker' in navigator
      });
    };

    updateStatus();
    
    const handleNetworkChange = (online: boolean) => {
      setStatus(prev => ({ ...prev, isOnline: online }));
    };

    networkStatus.addListener(handleNetworkChange);
    
    return () => {
      networkStatus.removeListener(handleNetworkChange);
    };
  }, []);

  return (
    <div className="bg-gray-800 p-4 rounded-xl">
      <h3 className="text-white font-semibold mb-3">PWA Status</h3>
      <div className="space-y-2">
        <StatusItem 
          label="App Installed" 
          status={status.isInstalled} 
        />
        <StatusItem 
          label="Online" 
          status={status.isOnline} 
        />
        <StatusItem 
          label="Notifications" 
          status={status.hasNotificationPermission} 
        />
        <StatusItem 
          label="Service Worker" 
          status={status.hasServiceWorker} 
        />
      </div>
    </div>
  );
};

const StatusItem = ({ label, status }: { label: string; status: boolean }) => (
  <div className="flex items-center justify-between">
    <span className="text-gray-300 text-sm">{label}</span>
    <div className={`w-3 h-3 rounded-full ${status ? 'bg-green-500' : 'bg-red-500'}`} />
  </div>
);
