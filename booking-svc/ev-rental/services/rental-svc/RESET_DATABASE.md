# Reset Database - Hướng dẫn

## Vấn đề đã sửa

1. **Prisma Client Singleton**: Tránh tạo nhiều connections bằng singleton pattern
2. **Connection Pool**: Thêm config `connection_limit=10&pool_timeout=20`
3. **Graceful Shutdown**: Disconnect Prisma khi service shutdown

## Các bước Reset Database

### Cách 1: Sử dụng Script (Khuyến nghị)

```bash
cd booking-svc/ev-rental/services/rental-svc

# Bước 1: Drop database cũ trong MySQL container
docker exec -i booking-mysql mysql -uroot -proot < drop-and-recreate.sql

# Bước 2: Xóa migrations cũ và tạo migration mới
rm -rf prisma/migrations
npx prisma generate

# Bước 3: Tạo migration mới
npx prisma migrate dev --name init

# Bước 4: Seed data
npm run seed
```

### Cách 2: Manual (trong Docker container)

```bash
# Vào rental-svc container
docker exec -it rental-svc sh

# Xóa migrations cũ
rm -rf prisma/migrations

# Generate Prisma client
npx prisma generate

# Tạo migration mới và apply
npx prisma migrate dev --name init

# Seed data
npm run seed
```

### Cách 3: Drop MySQL container và tạo mới

```bash
cd booking-svc/ev-rental

# Stop và xóa containers
docker compose down -v

# Rebuild và start lại
docker compose up -d --build

# Chờ MySQL healthy, sau đó vào rental-svc container
docker exec -it rental-svc sh
npx prisma migrate deploy
npm run seed
```

## Kiểm tra sau khi reset

```bash
# Kiểm tra tables đã được tạo
docker exec -it booking-mysql mysql -uevuser -pevpass -e "USE evrental; SHOW TABLES;"

# Kiểm tra dữ liệu seed
docker exec -it booking-mysql mysql -uevuser -pevpass -e "USE evrental; SELECT COUNT(*) FROM Station; SELECT COUNT(*) FROM Vehicle;"
```

## Các thay đổi code

1. **src/prisma/index.js**: Singleton pattern với connection pool
2. **src/routes/bookings.js**: Dùng shared prisma instance
3. **src/routes/vehicles.js**: Dùng shared prisma instance
4. **src/mq.js**: Dùng shared prisma instance
5. **docker-compose.yml**: Thêm connection pool config trong DATABASE_URL

