# EVRental Billing & Analytics

## Databases
- payment-svc → `evrental`
  - Tables: `Payment`, `PaymentTransaction`, `Deposit`, `IdempotencyKey`, `WebhookInbound`
  - Env: `DATABASE_URL=mysql://root:root@evrental-billing-mysql-1:3306/evrental`
- analytics-svc → `evrental_analytics`
  - Tables: `RevenueDaily`, `StationStatsDaily`, `UserRentalStats`, `HourlyHeatmap`
  - Env: `DATABASE_URL=mysql://root:root@evrental-billing-mysql-1:3306/evrental_analytics`

Tách riêng DB để tránh xóa chéo schema khi chạy `prisma db push` giữa hai service.

## Prisma
- payment-svc:
  docker exec -it evrental-billing-payment-svc-1 npx prisma db push
- analytics-svc:
  docker exec -it evrental-billing-analytics-svc-1 npx prisma db push

## NiFi Aggregation (RevenueDaily)
- NiFi tham chiếu: `nifi/REVENUE_FLOW_GUIDE.md`
- Kết nối:
  - booking DB: `jdbc:mysql://ev-mysql:3306/evrental`
  - analytics DB: `jdbc:mysql://evrental-billing-mysql-1:3306/evrental_analytics`
- SQL helper: `nifi/sql/revenue_daily.sql` (INSERT vào `evrental_analytics.RevenueDaily`)

## API
- Analytics:
  - GET /api/v1/analytics/revenue-daily?from=YYYY-MM-DD&to=YYYY-MM-DD
  - GET /api/v1/analytics/revenue (theo station nếu truyền `stationId`)

## Gateway (APISIX)
- Đảm bảo route analytics trỏ tới `analytics-svc:8083`, và cho phép CORS nếu gọi từ frontend.