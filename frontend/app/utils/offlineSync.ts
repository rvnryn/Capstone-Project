/**
 * Unified Offline Data Sync Manager
 * Handles synchronization of offline actions when connection is restored
 */

import { dbManager, STORES, OfflineAction, StoreName } from "./indexedDB";
import { toast } from "react-toastify";

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export interface SyncResult {
  success: boolean;
  synced: number;
  failed: number;
  errors: Array<{
    action: OfflineAction;
    error: string;
  }>;
}

class OfflineSyncManager {
  private isSyncing: boolean = false;
  private syncListeners: Array<(result: SyncResult) => void> = [];

  /**
   * Add a listener for sync completion
   */
  addSyncListener(listener: (result: SyncResult) => void) {
    this.syncListeners.push(listener);
  }

  /**
   * Remove a sync listener
   */
  removeSyncListener(listener: (result: SyncResult) => void) {
    this.syncListeners = this.syncListeners.filter((l) => l !== listener);
  }

  /**
   * Notify all listeners
   */
  private notifyListeners(result: SyncResult) {
    this.syncListeners.forEach((listener) => {
      try {
        listener(result);
      } catch (error) {
        console.error("Error in sync listener:", error);
      }
    });
  }

  /**
   * Check if currently syncing
   */
  isSyncInProgress(): boolean {
    return this.isSyncing;
  }

  /**
   * Sync all pending offline actions
   */
  async syncAllActions(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log("[Sync] Sync already in progress");
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    if (!navigator.onLine) {
      console.log("[Sync] Cannot sync while offline");
      toast.warning("Cannot sync while offline");
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    this.isSyncing = true;
    toast.info("Starting offline data sync...");

    try {
      const pendingActions = await dbManager.getPendingActions();

      if (pendingActions.length === 0) {
        console.log("[Sync] No pending actions to sync");
        toast.success("All data is already synced!");
        this.isSyncing = false;
        return {
          success: true,
          synced: 0,
          failed: 0,
          errors: [],
        };
      }

      console.log(`[Sync] Syncing ${pendingActions.length} pending actions`);

      let syncedCount = 0;
      let failedCount = 0;
      const errors: Array<{ action: OfflineAction; error: string }> = [];

      // Sort actions by timestamp (oldest first)
      const sortedActions = pendingActions.sort((a, b) => a.timestamp - b.timestamp);

      for (const action of sortedActions) {
        try {
          await this.syncSingleAction(action);
          syncedCount++;

          if (action.id) {
            await dbManager.markActionSynced(action.id);
          }
        } catch (error) {
          failedCount++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          errors.push({
            action,
            error: errorMessage,
          });

          if (action.id) {
            await dbManager.markActionFailed(action.id, errorMessage);
          }
        }
      }

      const result: SyncResult = {
        success: failedCount === 0,
        synced: syncedCount,
        failed: failedCount,
        errors,
      };

      // Notify listeners
      this.notifyListeners(result);

      // Show toast notification
      if (failedCount === 0) {
        toast.success(`✅ Synced ${syncedCount} offline changes!`);
      } else {
        toast.warning(
          `Synced ${syncedCount} changes, ${failedCount} failed. Will retry later.`
        );
      }

      console.log("[Sync] Sync complete:", result);

      return result;
    } catch (error) {
      console.error("[Sync] Sync failed:", error);
      toast.error("Sync failed. Will retry later.");
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [],
      };
    } finally {
      this.isSyncing = false;
    }
  }

  /**
   * Sync a single offline action
   */
  private async syncSingleAction(action: OfflineAction): Promise<void> {
    console.log(`[Sync] Syncing ${action.operation} on ${action.entity_type}`);

    try {
      // Get auth token if available
      const token = await this.getAuthToken();

      const headers: Record<string, string> = {
        "Content-Type": "application/json",
      };

      if (token) {
        headers["Authorization"] = `Bearer ${token}`;
      }

      const requestOptions: RequestInit = {
        method: action.method,
        headers,
      };

      if (action.data && (action.method === "POST" || action.method === "PUT")) {
        requestOptions.body = JSON.stringify(action.data);
      }

      const fullUrl = this.getFullUrl(action.endpoint);
      const response = await fetch(fullUrl, requestOptions);

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const responseData = await response.json();

      // Update local data with server response
      await this.updateLocalDataAfterSync(action, responseData);

      console.log(`[Sync] Successfully synced ${action.operation}`);
    } catch (error) {
      console.error(`[Sync] Failed to sync ${action.operation}:`, error);
      throw error;
    }
  }

