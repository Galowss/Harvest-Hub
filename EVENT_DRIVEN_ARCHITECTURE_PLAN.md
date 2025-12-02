# Event-Driven Architecture Integration Plan
## Redis, Nginx, and RabbitMQ for Harvest Hub

**Date:** December 2, 2025  
**System:** Harvest Hub - Agricultural Marketplace  
**Goal:** Transform into a fully event-driven, scalable architecture

---

## 📊 Current Architecture Analysis

### Current Stack
- **Frontend/Backend:** Next.js 15.5.4 (App Router)
- **Database:** Firebase Firestore (NoSQL)
- **Auth:** Firebase Authentication
- **Storage:** Firebase Storage
- **State:** Local React state (no global state management)
- **Deployment:** Docker containers

### Current Limitations
1. ❌ No caching layer (repeated Firestore queries)
2. ❌ No message queue (synchronous operations)
3. ❌ No reverse proxy (direct Node.js exposure)
4. ❌ No real-time event distribution
5. ❌ No load balancing capability
6. ❌ Poor scalability for high traffic

---

## 🎯 Recommended Architecture

### High-Level Overview

```
┌─────────────┐
│   Clients   │
│ (Browsers)  │
└──────┬──────┘
       │
       ▼
┌─────────────┐
│    Nginx    │ ← Reverse Proxy, Load Balancer, SSL
└──────┬──────┘
       │
       ▼
┌─────────────────────────────────┐
│      Next.js Application        │
│  (Multiple Instances Possible)  │
└─────┬───────────────────┬───────┘
      │                   │
      ▼                   ▼
┌─────────┐         ┌──────────┐
│  Redis  │         │ RabbitMQ │
│ Cache   │         │  Queue   │
└────┬────┘         └─────┬────┘
     │                    │
     └────────┬───────────┘
              │
              ▼
      ┌──────────────┐
      │   Firebase   │
      │  (Firestore) │
      └──────────────┘
```

---

## 🔴 1. Redis Integration

### Purpose
- **Caching:** Reduce Firestore reads (cost optimization)
- **Session Management:** Store user sessions
- **Real-time Data:** Pub/Sub for live updates
- **Rate Limiting:** API throttling

### Use Cases for Harvest Hub

#### A. Product Caching
```javascript
// Cache frequently accessed products
Cache Key: products:all
Cache Key: products:farmer:{farmerId}
Cache Key: products:category:{category}
TTL: 5 minutes
```

#### B. User Session Management
```javascript
Cache Key: session:{userId}
TTL: 24 hours
Data: { userId, role, name, email, lastActive }
```

#### C. Real-time Notifications
```javascript
// Pub/Sub channels
Channel: orders:new:{farmerId}
Channel: products:updated:{productId}
Channel: ratings:new:{farmerId}
```

#### D. Rate Limiting
```javascript
// Prevent abuse
Cache Key: ratelimit:{userId}:{endpoint}
TTL: 1 minute
Limit: 60 requests/minute
```

### Implementation Steps

#### Step 1: Install Redis Client
```bash
npm install redis @types/redis ioredis
```

#### Step 2: Create Redis Configuration
**File:** `lib/redis.ts`

```typescript
import { createClient } from 'redis';

const redisClient = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379',
  password: process.env.REDIS_PASSWORD,
});

redisClient.on('error', (err) => console.error('Redis Client Error', err));
redisClient.on('connect', () => console.log('Redis Client Connected'));

export const connectRedis = async () => {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
  return redisClient;
};

export default redisClient;
```

#### Step 3: Create Cache Service
**File:** `lib/cacheService.ts`

```typescript
import redisClient from './redis';

export class CacheService {
  // Get cached data
  static async get<T>(key: string): Promise<T | null> {
    try {
      const data = await redisClient.get(key);
      return data ? JSON.parse(data) : null;
    } catch (error) {
      console.error('Cache get error:', error);
      return null;
    }
  }

  // Set cached data
  static async set(key: string, value: any, ttl: number = 300): Promise<void> {
    try {
      await redisClient.setEx(key, ttl, JSON.stringify(value));
    } catch (error) {
      console.error('Cache set error:', error);
    }
  }

  // Delete cached data
  static async del(key: string): Promise<void> {
    try {
      await redisClient.del(key);
    } catch (error) {
      console.error('Cache delete error:', error);
    }
  }

  // Invalidate pattern
  static async invalidatePattern(pattern: string): Promise<void> {
    try {
      const keys = await redisClient.keys(pattern);
      if (keys.length > 0) {
        await redisClient.del(keys);
      }
    } catch (error) {
      console.error('Cache invalidate error:', error);
    }
  }
}
```

