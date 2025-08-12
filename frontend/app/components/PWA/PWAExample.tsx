// Example PWA integration for any feature page
'use client';

import { useEffect } from 'react';
import { usePWA, useOfflineQueue } from '@/app/hooks/usePWA';
import { PWAStatus } from '@/app/components/PWA/PWAComponents';

export const PWAExample = () => {
  const { 
    isOnline, 
    hasNotificationPermission, 
    requestNotificationPermission,
    pwaFeatures 
  } = usePWA();

  const { 
    addOfflineAction, 
    syncWhenOnline 
  } = useOfflineQueue();

  // Example: Handle form submission with offline support
  const handleFormSubmit = async (formData: any) => {
    if (isOnline) {
      try {
        // Normal API call
        const response = await fetch('/api/some-endpoint', {
          method: 'POST',
          body: JSON.stringify(formData),
          headers: { 'Content-Type': 'application/json' }
        });
        
        if (response.ok) {
          console.log('Data submitted successfully');
        }
      } catch (error) {
        console.error('Submission failed, adding to offline queue');
        addOfflineAction('submit-form', formData);
      }
    } else {
      // Add to offline queue
      addOfflineAction('submit-form', formData);
      console.log('Added to offline queue - will sync when online');
    }
  };

  // Example: Sync offline actions when connection is restored
  useEffect(() => {
    const syncOfflineData = async (offlineActions: any[]) => {
      for (const action of offlineActions) {
        try {
          if (action.action === 'submit-form') {
            await fetch('/api/some-endpoint', {
              method: 'POST',
              body: JSON.stringify(action.data),
              headers: { 'Content-Type': 'application/json' }
            });
          }
          // Handle other action types...
        } catch (error) {
          console.error('Failed to sync offline action:', error);
        }
      }
    };

    syncWhenOnline(syncOfflineData);
  }, [syncWhenOnline]);

  // Example: Request notification permission
  const enableNotifications = async () => {
    const permission = await requestNotificationPermission();
    if (permission === 'granted') {
      console.log('Notifications enabled');
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">PWA Features</h2>
      
      {/* Network Status */}
      <div className={`p-3 rounded-lg mb-4 ${isOnline ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
        Status: {isOnline ? 'Online' : 'Offline'}
      </div>

      {/* Notification Permission */}
      {!hasNotificationPermission && (
        <button 
          onClick={enableNotifications}
          className="bg-blue-500 text-white px-4 py-2 rounded mb-4"
        >
          Enable Notifications
        </button>
      )}

      {/* PWA Status Component */}
      <PWAStatus />

      {/* Example form with offline support */}
      <form 
        onSubmit={(e) => {
          e.preventDefault();
          const formData = new FormData(e.target as HTMLFormElement);
          handleFormSubmit(Object.fromEntries(formData));
        }}
        className="mt-4"
      >
        <input 
          name="example" 
          placeholder="Enter data" 
          className="border p-2 rounded mr-2"
        />
        <button 
          type="submit"
          className="bg-green-500 text-white px-4 py-2 rounded"
        >
          Submit {!isOnline && '(Offline)'}
        </button>
      </form>
    </div>
  );
};
