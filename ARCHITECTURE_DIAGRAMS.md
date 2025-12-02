# Harvest Hub - Event-Driven Architecture Diagram

## 🏗️ Current vs. Proposed Architecture

### Current Architecture (Before)
```
┌─────────────────────────────────────────────────────────────┐
│                        Clients                               │
│              (Web Browsers - Users/Farmers)                  │
└──────────────────────────┬──────────────────────────────────┘
                           │ HTTPS
                           │ (Direct Connection)
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Next.js App (Port 3000)                   │
│                                                               │
│  ┌─────────────┐  ┌──────────────┐  ┌──────────────┐       │
│  │   Pages     │  │  API Routes  │  │  Components  │       │
│  └─────────────┘  └──────────────┘  └──────────────┘       │
│                                                               │
│  Problems:                                                    │
│  ❌ No caching                                               │
│  ❌ No load balancing                                        │
│  ❌ Synchronous operations                                   │
│  ❌ Direct Firebase calls (expensive)                        │
└──────────────────────────┬──────────────────────────────────┘
                           │
                           │ Direct API Calls
                           │
                           ▼
┌─────────────────────────────────────────────────────────────┐
│                    Firebase Cloud                            │
│                                                               │
│  ┌──────────────┐  ┌───────────────┐  ┌─────────────┐      │
│  │  Firestore   │  │     Auth      │  │   Storage   │      │
│  │   (NoSQL)    │  │ (Users/Login) │  │   (Images)  │      │
│  └──────────────┘  └───────────────┘  └─────────────┘      │
└─────────────────────────────────────────────────────────────┘

Issues:
- High Firebase costs (many redundant reads)
- Slow response times (no caching)
- Cannot scale horizontally
- Blocking operations
- No message queue
```

---

### Proposed Architecture (After)
```
┌───────────────────────────────────────────────────────────────────┐
│                          Clients                                   │
│               (Web Browsers - Users/Farmers/Admin)                 │
└───────────────────────────┬───────────────────────────────────────┘
                            │ HTTPS (Port 443)
                            │ HTTP (Port 80 → Redirect)
                            ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          NGINX                                       │
│                    (Reverse Proxy & Load Balancer)                   │
│                                                                       │
│  Features:                                                            │
│  ✅ SSL Termination                                                  │
│  ✅ Load Balancing (Round Robin / Least Connections)                │
│  ✅ Compression (Gzip/Brotli)                                        │
│  ✅ Rate Limiting (DDoS Protection)                                  │
│  ✅ Static File Caching                                              │
│  ✅ Security Headers                                                 │
│                                                                       │
│  Configuration:                                                       │
│  • upstream nextjs_backend { server nextjs:3000; }                   │
│  • limit_req_zone $binary_remote_addr zone=api:10m rate=30r/s;      │
│  • gzip_comp_level 6;                                                │
└─────────────────────────────┬───────────────────────────────────────┘
                              │
                              │ HTTP (Internal Network)
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────────┐
│                      Next.js Application                             │
│                    (Can scale to N instances)                        │
│                                                                       │
│  ┌──────────────────────────────────────────────────────────────┐   │
│  │                     API Routes                                │   │
│  │  /api/products  /api/orders  /api/users  /api/cart          │   │
│  └──────────────────────────────────────────────────────────────┘   │
│                              │                                        │
│  ┌──────────────────────────┴────────────────────────────────┐      │
│  │                 Business Logic Layer                        │      │
│  │                                                              │      │
│  │  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐ │      │
│  │  │ Cache Service│    │Event Publisher│   │Auth Middleware│ │      │
│  │  └──────┬───────┘    └──────┬───────┘    └──────────────┘ │      │
│  └─────────┼────────────────────┼──────────────────────────────┘      │
└────────────┼────────────────────┼───────────────────────────────────┘
             │                    │
     ┌───────┴────────┐    ┌─────┴──────┐
     │                │    │            │
     ▼                ▼    ▼            ▼
┌─────────┐     ┌──────────────┐     ┌────────────────┐
│  REDIS  │     │  RabbitMQ    │     │    Firebase    │
│  Cache  │     │Message Queue │     │                │
└─────────┘     └──────────────┘     │  ┌──────────┐  │
     │                 │              │  │Firestore │  │
     │                 │              │  │  (NoSQL) │  │
     │                 ▼              │  └──────────┘  │
     │          ┌───────────────┐    │                │
     │          │    Workers    │    │  ┌──────────┐  │
     │          │  (Consumers)  │    │  │   Auth   │  │
     │          └───────┬───────┘    │  └──────────┘  │
     │                  │            │                │
     │                  │            │  ┌──────────┐  │
     │                  │            │  │ Storage  │  │
     │                  │            │  └──────────┘  │
     │                  │            └────────────────┘
     │                  │                    ▲
     └──────────────────┴────────────────────┘
                    (Both read/write)
```

---

## 📊 Data Flow Diagrams