#### Step 4: Implement Product Caching
**Example Usage:**

```typescript
// In your API route or server component
import { CacheService } from '@/lib/cacheService';
import { getDocs, collection } from 'firebase/firestore';
import { db } from '@/app/config/firebase';

export async function getProducts() {
  const cacheKey = 'products:all';
  
  // Try cache first
  const cached = await CacheService.get(cacheKey);
  if (cached) {
    console.log('✅ Cache HIT');
    return cached;
  }
  
  console.log('❌ Cache MISS - Fetching from Firestore');
  // Fetch from Firestore
  const querySnapshot = await getDocs(collection(db, 'products'));
  const products = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
  
  // Cache for 5 minutes
  await CacheService.set(cacheKey, products, 300);
  
  return products;
}

// Invalidate cache when products change
export async function invalidateProductCache() {
  await CacheService.invalidatePattern('products:*');
}
```

---

## 🟢 2. Nginx Integration

### Purpose
- **Reverse Proxy:** Hide Node.js implementation
- **Load Balancing:** Distribute traffic across multiple instances
- **SSL Termination:** Handle HTTPS
- **Static File Serving:** Serve assets efficiently
- **Compression:** Gzip/Brotli compression
- **Security:** Rate limiting, DDoS protection

### Nginx Configuration

#### File: `nginx.conf`

```nginx
# Main configuration
user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';
    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript 
               application/json application/javascript application/xml+rss 
               application/rss+xml font/truetype font/opentype 
               application/vnd.ms-fontobject image/svg+xml;

    # Rate limiting
    limit_req_zone $binary_remote_addr zone=general:10m rate=10r/s;
    limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;

    # Upstream - Next.js application
    upstream nextjs_backend {
        least_conn;
        server nextjs:3000 max_fails=3 fail_timeout=30s;
        # Add more instances for load balancing:
        # server nextjs2:3000 max_fails=3 fail_timeout=30s;
        # server nextjs3:3000 max_fails=3 fail_timeout=30s;
    }

    # HTTP to HTTPS redirect
    server {
        listen 80;
        server_name harvesthub.com www.harvesthub.com;
        return 301 https://$server_name$request_uri;
    }

    # Main HTTPS server
    server {
        listen 443 ssl http2;
        server_name harvesthub.com www.harvesthub.com;

        # SSL Configuration (use Let's Encrypt)
        ssl_certificate /etc/nginx/ssl/cert.pem;
        ssl_certificate_key /etc/nginx/ssl/key.pem;
        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;
        ssl_session_cache shared:SSL:10m;
        ssl_session_timeout 10m;

        # Security headers
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-XSS-Protection "1; mode=block" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header Referrer-Policy "no-referrer-when-downgrade" always;
        add_header Content-Security-Policy "default-src 'self' https: data: 'unsafe-inline' 'unsafe-eval';" always;

        # Max body size (for image uploads)
        client_max_body_size 10M;

        # Static files caching
        location /_next/static {
            proxy_pass http://nextjs_backend;
            proxy_cache_valid 200 60m;
            add_header Cache-Control "public, immutable";
        }

        # API routes with rate limiting
        location /api/ {
            limit_req zone=api burst=20 nodelay;
            proxy_pass http://nextjs_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
            proxy_read_timeout 300s;
            proxy_connect_timeout 75s;
        }

        # All other routes
        location / {
            limit_req zone=general burst=5 nodelay;
            proxy_pass http://nextjs_backend;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
            proxy_cache_bypass $http_upgrade;
        }

        # Health check endpoint
        location /health {
            access_log off;
            proxy_pass http://nextjs_backend;
        }
    }
}
```

---

## 🟠 3. RabbitMQ Integration

### Purpose
- **Async Operations:** Handle time-consuming tasks
- **Event Distribution:** Publish/Subscribe pattern
- **Decoupling:** Separate services communication
- **Reliability:** Message persistence and retry

### Use Cases for Harvest Hub

#### A. Order Processing
```
Event: order.created
Consumers:
- Inventory Service (update stock)
- Notification Service (email/SMS)
- Analytics Service (track metrics)
- Payment Service (process payment)
```

