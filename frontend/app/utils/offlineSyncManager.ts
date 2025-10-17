/**
 * Offline Sync Manager
 * Handles syncing of offline data when connection is restored
 */

import { dbManager, STORES, OfflineAction } from "./indexedDB";

class OfflineSyncManager {
  private isSyncing = false;
  private syncCallbacks: Array<(status: SyncStatus) => void> = [];

  /**
   * Register a callback for sync status updates
   */
  onSyncStatusChange(callback: (status: SyncStatus) => void) {
    this.syncCallbacks.push(callback);
    return () => {
      this.syncCallbacks = this.syncCallbacks.filter((cb) => cb !== callback);
    };
  }

  /**
   * Notify all callbacks of sync status
   */
  private notifySyncStatus(status: SyncStatus) {
    this.syncCallbacks.forEach((callback) => callback(status));
  }

  /**
   * Sync all pending offline actions
   */
  async syncAll(): Promise<SyncResult> {
    if (this.isSyncing) {
      console.log("⏳ Sync already in progress");
      return {
        success: false,
        message: "Sync already in progress",
        synced: 0,
        failed: 0,
      };
    }

    this.isSyncing = true;
    this.notifySyncStatus({ syncing: true, progress: 0 });

    try {
      const pendingActions = await dbManager.getPendingActions();

      if (pendingActions.length === 0) {
        console.log("✅ No pending actions to sync");
        this.isSyncing = false;
        this.notifySyncStatus({ syncing: false, progress: 100 });
        return {
          success: true,
          message: "No pending actions",
          synced: 0,
          failed: 0,
        };
      }

      console.log(`🔄 Syncing ${pendingActions.length} pending actions...`);

      let synced = 0;
      let failed = 0;
      const failedActions: Array<{ action: OfflineAction; error: string }> = [];

      for (let i = 0; i < pendingActions.length; i++) {
        const action = pendingActions[i];
        const progress = ((i + 1) / pendingActions.length) * 100;

        this.notifySyncStatus({ syncing: true, progress });

        try {
          await this.syncAction(action);
          synced++;

          if (action.id) {
            await dbManager.markActionSynced(action.id);
          }
        } catch (error) {
          failed++;
          const errorMessage =
            error instanceof Error ? error.message : "Unknown error";

          if (action.id) {
            await dbManager.markActionFailed(action.id, errorMessage);
          }

          failedActions.push({ action, error: errorMessage });
          console.error(`❌ Failed to sync action ${action.id}:`, error);
        }
      }

      const result: SyncResult = {
        success: failed === 0,
        message: `Synced ${synced} actions, ${failed} failed`,
        synced,
        failed,
        failedActions: failedActions.length > 0 ? failedActions : undefined,
      };

      console.log(
        `✅ Sync complete: ${synced} synced, ${failed} failed`
      );

      this.isSyncing = false;
      this.notifySyncStatus({ syncing: false, progress: 100 });

      return result;
    } catch (error) {
      console.error("❌ Sync failed:", error);
      this.isSyncing = false;
      this.notifySyncStatus({ syncing: false, progress: 0 });

      return {
        success: false,
        message: error instanceof Error ? error.message : "Sync failed",
        synced: 0,
        failed: 0,
      };
    }
  }

  /**
   * Sync a single offline action
   */
  private async syncAction(action: OfflineAction): Promise<void> {
    const { endpoint, method, data } = action;

    console.log(`🔄 Syncing ${method} ${endpoint}`);

    const response = await fetch(endpoint, {
      method,
      headers: {
        "Content-Type": "application/json",
      },
      body: method !== "GET" ? JSON.stringify(data) : undefined,
    });

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const result = await response.json();
    console.log(`✅ Synced action:`, result);

    return result;
  }

  /**
   * Queue an offline action
   */
  async queueAction(
    entityType: string,
    operation: "CREATE" | "UPDATE" | "DELETE",
    data: any,
    endpoint: string,
    method: string
  ): Promise<number> {
    console.log(`📋 Queuing ${operation} action for ${entityType}`);

    const actionId = await dbManager.queueAction({
      entity_type: entityType as any,
      operation,
      data,
      endpoint,
      method,
      timestamp: Date.now(),
      status: "pending",
    });

    console.log(`✅ Queued action ID: ${actionId}`);
    return actionId;
  }

  /**
   * Get pending actions count
   */
  async getPendingCount(): Promise<number> {
    const actions = await dbManager.getPendingActions();
    return actions.length;
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

    console.log(`🗑️ Cleared ${cleared} synced actions`);
    return cleared;
  }

  /**
   * Retry failed actions
   */
  async retryFailedActions(): Promise<SyncResult> {
    const allActions = await dbManager.getAll<OfflineAction>(
      STORES.OFFLINE_ACTIONS
    );

    const failedActions = allActions.filter(
      (action) => action.status === "failed"
    );

    if (failedActions.length === 0) {
      return {
        success: true,
        message: "No failed actions to retry",
        synced: 0,
        failed: 0,
      };
    }

    console.log(`🔄 Retrying ${failedActions.length} failed actions...`);

    // Mark failed actions as pending and sync
    for (const action of failedActions) {
      if (action.id) {
        await dbManager.put(STORES.OFFLINE_ACTIONS, {
          ...action,
          status: "pending",
        });
      }
    }

    return this.syncAll();
  }

  /**
   * Get sync statistics
   */
  async getSyncStats() {
    const allActions = await dbManager.getAll<OfflineAction>(
      STORES.OFFLINE_ACTIONS
    );

    const stats = {
      total: allActions.length,
      pending: allActions.filter((a) => a.status === "pending").length,
      synced: allActions.filter((a) => a.status === "synced").length,
      failed: allActions.filter((a) => a.status === "failed").length,
      oldestPending: allActions
        .filter((a) => a.status === "pending")
        .sort((a, b) => a.timestamp - b.timestamp)[0]?.timestamp,
    };

    return stats;
  }
}

// Types
export interface SyncStatus {
  syncing: boolean;
  progress: number;
}

export interface SyncResult {
  success: boolean;
  message: string;
  synced: number;
  failed: number;
  failedActions?: Array<{ action: OfflineAction; error: string }>;
}

// Export singleton instance
export const syncManager = new OfflineSyncManager();

// Auto-sync when online
if (typeof window !== "undefined") {
  window.addEventListener("online", async () => {
    console.log("🌐 Connection restored - starting auto-sync...");
    const result = await syncManager.syncAll();
    console.log("Auto-sync result:", result);
  });
}
