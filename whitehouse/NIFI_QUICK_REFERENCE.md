# NiFi Quick Reference - Checklist Nhanh

## 0. ⚡ Real-Time Setup (QUAN TRỌNG)

### Tạo Indexes Trước
```bash
# Chạy script tạo indexes
docker exec -i booking-mysql mysql -u evuser -pevpass evrental < whitehouse/setup-realtime-indexes.sql
docker exec -i billing-mysql mysql -u root -proot evrental < whitehouse/setup-realtime-indexes.sql
```

### Cấu Hình Real-Time
- **QueryDatabaseTable**: Set `Maximum-value Columns` = `updatedAt`
- **Scheduling**: `Timer driven` với `30 sec` hoặc `1 min`
- **Xem chi tiết**: `whitehouse/REALTIME_SETUP.md`

---

## 1. Database Connections (DBCPConnectionPool)

### Booking DB
```
Name: BookingDBConnection
URL: jdbc:mysql://booking-mysql:3306/evrental?useSSL=false&allowPublicKeyRetrieval=true
User: evuser
Pass: evpass
Driver: com.mysql.cj.jdbc.Driver
```

### Payment DB
```
Name: PaymentDBConnection
URL: jdbc:mysql://billing-mysql:3306/evrental?useSSL=false&allowPublicKeyRetrieval=true
User: root
Pass: root
```

### Auth DB
```
Name: AuthDBConnection
URL: jdbc:mysql://auth-mysql:3306/xdhdt?useSSL=false&allowPublicKeyRetrieval=true
User: root
Pass: root
```

### Whitehouse DB
```
Name: WhitehouseDBConnection
URL: jdbc:mysql://whitehouse-mysql:3306/whitehouse?useSSL=false&allowPublicKeyRetrieval=true
User: nifi
Pass: nifi123
Max Connections: 20
```

---

## 2. SQL Queries Nhanh

### Extract Bookings
```sql
SELECT id, userId, vehicleId, stationId, startTime, endTime, 
       status, priceEstimate, priceFinal, paymentId, createdAt, updatedAt
FROM Booking
WHERE DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
ORDER BY updatedAt
```

### Extract Payments
```sql
SELECT id, renterId, bookingId, stationId, amount, status, 
       method, type, transactionId, createdAt, updatedAt
FROM Payment
WHERE status = 'SUCCEEDED' 
  AND DATE(createdAt) >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
```

### Load to Staging Booking
```sql
INSERT INTO staging_booking (booking_id, user_id, vehicle_id, station_id, 
  start_time, end_time, status, price_estimate, price_final, payment_id, 
  created_at, updated_at)
VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  status = VALUES(status),
  price_final = VALUES(price_final),
  updated_at = VALUES(updated_at)
```

### Transform to Fact Booking
```sql
INSERT INTO fact_booking (booking_id, time_id, user_id, station_id, vehicle_id,
  start_time, end_time, status, price_estimate, price_final, payment_id, duration_hours)
SELECT 
  sb.booking_id, dt.time_id, sb.user_id, sb.station_id, sb.vehicle_id,
  sb.start_time, sb.end_time, sb.status, sb.price_estimate, sb.price_final,
  sb.payment_id,
  CASE WHEN sb.end_time IS NOT NULL 
    THEN TIMESTAMPDIFF(HOUR, sb.start_time, sb.end_time) 
    ELSE NULL END
FROM staging_booking sb
INNER JOIN dim_time dt ON DATE(sb.start_time) = dt.date
WHERE sb.status IN ('CONFIRMED', 'COMPLETED')
ON DUPLICATE KEY UPDATE
  end_time = VALUES(end_time),
  status = VALUES(status),
  price_final = VALUES(price_final),
  duration_hours = VALUES(duration_hours)
```

---

## 3. Schedule (Real-Time vs Batch)

### ⚡ Real-Time (Recommended)
| Flow | Strategy | Schedule | Mô Tả |
|------|----------|----------|-------|
| Extract Bookings | Timer driven | `30 sec` | Check mỗi 30s |
| Extract Payments | Timer driven | `30 sec` | Check mỗi 30s |
| Transform to Fact | Timer driven | `1 min` | Transform mỗi phút |
| Sync Dimensions | Timer driven | `5 min` | Sync mỗi 5 phút |

### 📅 Batch (Traditional)
| Flow | Cron | Mô Tả |
|------|------|-------|
| Extract Bookings | `0 0 1 * * ?` | 1h sáng hàng ngày |
| Extract Payments | `0 15 1 * * ?` | 1h15 sáng |
| Sync Dimensions | `0 30 1 * * ?` | 1h30 sáng |
| Aggregate Stats | `0 45 1 * * ?` | 1h45 sáng |
| Peak Hours | `0 0 2 * * ?` | 2h sáng |
| DimTime (Yearly) | `0 0 0 1 1 ?` | 1/1 hàng năm |

