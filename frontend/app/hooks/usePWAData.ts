"use client";

import { useState, useEffect, useCallback } from 'react';
import { PWACache, CacheConfig, CachedData, CacheStrategies } from '@/app/utils/pwaCache';
import { usePWA, useOfflineQueue } from '@/app/hooks/usePWA';

interface UsePWADataOptions extends CacheConfig {
  fetchFn: () => Promise<any>;
  autoFetch?: boolean;
  syncOnOnline?: boolean;
}

interface PWADataState<T> {
  data: T | null;
  isLoading: boolean;
  isOffline: boolean;
  isCached: boolean;
  isStale: boolean;
  error: string | null;
  lastUpdated: Date | null;
  cacheAge: number | null;
}

/**
 * 💾 Smart PWA Data Hook
 * Handles caching, offline data, and sync automatically
 */
export function usePWAData<T = any>(options: UsePWADataOptions) {
  const { key, fetchFn, autoFetch = true, syncOnOnline = true, ...cacheConfig } = options;
  const { isOnline } = usePWA();
  const { addOfflineAction, syncWhenOnline } = useOfflineQueue();
  
  const [state, setState] = useState<PWADataState<T>>({
    data: null,
    isLoading: autoFetch,
    isOffline: !isOnline,
    isCached: false,
    isStale: false,
    error: null,
    lastUpdated: null,
    cacheAge: null,
  });

  // Load cached data on mount
  useEffect(() => {
    const cached = PWACache.get<T>(key);
    if (cached) {
      setState(prev => ({
        ...prev,
        data: cached.data,
        isCached: true,
        isStale: !PWACache.isFresh(key),
        lastUpdated: new Date(cached.lastUpdated),
        cacheAge: PWACache.getAge(key),
        isLoading: autoFetch && isOnline, // Still loading if we're going to fetch fresh data
      }));
    }
  }, [key, autoFetch, isOnline]);

  // Fetch data function
  const fetchData = useCallback(async (force = false) => {
    if (!isOnline && !force) {
      // If offline, queue the fetch for later
      addOfflineAction('fetch', { key, timestamp: new Date().toISOString() });
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const freshData = await fetchFn();
      
      // Cache the fresh data
      PWACache.set({ key, ...cacheConfig }, freshData);
      
      setState(prev => ({
        ...prev,
        data: freshData,
        isLoading: false,
        isCached: true,
        isStale: false,
        lastUpdated: new Date(),
        cacheAge: 0,
        error: null,
      }));

      return freshData;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to fetch data';
      
      setState(prev => ({
        ...prev,
        isLoading: false,
        error: errorMessage,
      }));

      // If we have cached data, still show it despite the error
      const cached = PWACache.get<T>(key);
      if (cached && !state.data) {
        setState(prev => ({
          ...prev,
          data: cached.data,
          isCached: true,
          isStale: true,
        }));
      }

      throw error;
    }
  }, [isOnline, fetchFn, key, cacheConfig, addOfflineAction]);

  // Auto-fetch on mount and when coming online
  useEffect(() => {
    if (autoFetch && isOnline) {
      fetchData().catch(() => {
        // Error handling is done in fetchData
      });
    }
  }, [autoFetch, isOnline, fetchData]);

  // Sync when coming online
  useEffect(() => {
    if (syncOnOnline && isOnline && state.isStale) {
      syncWhenOnline(async () => {
        await fetchData();
      });
    }
  }, [isOnline, syncOnOnline, state.isStale, fetchData, syncWhenOnline]);

  // Update offline status
  useEffect(() => {
    setState(prev => ({ ...prev, isOffline: !isOnline }));
  }, [isOnline]);

  // Update cache age periodically
  useEffect(() => {
    const interval = setInterval(() => {
      const age = PWACache.getAge(key);
      if (age !== null) {
        setState(prev => ({ ...prev, cacheAge: age }));
      }
    }, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [key]);

  // Mutation function for updating data
  const mutateData = useCallback(async (newData: T, optimistic = true) => {
    if (optimistic) {
      // Optimistically update the UI
      setState(prev => ({
        ...prev,
        data: newData,
        lastUpdated: new Date(),
      }));
    }

    if (isOnline) {
      try {
        // Cache the updated data
        PWACache.set({ key, ...cacheConfig }, newData);
        
        if (!optimistic) {
          setState(prev => ({
            ...prev,
            data: newData,
            lastUpdated: new Date(),
          }));
        }
      } catch (error) {
        // Revert optimistic update on error
        if (optimistic) {
          const cached = PWACache.get<T>(key);
          setState(prev => ({
            ...prev,
            data: cached?.data || prev.data,
          }));
        }
        throw error;
      }
    } else {
      // Queue the mutation for later
      addOfflineAction('mutate', { 
        key, 
        data: newData, 
        timestamp: new Date().toISOString() 
      });
      
      // Update cache even when offline
      PWACache.set({ key, ...cacheConfig }, newData);
    }
  }, [isOnline, key, cacheConfig, addOfflineAction]);

  // Refresh data
  const refresh = useCallback(() => {
    return fetchData(true);
  }, [fetchData]);

  // Clear cached data
  const clearCache = useCallback(() => {
    PWACache.remove(key);
    setState(prev => ({
      ...prev,
      data: null,
      isCached: false,
      isStale: false,
      lastUpdated: null,
      cacheAge: null,
    }));
  }, [key]);

  return {
    // Data state
    ...state,
    
    // Actions
    fetch: fetchData,
    mutate: mutateData,
    refresh,
    clearCache,
    
    // Computed properties
    hasData: state.data !== null,
    isEmpty: state.data === null && !state.isLoading,
    shouldShowOfflineMessage: !isOnline && state.isCached,
    shouldShowStaleMessage: state.isStale && isOnline,
  };
}

/**
 * Quick hook for simple data caching
 */
export function useQuickCache<T>(key: string, fetchFn: () => Promise<T>, ttl?: number) {
  return usePWAData<T>({
    key,
    fetchFn,
    ttl,
    autoFetch: true,
    syncOnOnline: true,
  });
}

// Re-export cache strategies for convenience
export { CacheStrategies };
