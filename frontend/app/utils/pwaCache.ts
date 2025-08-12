/**
 * PWA Caching Utilities
 * Smart caching strategies for different types of data
 */

export interface CacheConfig {
  key: string;
  ttl?: number; // Time to live in milliseconds
  version?: string;
}

export interface CachedData<T = any> {
  data: T;
  timestamp: number;
  version: string;
  lastUpdated: string;
}

/**
 * Smart Cache Manager
 */
export class PWACache {
  private static prefix = 'pwa_cache_';

  /**
   * Store data with smart caching strategy
   */
  static set<T>(config: CacheConfig, data: T): void {
    try {
      const cachedData: CachedData<T> = {
        data,
        timestamp: Date.now(),
        version: config.version || '1.0',
        lastUpdated: new Date().toISOString(),
      };

      localStorage.setItem(
        `${this.prefix}${config.key}`,
        JSON.stringify(cachedData)
      );

      // Store cache metadata
      const metadata = {
        key: config.key,
        ttl: config.ttl || 3600000, // Default 1 hour
        version: config.version || '1.0',
        stored: Date.now(),
      };

      localStorage.setItem(
        `${this.prefix}meta_${config.key}`,
        JSON.stringify(metadata)
      );
    } catch (error) {
      console.error('Failed to cache data:', error);
    }
  }

  /**
   * Get cached data with freshness check
   */
  static get<T>(key: string): CachedData<T> | null {
    try {
      const cached = localStorage.getItem(`${this.prefix}${key}`);
      const metadata = localStorage.getItem(`${this.prefix}meta_${key}`);

      if (!cached || !metadata) return null;

      const meta = JSON.parse(metadata);
      const now = Date.now();

      // Check if cache is expired
      if (meta.ttl && now - meta.stored > meta.ttl) {
        this.remove(key);
        return null;
      }

      return JSON.parse(cached) as CachedData<T>;
    } catch (error) {
      console.error('Failed to get cached data:', error);
      return null;
    }
  }

  /**
   * Check if data is cached and fresh
   */
  static isFresh(key: string): boolean {
    try {
      const metadata = localStorage.getItem(`${this.prefix}meta_${key}`);
      if (!metadata) return false;

      const meta = JSON.parse(metadata);
      const now = Date.now();

      return !meta.ttl || now - meta.stored <= meta.ttl;
    } catch {
      return false;
    }
  }

  /**
   * Get cache age in minutes
   */
  static getAge(key: string): number | null {
    try {
      const metadata = localStorage.getItem(`${this.prefix}meta_${key}`);
      if (!metadata) return null;

      const meta = JSON.parse(metadata);
      return Math.floor((Date.now() - meta.stored) / (1000 * 60));
    } catch {
      return null;
    }
  }

  /**
   * Remove cached data
   */
  static remove(key: string): void {
    localStorage.removeItem(`${this.prefix}${key}`);
    localStorage.removeItem(`${this.prefix}meta_${key}`);
  }

  /**
   * Clear all cached data
   */
  static clear(): void {
    const keys = Object.keys(localStorage).filter(key => 
      key.startsWith(this.prefix)
    );
    keys.forEach(key => localStorage.removeItem(key));
  }

  /**
   * Get all cached keys
   */
  static getKeys(): string[] {
    return Object.keys(localStorage)
      .filter(key => key.startsWith(`${this.prefix}meta_`))
      .map(key => key.replace(`${this.prefix}meta_`, ''));
  }
}

/**
 * Cache strategies for different data types
 */
export const CacheStrategies = {
  // User data - cache for 30 minutes
  USER_DATA: { ttl: 30 * 60 * 1000 },
  
  // Dashboard data - cache for 10 minutes
  DASHBOARD: { ttl: 10 * 60 * 1000 },
  
  // Inventory data - cache for 5 minutes
  INVENTORY: { ttl: 5 * 60 * 1000 },
  
  // Menu data - cache for 1 hour
  MENU: { ttl: 60 * 60 * 1000 },
  
  // Reports - cache for 15 minutes
  REPORTS: { ttl: 15 * 60 * 1000 },
  
  // Settings - cache for 24 hours
  SETTINGS: { ttl: 24 * 60 * 60 * 1000 },
  
  // Static data - cache indefinitely
  STATIC: { ttl: undefined },
};
