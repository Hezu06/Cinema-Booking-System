# ===== BUILD STAGE =====
# Sử dụng Node.js 22 trên Alpine Linux (kích thước nhỏ)
FROM node:22-alpine AS builder

# Thiết lập thư mục làm việc
WORKDIR /app

# ===== CÀI ĐẶT CÁC CÔNG CỤ CẦN THIẾT =====
RUN apk add --no-cache \
	python3 \
	make \
	g++ \
	gcc \
	git

# ===== COPY CÁC FILE CẤU HÌNH =====
COPY package.json package-lock.json ./
COPY tsconfig.json tsconfig.prisma.json ./
COPY prisma ./prisma
COPY .env.docker.example .env

# ===== CÀI ĐẶT NPM DEPENDENCIES =====
# Cài đặt tất cả dependencies (dev + production)
RUN npm ci --verbose

# ===== COPY SOURCE CODE =====
COPY src ./src

# ===== GENERATE PRISMA CLIENT =====
# Tạo Prisma Client từ schema
RUN npm run prisma:generate

# ===== BUILD TYPESCRIPT =====
# Biên dịch TypeScript thành JavaScript
RUN npm run build

# ===== PRODUCTION STAGE =====
# Sử dụng image tối thiểu cho production
FROM node:22-alpine

# Thiết lập thư mục làm việc
WORKDIR /app

# ===== CÀI ĐẶT RUNTIME DEPENDENCIES =====
RUN apk add --no-cache \
	# Dumb-init: Xử lý signals đúng cách khi container shutdown
	dumb-init \
	# Curl: Cho health check
	curl \
	# Bash: Cho shell scripting
	bash

# ===== COPY PACKAGE FILES =====
COPY package.json package-lock.json ./

# ===== CÀI ĐẶT PRODUCTION DEPENDENCIES =====
# Chỉ cài production dependencies (không dev)
RUN npm ci --omit=dev --verbose && \
	npm cache clean --force

# ===== COPY PRISMA SCHEMA =====
COPY prisma ./prisma
COPY .env.docker.example .env

# ===== COPY BUILD OUTPUT =====
# Copy các file đã biên dịch từ builder stage
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules/.prisma ./node_modules/.prisma

# ===== COPY ENTRYPOINT SCRIPT =====
COPY entrypoint.sh ./
RUN chmod +x ./entrypoint.sh

# ===== TẠO NON-ROOT USER =====
# Tạo user nodejs để chạy app (bảo mật)
RUN addgroup -g 1001 -S nodejs && \
	adduser -S nodejs -u 1001 && \
	chown -R nodejs:nodejs /app

# ===== CHUYỂN SANG NON-ROOT USER =====
USER nodejs

# ===== EXPOSE PORT =====
# Expose port 5000 cho ứng dụng Express
EXPOSE 5000

# ===== HEALTH CHECK =====
# Kiểm tra sức khỏe container mỗi 30 giây
HEALTHCHECK --interval=30s --timeout=10s --start-period=10s --retries=3 \
	CMD curl --fail http://localhost:5000/health || exit 1

# ===== ENTRYPOINT =====
# Sử dụng dumb-init để xử lý signals đúng cách
ENTRYPOINT ["dumb-init", "--"]

# ===== START APPLICATION =====
# Chạy entrypoint script för migrations và khởi động app
CMD ["bash", "entrypoint.sh"]