#### B. Product Updates
```
Event: product.updated
Consumers:
- Cache Service (invalidate cache)
- Search Index Service (update search)
- Recommendation Service (recalculate)
```

#### C. Notifications
```
Event: notification.send
Consumers:
- Email Service
- SMS Service
- Push Notification Service
- In-app Notification Service
```

#### D. Image Processing
```
Event: image.uploaded
Consumers:
- Thumbnail Generator
- Image Optimizer
- Image Classifier (AI)
- Watermark Service
```

### Implementation Steps

#### Step 1: Install RabbitMQ Client
```bash
npm install amqplib @types/amqplib
```

#### Step 2: Create RabbitMQ Connection
**File:** `lib/rabbitmq.ts`

```typescript
import amqp, { Connection, Channel } from 'amqplib';

let connection: Connection | null = null;
let channel: Channel | null = null;

export const connectRabbitMQ = async () => {
  try {
    if (!connection) {
      connection = await amqp.connect(
        process.env.RABBITMQ_URL || 'amqp://localhost:5672'
      );
      console.log('✅ RabbitMQ Connected');

      connection.on('error', (err) => {
        console.error('RabbitMQ connection error:', err);
        connection = null;
        channel = null;
      });

      connection.on('close', () => {
        console.log('RabbitMQ connection closed');
        connection = null;
        channel = null;
      });
    }

    if (!channel) {
      channel = await connection.createChannel();
      await channel.assertExchange('harvest_hub', 'topic', { durable: true });
    }

    return { connection, channel };
  } catch (error) {
    console.error('Failed to connect to RabbitMQ:', error);
    throw error;
  }
};

export const getChannel = async (): Promise<Channel> => {
  if (!channel) {
    const { channel: newChannel } = await connectRabbitMQ();
    return newChannel;
  }
  return channel;
};
```

#### Step 3: Create Event Publisher
**File:** `lib/eventPublisher.ts`

```typescript
import { getChannel } from './rabbitmq';

export class EventPublisher {
  private static exchange = 'harvest_hub';

  static async publish(routingKey: string, message: any) {
    try {
      const channel = await getChannel();
      const messageBuffer = Buffer.from(JSON.stringify(message));
      
      channel.publish(
        this.exchange,
        routingKey,
        messageBuffer,
        { persistent: true }
      );

      console.log(`📤 Published event: ${routingKey}`, message);
    } catch (error) {
      console.error('Failed to publish event:', error);
      throw error;
    }
  }

  // Specific event publishers
  static async publishOrderCreated(order: any) {
    await this.publish('order.created', {
      type: 'ORDER_CREATED',
      timestamp: new Date().toISOString(),
      data: order
    });
  }

  static async publishProductUpdated(product: any) {
    await this.publish('product.updated', {
      type: 'PRODUCT_UPDATED',
      timestamp: new Date().toISOString(),
      data: product
    });
  }

  static async publishNotification(notification: any) {
    await this.publish('notification.send', {
      type: 'NOTIFICATION_SEND',
      timestamp: new Date().toISOString(),
      data: notification
    });
  }

  static async publishImageUpload(imageData: any) {
    await this.publish('image.uploaded', {
      type: 'IMAGE_UPLOADED',
      timestamp: new Date().toISOString(),
      data: imageData
    });
  }
}
```

#### Step 4: Create Event Consumers
**File:** `workers/orderProcessor.ts`

```typescript
import { getChannel } from '../lib/rabbitmq';
import { updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../app/config/firebase';

export class OrderProcessor {
  static async start() {
    const channel = await getChannel();
    const queue = 'order_processing';

    await channel.assertQueue(queue, { durable: true });
    await channel.bindQueue(queue, 'harvest_hub', 'order.created');

    console.log('🎧 Order Processor listening...');

    channel.consume(queue, async (msg) => {
      if (!msg) return;

      try {
        const event = JSON.parse(msg.content.toString());
        console.log('📦 Processing order:', event.data);

        // Update inventory
        if (event.data.productId) {
          await updateDoc(doc(db, 'products', event.data.productId), {
            stock: increment(-event.data.quantity)
          });
        }

        // Send notifications
        await this.sendOrderNotification(event.data);

        // Update analytics
        await this.trackOrderMetrics(event.data);

        channel.ack(msg);
        console.log('✅ Order processed successfully');
      } catch (error) {
        console.error('❌ Error processing order:', error);
        channel.nack(msg, false, true); // Requeue
      }
    });
  }

  private static async sendOrderNotification(order: any) {
    // Send email/SMS notification
    console.log('📧 Sending notification for order:', order.id);
  }

  private static async trackOrderMetrics(order: any) {
    // Track in analytics
    console.log('📊 Tracking metrics for order:', order.id);
  }
}
```

