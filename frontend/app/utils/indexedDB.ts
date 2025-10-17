/**
 * IndexedDB Manager for Offline Data Storage
 * Provides structured storage for offline CRUD operations
 */

const DB_NAME = "CardiacDelightsDB";
const DB_VERSION = 2;

// Store names
export const STORES = {
  MENU: "menu",
  INVENTORY: "inventory",
  SUPPLIERS: "suppliers",
  USERS: "users",
  SETTINGS: "settings",
  OFFLINE_ACTIONS: "offline_actions",
  CACHED_DATA: "cached_data",
  REPORTS: "reports",
} as const;

export type StoreName = (typeof STORES)[keyof typeof STORES];

// Database interface
interface DBSchema {
  [STORES.MENU]: MenuItem[];
  [STORES.INVENTORY]: InventoryItem[];
  [STORES.SUPPLIERS]: Supplier[];
  [STORES.USERS]: User[];
  [STORES.SETTINGS]: Settings[];
  [STORES.OFFLINE_ACTIONS]: OfflineAction[];
  [STORES.CACHED_DATA]: CachedData[];
  [STORES.REPORTS]: Report[];
}

export interface MenuItem {
  id: string | number;
  name: string;
  price: number;
  category: string;
  description?: string;
  image_url?: string;
  available?: boolean;
  created_at?: string;
  updated_at?: string;
  _offline?: boolean;
  _pending_sync?: boolean;
}

export interface InventoryItem {
  id: string | number;
  name: string;
  quantity: number;
  unit: string;
  category: string;
  min_quantity?: number;
  supplier_id?: string;
  created_at?: string;
  updated_at?: string;
  _offline?: boolean;
  _pending_sync?: boolean;
}

export interface Supplier {
  id: string | number;
  name: string;
  contact: string;
  email?: string;
  phone?: string;
  address?: string;
  category?: string;
  created_at?: string;
  updated_at?: string;
  _offline?: boolean;
  _pending_sync?: boolean;
}

export interface User {
  id: string | number;
  name: string;
  email: string;
  role: string;
  status?: string;
  created_at?: string;
  updated_at?: string;
  _offline?: boolean;
  _pending_sync?: boolean;
}

export interface Settings {
  key: string;
  value: any;
  updated_at?: string;
}

export interface OfflineAction {
  id?: number;
  entity_type: StoreName;
  operation: "CREATE" | "UPDATE" | "DELETE";
  data: any;
  endpoint: string;
  method: string;
  timestamp: number;
  status: "pending" | "synced" | "failed";
  error?: string;
}

export interface CachedData {
  key: string;
  data: any;
  timestamp: number;
  expiry?: number;
}

