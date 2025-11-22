#!/bin/bash
# Script để reset database - XÓA và TẠO LẠI database từ đầu

set -e

echo "🗑️  Dropping existing database and migrations..."

# Xóa thư mục migrations cũ
rm -rf prisma/migrations

echo "📦 Generating fresh Prisma client..."
npx prisma generate

echo "🔄 Creating fresh migration..."
npx prisma migrate dev --name init --create-only

echo "🚀 Applying migration..."
npx prisma migrate deploy

echo "🌱 Seeding database..."
npm run seed

echo "✅ Database reset completed!"