  /**
   * Update local IndexedDB data after successful sync
   */
  private async updateLocalDataAfterSync(
    action: OfflineAction,
    responseData: any
  ): Promise<void> {
    try {
      const storeName = action.entity_type;

      if (action.operation === "CREATE" || action.operation === "UPDATE") {
        // Update or add the synced item to local storage
        const updatedItem = {
          ...action.data,
          ...responseData,
          _offline: false,
          _pending_sync: false,
        };

        await dbManager.put(storeName, updatedItem);
      } else if (action.operation === "DELETE") {
        // Remove the item from local storage
        if (action.data.id) {
          await dbManager.delete(storeName, action.data.id);
        }
      }
    } catch (error) {
      console.error("[Sync] Error updating local data after sync:", error);
    }
  }

  /**
   * Get auth token from storage
   */
  private async getAuthToken(): Promise<string | null> {
    try {
      // Try to get from localStorage first
      const token = localStorage.getItem("auth_token");
      if (token) {
        return token;
      }

      // Try to get from IndexedDB
      const cachedToken = await dbManager.getCachedData("auth_token");
      return cachedToken;
    } catch (error) {
      console.warn("[Sync] Could not retrieve auth token:", error);
      return null;
    }
  }

  /**
   * Get full API URL
   */
  private getFullUrl(endpoint: string): string {
    if (endpoint.startsWith("http://") || endpoint.startsWith("https://")) {
      return endpoint;
    }

    const cleanEndpoint = endpoint.startsWith("/") ? endpoint : `/${endpoint}`;
    return `${API_BASE_URL}${cleanEndpoint}`;
  }

  /**
   * Queue an offline action
   */
  async queueAction(
    entityType: StoreName,
    operation: "CREATE" | "UPDATE" | "DELETE",
    data: any,
    endpoint: string
  ): Promise<number> {
    const method =
      operation === "CREATE"
        ? "POST"
        : operation === "UPDATE"
        ? "PUT"
        : "DELETE";

    return await dbManager.queueAction({
      entity_type: entityType,
      operation,
      data,
      endpoint,
      method,
      timestamp: Date.now(),
      status: "pending",
    });
  }

  /**
   * Get count of pending actions
   */
  async getPendingCount(): Promise<number> {
    const actions = await dbManager.getPendingActions();
    return actions.length;
  }

  /**
   * Get count of pending actions by entity type
   */
  async getPendingCountByEntity(): Promise<Record<string, number>> {
    const actions = await dbManager.getPendingActions();
    const counts: Record<string, number> = {};

    actions.forEach((action) => {
      counts[action.entity_type] = (counts[action.entity_type] || 0) + 1;
    });

    return counts;
  }

  /**
   * Clear all synced actions
   */
  async clearSyncedActions(): Promise<number> {
    const allActions = await dbManager.getAll<OfflineAction>(
      STORES.OFFLINE_ACTIONS
    );
    let cleared = 0;

    for (const action of allActions) {
      if (action.status === "synced" && action.id) {
        await dbManager.delete(STORES.OFFLINE_ACTIONS, action.id);
        cleared++;
      }
    }

    console.log(`[Sync] Cleared ${cleared} synced actions`);
    return cleared;
  }

  /**
   * Retry failed actions
   */
  async retryFailedActions(): Promise<SyncResult> {
    if (!navigator.onLine) {
      toast.warning("Cannot retry while offline");
      return {
        success: false,
        synced: 0,
        failed: 0,
        errors: [],
      };
    }

    // Reset failed actions to pending
    const allActions = await dbManager.getAll<OfflineAction>(
      STORES.OFFLINE_ACTIONS
    );

    for (const action of allActions) {
      if (action.status === "failed" && action.id) {
        await dbManager.put(STORES.OFFLINE_ACTIONS, {
          ...action,
          status: "pending",
          error: undefined,
        });
      }
    }

    // Sync all pending actions
    return await this.syncAllActions();
  }

  /**
   * Auto-sync when coming online
   */
  enableAutoSync() {
    if (typeof window === "undefined") return;

    const handleOnline = async () => {
      console.log("[Sync] Connection restored, auto-syncing...");
      setTimeout(async () => {
        const pendingCount = await this.getPendingCount();
        if (pendingCount > 0) {
          await this.syncAllActions();
        }
      }, 1000); // Wait 1 second before syncing
    };

    window.addEventListener("online", handleOnline);

    // Return cleanup function
    return () => {
      window.removeEventListener("online", handleOnline);
    };
  }
}

// Export singleton instance
export const syncManager = new OfflineSyncManager();

// Enable auto-sync on initialization
if (typeof window !== "undefined") {
  syncManager.enableAutoSync();
}
