# Hướng Dẫn Cấu Hình Apache NiFi cho Whitehouse Database

## Mục Lục
1. [Tổng Quan](#tổng-quan)
2. [Cấu Hình Kết Nối Database](#cấu-hình-kết-nối-database)
3. [Flow 1: Extract và Load Booking Data](#flow-1-extract-và-load-booking-data)
4. [Flow 2: Extract và Load Payment Data](#flow-2-extract-và-load-payment-data)
5. [Flow 3: Populate Dimension Tables](#flow-3-populate-dimension-tables)
6. [Flow 4: Aggregate Daily Stats](#flow-4-aggregate-daily-stats)
7. [Flow 5: Calculate Peak Hours](#flow-5-calculate-peak-hours)
8. [Schedule và Automation](#schedule-và-automation)
9. [Monitoring và Troubleshooting](#monitoring-và-troubleshooting)
10. [Best Practices](#best-practices)

---

## Tổng Quan

Apache NiFi được sử dụng để:
- **Extract**: Lấy dữ liệu từ các service databases (booking, payment, auth)
- **Transform**: Chuyển đổi và làm sạch dữ liệu
- **Load**: Đưa dữ liệu vào whitehouse database (data warehouse)

### Kiến Trúc
```
[Booking DB] ──┐
[Payment DB] ──┼──> [NiFi] ──> [Whitehouse DB]
[Auth DB]   ──┘
```

---

## Cấu Hình Kết Nối Database

### 1. Tạo DBCPConnectionPool Controllers

#### 1.1. Booking Database Connection
1. Vào **Controller Services** (biểu tượng ⚙️ ở thanh toolbar)
2. Click **+** để tạo service mới
3. Chọn **DBCPConnectionPool**
4. Đặt tên: `BookingDBConnection`
5. Cấu hình:
   - **Database Connection URL**: `jdbc:mysql://booking-mysql:3306/evrental?useSSL=false&allowPublicKeyRetrieval=true`
   - **Database Driver Class Name**: `com.mysql.cj.jdbc.Driver`
   - **Database Driver Location(s)**: `/opt/nifi/nifi-current/lib/mysql-connector-java-8.0.33.jar`
   - **Database User**: `evuser`
   - **Password**: `evpass`
   - **Max Total Connections**: `10`
   - **Max Idle Connections**: `5`
   - **Min Idle Connections**: `2`
   - **Validation Query**: `SELECT 1`

#### 1.2. Payment Database Connection
- Tên: `PaymentDBConnection`
- **Database Connection URL**: `jdbc:mysql://billing-mysql:3306/evrental?useSSL=false&allowPublicKeyRetrieval=true`
- **Database User**: `root`
- **Password**: `root`
- Các settings khác giống Booking DB

#### 1.3. Auth Database Connection
- Tên: `AuthDBConnection`
- **Database Connection URL**: `jdbc:mysql://auth-mysql:3306/xdhdt?useSSL=false&allowPublicKeyRetrieval=true`
- **Database User**: `root` (hoặc user tương ứng)
- **Password**: `root` (hoặc password tương ứng)

#### 1.4. Whitehouse Database Connection
- Tên: `WhitehouseDBConnection`
- **Database Connection URL**: `jdbc:mysql://whitehouse-mysql:3306/whitehouse?useSSL=false&allowPublicKeyRetrieval=true`
- **Database User**: `nifi`
- **Password**: `nifi123`
- **Max Total Connections**: `20` (vì sẽ có nhiều write operations)

### 2. Enable Controllers
- Click vào từng controller service và click **Enable** (biểu tượng ▶️)

---

## Flow 1: Extract và Load Booking Data

### Mục Đích
Extract booking data từ booking database và load vào `fact_booking` và staging tables.

### ⚡ CẤU HÌNH REAL-TIME (Near Real-Time Updates)

Để NiFi tự động cập nhật mỗi khi database thay đổi, sử dụng **QueryDatabaseTable** với **Maximum-value Columns** và polling interval ngắn.

### Các Processors Cần Tạo

#### 1.1. QueryDatabaseTable (Real-Time Polling)
- **Name**: `ExtractBookingsRealtime`
- **Controller Service**: `BookingDBConnection`
- **Table Name**: `Booking`
- **Columns to Return**: `id, userId, vehicleId, stationId, startTime, endTime, status, priceEstimate, priceFinal, paymentId, createdAt, updatedAt`
- **Maximum-value Columns**: `updatedAt` ⭐ (QUAN TRỌNG: Để incremental load)
- **Where Clause**: `status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED')`
- **Scheduling Strategy**: `Timer driven`
- **Run Schedule**: `30 sec` (hoặc `1 min` - check mỗi 30 giây hoặc 1 phút)
- **Concurrent Tasks**: `1`
- **Max Rows Per Flow File**: `1000` (để tránh flowfile quá lớn)

**Cách hoạt động:**
- NiFi sẽ lưu giá trị `updatedAt` lớn nhất đã xử lý
- Mỗi lần chạy, chỉ query các records có `updatedAt > giá trị đã lưu`
- Tự động cập nhật giá trị mới sau mỗi lần query thành công

#### 1.2. ConvertRecord (JSON to Avro/JSON)
- **Name**: `ConvertBookingToJSON`
- **Record Reader**: `JsonTreeReader`
- **Record Writer**: `JsonRecordSetWriter`

#### 1.3. UpdateAttribute
- **Name**: `SetBookingAttributes`
- Thêm attributes:
  - `booking.table`: `fact_booking`
  - `booking.operation`: `INSERT`

#### 1.4. PutSQL
- **Name**: `LoadBookingsToStaging`
- **Controller Service**: `WhitehouseDBConnection`
- **SQL Statement**:
```sql
INSERT INTO staging_booking (
  booking_id, user_id, vehicle_id, station_id, 
  start_time, end_time, status, price_estimate, 
  price_final, payment_id, created_at, updated_at
) VALUES (
  ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?
)
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  vehicle_id = VALUES(vehicle_id),
  station_id = VALUES(station_id),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  status = VALUES(status),
  price_estimate = VALUES(price_estimate),
  price_final = VALUES(price_final),
  payment_id = VALUES(payment_id),
  updated_at = VALUES(updated_at)
```

#### 1.5. ExecuteSQL
- **Name**: `TransformStagingToFactBooking`
- **SQL Statement**:
```sql
INSERT INTO fact_booking (
  booking_id, time_id, user_id, station_id, vehicle_id,
  start_time, end_time, status, price_estimate, price_final,
  payment_id, duration_hours
)
SELECT 
  sb.booking_id,
  dt.time_id,
  sb.user_id,
  sb.station_id,
  sb.vehicle_id,
  sb.start_time,
  sb.end_time,
  sb.status,
  sb.price_estimate,
  sb.price_final,
  sb.payment_id,
  CASE 
    WHEN sb.end_time IS NOT NULL AND sb.start_time IS NOT NULL 
    THEN TIMESTAMPDIFF(HOUR, sb.start_time, sb.end_time)
    ELSE NULL
  END as duration_hours
FROM staging_booking sb
INNER JOIN dim_time dt ON DATE(sb.start_time) = dt.date
WHERE sb.status IN ('CONFIRMED', 'COMPLETED')
ON DUPLICATE KEY UPDATE
  time_id = VALUES(time_id),
  user_id = VALUES(user_id),
  station_id = VALUES(station_id),
  vehicle_id = VALUES(vehicle_id),
  start_time = VALUES(start_time),
  end_time = VALUES(end_time),
  status = VALUES(status),
  price_estimate = VALUES(price_estimate),
  price_final = VALUES(price_final),
  payment_id = VALUES(payment_id),
  duration_hours = VALUES(duration_hours)
```

### Kết Nối Processors (Real-Time)
```
ExtractBookingsRealtime → ConvertBookingToJSON 
→ SetBookingAttributes → LoadBookingsToStaging → TransformStagingToFactBooking
```

**Lưu ý:** Không cần `GenerateFlowFile` vì `QueryDatabaseTable` tự động trigger khi có data mới.

### ⚙️ Cấu Hình State Management

`QueryDatabaseTable` sẽ tự động lưu state (giá trị `updatedAt` lớn nhất) trong NiFi State Manager. Để reset state:
1. Click processor → Tab **State Management**
2. Click **Clear State** nếu muốn reset và load lại từ đầu
3. Hoặc xóa state file trong NiFi state directory

### 📊 Monitoring Real-Time Flow

- **Queue Size**: Kiểm tra queue size của `ExtractBookingsRealtime` - nếu tăng liên tục có nghĩa là xử lý không kịp
- **FlowFiles In/Out**: Số flowfiles đã xử lý
- **Last Execution Time**: Thời gian chạy lần cuối

---

## Flow 2: Extract và Load Payment Data

### Mục Đích
Extract payment data từ payment database và load vào `fact_payment`.

#### 2.1. QueryDatabaseTable (Real-Time)
- **Name**: `ExtractPaymentsRealtime`
- **Controller Service**: `PaymentDBConnection`
- **Table Name**: `Payment`
- **Columns**: `id, renterId, bookingId, stationId, amount, status, method, type, transactionId, createdAt, updatedAt`
- **Maximum-value Columns**: `updatedAt` ⭐ (QUAN TRỌNG)
- **Where Clause**: `status = 'SUCCEEDED'`
- **Scheduling Strategy**: `Timer driven`
- **Run Schedule**: `30 sec` (hoặc `1 min`)
- **Concurrent Tasks**: `1`
- **Max Rows Per Flow File**: `1000`

#### 2.2. PutSQL
- **Name**: `LoadPaymentsToStaging`
- **SQL Statement**:
```sql
INSERT INTO staging_payment (
  payment_id, user_id, booking_id, station_id,
  amount, status, method, type, transaction_id,
  created_at, updated_at
) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
ON DUPLICATE KEY UPDATE
  user_id = VALUES(user_id),
  booking_id = VALUES(booking_id),
  station_id = VALUES(station_id),
  amount = VALUES(amount),
  status = VALUES(status),
  method = VALUES(method),
  type = VALUES(type),
  transaction_id = VALUES(transaction_id),
  updated_at = VALUES(updated_at)
```

#### 2.3. ExecuteSQL
- **Name**: `TransformStagingToFactPayment`
- **SQL Statement**:
```sql
INSERT INTO fact_payment (
  payment_id, time_id, user_id, station_id, booking_id,
  amount, status, method, transaction_id
)
SELECT 
  sp.payment_id,
  dt.time_id,
  sp.user_id,
  sp.station_id,
  sp.booking_id,
  sp.amount,
  sp.status,
  sp.method,
  sp.transaction_id
FROM staging_payment sp
INNER JOIN dim_time dt ON DATE(sp.created_at) = dt.date
WHERE sp.status = 'SUCCEEDED'
ON DUPLICATE KEY UPDATE
  time_id = VALUES(time_id),
  user_id = VALUES(user_id),
  station_id = VALUES(station_id),
  booking_id = VALUES(booking_id),
  amount = VALUES(amount),
  status = VALUES(status),
  method = VALUES(method),
  transaction_id = VALUES(transaction_id)
```

---

## Flow 3: Populate Dimension Tables

### 3.1. Populate DimStation

#### ExecuteSQL
- **Name**: `SyncDimStation`
- **Schedule**: `0 0 2 * * ?` (Chạy lúc 2h sáng)
- **SQL Statement**:
```sql
INSERT INTO dim_station (station_id, station_name, address, lat, lng)
SELECT 
  s.id as station_id,
  s.name as station_name,
  s.address,
  s.lat,
  s.lng
FROM booking-mysql.evrental.Station s
ON DUPLICATE KEY UPDATE
  station_name = VALUES(station_name),
  address = VALUES(address),
  lat = VALUES(lat),
  lng = VALUES(lng),
  updated_at = NOW()
```

### 3.2. Populate DimUser

#### ExecuteSQL
- **Name**: `SyncDimUser`
- **SQL Statement**:
```sql
INSERT INTO dim_user (user_id, email, full_name, phone_number, role, verification_status)
SELECT 
  u.id as user_id,
  u.email,
  u.fullName as full_name,
  u.phoneNumber as phone_number,
  u.role,
  u.verificationStatus as verification_status
FROM auth-mysql.xdhdt.User u
ON DUPLICATE KEY UPDATE
  email = VALUES(email),
  full_name = VALUES(full_name),
  phone_number = VALUES(phone_number),
  role = VALUES(role),
  verification_status = VALUES(verification_status),
  updated_at = NOW()
```

### 3.3. Populate DimVehicle

#### ExecuteSQL
- **Name**: `SyncDimVehicle`
- **SQL Statement**:
```sql
INSERT INTO dim_vehicle (vehicle_id, vehicle_name, plate, type, station_id, price_per_day)
SELECT 
  v.id as vehicle_id,
  v.name as vehicle_name,
  v.plate,
  v.type,
  v.stationId as station_id,
  v.pricePerDay as price_per_day
FROM booking-mysql.evrental.Vehicle v
ON DUPLICATE KEY UPDATE
  vehicle_name = VALUES(vehicle_name),
  plate = VALUES(plate),
  type = VALUES(type),
  station_id = VALUES(station_id),
  price_per_day = VALUES(price_per_day),
  updated_at = NOW()
```

### 3.4. Populate DimTime (Nếu chưa có)

#### ExecuteSQL
- **Name**: `PopulateDimTime`
- **Schedule**: `0 0 0 1 1 ?` (Chạy mỗi năm một lần vào 1/1)
- **SQL Statement**: Gọi stored procedure
```sql
CALL populate_dim_time(2)
```

---

## Flow 4: Aggregate Daily Stats

### Mục Đích
Tính toán và lưu các thống kê hàng ngày vào `agg_daily_stats`.

#### ExecuteSQL
- **Name**: `AggregateDailyStats`
- **Schedule**: `0 30 1 * * ?` (Chạy lúc 1h30 sáng mỗi ngày)
- **SQL Statement**:
```sql
INSERT INTO agg_daily_stats (
  time_id, station_id,
  total_bookings, total_revenue, total_payments,
  completed_bookings, cancelled_bookings,
  avg_booking_duration_hours, unique_users, unique_vehicles
)
SELECT 
  dt.time_id,
  COALESCE(fb.station_id, fp.station_id) as station_id,
  COUNT(DISTINCT fb.booking_id) as total_bookings,
  COALESCE(SUM(fp.amount), 0) as total_revenue,
  COUNT(DISTINCT fp.payment_id) as total_payments,
  SUM(CASE WHEN fb.status = 'COMPLETED' THEN 1 ELSE 0 END) as completed_bookings,
  SUM(CASE WHEN fb.status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelled_bookings,
  AVG(fb.duration_hours) as avg_booking_duration_hours,
  COUNT(DISTINCT fb.user_id) as unique_users,
  COUNT(DISTINCT fb.vehicle_id) as unique_vehicles
FROM dim_time dt
LEFT JOIN fact_booking fb ON dt.time_id = fb.time_id
LEFT JOIN fact_payment fp ON dt.time_id = fp.time_id AND fp.status = 'SUCCEEDED'
WHERE dt.date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
GROUP BY dt.time_id, COALESCE(fb.station_id, fp.station_id)
ON DUPLICATE KEY UPDATE
  total_bookings = VALUES(total_bookings),
  total_revenue = VALUES(total_revenue),
  total_payments = VALUES(total_payments),
  completed_bookings = VALUES(completed_bookings),
  cancelled_bookings = VALUES(cancelled_bookings),
  avg_booking_duration_hours = VALUES(avg_booking_duration_hours),
  unique_users = VALUES(unique_users),
  unique_vehicles = VALUES(unique_vehicles),
  updated_at = NOW()
```

---

## Flow 5: Calculate Peak Hours

### Mục Đích
Tính toán giờ cao điểm và lưu vào `fact_peak_hours`.

#### ExecuteSQL
- **Name**: `CalculatePeakHours`
- **Schedule**: `0 0 2 * * ?` (Chạy lúc 2h sáng)
- **SQL Statement**:
```sql
INSERT INTO fact_peak_hours (
  time_id, hour_of_day, station_id, vehicle_type,
  total_bookings, total_revenue, avg_duration_hours,
  unique_users, peak_score
)
SELECT 
  dt.time_id,
  HOUR(fb.start_time) as hour_of_day,
  fb.station_id,
  dv.type as vehicle_type,
  COUNT(DISTINCT fb.booking_id) as total_bookings,
  COALESCE(SUM(fp.amount), 0) as total_revenue,
  AVG(fb.duration_hours) as avg_duration_hours,
  COUNT(DISTINCT fb.user_id) as unique_users,
  (
    COUNT(DISTINCT fb.booking_id) * 0.4 +
    COALESCE(SUM(fp.amount), 0) / 1000000 * 0.3 +
    COUNT(DISTINCT fb.user_id) * 0.2 +
    AVG(fb.duration_hours) * 0.1
  ) as peak_score
FROM dim_time dt
INNER JOIN fact_booking fb ON dt.time_id = fb.time_id
LEFT JOIN dim_vehicle dv ON fb.vehicle_id = dv.vehicle_id
LEFT JOIN fact_payment fp ON fb.booking_id = fp.booking_id AND fp.status = 'SUCCEEDED'
WHERE dt.date = DATE_SUB(CURDATE(), INTERVAL 1 DAY)
  AND fb.status IN ('CONFIRMED', 'COMPLETED')
GROUP BY dt.time_id, HOUR(fb.start_time), fb.station_id, dv.type
ON DUPLICATE KEY UPDATE
  total_bookings = VALUES(total_bookings),
  total_revenue = VALUES(total_revenue),
  avg_duration_hours = VALUES(avg_duration_hours),
  unique_users = VALUES(unique_users),
  peak_score = VALUES(peak_score),
  updated_at = NOW()
```

---

## Schedule và Automation

### ⚡ Real-Time vs Batch Processing

#### Option 1: Real-Time (Near Real-Time) - RECOMMENDED
Sử dụng **Timer driven** với interval ngắn cho fact tables:

| Flow | Strategy | Schedule | Mô Tả |
|------|----------|----------|-------|
| Extract Bookings | Timer driven | `30 sec` | Check mỗi 30 giây |
| Extract Payments | Timer driven | `30 sec` | Check mỗi 30 giây |
| Transform to Fact | Timer driven | `1 min` | Transform mỗi phút |
| Sync Dimensions | Timer driven | `5 min` | Sync mỗi 5 phút |
| Aggregate Stats | CRON driven | `0 0 1 * * ?` | Chạy 1h sáng (batch) |
| Calculate Peak Hours | CRON driven | `0 0 2 * * ?` | Chạy 2h sáng (batch) |

**Ưu điểm:**
- ✅ Cập nhật gần như real-time (delay 30s-1min)
- ✅ Tự động phát hiện thay đổi
- ✅ Không cần manual trigger

**Nhược điểm:**
- ⚠️ Tốn tài nguyên hơn (query thường xuyên)
- ⚠️ Cần đảm bảo database có index trên `updatedAt`

#### Option 2: Batch Processing (Traditional)
Sử dụng **CRON driven** cho các flows chạy theo lịch:

| Flow | Schedule | Mô Tả |
|------|----------|-------|
| Extract Bookings | `0 0 1 * * ?` | 1h sáng mỗi ngày |
| Extract Payments | `0 15 1 * * ?` | 1h15 sáng mỗi ngày |
| Sync Dimensions | `0 30 1 * * ?` | 1h30 sáng mỗi ngày |
| Aggregate Stats | `0 45 1 * * ?` | 1h45 sáng mỗi ngày |
| Calculate Peak Hours | `0 0 2 * * ?` | 2h sáng mỗi ngày |
| Populate DimTime | `0 0 0 1 1 ?` | 1/1 mỗi năm |

### Cron Expression Format
```
┌───────────── minute (0 - 59)
│ ┌───────────── hour (0 - 23)
│ │ ┌───────────── day of month (1 - 31)
│ │ │ ┌───────────── month (1 - 12)
│ │ │ │ ┌───────────── day of week (0 - 6) (Sunday to Saturday)
│ │ │ │ │
* * * * * ?
```

### Cấu Hình Schedule trong NiFi

#### Timer Driven (Real-Time)
1. Click vào processor
2. Tab **Scheduling**
3. **Scheduling Strategy**: `Timer driven`
4. **Run Schedule**: `30 sec` hoặc `1 min`
5. **Run Duration**: `0 seconds`
6. **Concurrent Tasks**: `1`

#### CRON Driven (Batch)
1. Click vào processor
2. Tab **Scheduling**
3. **Scheduling Strategy**: `CRON driven`
4. **Cron Expression**: Nhập expression tương ứng
5. **Run Duration**: `0 seconds`
6. **Concurrent Tasks**: `1`

---

## Monitoring và Troubleshooting

### 1. Kiểm Tra Flow Status

#### Bulletins
- Vào **Bulletin Board** (biểu tượng 📢) để xem warnings/errors

#### Processor Statistics
- Click processor → Tab **Statistics**:
  - **In**: Số flowfiles đã nhận
  - **Out**: Số flowfiles đã gửi
  - **Read/Write**: Bytes đã xử lý
  - **Duration**: Thời gian xử lý

### 2. Common Issues

#### Issue: Connection Timeout
**Nguyên nhân**: Database không accessible hoặc network issue
**Giải pháp**:
- Kiểm tra database container đang chạy: `docker ps | grep mysql`
- Test connection từ NiFi container: `docker exec nifi-container mysql -h host -u user -p`
- Tăng timeout trong DBCPConnectionPool settings

#### Issue: Duplicate Key Error
**Nguyên nhân**: Data đã tồn tại trong staging/fact tables
**Giải pháp**:
- Sử dụng `ON DUPLICATE KEY UPDATE` trong SQL
- Hoặc xóa data cũ trước khi insert: `DELETE FROM staging_booking WHERE DATE(created_at) = DATE_SUB(CURDATE(), INTERVAL 1 DAY)`

#### Issue: Missing Dimension Data
**Nguyên nhân**: `dim_time` hoặc dimension tables chưa có data
**Giải pháp**:
- Chạy `PopulateDimTime` stored procedure
- Sync dimension tables trước khi load fact tables

#### Issue: Performance Slow
**Nguyên nhân**: Quá nhiều data hoặc query không tối ưu
**Giải pháp**:
- Thêm indexes vào staging và fact tables
- Sử dụng incremental load (WHERE clause với date range)
- Tăng connection pool size
- Chạy flows vào giờ thấp điểm

### 3. Logging và Debugging

#### Enable Logging
1. Vào **Controller Settings** → **Logging**
2. Set log level cho processors:
   - `org.apache.nifi.processors.standard.ExecuteSQL` → `DEBUG`
   - `org.apache.nifi.processors.standard.QueryDatabaseTable` → `DEBUG`

#### View Logs
```bash
docker logs nifi-container --tail 100 -f
```

#### Check Database
```sql
-- Kiểm tra số records trong staging
SELECT COUNT(*) FROM staging_booking;
SELECT COUNT(*) FROM staging_payment;

-- Kiểm tra số records trong fact tables
SELECT COUNT(*) FROM fact_booking;
SELECT COUNT(*) FROM fact_payment;

-- Kiểm tra latest data
SELECT MAX(created_at) FROM staging_booking;
SELECT MAX(created_at) FROM fact_booking;
```

---

## Best Practices

### 1. Real-Time Processing Best Practices

#### Database Indexes (QUAN TRỌNG)
Đảm bảo có index trên `updatedAt` để query nhanh:
```sql
-- Booking table
CREATE INDEX idx_updated_at ON Booking(updatedAt);
CREATE INDEX idx_status_updated ON Booking(status, updatedAt);

-- Payment table
CREATE INDEX idx_updated_at ON Payment(updatedAt);
CREATE INDEX idx_status_updated ON Payment(status, updatedAt);
```

#### Polling Interval
- **30 giây**: Cho data thay đổi thường xuyên (bookings, payments)
- **1-5 phút**: Cho data ít thay đổi (dimensions)
- **Không nên < 10 giây**: Tránh overload database

#### State Management
- **Backup state**: NiFi state được lưu trong `conf/state/` - nên backup định kỳ
- **Clear state**: Nếu muốn reload từ đầu, clear state trong processor
- **State persistence**: Đảm bảo NiFi state directory được mount persistent

### 2. Data Quality
- **Validate data** trước khi load vào fact tables
- **Handle NULL values** đúng cách
- **Check referential integrity** (foreign keys)
- **Deduplicate**: Sử dụng `ON DUPLICATE KEY UPDATE` để tránh duplicate

### 3. Performance
- **Use staging tables** để transform data trước khi load vào fact
- **Index staging tables** trên các columns thường query
- **Batch inserts** thay vì insert từng record (Max Rows Per Flow File = 1000)
- **Incremental load** với Maximum-value Columns
- **Connection pooling**: Tăng Max Connections trong DBCPConnectionPool

### 4. Error Handling
- **Use PutSQL với error handling**: Set **Rollback On Failure** = `false`
- **Route failed flowfiles** đến một processor để log errors
- **Retry mechanism**: Sử dụng RetryFlowFile processor
- **Dead Letter Queue**: Lưu failed records để xử lý sau

### 5. Security
- **Store credentials** trong NiFi Registry hoặc environment variables
- **Use SSL** cho database connections (production)
- **Limit access** đến NiFi UI
- **Network isolation**: Đảm bảo NiFi chỉ có thể kết nối đến databases cần thiết

### 6. Monitoring
- **Set up alerts** cho failed processors
- **Monitor queue sizes** (nếu queue quá lớn, có thể có bottleneck)
- **Track data volume** mỗi ngày để phát hiện anomalies
- **Monitor database load**: Kiểm tra slow queries và connection count
- **Alert on state lag**: Nếu state không update trong X phút, có thể có vấn đề

---

## Sample Complete Flow

### Flow Diagram
```
[GenerateFlowFile] (Trigger daily at 1 AM)
    ↓
[QueryDatabaseTable] (Extract Bookings)
    ↓
[ConvertRecord] (JSON)
    ↓
[UpdateAttribute] (Set metadata)
    ↓
[PutSQL] (Load to staging_booking)
    ↓
[ExecuteSQL] (Transform to fact_booking)
    ↓
[LogAttribute] (Log success)
```

### Error Handling Flow
```
[PutSQL] (Load to staging)
    ├─ Success → [ExecuteSQL] (Transform)
    └─ Failure → [PutFile] (Save error file)
                  ↓
              [LogAttribute] (Log error)
```

---

## Quick Start Checklist

- [ ] Tạo 4 DBCPConnectionPool controllers (Booking, Payment, Auth, Whitehouse)
- [ ] Enable tất cả controllers
- [ ] Tạo Flow 1: Extract và Load Booking Data
- [ ] Tạo Flow 2: Extract và Load Payment Data
- [ ] Tạo Flow 3: Populate Dimension Tables
- [ ] Tạo Flow 4: Aggregate Daily Stats
- [ ] Tạo Flow 5: Calculate Peak Hours
- [ ] Cấu hình schedule cho từng flow
- [ ] Test từng flow với sample data
- [ ] Monitor logs và statistics
- [ ] Verify data trong whitehouse database

---

## Tài Liệu Tham Khảo

- [NiFi User Guide](https://nifi.apache.org/docs.html)
- [NiFi Expression Language](https://nifi.apache.org/docs/nifi-docs/html/expression-language-guide.html)
- [MySQL JDBC Driver](https://dev.mysql.com/doc/connector-j/8.0/en/)
- [Cron Expression](https://www.freeformatter.com/cron-expression-generator-quartz.html)

---

## Liên Hệ và Hỗ Trợ

Nếu gặp vấn đề, kiểm tra:
1. NiFi logs: `docker logs nifi-container`
2. Database logs: `docker logs whitehouse-mysql`
3. Network connectivity: `docker network inspect ev-rental-network`
4. Processor bulletins trong NiFi UI

