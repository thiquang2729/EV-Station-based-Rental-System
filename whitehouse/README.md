# Whitehouse Data Warehouse

Database tổng hợp dữ liệu từ các service cho Apache NiFi ETL.

## 🏗️ Kiến trúc

```
┌─────────────────┐     ┌─────────────────┐     ┌─────────────────┐
│  booking-mysql  │     │  billing-mysql   │     │   auth-mysql    │
│   (evrental)    │     │ (evrental +     │     │    (xdhdt)      │
│                 │     │  analytics)     │     │                 │
└────────┬────────┘     └────────┬────────┘     └────────┬────────┘
         │                       │                       │
         └───────────────────────┼───────────────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │   Apache NiFi (ETL)    │
                    └────────────┬────────────┘
                                 │
                    ┌────────────▼────────────┐
                    │  whitehouse-mysql       │
                    │   (Data Warehouse)     │
                    └────────────────────────┘
```

## 📊 Database Schema

### Dimension Tables (Bảng chiều)
- `dim_time`: Bảng thời gian (date, year, month, quarter, week...)
- `dim_station`: Thông tin trạm
- `dim_user`: Thông tin người dùng
- `dim_vehicle`: Thông tin xe

### Fact Tables (Bảng sự kiện)
- `fact_booking`: Sự kiện đặt xe
- `fact_payment`: Sự kiện thanh toán
- `agg_daily_stats`: Thống kê tổng hợp theo ngày
- `fact_peak_hours`: **Phân tích giờ cao điểm** ⭐

### Staging Tables (Bảng tạm cho ETL)
- `staging_booking`: Staging cho bookings
- `staging_payment`: Staging cho payments

### Views
- `v_daily_revenue`: View tổng hợp revenue theo ngày
- `v_vehicle_utilization`: View thống kê sử dụng xe
- `v_peak_hours_analysis`: **Phân tích giờ cao điểm theo trạm/loại xe** ⭐
- `v_top_peak_hours`: **Top giờ cao điểm** ⭐
- `v_vehicle_utilization_by_hour`: **Sử dụng xe theo giờ** ⭐

## 🚀 Setup

### 1. Start Whitehouse Database

```bash
cd whitehouse
docker compose up -d
```

### 2. Kiểm tra database

```bash
# Kết nối vào database
docker exec -it whitehouse-mysql mysql -unifi -pnifi123 whitehouse

# Xem tables
SHOW TABLES;

# Xem dữ liệu dim_time
SELECT * FROM dim_time LIMIT 10;
```

## 📈 Vehicle Utilization & Peak Hours Analysis

### Xem Vehicle Utilization
```sql
SELECT * FROM v_vehicle_utilization 
ORDER BY utilization_percentage DESC 
LIMIT 20;
```

### Xem Top Giờ Cao Điểm
```sql
SELECT 
    hour_of_day,
    CASE 
        WHEN hour_of_day < 12 THEN CONCAT(hour_of_day, ':00 AM')
        WHEN hour_of_day = 12 THEN '12:00 PM'
        ELSE CONCAT(hour_of_day - 12, ':00 PM')
    END as time_label,
    total_bookings,
    total_revenue,
    ROUND(avg_peak_score, 2) as peak_score
FROM v_top_peak_hours
ORDER BY peak_rank
LIMIT 10;
```

### Xem Peak Hours theo Trạm
```sql
SELECT 
    station_name,
    hour_of_day,
    total_bookings,
    total_revenue,
    ROUND(avg_peak_score, 2) as peak_score
FROM v_peak_hours_analysis
WHERE station_id IS NOT NULL
ORDER BY station_name, avg_peak_score DESC;
```

### Xem Vehicle Utilization theo Giờ
```sql
SELECT 
    hour_of_day,
    vehicle_name,
    plate,
    type,
    station_name,
    bookings_count,
    utilization_hours
FROM v_vehicle_utilization_by_hour
WHERE hour_of_day BETWEEN 6 AND 22
ORDER BY hour_of_day, bookings_count DESC;
```

### Heatmap Data (Giờ vs Ngày trong tuần)
```sql
SELECT 
    dt.day_of_week,
    HOUR(fb.start_time) as hour_of_day,
    COUNT(fb.booking_id) as booking_count,
    SUM(fb.price_final) as revenue
FROM fact_booking fb
JOIN dim_time dt ON DATE(fb.start_time) = dt.date
WHERE fb.status = 'CONFIRMED'
    AND fb.start_time >= DATE_SUB(CURDATE(), INTERVAL 30 DAY)
GROUP BY dt.day_of_week, HOUR(fb.start_time)
ORDER BY dt.day_of_week, hour_of_day;
```

## 🔌 Connection Strings cho NiFi

### Whitehouse Database
```
JDBC URL: jdbc:mysql://whitehouse-mysql:3306/whitehouse
Username: nifi
Password: nifi123
Driver: com.mysql.cj.jdbc.Driver
```

### Source Databases (để NiFi đọc dữ liệu)

#### Booking Database
```
JDBC URL: jdbc:mysql://booking-mysql:3306/evrental
Username: evuser
Password: evpass
```

#### Billing Database
```
JDBC URL: jdbc:mysql://billing-mysql:3306/evrental
Username: root
Password: root
```

#### Analytics Database
```
JDBC URL: jdbc:mysql://billing-mysql:3306/evrental_analytics
Username: root
Password: root
```

#### Auth Database
```
JDBC URL: jdbc:mysql://auth-mysql:3306/xdhdt
Username: root
Password: 123456
```

## 📝 NiFi Flow Example

### 1. Extract từ Booking Database
```
QueryDatabaseTable (booking-mysql)
  → ConvertRecord (JSON)
  → PutDatabaseRecord (whitehouse.staging_booking)
```

### 2. Transform & Load
```
GetDatabaseRecord (staging_booking)
  → UpdateRecord (map to fact_booking format)
  → LookupRecord (dim_time, dim_user, dim_station, dim_vehicle)
  → PutDatabaseRecord (fact_booking)
```

### 3. Aggregate Peak Hours
```
ExecuteSQL (aggregate peak hours - query #11 trong nifi-sample-queries.sql)
  → PutDatabaseRecord (fact_peak_hours)
```

### 4. Vehicle Utilization Analysis
```
ExecuteSQL (vehicle utilization by hour)
  → UpdateAttribute (add metadata)
  → PutDatabaseRecord (hoặc output to JSON cho reporting)
```

## 🔍 Sample Queries

Xem file `peak-hours-analysis.sql` để có đầy đủ các queries phân tích giờ cao điểm.

## 📦 Ports

- **MySQL**: `3310` (host) → `3306` (container)

## 🔐 Credentials

- **Root**: `root` / `whitehouse123`
- **NiFi User**: `nifi` / `nifi123`

## 📚 Files

- `init-db.sql`: Schema và initial data
- `nifi-sample-queries.sql`: Queries cho NiFi ETL
- `peak-hours-analysis.sql`: **Queries phân tích giờ cao điểm** ⭐

## 📚 Tham khảo

- [Apache NiFi Documentation](https://nifi.apache.org/docs.html)
- [MySQL Data Warehouse Best Practices](https://dev.mysql.com/doc/refman/8.0/en/data-warehousing.html)
