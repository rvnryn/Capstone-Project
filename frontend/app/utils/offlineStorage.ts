/**
 * Offline Storage Utilities
 * Provides helpers for offline data management
 */

import { dbManager, STORES, StoreName } from "./indexedDB";
import { syncManager } from "./offlineSync";

/**
 * Generic offline CRUD operations for any entity type
 */
export class OfflineStorage<T extends { id: string | number }> {
  constructor(private storeName: StoreName, private apiEndpoint: string) {}

  /**
   * Get all items (from IndexedDB if offline, or API if online)
   */
  async getAll(): Promise<T[]> {
    if (navigator.onLine) {
      try {
        // Try to fetch from API
        const response = await fetch(this.apiEndpoint);
        if (response.ok) {
          const data = await response.json();

          // Update IndexedDB cache
          await dbManager.bulkPut(this.storeName, data);

          return data;
        }
      } catch (error) {
        console.warn(`[OfflineStorage] API fetch failed, using cached data`);
      }
    }

    // Return from IndexedDB
    return await dbManager.getAll<T>(this.storeName);
  }

  /**
   * Get item by ID
   */
  async getById(id: string | number): Promise<T | undefined> {
    if (navigator.onLine) {
      try {
        const response = await fetch(`${this.apiEndpoint}/${id}`);
        if (response.ok) {
          const data = await response.json();

          // Update IndexedDB cache
          await dbManager.put(this.storeName, data);

          return data;
        }
      } catch (error) {
        console.warn(`[OfflineStorage] API fetch failed, using cached data`);
      }
    }

    return await dbManager.getById<T>(this.storeName, id);
  }

  /**
   * Create a new item
   */
  async create(item: Omit<T, "id">): Promise<T> {
    const newItem = {
      ...item,
      id: `temp_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      created_at: new Date().toISOString(),
      _offline: !navigator.onLine,
      _pending_sync: !navigator.onLine,
    } as T;

    if (navigator.onLine) {
      try {
        const response = await fetch(this.apiEndpoint, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(item),
        });

        if (response.ok) {
          const serverItem = await response.json();

          // Store in IndexedDB
          await dbManager.put(this.storeName, serverItem);

          return serverItem;
        }
      } catch (error) {
        console.warn(`[OfflineStorage] CREATE failed, saving offline`);
      }
    }

    // Store offline
    await dbManager.add(this.storeName, newItem);

    // Queue for sync
    await syncManager.queueAction(
      this.storeName,
      "CREATE",
      item,
      this.apiEndpoint
    );

    return newItem;
  }

  /**
   * Update an existing item
   */
  async update(id: string | number, updates: Partial<T>): Promise<T> {
    const existingItem = await dbManager.getById<T>(this.storeName, id);

    if (!existingItem) {
      throw new Error(`Item with ID ${id} not found`);
    }

    const updatedItem = {
      ...existingItem,
      ...updates,
      updated_at: new Date().toISOString(),
      _offline: !navigator.onLine,
      _pending_sync: !navigator.onLine,
    } as T;

    if (navigator.onLine) {
      try {
        const response = await fetch(`${this.apiEndpoint}/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(updates),
        });

        if (response.ok) {
          const serverItem = await response.json();

          // Store in IndexedDB
          await dbManager.put(this.storeName, serverItem);

          return serverItem;
        }
      } catch (error) {
        console.warn(`[OfflineStorage] UPDATE failed, saving offline`);
      }
    }

    // Store offline
    await dbManager.put(this.storeName, updatedItem);

    // Queue for sync
    await syncManager.queueAction(
      this.storeName,
      "UPDATE",
      updatedItem,
      `${this.apiEndpoint}/${id}`
    );

    return updatedItem;
  }

  /**
   * Delete an item
   */
  async delete(id: string | number): Promise<boolean> {
    if (navigator.onLine) {
      try {
        const response = await fetch(`${this.apiEndpoint}/${id}`, {
          method: "DELETE",
        });

        if (response.ok) {
          // Remove from IndexedDB
          await dbManager.delete(this.storeName, id);

          return true;
        }
      } catch (error) {
        console.warn(`[OfflineStorage] DELETE failed, queueing for sync`);
      }
    }

    // Mark for deletion offline
    const existingItem = await dbManager.getById<T>(this.storeName, id);

    if (existingItem) {
      const markedItem = {
        ...existingItem,
        _offline: true,
        _pending_sync: true,
        _deleted: true,
      } as any;

      await dbManager.put(this.storeName, markedItem);

      // Queue for sync
      await syncManager.queueAction(
        this.storeName,
        "DELETE",
        { id },
        `${this.apiEndpoint}/${id}`
      );
    }

    return true;
  }

  /**
   * Search/filter items
   */
  async search(predicate: (item: T) => boolean): Promise<T[]> {
    const allItems = await this.getAll();
    return allItems.filter(predicate);
  }

  /**
   * Get pending sync count for this entity
   */
  async getPendingSyncCount(): Promise<number> {
    const items = await dbManager.getPendingSyncItems<T>(this.storeName);
    return items.length;
  }

  /**
   * Clear all local data for this entity
   */
  async clearLocal(): Promise<void> {
    await dbManager.clear(this.storeName);
  }
}

// Pre-configured storage instances for each entity
export const menuStorage = new OfflineStorage(STORES.MENU, "/api/menu");
export const inventoryStorage = new OfflineStorage(
  STORES.INVENTORY,
  "/api/inventory"
);
export const suppliersStorage = new OfflineStorage(
  STORES.SUPPLIERS,
  "/api/suppliers"
);
export const usersStorage = new OfflineStorage(STORES.USERS, "/api/users");

/**
 * Utility functions
 */
export const offlineUtils = {
  /**
   * Check if device is online
   */
  isOnline(): boolean {
    return navigator.onLine;
  },

  /**
   * Get total pending sync count across all entities
   */
  async getTotalPendingCount(): Promise<number> {
    return await syncManager.getPendingCount();
  },

  /**
   * Get pending counts by entity
   */
  async getPendingCountsByEntity(): Promise<Record<string, number>> {
    return await syncManager.getPendingCountByEntity();
  },

  /**
   * Sync all pending changes
   */
  async syncAll() {
    return await syncManager.syncAllActions();
  },

  /**
   * Get database statistics
   */
  async getStats() {
    return await dbManager.getStats();
  },

  /**
   * Clear all offline data
   */
  async clearAllOfflineData() {
    for (const store of Object.values(STORES)) {
      await dbManager.clear(store);
    }
  },

  /**
   * Export all offline data for backup
   */
  async exportOfflineData() {
    const data: Record<string, any> = {};

    for (const store of Object.values(STORES)) {
      data[store] = await dbManager.getAll(store);
    }

    return data;
  },

  /**
   * Import offline data from backup
   */
  async importOfflineData(data: Record<string, any[]>) {
    for (const [store, items] of Object.entries(data)) {
      if (Object.values(STORES).includes(store as StoreName)) {
        await dbManager.bulkPut(store as StoreName, items);
      }
    }
  },

  /**
   * Download offline data as JSON file
   */
  async downloadBackup() {
    const data = await this.exportOfflineData();
    const blob = new Blob([JSON.stringify(data, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `cardiac-delights-backup-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  },
};
