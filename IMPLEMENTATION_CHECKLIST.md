# Event-Driven Architecture - Quick Start Checklist

## ✅ Pre-Implementation Checklist

### Prerequisites
- [ ] Docker installed and running
- [ ] Node.js 20+ installed
- [ ] Basic understanding of message queues
- [ ] Firebase project active
- [ ] Production domain ready (optional for local dev)

---

## 🚀 Phase 1: Redis Implementation (Week 1)

### Day 1-2: Setup & Configuration
- [ ] Install Redis dependencies
  ```bash
  npm install redis @types/redis ioredis
  ```
- [ ] Start Redis with Docker
  ```bash
  docker run -d -p 6379:6379 --name redis redis:7-alpine
  ```
- [ ] Create `lib/redis.ts` connection file
- [ ] Create `lib/cacheService.ts` helper
- [ ] Add Redis URL to `.env.local`

### Day 3-4: Implement Product Caching
- [ ] Modify product fetch functions
- [ ] Add cache layer to `app/dashboard/user/page.tsx`
- [ ] Add cache layer to `app/dashboard/farmer/page.tsx`
- [ ] Implement cache invalidation on product updates
  ```typescript
  // After updating a product:
  await CacheService.invalidatePattern('products:*');
  ```
- [ ] Test cache hit/miss scenarios

### Day 5: Session & Rate Limiting
- [ ] Implement session caching
- [ ] Create rate limiting middleware
- [ ] Test authentication with Redis sessions

### Testing Checklist
- [ ] Products load faster on second request
- [ ] Cache invalidates on product update
- [ ] Redis container restarts successfully
- [ ] Performance monitoring shows improvement

---

## 🌐 Phase 2: Nginx Setup (Week 2)

### Day 1-2: Local Nginx Configuration
- [ ] Create `nginx.conf` file
- [ ] Set up SSL certificates (self-signed for local)
  ```bash
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout ssl/key.pem -out ssl/cert.pem
  ```
- [ ] Add Nginx to Docker Compose
- [ ] Configure reverse proxy to Next.js
- [ ] Test HTTP to HTTPS redirect

### Day 3: Load Balancing & Optimization
- [ ] Configure upstream servers
- [ ] Set up compression (gzip)
- [ ] Configure static file caching
- [ ] Test rate limiting rules

### Day 4-5: Security & Monitoring
- [ ] Add security headers
- [ ] Configure request size limits
- [ ] Set up access logs
- [ ] Test DDoS protection

### Testing Checklist
- [ ] HTTPS works locally
- [ ] Static files served with caching headers
- [ ] Rate limiting blocks excessive requests
- [ ] Load balancing distributes traffic
- [ ] Compression reduces response size

---

## 🐰 Phase 3: RabbitMQ Implementation (Week 3-4)

### Day 1-3: Setup & Basic Integration
- [ ] Install RabbitMQ dependencies
  ```bash
  npm install amqplib @types/amqplib
  ```
- [ ] Start RabbitMQ with Docker
  ```bash
  docker run -d -p 5672:5672 -p 15672:15672 \
    --name rabbitmq rabbitmq:3-management-alpine
  ```
- [ ] Create `lib/rabbitmq.ts` connection
- [ ] Create `lib/eventPublisher.ts`
- [ ] Test RabbitMQ connection
- [ ] Access management UI at http://localhost:15672

### Day 4-6: Order Processing
- [ ] Create `workers/orderProcessor.ts`
- [ ] Implement order event publishing
- [ ] Modify order creation to publish events
  ```typescript
  await EventPublisher.publishOrderCreated(orderData);
  ```
- [ ] Test async order processing
- [ ] Implement retry logic

### Day 7-9: Additional Workers
- [ ] Create `workers/notificationProcessor.ts`
- [ ] Create `workers/imageProcessor.ts`
- [ ] Implement cache invalidation worker
- [ ] Test all workers together

### Day 10: Integration & Testing
- [ ] Create `workers/index.ts` main file
- [ ] Create `Dockerfile.worker`
- [ ] Test complete order flow
- [ ] Monitor queue lengths
- [ ] Test failure scenarios

### Testing Checklist
- [ ] Orders process asynchronously
- [ ] Inventory updates correctly
- [ ] Notifications sent successfully
- [ ] Failed messages retry properly
- [ ] Workers restart on crash
- [ ] Message persistence works

---

## 🐳 Docker Compose Full Stack

### Final docker-compose.yaml structure:
```
✅ nginx (reverse proxy)
✅ nextjs (app server)
✅ redis (cache)
✅ rabbitmq (message queue)
✅ worker (event processor)
```

### Commands:
```bash
# Start everything
docker-compose up -d

# View logs
docker-compose logs -f [service]

# Restart a service
docker-compose restart [service]

# Stop everything
docker-compose down

# Rebuild and restart
docker-compose up -d --build
```

---

## 📊 Monitoring Setup

### Redis Monitoring
```bash
# Connect to Redis CLI
docker exec -it redis redis-cli

# Check stats
INFO stats
INFO memory

# Monitor commands
MONITOR
```