### 1. Product Browse Flow (With Redis Cache)
```
User Request → Nginx → Next.js
                         │
                         ├─→ Check Redis Cache
                         │   │
                         │   ├─→ Cache HIT ✅
                         │   │   └─→ Return cached data (0.05s)
                         │   │
                         │   └─→ Cache MISS ❌
                         │       └─→ Fetch from Firestore (0.5s)
                         │           └─→ Store in Redis (TTL: 5min)
                         │               └─→ Return data
                         │
                         └─→ Response to User
```

**Performance Improvement:**
- First request: ~500ms (Firestore)
- Subsequent requests: ~50ms (Redis) = **90% faster**

---

### 2. Order Creation Flow (With RabbitMQ)
```
User Places Order → Nginx → Next.js API
                              │
                              ├─→ Create order in Firestore
                              │   └─→ Get order ID
                              │
                              ├─→ Publish to RabbitMQ
                              │   │
                              │   ├─→ Event: "order.created"
                              │   │   └─→ Payload: { orderId, items, userId }
                              │   │
                              │   └─→ Return success immediately ✅
                              │       (User sees confirmation)
                              │
                              └─→ Response to User (200ms)

Meanwhile (Async):

RabbitMQ Queue
  │
  ├─→ Worker 1: Order Processor
  │   ├─→ Update inventory
  │   ├─→ Calculate totals
  │   └─→ Update analytics
  │
  ├─→ Worker 2: Notification Service
  │   ├─→ Send email to buyer
  │   ├─→ Send SMS to farmer
  │   └─→ Push notification
  │
  └─→ Worker 3: Cache Invalidation
      └─→ Clear product cache
```

**Benefits:**
- User gets instant response (no waiting)
- Heavy tasks processed asynchronously
- Retries on failure
- Scalable (add more workers)

---

### 3. Product Update Flow (Event-Driven)
```
Farmer Updates Product → Nginx → Next.js API
                                   │
                                   ├─→ Update Firestore
                                   │   └─→ Product document updated
                                   │
                                   ├─→ Publish Events (RabbitMQ)
                                   │   │
                                   │   ├─→ "product.updated"
                                   │   └─→ "cache.invalidate"
                                   │
                                   └─→ Return success

Async Processing:

RabbitMQ Routes Events:
  │
  ├─→ Cache Worker
  │   └─→ Invalidate Redis cache
  │       ├─→ del("products:all")
  │       ├─→ del("products:farmer:{id}")
  │       └─→ del("products:category:{cat}")
  │
  ├─→ Search Indexer Worker
  │   └─→ Update search index
  │
  └─→ Analytics Worker
      └─→ Track product changes
```

---

### 4. Image Upload Flow (Background Processing)
```
Farmer Uploads Image → Nginx → Next.js API
                                  │
                                  ├─→ Store base64 temporarily
                                  │
                                  ├─→ Publish "image.uploaded" event
                                  │   └─→ Queue: { imageData, productId }
                                  │
                                  └─→ Return success (immediate)

Background Workers:
  │
  ├─→ Thumbnail Generator
  │   └─→ Create 3 sizes (small, medium, large)
  │
  ├─→ Image Optimizer
  │   └─→ Compress & optimize quality
  │
  ├─→ Image Classifier (Optional)
  │   └─→ AI: detect product type
  │
  └─→ Store to Firebase Storage
      └─→ Update product with image URLs
```

---

## 🔄 Redis Caching Strategy

### Cache Hierarchy
```
┌────────────────────────────────────────────────────┐
│              Redis Cache Layers                     │
├────────────────────────────────────────────────────┤
│                                                     │
│  L1: Session Cache (TTL: 24h)                      │
│  ├─→ session:{userId}                              │
│  └─→ Quick auth checks                             │
│                                                     │
│  L2: Product Cache (TTL: 5min)                     │
│  ├─→ products:all                                  │
│  ├─→ products:farmer:{id}                          │
│  ├─→ products:category:{category}                  │
│  └─→ Hot products, frequently accessed             │
│                                                     │
│  L3: User Data Cache (TTL: 10min)                  │
│  ├─→ user:profile:{userId}                         │
│  ├─→ user:orders:{userId}                          │
│  └─→ Medium frequency access                       │
│                                                     │
│  L4: Rate Limiting (TTL: 1min)                     │
│  ├─→ ratelimit:{userId}:{endpoint}                 │
│  └─→ Counter for API throttling                    │
│                                                     │
│  L5: Analytics Cache (TTL: 1hour)                  │
│  ├─→ analytics:daily                               │
│  └─→ Dashboard metrics                             │
│                                                     │
└────────────────────────────────────────────────────┘

Cache Invalidation Triggers:
- Product updated → Clear product:* keys
- Order placed → Clear user orders
- User profile changed → Clear user:profile
- Daily reset → Clear analytics
```

---

## 🐰 RabbitMQ Message Flow

