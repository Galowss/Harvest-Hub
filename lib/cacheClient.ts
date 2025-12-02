// Client-side cache service that calls API routes
export class CacheClient {
  static async get<T>(key: string): Promise<T | null> {
    try {
      const response = await fetch(`/api/cache?key=${encodeURIComponent(key)}`);
      const { data } = await response.json();
      return data;
    } catch (error) {
      console.error('Cache client get error:', error);
      return null;
    }
  }

  static async set(key: string, value: any, ttl: number = 3600): Promise<boolean> {
    try {
      const response = await fetch('/api/cache', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ key, value, ttl })
      });
      const { success } = await response.json();
      return success;
    } catch (error) {
      console.error('Cache client set error:', error);
      return false;
    }
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const response = await fetch('/api/cache/invalidate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pattern })
      });
      const { count } = await response.json();
      return count || 0;
    } catch (error) {
      console.error('Cache client invalidate error:', error);
      return 0;
    }
  }

  // Cache key generators (same as server-side)
  static productsListKey() {
    return 'products:list';
  }

  static productKey(productId: string) {
    return `product:${productId}`;
  }

  static farmerProductsKey(farmerId: string) {
    return `farmer:${farmerId}:products`;
  }

  static userOrdersKey(userId: string) {
    return `user:${userId}:orders`;
  }

  static farmerOrdersKey(farmerId: string) {
    return `farmer:${farmerId}:orders`;
  }

  static userCartKey(userId: string) {
    return `user:${userId}:cart`;
  }

  static farmerRatingsKey(farmerId: string) {
    return `farmer:${farmerId}:ratings`;
  }
}