### RabbitMQ Monitoring
- Access UI: http://localhost:15672 (guest/guest)
- Monitor queues
- Check message rates
- View connections

### Application Logs
```bash
# Next.js logs
docker-compose logs -f nextjs

# Worker logs
docker-compose logs -f worker

# All logs
docker-compose logs -f
```

---

## 🧪 Testing Strategy

### Performance Testing
- [ ] Measure response times before/after Redis
- [ ] Load test with 100 concurrent users
- [ ] Monitor memory usage
- [ ] Check Firebase query reduction

### Functional Testing
- [ ] Order flow end-to-end
- [ ] Product caching accuracy
- [ ] Cache invalidation timing
- [ ] Worker retry mechanism
- [ ] Error handling

### Load Testing Tools
```bash
# Install Apache Bench
apt-get install apache2-utils

# Test endpoint
ab -n 1000 -c 10 http://localhost/api/products

# Or use k6
k6 run load-test.js
```

---

## 📈 Success Metrics

### Expected Improvements

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Product Load Time | 1.5s | 0.3s | 80% faster |
| Firestore Reads | 100/min | 20/min | 80% reduction |
| Order Processing | Blocking | Async | Non-blocking |
| Concurrent Users | 50 | 500+ | 10x scale |
| Monthly Cost | $150 | $50 | 67% savings |

### KPIs to Track
- [ ] Cache hit rate (target: >70%)
- [ ] Average response time (target: <500ms)
- [ ] Queue processing rate (target: <5s)
- [ ] Error rate (target: <0.1%)
- [ ] Uptime (target: >99.9%)

---

## 🚨 Troubleshooting Guide

### Redis Issues
**Problem:** Can't connect to Redis
```bash
# Check if Redis is running
docker ps | grep redis

# Check logs
docker logs redis

# Restart
docker restart redis
```

### RabbitMQ Issues
**Problem:** Messages not being consumed
```bash
# Check queue status
docker exec rabbitmq rabbitmqctl list_queues

# Check connections
docker exec rabbitmq rabbitmqctl list_connections
```

### Nginx Issues
**Problem:** 502 Bad Gateway
```bash
# Check Nginx config
docker exec nginx nginx -t

# Check upstream health
docker exec nginx cat /var/log/nginx/error.log
```

---

## 🎓 Learning Resources

### Redis
- Redis University (free): https://university.redis.com/
- Redis Documentation: https://redis.io/docs/

### RabbitMQ
- RabbitMQ Tutorials: https://www.rabbitmq.com/tutorials
- CloudAMQP Blog: https://www.cloudamqp.com/blog/

### Nginx
- Nginx Beginner's Guide: http://nginx.org/en/docs/beginners_guide.html
- DigitalOcean Nginx Tutorials: https://www.digitalocean.com/community/tags/nginx

---

## 💰 Cost Analysis

### Infrastructure Costs (Monthly)

#### Development
- Redis (local): $0
- RabbitMQ (local): $0
- Nginx (local): $0
**Total: $0**

#### Production (Cloud)
- Redis Cloud (256MB): $0 (free tier) or $5
- CloudAMQP (RabbitMQ): $0 (free tier) or $9
- DigitalOcean Droplet (Nginx + App): $12-24
- Firebase (reduced usage): $30-50
**Total: $42-88/month**

### Cost Savings
- Before: ~$150/month (high Firebase usage)
- After: ~$60/month (optimized with cache)
- **Savings: ~$90/month (60%)**

---

## 🎯 Next Actions

### Immediate (This Week)
1. Review the EVENT_DRIVEN_ARCHITECTURE_PLAN.md
2. Set up local development environment
3. Start with Redis implementation
4. Test product caching

### Short-term (Next 2-3 Weeks)
1. Complete Redis integration
2. Set up Nginx reverse proxy
3. Begin RabbitMQ integration
4. Create first worker

### Long-term (1-2 Months)
1. Full production deployment
2. Performance monitoring
3. Cost analysis
4. Iterate and optimize

---

## 📞 Support & Questions

If you need help with:
- **Architecture decisions**: Review the full plan
- **Implementation**: Follow this checklist step-by-step
- **Debugging**: Check troubleshooting section
- **Best practices**: Refer to learning resources

**Ready to start?** Begin with Phase 1: Redis Implementation! 🚀

# Redis (Required for caching)
REDIS_URL=rediss://default:AY5JAAIncDFkNGViY2VlM2RiNGM0M2I2OGM0YzlhMWI2NDU5NTUwZHAxMzY0MjU@equipped-maggot-36425.upstash.io:6379

# Firebase (Your existing vars)
NEXT_PUBLIC_FIREBASE_API_KEY=AIzaSyAv5iyGz1zYwW_bFvg92VWagINcHjNNiSU
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=harvesthub-fe2bd.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=harvesthub-fe2bd
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=harvesthub-fe2bd.firebasestorage.app
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=822206956687
NEXT_PUBLIC_FIREBASE_APP_ID=1:822206956687:web:a6477536c192798f0c9cfa
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=G-84282FEHBV
