# 🎬 Cinema Booking System - Docker Setup

## 📋 Yêu cầu hệ thống

- Docker Desktop hoặc Docker Engine
- Docker Compose v2.0+
- PowerShell (Windows) hoặc Bash (Linux/Mac)

## 🏗️ Cấu trúc Docker

### **Dockerfile - Multi-stage Build**

#### **Stage 1: Builder**
```
FROM node:22-alpine
- Cài Node.js 22 + npm
- Cài build tools (python, make, g++, gcc, git)
- Cài tất cả dependencies (dev + production)
- Generate Prisma Client
- Build TypeScript → JavaScript
```

#### **Stage 2: Production**
```
FROM node:22-alpine
- Runtime minimal (chỉ production dependencies)
- Cài curl, bash, dumb-init cho health checks
- Copy built files từ builder
- Tạo non-root user (bảo mật)
- Expose port 5000
- Health checks tự động
```

## 🚀 Quick Start

### **1. Build và chạy Production**

```bash
# Build image
docker-compose build

# Chạy tất cả services (MySQL + App)
docker-compose up -d

# Xem logs
docker-compose logs -f app
```

### **2. Development Mode**

```bash
# Chạy với auto-reload (npm run dev)
docker-compose -f docker-compose.yml -f docker-compose.override.yml up

# Hoặc cùng lệnh
docker-compose up
```

### **3. Stop Services**

```bash
# Stop containers
docker-compose stop

# Stop và xóa containers
docker-compose down

# Stop và xóa volumes (cẩn thận!)
docker-compose down -v
```

## 📊 Database

### **Migrations**

```bash
# Chạy migrations
docker-compose exec app npx prisma migrate deploy

# Tạo migration mới
docker-compose exec app npx prisma migrate dev --name feature_name

# Reset database (dev only!)
docker-compose exec app npx prisma migrate reset
```

### **Prisma Studio**

```bash
# Mở Prisma Studio UI
docker-compose exec app npm run prisma:studio
# Truy cập: http://localhost:5555
```

## 🔍 Monitoring & Debugging

### **Xem Logs**

```bash
# Logs từ app
docker-compose logs -f app

# Logs từ MySQL
docker-compose logs -f mysql

# Logs từ tất cả
docker-compose logs -f
```

### **Truy cập Container Shell**

```bash
# App container
docker-compose exec app bash

# MySQL container
docker-compose exec mysql bash

# MySQL CLI
docker-compose exec mysql mysql -u cbs -p cinema_booking
# Password: cbs_password
```

### **Health Check**

```bash
# Kiểm tra status
docker-compose ps

# Manual health check
docker-compose exec app curl http://localhost:5000/health
```

## 🔐 Environment Variables

File `.env` được tạo từ `.env.example`:

```env
NODE_ENV=production
PORT=5000
HOST=0.0.0.0
DATABASE_URL=mysql://cbs:cbs_password@mysql:3306/cinema_booking
JWT_SECRET=your_secret_key_here
JWT_EXPIRES_IN=7d
CORS_ORIGIN=http://localhost:3000
LOG_LEVEL=info
```

**⚠️ Trong production, thay đổi các giá trị sensitive!**

## 📦 Ports

| Service | Port | URL |
|---------|------|-----|
| App (Express) | 5000 | http://localhost:5000 |
| MySQL | 3306 | mysql://cbs:cbs_password@mysql:3306 |
| Prisma Studio | 5555 | http://localhost:5555 |
| Node Debugger | 9229 | chrome://inspect |

## 🐛 Troubleshooting

### **Container không khởi động**

```bash
# Xem chi tiết logs
docker-compose logs app

# Rebuild image
docker-compose build --no-cache

# Restart
docker-compose restart
```

### **Database connection failed**

```bash
# Kiểm tra MySQL status
docker-compose logs mysql

# Connect trực tiếp
docker-compose exec mysql mysql -u cbs -p cinema_booking
```

### **Dependencies không cài đúng**

```bash
# Clear cache và rebuild
docker-compose down -v
docker-compose build --no-cache
docker-compose up
```

### **Port đã được sử dụng**

```bash
# Thay đổi port trong docker-compose.yml
ports:
  - "5001:5000"  # Dùng 5001 thay vì 5000
```

## 📝 Build Process Chi Tiết

```
1. Builder Stage:
   ├─ Pull node:22-alpine
   ├─ Cài build tools (gcc, make, python...)
   ├─ npm ci (install lock file)
   ├─ npx prisma generate (tạo Prisma Client)
   ├─ npm run build (tsc để build TypeScript)
   └─ Output: /app/dist, node_modules

2. Production Stage:
   ├─ Pull node:22-alpine clean
   ├─ Cài runtime deps (curl, bash, dumb-init)
   ├─ npm ci --omit=dev (chỉ production)
   ├─ COPY từ builder stage
   ├─ Tạo non-root user (nodejs)
   ├─ chmod +x entrypoint.sh
   ├─ HEALTHCHECK setup
   └─ CMD bash entrypoint.sh
```

## 🔧 Entrypoint Script

File `entrypoint.sh` tự động:

1. Chạy Prisma migrations (`prisma migrate deploy`)
2. Nếu fail → chạy `prisma db push`
3. Generate Prisma Client
4. Khởi động ứng dụng (`node dist/server.js`)

## 📈 Performance Tips

- **Multi-stage build** giảm image size ~60%
- **Alpine Linux** giảm base size từ 900MB → 150MB
- **Non-root user** tăng security
- **Health checks** giúp orchestration
- **npm ci** thay vì `npm install` (chính xác hơn)

## 🚄 Build Optimization

```bash
# Chỉ rebuild service cụ thể
docker-compose build app

# Build mà không cache
docker-compose build --no-cache

# View build history
docker history cinema-booking-system-app
```

---

**Tạo bởi Cinema Booking System Team** 🎬
