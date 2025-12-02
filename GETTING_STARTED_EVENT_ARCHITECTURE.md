# Quick Start Guide - Event-Driven Architecture

## 🚀 Quick Start (Development)

### Step 1: Install Dependencies
```bash
npm install redis @types/redis ioredis amqplib @types/amqplib
```

### Step 2: Start Redis & RabbitMQ
```bash
# Start Redis
docker run -d -p 6379:6379 --name harvest-redis redis:7-alpine

# Start RabbitMQ
docker run -d -p 5672:5672 -p 15672:15672 --name harvest-rabbitmq \
  -e RABBITMQ_DEFAULT_USER=harvest \
  -e RABBITMQ_DEFAULT_PASS=harvest123 \
  rabbitmq:3-management-alpine
```

### Step 3: Configure Environment
Copy `.env.example` to `.env.local` and add:
```env
REDIS_URL=redis://localhost:6379
RABBITMQ_URL=amqp://localhost:5672
```

### Step 4: Start Next.js
```bash
npm run dev
```

### Step 5: Start Worker (separate terminal)
```bash
npx tsx workers/orderProcessor.ts
```

## 🐳 Quick Start (Docker - Full Stack)

### Deploy everything with one command:
```bash
docker-compose up -d
```

This starts:
- ✅ Nginx (reverse proxy) on port 80/443
- ✅ Next.js app (internal)
- ✅ Redis (caching)
- ✅ RabbitMQ (message queue) + Management UI on port 15672
- ✅ Worker process (background jobs)

### Access services:
- **Application**: http://localhost
- **RabbitMQ Management**: http://localhost:15672 (harvest/harvest123)

### View logs:
```bash
docker-compose logs -f
```

## 📊 Monitoring

### Check Redis:
```bash
# Connect to Redis CLI
docker exec -it harvest-redis redis-cli

# Check cache keys
> KEYS *

# Get cache stats
> INFO stats
```

### Check RabbitMQ:
- Open http://localhost:15672
- Login: harvest / harvest123
- View queues, messages, and consumption rates

## 🔧 Integrating Caching in Your Code

### Example 1: Fetch Products with Cache
```typescript
import { CacheService } from '@/lib/cacheService';
import { db } from '@/app/config/firebase';
import { collection, getDocs } from 'firebase/firestore';

async function getProducts() {
  // Try cache first
  const cached = await CacheService.get(CacheService.productsListKey());
  if (cached) return cached;

  // Cache miss - fetch from Firestore
  const querySnapshot = await getDocs(collection(db, "products"));
  const products = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));

  // Store in cache
  await CacheService.set(CacheService.productsListKey(), products, 3600);
  
  return products;
}
```

### Example 2: Publish Events
```typescript
import { EventPublisher } from '@/lib/eventPublisher';

// After creating an order
await EventPublisher.publishOrderCreated({
  id: orderId,
  userId,
  farmerId,
  totalPrice,
  items
});
```

## 📈 Expected Performance Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Product Load | 800ms | 50ms | **94% faster** |
| Order List | 600ms | 80ms | **87% faster** |
| Firebase Reads | 100,000/day | 30,000/day | **70% reduction** |
| Monthly Cost | $150 | $50-60 | **60% savings** |

## 🛠️ Next Steps

1. **Week 1**: Test Redis caching in development
2. **Week 2**: Deploy Nginx and configure SSL
3. **Week 3**: Implement RabbitMQ event publishing
4. **Week 4**: Monitor and optimize cache hit rates

## 📝 Implementation Checklist

See `IMPLEMENTATION_CHECKLIST.md` for detailed week-by-week tasks.

## ⚠️ Important Notes

- Redis stores data in memory - configure `maxmemory` appropriately
- RabbitMQ queues are durable - messages survive restarts
- Worker must be running to process background jobs
- Invalidate caches after data updates
- Monitor cache hit rates to optimize TTL values

## 🐛 Troubleshooting

### Redis Connection Error
```bash
# Check if Redis is running
docker ps | grep redis

# View Redis logs
docker logs harvest-redis
```

### RabbitMQ Connection Error
```bash
# Check if RabbitMQ is running
docker ps | grep rabbitmq

# View RabbitMQ logs
docker logs harvest-rabbitmq
```

### Cache Not Working
- Check Redis connection in logs
- Verify REDIS_URL environment variable
- Test Redis with: `docker exec -it harvest-redis redis-cli ping`

## 📚 Additional Resources

- `EVENT_DRIVEN_ARCHITECTURE_PLAN.md` - Full architecture details
- `lib/cacheIntegrationExamples.ts` - Code patterns and examples
- `IMPLEMENTATION_CHECKLIST.md` - Week-by-week implementation guide
