/**
 * IndexedDB Manager for Offline PWA Storage
 * Provides robust offline data storage with better performance than localStorage
 */

const DB_NAME = 'CardiacDelightsDB';
const DB_VERSION = 1;

// Store names for different data types
export const STORES = {
  INVENTORY: 'inventory',
  MENU: 'menu',
  SUPPLIERS: 'suppliers',
  USERS: 'users',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  OFFLINE_QUEUE: 'offline_queue',
  CACHE_METADATA: 'cache_metadata',
} as const;

export type StoreName = typeof STORES[keyof typeof STORES];

class IndexedDBManager {
  private db: IDBDatabase | null = null;
  private initPromise: Promise<IDBDatabase> | null = null;

  /**
   * Initialize the IndexedDB database
   */
  async init(): Promise<IDBDatabase> {
    if (this.db) return this.db;
    if (this.initPromise) return this.initPromise;

    this.initPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(DB_NAME, DB_VERSION);

      request.onerror = () => {
        console.error('[IndexedDB] Error opening database:', request.error);
        reject(request.error);
      };

      request.onsuccess = () => {
        this.db = request.result;
        console.log('[IndexedDB] Database opened successfully');
        resolve(this.db);
      };

      request.onupgradeneeded = (event) => {
        const db = (event.target as IDBOpenDBRequest).result;
        console.log('[IndexedDB] Upgrading database schema...');

        // Create object stores if they don't exist
        Object.values(STORES).forEach((storeName) => {
          if (!db.objectStoreNames.contains(storeName)) {
            const store = db.createObjectStore(storeName, {
              keyPath: 'id',
              autoIncrement: true,
            });

            // Create indexes for common queries
            if (storeName === STORES.OFFLINE_QUEUE) {
              store.createIndex('status', 'status', { unique: false });
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('entityName', 'entityName', { unique: false });
            } else if (storeName === STORES.CACHE_METADATA) {
              store.createIndex('key', 'key', { unique: true });
              store.createIndex('timestamp', 'timestamp', { unique: false });
            } else {
              store.createIndex('timestamp', 'timestamp', { unique: false });
              store.createIndex('status', 'status', { unique: false });
            }

            console.log(`[IndexedDB] Created store: ${storeName}`);
          }
        });
      };
    });

    return this.initPromise;
  }

  /**
   * Get a value from a store
   */
  async get<T = any>(storeName: StoreName, key: IDBValidKey): Promise<T | null> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.get(key);

        request.onsuccess = () => resolve(request.result || null);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error getting from ${storeName}:`, error);
      return null;
    }
  }

  /**
   * Get all values from a store
   */
  async getAll<T = any>(storeName: StoreName): Promise<T[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.getAll();

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error getting all from ${storeName}:`, error);
      return [];
    }
  }

  /**
   * Put (add or update) a value in a store
   */
  async put<T = any>(storeName: StoreName, value: T): Promise<IDBValidKey> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.put(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error putting to ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Add a value to a store (fails if key exists)
   */
  async add<T = any>(storeName: StoreName, value: T): Promise<IDBValidKey> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.add(value);

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error adding to ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Delete a value from a store
   */
  async delete(storeName: StoreName, key: IDBValidKey): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.delete(key);

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error deleting from ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Clear all values from a store
   */
  async clear(storeName: StoreName): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);
        const request = store.clear();

        request.onsuccess = () => resolve();
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error clearing ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Query by index
   */
  async getByIndex<T = any>(
    storeName: StoreName,
    indexName: string,
    value: IDBValidKey
  ): Promise<T[]> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const index = store.index(indexName);
        const request = index.getAll(value);

        request.onsuccess = () => resolve(request.result || []);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error querying ${storeName} by ${indexName}:`, error);
      return [];
    }
  }

  /**
   * Count items in a store
   */
  async count(storeName: StoreName): Promise<number> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readonly');
        const store = transaction.objectStore(storeName);
        const request = store.count();

        request.onsuccess = () => resolve(request.result);
        request.onerror = () => reject(request.error);
      });
    } catch (error) {
      console.error(`[IndexedDB] Error counting ${storeName}:`, error);
      return 0;
    }
  }

  /**
   * Batch operations
   */
  async bulkPut<T = any>(storeName: StoreName, values: T[]): Promise<void> {
    try {
      const db = await this.init();
      return new Promise((resolve, reject) => {
        const transaction = db.transaction(storeName, 'readwrite');
        const store = transaction.objectStore(storeName);

        let completed = 0;
        const total = values.length;

        values.forEach((value) => {
          const request = store.put(value);
          request.onsuccess = () => {
            completed++;
            if (completed === total) resolve();
          };
          request.onerror = () => reject(request.error);
        });

        if (total === 0) resolve();
      });
    } catch (error) {
      console.error(`[IndexedDB] Error bulk putting to ${storeName}:`, error);
      throw error;
    }
  }

  /**
   * Close the database connection
   */
  close(): void {
    if (this.db) {
      this.db.close();
      this.db = null;
      this.initPromise = null;
      console.log('[IndexedDB] Database closed');
    }
  }
}

// Export singleton instance
export const dbManager = new IndexedDBManager();

// Helper functions for common operations
export const offlineStorage = {
  /**
   * Save data to offline storage
   */
  async saveData<T = any>(storeName: StoreName, data: T[]): Promise<void> {
    await dbManager.bulkPut(storeName, data);
    
    // Update cache metadata
    await dbManager.put(STORES.CACHE_METADATA, {
      key: storeName,
      timestamp: Date.now(),
      count: data.length,
    });
  },

  /**
   * Get data from offline storage
   */
  async getData<T = any>(storeName: StoreName): Promise<T[]> {
    return dbManager.getAll<T>(storeName);
  },

  /**
   * Check if data is fresh (less than maxAge milliseconds old)
   */
  async isFresh(storeName: StoreName, maxAge: number): Promise<boolean> {
    const metadata = await dbManager.getByIndex<any>(
      STORES.CACHE_METADATA,
      'key',
      storeName
    );
    
    if (!metadata || metadata.length === 0) return false;
    
    const age = Date.now() - metadata[0].timestamp;
    return age < maxAge;
  },

  /**
   * Get cache age in milliseconds
   */
  async getCacheAge(storeName: StoreName): Promise<number | null> {
    const metadata = await dbManager.getByIndex<any>(
      STORES.CACHE_METADATA,
      'key',
      storeName
    );
    
    if (!metadata || metadata.length === 0) return null;
    
    return Date.now() - metadata[0].timestamp;
  },

  /**
   * Clear all offline data
   */
  async clearAll(): Promise<void> {
    const stores = Object.values(STORES);
    await Promise.all(stores.map((store) => dbManager.clear(store)));
    console.log('[IndexedDB] All stores cleared');
  },
};

// Initialize on module load
if (typeof window !== 'undefined') {
  dbManager.init().catch((error) => {
    console.error('[IndexedDB] Failed to initialize:', error);
  });
}