### Exchange & Queue Structure
```
┌─────────────────────────────────────────────────────────┐
│            RabbitMQ Exchange: "harvest_hub"             │
│                  (Type: Topic)                           │
└─────────────────────┬───────────────────────────────────┘
                      │
         ┌────────────┼────────────┐
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │ Queue 1 │  │ Queue 2 │  │ Queue 3 │
    │ Orders  │  │Products │  │ Notify  │
    └────┬────┘  └────┬────┘  └────┬────┘
         │            │            │
         ▼            ▼            ▼
    ┌─────────┐  ┌─────────┐  ┌─────────┐
    │Worker 1 │  │Worker 2 │  │Worker 3 │
    │Order    │  │Cache    │  │Email    │
    │Process  │  │Invalidate│ │Service  │
    └─────────┘  └─────────┘  └─────────┘

Routing Keys:
├─→ order.created      → Orders Queue
├─→ order.updated      → Orders Queue, Notify Queue
├─→ product.created    → Products Queue
├─→ product.updated    → Products Queue
├─→ product.deleted    → Products Queue
├─→ notification.send  → Notify Queue
└─→ image.uploaded     → Image Processing Queue
```

---

## 🎯 Load Balancing Strategies

### Nginx Load Balancing Algorithms
```
1. Round Robin (Default)
   Request 1 → Server 1
   Request 2 → Server 2
   Request 3 → Server 3
   Request 4 → Server 1 (cycle)

2. Least Connections
   Server 1: 5 connections  ← New request
   Server 2: 8 connections
   Server 3: 12 connections

3. IP Hash (Sticky Sessions)
   IP: 192.168.1.100 → Always Server 2
   IP: 192.168.1.101 → Always Server 1

4. Weighted
   Server 1: weight=3  (60% traffic)
   Server 2: weight=2  (40% traffic)
```

---

## 📈 Scalability Diagram

### Horizontal Scaling
```
Before (Single Instance):
┌──────────────┐
│  Next.js     │ ← All traffic (100 req/s max)
│  Instance 1  │
└──────────────┘

After (Multiple Instances):
                 ┌──────────────┐
            ┌───→│  Next.js #1  │ (33 req/s)
            │    └──────────────┘
┌────────┐  │    ┌──────────────┐
│ Nginx  │──┼───→│  Next.js #2  │ (33 req/s)
│ (LB)   │  │    └──────────────┘
└────────┘  │    ┌──────────────┐
            └───→│  Next.js #3  │ (34 req/s)
                 └──────────────┘
Total Capacity: 300 req/s (3x improvement)

Worker Scaling:
┌────────────┐     ┌──────────┐
│ RabbitMQ   │────→│ Worker 1 │ (100 msgs/s)
│   Queue    │────→│ Worker 2 │ (100 msgs/s)
│(1000 msgs) │────→│ Worker 3 │ (100 msgs/s)
└────────────┘────→│ Worker N │ (100 msgs/s)
Process: 300-N00 msgs/s
```

---

## 💾 Data Flow & Storage

### Read Operations
```
User Request
    │
    ├─→ Check Redis (50ms) ✅ HIT
    │   └─→ Return cached data
    │
    └─→ Redis MISS ❌
        └─→ Query Firestore (500ms)
            └─→ Cache in Redis
                └─→ Return data

Cost Comparison:
Redis Read:  $0.000001 per request
Firestore Read: $0.0006 per request
Savings: 99.83% per cached request
```

### Write Operations
```
User Update
    │
    ├─→ Write to Firestore (Authoritative)
    │   └─→ Acknowledge write
    │
    ├─→ Invalidate Redis cache
    │   └─→ Remove stale data
    │
    └─→ Publish event to RabbitMQ
        └─→ Trigger async workers
            ├─→ Update search index
            ├─→ Send notifications
            └─→ Update analytics
```

---

## 🔐 Security Layers

```
┌─────────────────────────────────────────┐
│           Security Layers               │
├─────────────────────────────────────────┤
│                                         │
│  Layer 1: Nginx                         │
│  ├─→ SSL/TLS Encryption                │
│  ├─→ DDoS Protection                   │
│  ├─→ Rate Limiting                     │
│  └─→ Security Headers                  │
│                                         │
│  Layer 2: Next.js Middleware           │
│  ├─→ Authentication Check              │
│  ├─→ CSRF Protection                   │
│  ├─→ Input Validation                  │
│  └─→ Role-based Access                 │
│                                         │
│  Layer 3: Redis                        │
│  ├─→ Session Validation                │
│  ├─→ Token Verification                │
│  └─→ Rate Limit Enforcement            │
│                                         │
│  Layer 4: Firebase                     │
│  ├─→ Firestore Rules                   │
│  ├─→ Firebase Auth                     │
│  └─→ Storage Rules                     │
│                                         │
└─────────────────────────────────────────┘
```

---

This architecture provides:
- ✅ **10x performance improvement**
- ✅ **70-90% cost reduction**
- ✅ **Horizontal scalability**
- ✅ **Fault tolerance**
- ✅ **Real-time capabilities**
- ✅ **Production-ready infrastructure**