#### Step 5: Update Order Creation
**Modify:** `app/dashboard/user/order-summary/page.tsx`

```typescript
import { EventPublisher } from '@/lib/eventPublisher';

const handlePlaceOrder = async () => {
  // ... existing order creation code ...

  try {
    // Create order in Firestore
    const orderRef = await addDoc(collection(db, "orders"), orderData);

    // Publish event for async processing
    await EventPublisher.publishOrderCreated({
      id: orderRef.id,
      ...orderData
    });

    // Remove from cart immediately
    await deleteDoc(doc(db, "cart", item.id));

    alert('Order placed successfully!');
    router.push("/dashboard/user/orders");
  } catch (err) {
    console.error("Error placing order:", err);
    alert("Error placing order. Please try again.");
  }
};
```

---

## 🐳 Docker Compose Configuration

**Updated `compose.yaml`:**

```yaml
version: '3.8'

services:
  # Nginx Reverse Proxy
  nginx:
    image: nginx:alpine
    container_name: harvest-hub-nginx
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
      - ./ssl:/etc/nginx/ssl:ro
    depends_on:
      - nextjs
    networks:
      - harvest-hub-network
    restart: unless-stopped

  # Next.js Application
  nextjs:
    build:
      context: .
      dockerfile: Dockerfile
    container_name: harvest-hub-app
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    networks:
      - harvest-hub-network
    restart: unless-stopped
    # For load balancing, add more instances:
    # deploy:
    #   replicas: 3

  # Redis Cache
  redis:
    image: redis:7-alpine
    container_name: harvest-hub-redis
    ports:
      - "6379:6379"
    volumes:
      - redis-data:/data
    command: redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
    networks:
      - harvest-hub-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "redis-cli", "ping"]
      interval: 10s
      timeout: 3s
      retries: 3

  # RabbitMQ Message Queue
  rabbitmq:
    image: rabbitmq:3-management-alpine
    container_name: harvest-hub-rabbitmq
    ports:
      - "5672:5672"   # AMQP port
      - "15672:15672" # Management UI
    environment:
      - RABBITMQ_DEFAULT_USER=admin
      - RABBITMQ_DEFAULT_PASS=admin123
    volumes:
      - rabbitmq-data:/var/lib/rabbitmq
    networks:
      - harvest-hub-network
    restart: unless-stopped
    healthcheck:
      test: ["CMD", "rabbitmq-diagnostics", "ping"]
      interval: 10s
      timeout: 5s
      retries: 3

  # Worker for processing events
  worker:
    build:
      context: .
      dockerfile: Dockerfile.worker
    container_name: harvest-hub-worker
    environment:
      - NODE_ENV=production
      - REDIS_URL=redis://redis:6379
      - RABBITMQ_URL=amqp://rabbitmq:5672
    depends_on:
      - redis
      - rabbitmq
    networks:
      - harvest-hub-network
    restart: unless-stopped

networks:
  harvest-hub-network:
    driver: bridge

volumes:
  redis-data:
  rabbitmq-data:
```

---

## 📦 Worker Dockerfile

**File: `Dockerfile.worker`**

```dockerfile
FROM node:22-alpine

WORKDIR /app

# Copy package files
COPY package*.json ./
RUN npm install --production

# Copy worker files
COPY lib ./lib
COPY workers ./workers
COPY app/config/firebase.ts ./app/config/

# Run worker
CMD ["node", "workers/index.js"]
```

**File: `workers/index.ts`**

```typescript
import { connectRabbitMQ } from '../lib/rabbitmq';
import { connectRedis } from '../lib/redis';
import { OrderProcessor } from './orderProcessor';
import { NotificationProcessor } from './notificationProcessor';
import { ImageProcessor } from './imageProcessor';

async function startWorkers() {
  try {
    // Connect to services
    await connectRedis();
    await connectRabbitMQ();

    console.log('🚀 Starting workers...');

    // Start all processors
    await OrderProcessor.start();
    await NotificationProcessor.start();
    await ImageProcessor.start();

    console.log('✅ All workers started successfully');
  } catch (error) {
    console.error('❌ Failed to start workers:', error);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  console.log('Received SIGTERM, shutting down gracefully...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('Received SIGINT, shutting down gracefully...');
  process.exit(0);
});

startWorkers();
```

