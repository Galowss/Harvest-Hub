@echo off
REM Harvest Hub - Event-Driven Architecture Setup Script
REM This script sets up Redis, RabbitMQ, and installs all dependencies

echo ========================================
echo Harvest Hub - Event Architecture Setup
echo ========================================
echo.

echo [1/5] Installing npm dependencies...
call npm install redis @types/redis ioredis amqplib @types/amqplib tsx
if errorlevel 1 (
    echo ERROR: Failed to install dependencies
    exit /b 1
)
echo ✓ Dependencies installed
echo.

echo [2/5] Checking Docker...
docker --version >nul 2>&1
if errorlevel 1 (
    echo ERROR: Docker is not installed or not running
    echo Please install Docker Desktop from https://www.docker.com/products/docker-desktop
    exit /b 1
)
echo ✓ Docker is available
echo.

echo [3/5] Starting Redis container...
docker ps -a | findstr harvest-redis >nul
if not errorlevel 1 (
    echo Redis container already exists, starting it...
    docker start harvest-redis
) else (
    echo Creating new Redis container...
    docker run -d -p 6379:6379 --name harvest-redis ^
        --restart unless-stopped ^
        redis:7-alpine redis-server --appendonly yes --maxmemory 256mb --maxmemory-policy allkeys-lru
)
if errorlevel 1 (
    echo ERROR: Failed to start Redis
    exit /b 1
)
echo ✓ Redis is running on port 6379
echo.

echo [4/5] Starting RabbitMQ container...
docker ps -a | findstr harvest-rabbitmq >nul
if not errorlevel 1 (
    echo RabbitMQ container already exists, starting it...
    docker start harvest-rabbitmq
) else (
    echo Creating new RabbitMQ container...
    docker run -d -p 5672:5672 -p 15672:15672 --name harvest-rabbitmq ^
        --restart unless-stopped ^
        -e RABBITMQ_DEFAULT_USER=harvest ^
        -e RABBITMQ_DEFAULT_PASS=harvest123 ^
        rabbitmq:3-management-alpine
)
if errorlevel 1 (
    echo ERROR: Failed to start RabbitMQ
    exit /b 1
)
echo ✓ RabbitMQ is running on ports 5672 and 15672
echo.

echo [5/5] Configuring environment...
if not exist .env.local (
    echo Creating .env.local from .env.example...
    copy .env.example .env.local >nul
    echo REDIS_URL=redis://localhost:6379 >> .env.local
    echo RABBITMQ_URL=amqp://localhost:5672 >> .env.local
    echo ✓ Environment file created
) else (
    echo ✓ .env.local already exists
)
echo.

echo ========================================
echo ✓ Setup Complete!
echo ========================================
echo.
echo Services running:
echo - Redis:    localhost:6379
echo - RabbitMQ: localhost:5672
echo - RabbitMQ Management: http://localhost:15672 (harvest/harvest123)
echo.
echo Next steps:
echo 1. Start Next.js:  npm run dev
echo 2. Start Worker:   npm run worker (in a separate terminal)
echo.
echo Useful commands:
echo - Check containers: docker ps
echo - View Redis logs:  docker logs harvest-redis
echo - View RabbitMQ:    docker logs harvest-rabbitmq
echo - Stop services:    docker stop harvest-redis harvest-rabbitmq
echo.
pause
