/**
 * 🚀 PWA Features Example
 * Shows how to implement all 3 PWA features in any page
 */

"use client";

import React from 'react';
import { usePWAData, CacheStrategies } from '@/app/hooks/usePWAData';
import { 
  OfflineDataDisplay, 
  SyncStatus, 
  PWAStatusBar 
} from '@/app/components/PWA/PWAStatus';

// Example: Inventory Page with PWA Features
export default function InventoryWithPWA() {
  // 💾 1. Smart Caching - Automatically caches inventory data
  const {
    data: inventoryData,
    isLoading,
    isOffline,
    isCached,
    isStale,
    error,
    refresh,
    mutate,
    shouldShowOfflineMessage,
    shouldShowStaleMessage,
  } = usePWAData({
    key: 'inventory_list',
    fetchFn: async () => {
      // Your API call here
      const response = await fetch('/api/inventory');
      return response.json();
    },
    ...CacheStrategies.INVENTORY, // 5-minute cache
    autoFetch: true,
    syncOnOnline: true,
  });

  const handleUpdateInventory = async (newItem: any) => {
    try {
      // Optimistic update - shows immediately
      await mutate([...inventoryData, newItem]);
      
      // Actual API call would happen here
      // await fetch('/api/inventory', { method: 'POST', body: JSON.stringify(newItem) });
    } catch (error) {
      console.error('Failed to update inventory:', error);
    }
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Inventory Management</h1>
      
      {/* 🔄 2. Sync Status - Shows pending actions and sync progress */}
      <SyncStatus showDetails={true} />
      
      {/* 📊 3. Offline Data Display - Shows cached data messages */}
      {shouldShowOfflineMessage && (
        <OfflineDataDisplay 
          dataKey="inventory_list"
          dataType="Inventory Data"
          showDetails={true}
        />
      )}
      
      {/* Alternative: Compact status bar */}
      <PWAStatusBar 
        dataKey="inventory_list"
        dataType="inventory"
        className="mb-4"
      />
      
      {/* Your regular content */}
      <div className="space-y-4">
        {isLoading && !isCached && (
          <div className="text-center py-8">
            <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p>Loading inventory...</p>
          </div>
        )}
        
        {error && !inventoryData && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4">
            <p className="text-red-800">Error: {error}</p>
            <button 
              onClick={refresh}
              className="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Retry
            </button>
          </div>
        )}
        
        {inventoryData && (
          <>
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">
                Items ({inventoryData.length})
                {isCached && <span className="text-sm text-gray-500 ml-2">(Cached)</span>}
                {isStale && <span className="text-sm text-yellow-600 ml-2">(Needs Sync)</span>}
              </h2>
              
              <button
                onClick={refresh}
                disabled={isLoading}
                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
              >
                {isLoading ? 'Refreshing...' : 'Refresh'}
              </button>
            </div>
            
            <div className="grid gap-4">
              {inventoryData.map((item: any, index: number) => (
                <div key={index} className="bg-white border rounded-lg p-4 shadow-sm">
                  <h3 className="font-medium">{item.name || `Item ${index + 1}`}</h3>
                  <p className="text-gray-600">
                    Quantity: {item.quantity || Math.floor(Math.random() * 100)}
                  </p>
                </div>
              ))}
            </div>
            
            {/* Example: Add new item (works offline) */}
            <button
              onClick={() => handleUpdateInventory({
                name: `New Item ${Date.now()}`,
                quantity: Math.floor(Math.random() * 50),
              })}
              className="w-full py-3 bg-green-600 text-white rounded hover:bg-green-700"
            >
              Add Item {isOffline && '(Will sync when online)'}
            </button>
          </>
        )}
      </div>
    </div>
  );
}

// 📖 USAGE GUIDE:
// 
// 1. Add these 3 imports to any page:
//    import { usePWAData, CacheStrategies } from '@/app/hooks/usePWAData';
//    import { OfflineDataDisplay, SyncStatus, PWAStatusBar } from '@/app/components/PWA/PWAStatus';
//
// 2. Use usePWAData for smart caching:
//    const { data, isLoading, shouldShowOfflineMessage } = usePWAData({
//      key: 'your_data_key',
//      fetchFn: async () => fetch('/api/your-endpoint').then(r => r.json()),
//      ...CacheStrategies.YOUR_TYPE, // Choose: USER_DATA, DASHBOARD, INVENTORY, etc.
//    });
//
// 3. Add status components:
//    <SyncStatus />
//    <OfflineDataDisplay dataKey="your_data_key" dataType="Your Data" />
//    // OR use the compact version:
//    <PWAStatusBar dataKey="your_data_key" dataType="your data" />
//
// 4. That's it! Your page now has:
//    ✅ Smart caching with automatic TTL
//    ✅ Offline data display messages  
//    ✅ Sync status notifications
//    ✅ Optimistic updates
//    ✅ Auto-sync when online
