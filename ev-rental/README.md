# 🚗 EV Rental Microservices – Port & Endpoint Overview

| Service               | URL để test             | Ví dụ endpoint                                    | Công dụng                        |
| --------------------- | ----------------------- | ------------------------------------------------- | -------------------------------- |
| **rental-svc**        | `http://localhost:3002` | `/health`, `/api/v1/bookings`, `/api/v1/stations` | Xử lý thuê xe, trả xe            |
| **fleet-svc**         | `http://localhost:3003` | `/health`, `/api/v1/vehicles`, `/api/v1/stations` | Quản lý xe, trạm                 |
| **admin-svc**         | `http://localhost:3001` | `/health`, `/api/v1/admin`                        | Quản trị hệ thống                |
| **adminer (DB UI)**   | `http://localhost:8080` | Giao diện Adminer                                 | Xem DB MySQL                     |
| **nginx-gateway**     | `http://localhost`      | `/rental/health`, `/fleet/health`                 | Route trung gian (Frontend dùng) |
| **mysql (DB server)** | `localhost:3307`        | (Truy cập qua Adminer hoặc MySQL Workbench)       | Lưu dữ liệu toàn hệ thống        |

---

## 🧭 Hướng dẫn nhanh

###  Kiểm tra service hoạt động
 http://localhost:3002/health   # rental-svc
 http://localhost:3003/health   # fleet-svc
 http://localhost:3001/health   # admin-svc

 ## Test thông qua gateway
## http://localhost/rental/health
## http://localhost/fleet/health

http://localhost:3003/api/v1/vehicles/veh001/status test cập nhật xe