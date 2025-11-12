# EV Rental Microservices — Hướng Dẫn

Toàn bộ API truy cập qua 1 cổng duy nhất: `http://localhost:4000` (nginx-gateway). Các service nội bộ không mở cổng 3001/3002/3003 ra ngoài.

| Service               | Base URL (qua gateway)          | Ví dụ endpoint                                                 | Công dụng        

| --------------------- | -------------------------------- | -------------------------------------------------------------- | ------------------- |
| rental-svc (gateway)  | `http://localhost:4000/rental`   | `/health`, `/api/v1/stations`, `/api/v1/vehicles`, `/api/v1/bookings` | Thuê xe, trả xe     |
| fleet-svc (gateway)   | `http://localhost:4000/fleet`    | `/health`, `/api/v1/vehicles`, `/api/v1/overview` 
http://localhost:4000/fleet/api/v1/incidents   sự cố|              | Quản lý đội xe/trạm |
| admin-svc (gateway)   | `http://localhost:4000/admin`    | `/health`, `/admin/vehicles`, `/admin/reports`                 | Quản trị hệ thống   |
| adminer (DB UI)       | `http://localhost:8080`          | Giao diện Adminer                                              | Xem DB MySQL        |
| mysql (DB server)     | `localhost:3307`                 | (kết nối qua Adminer/Workbench)                                | Lưu dữ liệu hệ thống|

Lưu ý: `admin-svc` giữ prefix `/admin/*` ở phía service. Gateway đã map riêng `/admin/health` → nội bộ `/health`, còn các đường khác `/admin/*` giữ nguyên.

---

## Chạy Dịch Vụ Và Test Tự Động

- Yêu cầu: Docker Desktop đang chạy; trống port `4000`, `8080`, `3307`.
- Dựng dịch vụ và chạy kiểm tra:
  - PowerShell: `./scripts/up.ps1`
  - Bỏ qua test (chỉ dựng): `./scripts/up.ps1 -NoTest`
- Chỉ chạy smoke test (dịch vụ đã chạy sẵn):
  - PowerShell: `./scripts/smoke-test.ps1`

Smoke test sẽ:
- Kiểm tra health qua gateway: `http://localhost:4000/admin/health`, `/rental/health`, `/fleet/health`, cộng thêm Adminer và MySQL TCP.
- Gọi nhanh API chính:
  - rental: `/rental/api/v1/stations`, `/rental/api/v1/vehicles`, `/rental/api/v1/bookings`
  - fleet: `/fleet/api/v1/vehicles`, `/fleet/api/v1/overview`
  - admin: `/admin/vehicles`, `/admin/reports`
- In tổng kết và trả mã lỗi nếu health quan trọng bị lỗi.

---

## Ví Dụ cURL Nhanh

- Health qua gateway:
  - `curl http://localhost:4000/rental/health`
  - `curl http://localhost:4000/fleet/health`
  - `curl http://localhost:4000/admin/health`
- Danh sách trạm (rental):
  - `curl http://localhost:4000/rental/api/v1/stations`
- Tạo trạm (rental):
  - `curl -X POST http://localhost:4000/rental/api/v1/stations -H "Content-Type: application/json" -d "{\"name\":\"Station 02\",\"address\":\"2 DEF St\",\"lat\":10.78,\"lng\":106.70}"`
- Lấy trạm theo ID (rental):
  - `curl http://localhost:4000/rental/api/v1/stations/<STATION_ID>`
- Danh sách xe (rental) với lọc tùy chọn:
  - `curl "http://localhost:4000/rental/api/v1/vehicles?available=true"`
  - `curl "http://localhost:4000/rental/api/v1/vehicles?stationId=<STATION_ID>"`
- Danh sách booking (rental):
  - `curl http://localhost:4000/rental/api/v1/bookings`
- Tổng quan đội xe (fleet):
  - `curl http://localhost:4000/fleet/api/v1/overview`

---

## Seed Dữ Liệu Mẫu

- Chạy seed cho rental-svc (tạo 1 trạm + vài xe):
  - `docker compose exec rental-svc sh -lc "node prisma/seed.js"`
- Kiểm tra lại trạm/xe:
  - `curl http://localhost:4000/rental/api/v1/stations`
  - `curl http://localhost:4000/rental/api/v1/vehicles`

