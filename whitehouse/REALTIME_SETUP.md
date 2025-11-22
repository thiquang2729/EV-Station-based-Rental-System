# Hướng Dẫn Cấu Hình Real-Time Updates với NiFi

## Tổng Quan

Hướng dẫn này mô tả cách cấu hình NiFi để tự động cập nhật whitehouse database mỗi khi source database thay đổi (near real-time).

## Kiến Trúc Real-Time

```
[Source DB] ──> [NiFi QueryDatabaseTable] ──> [Staging] ──> [Fact Tables]
     ↑                    ↓ (Polling 30s)
     └─── updatedAt ──────┘
```

## Bước 1: Chuẩn Bị Database

### 1.1. Tạo Indexes (QUAN TRỌNG)

Chạy các lệnh sau trên source databases:

#### Booking Database
```sql
USE evrental;

-- Index cho updatedAt (cho incremental query)
CREATE INDEX IF NOT EXISTS idx_booking_updated_at ON Booking(updatedAt);
CREATE INDEX IF NOT EXISTS idx_booking_status_updated ON Booking(status, updatedAt);
CREATE INDEX IF NOT EXISTS idx_booking_created_at ON Booking(createdAt);

-- Verify indexes
SHOW INDEX FROM Booking;
```

#### Payment Database
```sql
USE evrental;

-- Index cho updatedAt
CREATE INDEX IF NOT EXISTS idx_payment_updated_at ON Payment(updatedAt);
CREATE INDEX IF NOT EXISTS idx_payment_status_updated ON Payment(status, updatedAt);
CREATE INDEX IF NOT EXISTS idx_payment_created_at ON Payment(createdAt);

-- Verify indexes
SHOW INDEX FROM Payment;
```

### 1.2. Kiểm Tra updatedAt Column

Đảm bảo tất cả tables có column `updatedAt` và được update tự động:

```sql
-- Booking table
ALTER TABLE Booking 
MODIFY COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;

-- Payment table
ALTER TABLE Payment 
MODIFY COLUMN updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP;
```

## Bước 2: Cấu Hình QueryDatabaseTable Processor

### 2.1. Extract Bookings (Real-Time)

1. **Tạo Processor**: `QueryDatabaseTable`
2. **Name**: `ExtractBookingsRealtime`
3. **Settings**:

#### Tab General
- **Name**: `ExtractBookingsRealtime`
- **Automatically Terminate Relationships**: Chọn tất cả ngoại trừ `success`

#### Tab Properties
- **Database Connection**: `BookingDBConnection`
- **Table Name**: `Booking`
- **Columns to Return**: 
  ```
  id, userId, vehicleId, stationId, startTime, endTime, 
  status, priceEstimate, priceFinal, paymentId, createdAt, updatedAt
  ```
- **Maximum-value Columns**: `updatedAt` ⭐ **QUAN TRỌNG**
- **Where Clause**: `status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED')`
- **Max Rows Per Flow File**: `1000`
- **Max Wait Time**: `0 seconds`

#### Tab Scheduling
- **Scheduling Strategy**: `Timer driven`
- **Run Schedule**: `30 sec` (hoặc `1 min`)
- **Concurrent Tasks**: `1`
- **Run Duration**: `0 seconds`

#### Tab State Management
- **Stateful**: `true` (tự động)
- **State Scope**: `CLUSTER` (nếu có cluster) hoặc `LOCAL`

### 2.2. Extract Payments (Real-Time)

Tương tự như trên:
- **Name**: `ExtractPaymentsRealtime`
- **Database Connection**: `PaymentDBConnection`
- **Table Name**: `Payment`
- **Maximum-value Columns**: `updatedAt`
- **Where Clause**: `status = 'SUCCEEDED'`
- **Run Schedule**: `30 sec`

## Bước 3: Cấu Hình State Management

### 3.1. Kiểm Tra State

NiFi sẽ tự động lưu state (giá trị `updatedAt` lớn nhất) trong:
- **Local**: `conf/state/local/`
- **Cluster**: NiFi Registry

### 3.2. View State

1. Click processor `ExtractBookingsRealtime`
2. Tab **State Management**
3. Click **View State** để xem giá trị hiện tại

### 3.3. Clear State (Nếu cần reset)

1. Click processor
2. Tab **State Management`
3. Click **Clear State`
4. ⚠️ **Cảnh báo**: Sẽ load lại tất cả data từ đầu

### 3.4. Backup State

```bash
# Backup state directory
docker exec nifi-container tar -czf /tmp/nifi-state-backup.tar.gz /opt/nifi/nifi-current/conf/state/

# Copy ra host
docker cp nifi-container:/tmp/nifi-state-backup.tar.gz ./nifi-state-backup.tar.gz
```

## Bước 4: Cấu Hình Transform Processors

### 4.1. Transform Staging to Fact (Real-Time)

Tạo processor `ExecuteSQL` để transform từ staging sang fact:

- **Name**: `TransformStagingToFactBookingRealtime`
- **Scheduling Strategy**: `Timer driven`
- **Run Schedule**: `1 min` (chạy mỗi phút để transform data mới)
- **SQL Statement**: (xem trong NIFI_SETUP_GUIDE.md)

## Bước 5: Testing Real-Time Flow

### 5.1. Test với Sample Data

1. **Insert test data vào Booking table**:
```sql
INSERT INTO Booking (id, userId, vehicleId, stationId, startTime, status, priceEstimate, createdAt, updatedAt)
VALUES ('test-booking-1', 'user-1', 'vehicle-1', 'station-1', NOW(), 'CONFIRMED', 100000, NOW(), NOW());
```

