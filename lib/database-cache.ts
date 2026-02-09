// Database query caching utilities
// This provides intelligent caching for frequently accessed data

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

class DatabaseCache {
  private cache = new Map<string, CacheEntry<any>>();
  private defaultTTL = 5 * 60 * 1000; // 5 minutes default
  
  // Set cache entry with optional TTL
  set<T>(key: string, data: T, ttl?: number): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    });
  }

  // Get cache entry if not expired
  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) return null;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }
    
    return entry.data;
  }

  // Check if key exists and is valid
  has(key: string): boolean {
    const entry = this.cache.get(key);
    if (!entry) return false;
    
    if (Date.now() - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return false;
    }
    
    return true;
  }

  // Delete specific key
  delete(key: string): boolean {
    return this.cache.delete(key);
  }

  // Clear all cache
  clear(): void {
    this.cache.clear();
  }

  // Clear expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
export const dbCache = new DatabaseCache();

// Cache key generators
export const cacheKeys = {
  tableCount: (tableName: string) => `table_count:${tableName}`,
  tableRegistry: () => 'table_registry',
  tableData: (tableName: string, page: number, limit: number) => 
    `table_data:${tableName}:${page}:${limit}`,
  employeeSummary: () => 'employee_summary',
  branchData: (branchId?: string) => `branch_data:${branchId || 'all'}`,
};

// Auto-cleanup interval (every 10 minutes)
setInterval(() => {
  dbCache.cleanup();
}, 10 * 60 * 1000);

// Cache invalidation helpers
export const invalidateTableCache = (tableName: string): void => {
  dbCache.delete(cacheKeys.tableCount(tableName));
  // Invalidate all data pages for this table
  const stats = dbCache.getStats();
  stats.keys
    .filter(key => key.startsWith(`table_data:${tableName}:`))
    .forEach(key => dbCache.delete(key));
};

export const invalidateAllTableCaches = (): void => {
  const stats = dbCache.getStats();
  stats.keys
    .filter(key => key.startsWith('table_'))
    .forEach(key => dbCache.delete(key));
};
