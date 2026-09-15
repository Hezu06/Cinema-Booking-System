#!/bin/bash

# Exit if any error occurs
set -e

echo "🚀 Starting Cinema Booking System..."

# ===== DATABASE MIGRATION =====
echo "📊 Running Prisma migrations..."
npx prisma migrate deploy || {
	echo "⚠️  Migration failed, attempting to create database..."
	npx prisma db push --skip-generate || true
}

# ===== GENERATE PRISMA CLIENT =====
echo "🔧 Generating Prisma Client..."
npx prisma generate

# ===== START APPLICATION =====
echo "✅ Starting Node.js application..."
exec node dist/server.js
