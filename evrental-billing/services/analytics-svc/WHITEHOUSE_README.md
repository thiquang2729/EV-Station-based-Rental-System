# Whitehouse Analytics Integration

Analytics service đã được tích hợp với Whitehouse Data Warehouse để query dữ liệu từ các bảng đã được tổng hợp bởi Apache NiFi.

## Setup

### 1. Generate Prisma Client cho Whitehouse

```bash
npm run prisma:whitehouse:generate
```

Hoặc trong Docker:
```bash
docker exec evrental-billing-analytics-svc-1 npm run prisma:whitehouse:generate
```

### 2. Push Schema (nếu cần)

```bash
npm run prisma:whitehouse:push
```

## API Endpoints

Tất cả endpoints đều yêu cầu authentication (STAFF hoặc ADMIN role).

### Revenue Analytics

```
GET /api/v1/whitehouse/revenue?from=YYYY-MM-DD&to=YYYY-MM-DD&stationId=xxx&granularity=day
```

**Query Parameters:**
- `from` (required): Start date (YYYY-MM-DD)
- `to` (required): End date (YYYY-MM-DD)
- `stationId` (optional): Filter by station
- `granularity` (optional): `day`, `week`, or `month` (default: `day`)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "period": "2025-11-22",
      "revenue": 150000,
      "transactionCount": 5
    }
  ],
  "source": "whitehouse"
}
```

### Utilization Analytics

```
GET /api/v1/whitehouse/utilization?from=YYYY-MM-DD&to=YYYY-MM-DD&stationId=xxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "utilization": {
      "percentage": 75.5,
      "totalRentals": 100,
      "totalRentalHours": 1812,
      "totalAvailableHours": 2400
    }
  },
  "source": "whitehouse"
}
```

### Peak Hours Analytics

```
GET /api/v1/whitehouse/peak-hours?from=YYYY-MM-DD&to=YYYY-MM-DD&stationId=xxx
```

**Response:**
```json
{
  "success": true,
  "data": {
    "peakHours": [17, 18, 19, 8, 9],
    "details": [
      {
        "hour": 17,
        "totalBookings": 50,
        "totalRevenue": 5000000,
        "avgDurationHours": 2.5,
        "peakScore": 8.5
      }
    ]
  },
  "source": "whitehouse"
}
```

### Daily Stats

```
GET /api/v1/whitehouse/daily-stats?from=YYYY-MM-DD&to=YYYY-MM-DD&stationId=xxx
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "date": "2025-11-22",
      "stationId": "ST123",
      "stationName": "Station Central",
      "totalBookings": 25,
      "totalRevenue": 2500000,
      "totalPayments": 25,
      "completedBookings": 20,
      "cancelledBookings": 5,
      "avgBookingDurationHours": 2.5,
      "uniqueUsers": 15,
      "uniqueVehicles": 10
    }
  ],
  "source": "whitehouse"
}
```

### Station Report

```
GET /api/v1/whitehouse/reports/stations?date=YYYY-MM-DD
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "stationId": "ST123",
      "date": "2025-11-22",
      "revenue": 2500000,
      "rentals": 25,
      "utilization": 75.5,
      "peakHours": [17, 18, 19]
    }
  ],
  "source": "whitehouse"
}
```

## Database Schema

Whitehouse database sử dụng star schema với:

### Dimension Tables
- `dim_time`: Time dimension
- `dim_station`: Station dimension
- `dim_user`: User dimension
- `dim_vehicle`: Vehicle dimension

### Fact Tables
- `fact_booking`: Booking events
- `fact_payment`: Payment events
- `fact_peak_hours`: Peak hours analysis
- `agg_daily_stats`: Aggregated daily statistics

### Staging Tables (for NiFi ETL)
- `staging_booking`: Staging for bookings
- `staging_payment`: Staging for payments

## Apache NiFi Integration

NiFi sẽ:
1. Extract data từ các service databases (booking, payment, auth)
2. Transform và load vào whitehouse staging tables
3. Transform staging data vào fact và dimension tables
4. Aggregate data vào `agg_daily_stats` và `fact_peak_hours`

## Migration từ Old Analytics

Các routes cũ vẫn hoạt động:
- `/api/v1/analytics/revenue` - Query từ payment database
- `/api/v1/analytics/utilization` - Query từ payment database
- `/api/v1/reports/stations` - Query từ payment database

Routes mới từ whitehouse:
- `/api/v1/whitehouse/revenue` - Query từ whitehouse
- `/api/v1/whitehouse/utilization` - Query từ whitehouse
- `/api/v1/whitehouse/reports/stations` - Query từ whitehouse

Frontend có thể chuyển sang dùng whitehouse routes để có dữ liệu đã được tổng hợp và tối ưu hóa.

