import { getRedisClient } from './redis';

export class CacheService {
  private static DEFAULT_TTL = 3600; // 1 hour in seconds

  static async get<T>(key: string): Promise<T | null> {
    try {
      const client = await getRedisClient();
      if (!client) return null; // Redis not available - skip cache
      
      const data = await client.get(key);
      return data ? JSON.parse(data.toString()) : null;
    } catch (error) {
      console.error(`Cache get error for key ${key}:`, error);
      return null; // Fail gracefully
    }
  }

  static async set(key: string, value: any, ttl: number = this.DEFAULT_TTL): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) return false; // Redis not available - skip cache
      
      await client.setEx(key, ttl, JSON.stringify(value));
      return true;
    } catch (error) {
      console.error(`Cache set error for key ${key}:`, error);
      return false;
    }
  }

  static async del(key: string): Promise<boolean> {
    try {
      const client = await getRedisClient();
      if (!client) return false; // Redis not available - skip cache
      
      await client.del(key);
      return true;
    } catch (error) {
      console.error(`Cache delete error for key ${key}:`, error);
      return false;
    }
  }

  static async invalidatePattern(pattern: string): Promise<number> {
    try {
      const client = await getRedisClient();
      if (!client) return 0; // Redis not available - skip cache
      
      const keys = await client.keys(pattern);
      if (keys.length > 0) {
        const result = await client.del(keys);
        return typeof result === 'number' ? result : parseInt(result, 10);
      }
      return 0;
    } catch (error) {
      console.error(`Cache invalidate pattern error for ${pattern}:`, error);
      return 0;
    }
  }

  // Specific cache key generators
  static productKey(productId: string) {
    return `product:${productId}`;
  }

  static productsListKey(filters?: any) {
    return filters 
      ? `products:list:${JSON.stringify(filters)}`
      : 'products:list:all';
  }

  static farmerProductsKey(farmerId: string) {
    return `farmer:${farmerId}:products`;
  }

  static ordersKey(userId: string) {
    return `user:${userId}:orders`;
  }

  static farmerOrdersKey(farmerId: string) {
    return `farmer:${farmerId}:orders`;
  }

  static userKey(userId: string) {
    return `user:${userId}`;
  }
}