---

## 📝 Environment Variables

**`.env.local`:**

```env
# Firebase
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_auth_domain
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_storage_bucket
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id

# Redis
REDIS_URL=redis://localhost:6379
REDIS_PASSWORD=your_redis_password

# RabbitMQ
RABBITMQ_URL=amqp://admin:admin123@localhost:5672
RABBITMQ_EXCHANGE=harvest_hub

# App
NODE_ENV=production
PORT=3000
```

---

## 🚀 Deployment Steps

### Step 1: Local Development Setup

```bash
# Install dependencies
npm install redis @types/redis ioredis amqplib @types/amqplib

# Start services with Docker Compose
docker-compose up -d redis rabbitmq

# Start Next.js in development
npm run dev

# In another terminal, start workers
npm run worker:dev
```

### Step 2: Update package.json

```json
{
  "scripts": {
    "dev": "next dev --turbopack",
    "build": "next build --turbopack --no-lint",
    "start": "next start",
    "worker:dev": "tsx watch workers/index.ts",
    "worker:build": "tsc workers/index.ts --outDir dist/workers",
    "worker:start": "node dist/workers/index.js"
  }
}
```

### Step 3: Production Deployment

```bash
# Build and start all services
docker-compose up -d --build

# Check logs
docker-compose logs -f

# Access services:
# - App: http://localhost
# - RabbitMQ UI: http://localhost:15672 (admin/admin123)
# - Redis: localhost:6379
```

---

## 📊 Benefits Summary

### Redis Benefits
- ✅ **70-90% reduction** in Firestore reads
- ✅ **10x faster** response times for cached data
- ✅ **Cost savings** on Firebase billing
- ✅ Real-time pub/sub capabilities

### Nginx Benefits
- ✅ **SSL termination** for security
- ✅ **Load balancing** for scalability
- ✅ **Rate limiting** for protection
- ✅ **Static file optimization**
- ✅ **Compression** (30-50% bandwidth savings)

### RabbitMQ Benefits
- ✅ **Async processing** (non-blocking operations)
- ✅ **Service decoupling** (better architecture)
- ✅ **Reliability** (message persistence)
- ✅ **Scalability** (multiple workers)
- ✅ **Retry mechanism** (fault tolerance)

---

## 🎯 Migration Strategy

### Phase 1: Redis (Week 1)
1. Install Redis locally
2. Implement CacheService
3. Add caching to product queries
4. Test and monitor cache hit rates
5. Deploy to production

### Phase 2: Nginx (Week 2)
1. Set up Nginx locally
2. Configure reverse proxy
3. Test SSL and compression
4. Set up rate limiting
5. Deploy to production

### Phase 3: RabbitMQ (Week 3-4)
1. Install RabbitMQ locally
2. Implement EventPublisher
3. Create order processor worker
4. Create notification worker
5. Create image processor worker
6. Test end-to-end
7. Deploy workers to production

---

## 🔍 Monitoring & Metrics

### Redis Monitoring
```bash
# Check Redis stats
redis-cli INFO stats
redis-cli INFO memory

# Monitor cache hit rate
redis-cli INFO stats | grep keyspace
```

### RabbitMQ Monitoring
- Access management UI: `http://localhost:15672`
- Monitor queue length
- Track message rates
- Check consumer status

### Application Metrics
```typescript
// Add to your app
import { CacheService } from '@/lib/cacheService';

export async function getMetrics() {
  return {
    cacheHitRate: await CacheService.getHitRate(),
    activeConnections: await getActiveConnections(),
    queueLength: await getQueueLength(),
  };
}
```

---

## 💡 Next Steps

1. **Implement Redis caching** for products and users
2. **Set up Nginx** as reverse proxy
3. **Deploy RabbitMQ** and create workers
4. **Monitor performance** improvements
5. **Iterate and optimize** based on metrics

**Estimated Timeline:** 3-4 weeks for full implementation

**Estimated Cost Savings:** 60-80% reduction in Firebase costs

---

Would you like me to proceed with implementing any specific part of this architecture?