### Mẹo lấy nhanh `<STATION_ID>`

- PowerShell:
  - `(Invoke-RestMethod -Uri http://localhost:4000/rental/api/v1/stations)[0].id`
- Bash + jq:
  - `curl -s http://localhost:4000/rental/api/v1/stations | jq -r '.[0].id'`

---

## Tạo Booking Mẫu

- Ví dụ đặt xe (thay `<VEHICLE_ID>` và thời gian phù hợp):
  - `curl -X POST http://localhost:4000/rental/api/v1/bookings -H "Content-Type: application/json" -d "{\"vehicleId\":\"<VEHICLE_ID>\",\"startTime\":\"2025-10-23T10:00:00.000Z\"}"`

- Trả xe (thay `<BOOKING_ID>`):
  - `curl -X PATCH http://localhost:4000/rental/api/v1/bookings/<BOOKING_ID>/return`

---

## Luồng End-to-End (Tạo trạm → thêm xe → đặt xe → trả xe)

1) Tạo trạm mới (rental):
   - `curl -s -X POST http://localhost:4000/rental/api/v1/stations -H "Content-Type: application/json" -d "{\"name\":\"Station Demo\",\"address\":\"123 Test St\",\"lat\":10.79,\"lng\":106.71}"`
   - Lấy `STATION_ID` (PowerShell): `(Invoke-RestMethod -Uri http://localhost:4000/rental/api/v1/stations)[-1].id`

2) Thêm xe mới (fleet) gắn vào trạm vừa tạo (thay `<STATION_ID>`):
   - `curl -s -X POST http://localhost:4000/fleet/api/v1/vehicles -H "Content-Type: application/json" -d "{\"id\":\"veh-demo-01\",\"name\":\"EV Demo\",\"stationId\":\"<STATION_ID>\",\"type\":\"scooter\",\"plate\":\"59A1-99999\",\"pricePerHour\":20000}"`

3) Kiểm tra xe và lấy `VEHICLE_ID`:
   - `curl -s http://localhost:4000/fleet/api/v1/vehicles`

4) Đặt xe (rental) với `VEHICLE_ID` (giờ hiện tại):
   - `curl -s -X POST http://localhost:4000/rental/api/v1/bookings -H "Content-Type: application/json" -d "{\"vehicleId\":\"<VEHICLE_ID>\",\"startTime\":\"$(date -u +%Y-%m-%dT%H:%M:%SZ)\",\"estDurationH\":1}"`

5) Trả xe (rental) với `BOOKING_ID` vừa tạo:
   - `curl -s -X PATCH http://localhost:4000/rental/api/v1/bookings/<BOOKING_ID>/return`

6) Kiểm tra danh sách booking:
   - `curl -s http://localhost:4000/rental/api/v1/bookings`

---

## Dữ Liệu Mẫu POST/PUT

- Tạo booking (rental):
  - Endpoint: `POST /rental/api/v1/bookings`
  - Body JSON mẫu:
    {
      "vehicleId": "<VEHICLE_ID>",
      "startTime": "2025-10-23T10:00:00.000Z",
      "estDurationH": 2
    }

- Trả xe (rental):
  - Endpoint: `PATCH /rental/api/v1/bookings/<BOOKING_ID>/return`
  - Body: không cần

- Thêm xe mới (fleet):
  - Endpoint: `POST /fleet/api/v1/vehicles`
  - Body JSON mẫu (dùng `stationId` lấy từ `/rental/api/v1/stations`):
    {
      "id": "veh001",
      "name": "EV Bike X",
      "stationId": "<STATION_ID>",
      "type": "scooter",
      "plate": "59A1-12345",
      "pricePerHour": 20000,
      "batteryLevel": 90,
      "isAvailable": true,
      "healthStatus": "OK"
    }

- Cập nhật trạng thái xe (fleet):
  - Endpoint: `PUT /fleet/api/v1/vehicles/<VEHICLE_ID>/status`
  - Body JSON mẫu (các trường tuỳ chọn):
    {
      "isAvailable": false,
      "batteryLevel": 75,
      "healthStatus": "MAINTENANCE"
    }
