import { createClient } from 'redis';

let redisClient: ReturnType<typeof createClient> | null = null;
let redisAvailable = true;

export async function getRedisClient() {
  // If Redis is disabled or unavailable, return null
  if (!redisAvailable) {
    return null;
  }

  if (!redisClient) {
    try {
      const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';
      const isTLS = redisUrl.startsWith('rediss://');
      
      redisClient = createClient({
        url: redisUrl,
        socket: {
          tls: isTLS, // Enable TLS for Upstash
          rejectUnauthorized: false, // Accept self-signed certificates
          reconnectStrategy: (retries) => {
            if (retries > 10) {
              console.error('Redis: Too many reconnection attempts');
              redisAvailable = false;
              return new Error('Too many retries');
            }
            return retries * 100; // Exponential backoff
          }
        }
      });

      redisClient.on('error', (err) => {
        console.error('Redis Client Error:', err);
        redisAvailable = false;
      });
      redisClient.on('connect', () => console.log('✅ Redis: Connected'));
      redisClient.on('reconnecting', () => console.log('Redis: Reconnecting...'));

      await redisClient.connect();
    } catch (error) {
      console.warn('⚠️ Redis unavailable - caching disabled:', error);
      redisAvailable = false;
      redisClient = null;
      return null;
    }
  }

  return redisClient;
}

export async function disconnectRedis() {
  if (redisClient) {
    await redisClient.quit();
    redisClient = null;
  }
}
