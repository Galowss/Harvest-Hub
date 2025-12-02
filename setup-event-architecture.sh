#!/bin/bash
# Harvest Hub - Event-Driven Architecture Setup Script (Linux/Mac)

echo "========================================"
echo "Harvest Hub - Event Architecture Setup"
echo "========================================"
echo ""

echo "[1/5] Installing npm dependencies..."
npm install redis @types/redis ioredis amqplib @types/amqplib tsx
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to install dependencies"
    exit 1
fi
echo "✓ Dependencies installed"
echo ""

echo "[2/5] Checking Docker..."
if ! command -v docker &> /dev/null; then
    echo "ERROR: Docker is not installed or not running"
    echo "Please install Docker from https://www.docker.com/products/docker-desktop"
    exit 1
fi
echo "✓ Docker is available"
echo ""

echo "[3/5] Starting Redis container..."
if docker ps -a | grep -q harvest-redis; then
    echo "Redis container already exists, starting it..."
    docker start harvest-redis
else
    echo "Creating new Redis container..."
    docker run -d -p 6379:6379 --name harvest-redis \
        --restart unless-stopped \
        redis:7-alpine redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
fi
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start Redis"
    exit 1
fi
echo "✓ Redis is running on port 6379"
echo ""

echo "[4/5] Starting RabbitMQ container..."
if docker ps -a | grep -q harvest-rabbitmq; then
    echo "RabbitMQ container already exists, starting it..."
    docker start harvest-rabbitmq
else
    echo "Creating new RabbitMQ container..."
    docker run -d -p 5672:5672 -p 15672:15672 --name harvest-rabbitmq \
        --restart unless-stopped \
        -e RABBITMQ_DEFAULT_USER=harvest \
        -e RABBITMQ_DEFAULT_PASS=harvest123 \
        rabbitmq:3-management-alpine
fi
if [ $? -ne 0 ]; then
    echo "ERROR: Failed to start RabbitMQ"
    exit 1
fi
echo "✓ RabbitMQ is running on ports 5672 and 15672"
echo ""

echo "[5/5] Configuring environment..."
if [ ! -f .env.local ]; then
    echo "Creating .env.local from .env.example..."
    cp .env.example .env.local
    echo "REDIS_URL=redis://localhost:6379" >> .env.local
    echo "RABBITMQ_URL=amqp://localhost:5672" >> .env.local
    echo "✓ Environment file created"
else
    echo "✓ .env.local already exists"
fi
echo ""

echo "========================================"
echo "✓ Setup Complete!"
echo "========================================"
echo ""
echo "Services running:"
echo "- Redis:    localhost:6379"
echo "- RabbitMQ: localhost:5672"
echo "- RabbitMQ Management: http://localhost:15672 (harvest/harvest123)"
echo ""
echo "Next steps:"
echo "1. Start Next.js:  npm run dev"
echo "2. Start Worker:   npm run worker (in a separate terminal)"
echo ""
echo "Useful commands:"
echo "- Check containers: docker ps"
echo "- View Redis logs:  docker logs harvest-redis"
echo "- View RabbitMQ:    docker logs harvest-rabbitmq"
echo "- Stop services:    docker stop harvest-redis harvest-rabbitmq"
echo ""
