# Dự án: Hệ thống Cho thuê Trạm Sạc Xe Điện

## Mô tả
Hệ thống Cho thuê Trạm Sạc Xe Điện là ứng dụng dựa trên kiến trúc microservices được thiết kế để giúp người dùng quản lý trạm sạc xe điện, đặt chỗ, thanh toán và phân tích dữ liệu. Dự án này sử dụng Node.js/Express cho backend, React/Vite cho frontend, và cung cấp RESTful API để dễ dàng tích hợp với các dịch vụ khác nhau.
![alt text](image.png)

## Tính năng chính
- **Quản lý Người dùng**: Đăng ký, đăng nhập và quản lý hồ sơ người dùng với phân quyền theo vai trò (RENTER, STAFF, ADMIN)
- **Xác minh Giấy tờ**: Tải lên và xác minh giấy tờ người dùng (CCCD, GPLX) để xác thực tại chỗ
- **Quản lý Trạm & Đặt chỗ**: Quản lý trạm sạc, slot và xử lý đặt chỗ
- **Thanh toán POS**: Xử lý thanh toán tiền mặt tại quầy với lịch sử giao dịch
- **Dashboard Phân tích**: Dashboard thời gian thực với báo cáo doanh thu, hiệu suất trạm và phân tích giờ cao điểm
- **Kiến trúc Event-Driven**: Giao tiếp bất đồng bộ giữa các services sử dụng RabbitMQ
- **Tích hợp Data Warehouse**: ETL pipeline với Apache NiFi tải dữ liệu vào Whitehouse DW để phân tích nâng cao
- **Single Sign-On (SSO)**: Xác thực chung trên nhiều frontend với JWT cookies
- **API Gateway**: Định tuyến và xác thực tập trung với Apache APISIX

## Công nghệ sử dụng
**Backend**: Node.js 18+, Express.js, JWT, bcrypt  
**Database**: MySQL 8.0  
**Message Broker**: RabbitMQ  
**ETL**: Apache NiFi  
**API Gateway**: Apache APISIX  
**Frontend**: React 18, Vite, Chakra UI, Redux Toolkit  
**DevOps**: Docker, Docker Compose, Prometheus  

## Bắt đầu

### Yêu cầu
- Docker Engine 24.0+
- Docker Compose 2.20+
- Git
- 16GB RAM (khuyến nghị 32GB cho NiFi)

### Clone Repository
```bash
git clone https://github.com/your-org/EV-Station-based-Rental-System.git
cd EV-Station-based-Rental-System
```

### Cài đặt Services
```bash
# Tạo shared network
docker network create ev-rental-network

# Khởi động RabbitMQ
cd rabbitmq && docker-compose up -d

# Khởi động Auth Service (port 8003, 8060)
cd ../EV-Station-based-Rental-System/EV-Station-based-Rental-System
docker-compose up -d

# Khởi động Booking Service (ports 8080, 8081, 8084, 3004)
cd ../../booking-svc/ev-rental && docker-compose up -d

# Khởi động Payment & Analytics (ports 8082, 8083, 5173)
cd ../../evrental-billing && docker-compose up -d

# Khởi động API Gateway (port 9080)
cd ../apisix-docker/example && docker-compose up -d

# Khởi động NiFi & Whitehouse DW (port 8443)
cd ../../nifi && docker-compose up -d
```

### Truy cập Ứng dụng
- **Auth Frontend**: http://localhost:8060
- **Booking Frontend**: http://localhost:3004
- **Analytics Dashboard**: http://localhost:5173
- **API Gateway**: http://localhost:9080
- **RabbitMQ Management**: http://localhost:15672 (guest/guest)
- **NiFi UI**: https://localhost:8443/nifi (admin/admin123456)

### Kiểm tra Services
```bash
curl http://localhost:8003/api/v1/health  # Auth Service
curl http://localhost:8081/api/v1/health  # Rental Service
curl http://localhost:8082/api/v1/health  # Payment Service
curl http://localhost:8083/api/v1/health  # Analytics Service
```

## Tài liệu API
- **Auth Service**: 23 endpoints (xác thực, quản lý user, xác minh giấy tờ)
- **Rental Service**: Quản lý trạm, slot, đặt chỗ
- **Payment Service**: 5 endpoints (thanh toán POS, lịch sử thanh toán)
- **Analytics Service**: 7 endpoints (dashboard, báo cáo, truy vấn Whitehouse)

Xem tài liệu API chi tiết:
- [Auth API Table](auth-api-table.md)
- [Payment & Analytics API Table](payment-analytics-api-table.md)

## Kiến trúc
- **Microservices**: 4 services độc lập (Auth, Booking, Payment, Analytics)
- **Event-Driven**: RabbitMQ với 2 exchanges, 5 queues
- **Data Warehouse**: Star schema với fact và dimension tables
- **Gateway**: Apache APISIX cho routing tập trung và JWT validation

## Hướng phát triển
- **Tích hợp VNPay**: Cổng thanh toán online cho nạp ví và thanh toán booking tự động
- **Mobile App**: Phát triển ứng dụng React Native/Flutter cho iOS và Android
- **Machine Learning**: Phân tích dự đoán giờ cao điểm, gợi ý trạm và phát hiện gian lận
- **Redis Caching**: Cải thiện hiệu suất Analytics Service với caching layer
- **Kubernetes Deployment**: Chuyển từ Docker Compose sang Kubernetes để mở rộng tốt hơn
- **CI/CD Pipeline**: Tự động testing và deployment với GitHub Actions
- **Hỗ trợ Đa ngôn ngữ**: Thêm tùy chọn Tiếng Việt và English

## Tài liệu
- [Tài liệu Thiết kế Auth Service](auth.txt)
- [Tài liệu Thiết kế Billing & Analytics](billing.txt)
- [Tài liệu RabbitMQ & NiFi](rabbitmq-nifi.txt)
- [Kết luận & Hướng phát triển](conclusion-future-work.txt)
- [ERD Diagrams](payment-service-erd-mermaid.txt), [Sequence Diagrams](payment-sequence-diagram-mermaid.txt)
- [Class Diagrams](payment-class-diagram-mermaid.txt), [Use Case Diagrams](payment-usecase-diagram-mermaid.txt)

## Giấy phép
Dự án này được cấp phép theo giấy phép MIT License.

## Đóng góp
EV Rental Development Team

---

**Cập nhật lần cuối**: 2024-11-23  
**Phiên bản**: 1.0
