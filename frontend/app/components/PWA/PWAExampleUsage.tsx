/**
 * 🚀 PWA Features Example
 * Shows how to implement PWA installation features
 * NOTE: Offline data functionality has been removed
 */

"use client";

import React from 'react';
import { usePWA, useInstallPrompt } from '@/app/hooks/usePWA';

// Example: Using PWA Installation Features
export default function PWAInstallExample() {
  const { isOnline, isInstalled } = usePWA();
  const { showPrompt, handleInstall, dismissPrompt, canInstall } = useInstallPrompt();

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">PWA Installation Example</h1>

      <div className="space-y-4">
        {/* Connection Status */}
        <div className={`p-4 rounded-lg ${isOnline ? 'bg-green-50 border border-green-200' : 'bg-red-50 border border-red-200'}`}>
          <p className={isOnline ? 'text-green-800' : 'text-red-800'}>
            Status: {isOnline ? 'Online' : 'Offline'}
          </p>
        </div>

        {/* Installation Status */}
        <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <p className="text-blue-800">
            Installation Status: {isInstalled ? 'Installed as PWA' : 'Running in browser'}
          </p>
        </div>

        {/* Install Prompt */}
        {canInstall && showPrompt && !isInstalled && (
          <div className="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
            <h3 className="font-semibold text-yellow-800 mb-2">Install App</h3>
            <p className="text-yellow-700 mb-4">Install this app for a better experience!</p>
            <div className="flex gap-2">
              <button
                onClick={handleInstall}
                className="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
              >
                Install Now
              </button>
              <button
                onClick={dismissPrompt}
                className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
              >
                Maybe Later
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// 📖 USAGE GUIDE:
//
// 1. Import PWA hooks:
//    import { usePWA, useInstallPrompt } from '@/app/hooks/usePWA';
//
// 2. Use PWA features in your component:
//    const { isOnline, isInstalled } = usePWA();
//    const { showPrompt, handleInstall, dismissPrompt, canInstall } = useInstallPrompt();
//
// 3. Features available:
//    ✅ PWA installation detection
//    ✅ Online/offline status
//    ✅ Install prompt handling
//    ✅ Native app experience
//
// 4. NOTE: Offline data caching and sync have been removed
//    All data operations require an active internet connection