export interface Report {
  id: string;
  type: string;
  data: any;
  generated_at: string;
}

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the database connection
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) {
      return this.db;
    }

    if (this.initPromise) {
      return this.initPromise;
    }

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;

        // Create object stores
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            if (storeName === STORES.OFFLINE_ACTIONS) {
              const store = db.createObjectStore(storeName, {
                keyPath: "id",
                autoIncrement: true,
              });
              store.createIndex("entity_type", "entity_type", { unique: false });
              store.createIndex("status", "status", { unique: false });
              store.createIndex("timestamp", "timestamp", { unique: false });
            } else if (storeName === STORES.CACHED_DATA) {
              db.createObjectStore(storeName, { keyPath: "key" });
            } else if (storeName === STORES.SETTINGS) {
              db.createObjectStore(storeName, { keyPath: "key" });
            } else {
              const store = db.createObjectStore(storeName, { keyPath: "id" });
              store.createIndex("_pending_sync", "_pending_sync", {
                unique: false,
              });
            }
          }
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Get all items from a store
   */
  async getAll<T>(storeName: StoreName): Promise<T[]> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.getAll();

      request.onsuccess = () => resolve(request.result as T[]);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get a single item by ID
   */
  async getById<T>(storeName: StoreName, id: string | number): Promise<T | undefined> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.get(id);

      request.onsuccess = () => resolve(request.result as T);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Add a new item to a store
   */
  async add<T>(storeName: StoreName, item: T): Promise<string | number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.add(item);

      request.onsuccess = () => resolve(request.result as string | number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Update an existing item
   */
  async put<T>(storeName: StoreName, item: T): Promise<string | number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.put(item);

      request.onsuccess = () => resolve(request.result as string | number);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Delete an item by ID
   */
  async delete(storeName: StoreName, id: string | number): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.delete(id);

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Clear all items from a store
   */
  async clear(storeName: StoreName): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);
      const request = store.clear();

      request.onsuccess = () => resolve();
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get items by index
   */
  async getByIndex<T>(
    storeName: StoreName,
    indexName: string,
    value: any
  ): Promise<T[]> {
    let lastError;
    for (let attempt = 0; attempt < 2; attempt++) {
      const db = await this.init();
      try {
        const transaction = db.transaction(storeName, "readonly");
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);
        return await new Promise<T[]>((resolve, reject) => {
          request.onsuccess = () => resolve(request.result as T[]);
          request.onerror = () => reject(request.error);
        });
      } catch (err: any) {
        lastError = err;
        if (err && err.name === "InvalidStateError") {
          this.db = null;
          continue; // retry
        }
        throw err;
      }
    }
    throw lastError;
  }

  /**
   * Batch operations
   */
  async bulkPut<T>(storeName: StoreName, items: T[]): Promise<void> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readwrite");
      const store = transaction.objectStore(storeName);

      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);

      items.forEach((item) => {
        store.put(item);
      });
    });
  }

  /**
   * Count items in a store
   */
  async count(storeName: StoreName): Promise<number> {
    const db = await this.init();
    return new Promise((resolve, reject) => {
      const transaction = db.transaction(storeName, "readonly");
      const store = transaction.objectStore(storeName);
      const request = store.count();

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
  }

  /**
   * Get pending sync items
   */
  async getPendingSyncItems<T>(storeName: StoreName): Promise<T[]> {
    try {
      return await this.getByIndex<T>(storeName, "_pending_sync", true);
    } catch (error) {
      console.warn(`No _pending_sync index for ${storeName}`);
      return [];
    }
  }

  /**
   * Queue an offline action
   */
  async queueAction(action: Omit<OfflineAction, "id">): Promise<number> {
    return this.add(STORES.OFFLINE_ACTIONS, {
      ...action,
      timestamp: Date.now(),
      status: "pending" as const,
    }) as Promise<number>;
  }

  /**
   * Get all pending offline actions
   */
  async getPendingActions(): Promise<OfflineAction[]> {
    return this.getByIndex<OfflineAction>(
      STORES.OFFLINE_ACTIONS,
      "status",
      "pending"
    );
  }

  /**
   * Mark action as synced
   */
  async markActionSynced(actionId: number): Promise<void> {
    const action = await this.getById<OfflineAction>(
      STORES.OFFLINE_ACTIONS,
      actionId
    );
    if (action) {
      await this.put(STORES.OFFLINE_ACTIONS, {
        ...action,
        status: "synced" as const,
      });
    }
  }

  /**
   * Mark action as failed
   */
  async markActionFailed(actionId: number, error: string): Promise<void> {
    const action = await this.getById<OfflineAction>(
      STORES.OFFLINE_ACTIONS,
      actionId
    );
    if (action) {
      await this.put(STORES.OFFLINE_ACTIONS, {
        ...action,
        status: "failed" as const,
        error,
      });
    }
  }

  /**
   * Cache data with expiry
   */
  async cacheData(key: string, data: any, expiryHours: number = 24): Promise<void> {
    const cacheEntry: CachedData = {
      key,
      data,
      timestamp: Date.now(),
      expiry: Date.now() + expiryHours * 60 * 60 * 1000,
    };

    await this.put(STORES.CACHED_DATA, cacheEntry);
  }

  /**
   * Get cached data
   */
  async getCachedData(key: string): Promise<any | null> {
    const cached = await this.getById<CachedData>(STORES.CACHED_DATA, key);

    if (!cached) {
      return null;
    }

    // Check if expired
    if (cached.expiry && Date.now() > cached.expiry) {
      await this.delete(STORES.CACHED_DATA, key);
      return null;
    }

    return cached.data;
  }

  /**
   * Clear expired cache entries
   */
  async clearExpiredCache(): Promise<number> {
    const allCached = await this.getAll<CachedData>(STORES.CACHED_DATA);
    const now = Date.now();
    let cleared = 0;

    for (const entry of allCached) {
      if (entry.expiry && now > entry.expiry) {
        await this.delete(STORES.CACHED_DATA, entry.key);
        cleared++;
      }
    }

    return cleared;
  }

  /**
   * Get database stats
   */
  async getStats() {
    const stats: Record<string, number> = {};

    for (const store of Object.values(STORES)) {
      stats[store] = await this.count(store);
    }

    const pendingActions = await this.getPendingActions();

    return {
      counts: stats,
      pendingActions: pendingActions.length,
      totalSize: Object.values(stats).reduce((sum, count) => sum + count, 0),
    };
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();

// Initialize on load
if (typeof window !== "undefined") {
  dbManager.init().catch((error) => {
    console.error("Failed to initialize IndexedDB:", error);
  });
}
