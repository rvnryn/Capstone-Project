# 🚀 PWA Features Usage Guide

## Quick Start (Copy & Paste)

### 1. For ANY Page - Add These 3 Lines:

```tsx
// At the top of your file
import { usePWAData, CacheStrategies } from '@/app/hooks/usePWAData';
import { SyncStatus, OfflineDataDisplay } from '@/app/components/PWA/PWAStatus';

export default function YourPage() {
  // Replace your data fetching with this
  const { data, isLoading, shouldShowOfflineMessage } = usePWAData({
    key: 'your_data_key',
    fetchFn: async () => fetch('/api/your-endpoint').then(r => r.json()),
    ...CacheStrategies.DASHBOARD, // Choose the right strategy
  });

  return (
    <div>
      {/* Add these components */}
      <SyncStatus />
      {shouldShowOfflineMessage && (
        <OfflineDataDisplay dataKey="your_data_key" dataType="Your Data" />
      )}
      
      {/* Your existing content */}
      {isLoading ? <div>Loading...</div> : <div>{JSON.stringify(data)}</div>}
    </div>
  );
}
```

---

## 📋 Cache Strategies Available:

```tsx
CacheStrategies.USER_DATA    // 30 minutes - user profiles, settings
CacheStrategies.DASHBOARD    // 10 minutes - dashboard data
CacheStrategies.INVENTORY    // 5 minutes  - inventory data
CacheStrategies.MENU         // 1 hour     - menu items
CacheStrategies.REPORTS      // 15 minutes - reports
CacheStrategies.SETTINGS     // 24 hours   - app settings
CacheStrategies.STATIC       // Forever    - static content
```

---

## 🎯 Real Examples:

### Dashboard Page:
```tsx
const { data, shouldShowOfflineMessage } = usePWAData({
  key: 'dashboard_data',
  fetchFn: async () => {
    const response = await fetch('/api/dashboard');
    return response.json();
  },
  ...CacheStrategies.DASHBOARD,
});
```

### Inventory Page:
```tsx
const { data, shouldShowOfflineMessage } = usePWAData({
  key: 'inventory_list',
  fetchFn: async () => {
    const response = await fetch('/api/inventory');
    return response.json();
  },
  ...CacheStrategies.INVENTORY,
});
```

### Menu Page:
```tsx
const { data, shouldShowOfflineMessage } = usePWAData({
  key: 'menu_items',
  fetchFn: async () => {
    const response = await fetch('/api/menu');
    return response.json();
  },
  ...CacheStrategies.MENU,
});
```

---

## 🔧 Available Components:

### 1. SyncStatus - Shows sync progress
```tsx
<SyncStatus showDetails={true} />
```
**Shows:** "Syncing...", "X items pending", "All data synced"

### 2. OfflineDataDisplay - Shows cached data info
```tsx
<OfflineDataDisplay 
  dataKey="your_data_key"
  dataType="Dashboard Data" 
  showDetails={true}
/>
```
**Shows:** "Offline Mode - Cached Dashboard Data", cache age, version

### 3. PWAStatusBar - Compact version
```tsx
<PWAStatusBar dataKey="your_data_key" dataType="data" />
```
**Shows:** Online/Offline status, pending actions, cached data indicator

---

## 🎪 What You Get Automatically:

✅ **Smart Caching**: Data cached based on type (5 min - 24 hours)
✅ **Offline Support**: App works without internet
✅ **Auto Sync**: Data syncs when connection returns
✅ **Visual Indicators**: Users see "offline" and "syncing" messages
✅ **Optimistic Updates**: Changes show immediately
✅ **Error Handling**: Falls back to cached data on errors

---

## 🚀 Quick Copy-Paste for Different Pages:

### For Dashboard:
```tsx
import { usePWAData, CacheStrategies } from '@/app/hooks/usePWAData';
import { SyncStatus, OfflineDataDisplay } from '@/app/components/PWA/PWAStatus';

const { data, shouldShowOfflineMessage } = usePWAData({
  key: 'dashboard_data',
  fetchFn: async () => fetch('/api/dashboard').then(r => r.json()),
  ...CacheStrategies.DASHBOARD,
});

// Add to JSX:
<SyncStatus />
{shouldShowOfflineMessage && <OfflineDataDisplay dataKey="dashboard_data" dataType="Dashboard" />}
```

### For Inventory:
```tsx
import { usePWAData, CacheStrategies } from '@/app/hooks/usePWAData';
import { SyncStatus, OfflineDataDisplay } from '@/app/components/PWA/PWAStatus';

const { data, shouldShowOfflineMessage } = usePWAData({
  key: 'inventory_data',
  fetchFn: async () => fetch('/api/inventory').then(r => r.json()),
  ...CacheStrategies.INVENTORY,
});

// Add to JSX:
<SyncStatus />
{shouldShowOfflineMessage && <OfflineDataDisplay dataKey="inventory_data" dataType="Inventory" />}
```

### For Menu:
```tsx
import { usePWAData, CacheStrategies } from '@/app/hooks/usePWAData';
import { SyncStatus, OfflineDataDisplay } from '@/app/components/PWA/PWAStatus';

const { data, shouldShowOfflineMessage } = usePWAData({
  key: 'menu_data',
  fetchFn: async () => fetch('/api/menu').then(r => r.json()),
  ...CacheStrategies.MENU,
});

// Add to JSX:
<SyncStatus />
{shouldShowOfflineMessage && <OfflineDataDisplay dataKey="menu_data" dataType="Menu" />}
```

---

## ⚡ That's It!

**Just copy the code for your page type and paste it!** 

Your page now has:
- 📊 Offline data display messages
- 🔄 Sync status notifications  
- 💾 Smart caching strategies

**No complex setup needed - it just works!** 🎉