2. **Kiểm tra NiFi**:
   - Processor `ExtractBookingsRealtime` sẽ tự động chạy trong 30 giây
   - Kiểm tra queue size tăng lên
   - Kiểm tra flowfiles được tạo

3. **Verify trong Whitehouse**:
```sql
SELECT * FROM staging_booking WHERE booking_id = 'test-booking-1';
SELECT * FROM fact_booking WHERE booking_id = 'test-booking-1';
```

### 5.2. Test Update

1. **Update booking**:
```sql
UPDATE Booking 
SET status = 'COMPLETED', updatedAt = NOW() 
WHERE id = 'test-booking-1';
```

2. **Kiểm tra NiFi**:
   - Processor sẽ detect change trong 30 giây
   - Flowfile mới sẽ được tạo với data updated

3. **Verify**:
```sql
SELECT * FROM fact_booking WHERE booking_id = 'test-booking-1';
-- Status phải là 'COMPLETED'
```

## Bước 6: Monitoring Real-Time Flow

### 6.1. Processor Statistics

Click processor → Tab **Statistics**:
- **In**: Số flowfiles đã nhận
- **Out**: Số flowfiles đã gửi
- **Last Execution Time**: Thời gian chạy lần cuối
- **Average Duration**: Thời gian xử lý trung bình

### 6.2. Queue Monitoring

- **Queue Size**: Nếu tăng liên tục → Xử lý không kịp
- **Queue Count**: Số flowfiles đang chờ
- **Data Size**: Tổng dung lượng data trong queue

### 6.3. State Lag Monitoring

Tạo một processor để check state lag:

```sql
-- Query để check lag
SELECT 
  MAX(updatedAt) as latest_in_source,
  (SELECT MAX(updatedAt) FROM staging_booking) as latest_in_staging,
  TIMESTAMPDIFF(SECOND, 
    (SELECT MAX(updatedAt) FROM staging_booking),
    MAX(updatedAt)
  ) as lag_seconds
FROM Booking
WHERE status IN ('CONFIRMED', 'COMPLETED', 'CANCELLED');
```

## Bước 7: Performance Tuning

### 7.1. Tối Ưu Polling Interval

| Data Volume | Recommended Interval |
|-------------|----------------------|
| < 100 records/day | `5 min` |
| 100-1000 records/day | `1 min` |
| 1000-10000 records/day | `30 sec` |
| > 10000 records/day | `10 sec` (cẩn thận với DB load) |

### 7.2. Batch Size

- **Max Rows Per Flow File**: 
  - Nhỏ (100-500): Ít memory, nhiều flowfiles
  - Lớn (1000-5000): Nhiều memory, ít flowfiles
  - **Recommended**: `1000`

### 7.3. Connection Pool

Tăng connection pool nếu có nhiều concurrent queries:
- **Max Total Connections**: `20`
- **Max Idle Connections**: `10`
- **Min Idle Connections**: `5`

## Bước 8: Error Handling

### 8.1. Handle Database Errors

Tạo relationship cho errors:
- **failure** → `LogAttribute` (log error)
- **failure** → `PutFile` (save failed records)

### 8.2. Retry Logic

Sử dụng `RetryFlowFile` processor:
- **Max Retries**: `3`
- **Retry Delay**: `30 sec`

### 8.3. Dead Letter Queue

Lưu failed records để xử lý sau:
```
[PutSQL] ──failure──> [PutFile] (save to /failed-records/)
                      └──> [LogAttribute] (log error)
```

## Troubleshooting

### Issue: State không update

**Nguyên nhân**: Processor không chạy hoặc có lỗi
**Giải pháp**:
1. Kiểm tra processor có đang chạy không
2. Kiểm tra logs: `docker logs nifi-container | grep ExtractBookings`
3. Clear state và chạy lại

### Issue: Duplicate records

**Nguyên nhân**: State bị reset hoặc data đã tồn tại
**Giải pháp**:
- Sử dụng `ON DUPLICATE KEY UPDATE` trong SQL
- Kiểm tra state có đúng không

### Issue: High Database Load

**Nguyên nhân**: Polling quá thường xuyên
**Giải pháp**:
- Tăng polling interval (30s → 1min → 5min)
- Tối ưu query với indexes
- Giảm Max Rows Per Flow File

### Issue: Queue Full

**Nguyên nhân**: Transform chậm hơn extract
**Giải pháp**:
- Tăng concurrent tasks cho transform processors
- Tối ưu SQL queries
- Tăng connection pool

## Checklist

- [ ] Tạo indexes trên `updatedAt` columns
- [ ] Cấu hình `QueryDatabaseTable` với `Maximum-value Columns`
- [ ] Set polling interval phù hợp (30s-1min)
- [ ] Test với sample data
- [ ] Verify state management hoạt động
- [ ] Monitor queue sizes
- [ ] Setup error handling
- [ ] Tối ưu performance
- [ ] Document state backup process

## Kết Luận

Với cấu hình này, NiFi sẽ tự động:
- ✅ Phát hiện thay đổi trong database mỗi 30 giây
- ✅ Chỉ extract data mới (incremental)
- ✅ Tự động cập nhật state
- ✅ Transform và load vào whitehouse gần như real-time

**Delay tổng thể**: ~1-2 phút (30s polling + 30s-1min transform)