---

## 4. Processor Settings

### QueryDatabaseTable
- **Scheduling Strategy**: `CRON driven`
- **Concurrent Tasks**: `1`
- **Maximum-value Columns**: `updatedAt` (incremental)

### PutSQL / ExecuteSQL
- **Rollback On Failure**: `false`
- **Support Fragmented Transactions**: `false`
- **Batch Size**: `100`

### ConvertRecord
- **Record Reader**: `JsonTreeReader`
- **Record Writer**: `JsonRecordSetWriter`

---

## 5. Troubleshooting Commands

### Check Database Connections
```bash
docker exec whitehouse-mysql mysql -u nifi -pnifi123 -e "SELECT 1"
docker exec booking-mysql mysql -u evuser -pevpass -e "SELECT 1"
```

### Check Data in Whitehouse
```sql
-- Count records
SELECT 'fact_booking' as table_name, COUNT(*) as count FROM fact_booking
UNION ALL
SELECT 'fact_payment', COUNT(*) FROM fact_payment
UNION ALL
SELECT 'agg_daily_stats', COUNT(*) FROM agg_daily_stats;

-- Latest data
SELECT MAX(created_at) as latest_booking FROM staging_booking;
SELECT MAX(created_at) as latest_payment FROM staging_payment;
```

### Check NiFi Logs
```bash
docker logs nifi-container --tail 100 -f | grep -i error
```

---

## 6. Flow Order (Thứ tự chạy)

1. **Populate DimTime** (nếu chưa có)
2. **Sync Dimensions** (DimStation, DimUser, DimVehicle)
3. **Extract Bookings** → Load to Staging → Transform to Fact
4. **Extract Payments** → Load to Staging → Transform to Fact
5. **Aggregate Daily Stats**
6. **Calculate Peak Hours**

---

## 7. Common Issues & Fixes

| Issue | Fix |
|-------|-----|
| Connection timeout | Check network, increase timeout in DBCPConnectionPool |
| Duplicate key error | Use `ON DUPLICATE KEY UPDATE` |
| Missing dim_time | Run `CALL populate_dim_time(2)` |
| Slow performance | Add indexes, use incremental load |
| Queue full | Increase concurrent tasks or optimize query |

---

## 8. Monitoring Queries

### Check ETL Status
```sql
-- Staging data today
SELECT COUNT(*) as staging_bookings_today
FROM staging_booking
WHERE DATE(created_at) = CURDATE();

-- Fact data today
SELECT COUNT(*) as fact_bookings_today
FROM fact_booking fb
JOIN dim_time dt ON fb.time_id = dt.time_id
WHERE dt.date = CURDATE();

-- Missing time records
SELECT DATE(sb.start_time) as missing_date
FROM staging_booking sb
LEFT JOIN dim_time dt ON DATE(sb.start_time) = dt.date
WHERE dt.time_id IS NULL
GROUP BY DATE(sb.start_time);
```

### Performance Check
```sql
-- Average booking duration by station
SELECT 
  ds.station_name,
  COUNT(*) as total_bookings,
  AVG(fb.duration_hours) as avg_duration,
  SUM(fb.price_final) as total_revenue
FROM fact_booking fb
JOIN dim_station ds ON fb.station_id = ds.station_id
WHERE fb.status = 'COMPLETED'
GROUP BY ds.station_name
ORDER BY total_revenue DESC;
```

---

## 9. Quick Test Flow

### Test Connection
1. Create **ExecuteSQL** processor
2. Set **SQL select query**: `SELECT 1 as test`
3. Set **Database Connection**: `WhitehouseDBConnection`
4. Run processor → Check output

### Test Extract
1. Create **QueryDatabaseTable**
2. Set **Table Name**: `Booking`
3. Set **Max Rows**: `10`
4. Run → Check flowfiles

### Test Load
1. Create **PutSQL**
2. Set **SQL Statement**: `INSERT INTO staging_booking (...) VALUES (?, ?, ...)`
3. Run → Check database

---

## 10. File Locations

- **Full Guide**: `whitehouse/NIFI_SETUP_GUIDE.md`
- **Sample Queries**: `whitehouse/nifi-sample-queries.sql`
- **Peak Hours SQL**: `whitehouse/peak-hours-analysis.sql`
- **Database Schema**: `whitehouse/init-db.sql`

