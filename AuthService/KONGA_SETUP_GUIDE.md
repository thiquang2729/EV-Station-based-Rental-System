# Konga GUI Setup Guide

## 🎉 Konga GUI đã sẵn sàng!

### Truy cập Konga GUI:
- **URL**: http://localhost:1337
- **Port**: 1337

## 📋 Hướng dẫn thiết lập Konga

### Bước 1: Tạo tài khoản Konga
1. Mở trình duyệt và truy cập: http://localhost:1337
2. Điền thông tin đăng ký:
   - **Username**: admin (hoặc tên bạn muốn)
   - **Email**: admin@example.com
   - **Password**: chọn mật khẩu mạnh
   - **Confirm Password**: nhập lại mật khẩu
3. Click **"Sign up"**

### Bước 2: Tạo kết nối Kong Gateway
1. Sau khi đăng nhập, click **"Create new connection"**
2. Điền thông tin kết nối:
   - **Name**: Kong Gateway
   - **Kong Admin URL**: http://kong:8001
   - **Kong Admin API Username**: (để trống)
   - **Kong Admin API Password**: (để trống)
3. Click **"Create Connection"**

### Bước 3: Quản lý Kong Gateway qua GUI

#### 🏢 Services Management
- **Tạo Service mới**:
  - Click "Services" → "New Service"
  - Name: auth-service
  - URL: http://auth-backend:8000
  - Click "Submit"

#### 🛣️ Routes Management
- **Tạo Route cho Service**:
  - Click "Routes" → "New Route"
  - Service: chọn auth-service
  - Name: auth-routes
  - Paths: /api/v1/auth, /api/v1/users, /api/v1/documents, /api/v1/upload, /api/v1/complaints
  - Strip Path: false
  - Click "Submit"

#### 🔌 Plugins Management
- **Thêm CORS Plugin**:
  - Click "Plugins" → "New Plugin"
  - Name: cors
  - Config:
    - Origins: *
    - Methods: GET, POST, PUT, PATCH, DELETE, OPTIONS
    - Headers: Accept, Authorization, Content-Type, X-Requested-With, Origin
    - Exposed Headers: Authorization, Content-Type
    - Credentials: true
    - Max Age: 3600
  - Click "Submit"

- **Thêm Rate Limiting Plugin**:
  - Click "Plugins" → "New Plugin"
  - Name: rate-limiting
  - Config:
    - Minute: 1000
    - Hour: 10000
    - Policy: local
  - Click "Submit"

#### 👥 Consumers Management
- **Tạo Consumer**:
  - Click "Consumers" → "New Consumer"
  - Username: auth-service
  - Custom ID: auth-service
  - Click "Submit"

#### 🔐 JWT Management
- **Tạo JWT Secret cho Consumer**:
  - Click vào Consumer "auth-service"
  - Click "JWT" tab
  - Click "New JWT"
  - Key: auth-service
  - Secret: your_jwt_secret_here
  - Algorithm: HS256
  - Click "Submit"

## 🚀 Các tính năng chính của Konga

### 1. **Dashboard**
- Tổng quan về Kong Gateway
- Thống kê services, routes, plugins
- Health check status

### 2. **Services**
- Quản lý backend services
- Thêm/sửa/xóa services
- Health check configuration

### 3. **Routes**
- Cấu hình API routing
- Path matching rules
- Method restrictions
- Host/header matching

### 4. **Plugins**
- Thêm/sửa/xóa plugins
- CORS, Rate Limiting, Authentication
- Request/Response transformation
- Logging và monitoring

### 5. **Consumers**
- Quản lý API consumers
- JWT, API Key authentication
- ACL (Access Control Lists)

### 6. **Upstreams**
- Load balancing configuration
- Health checks
- Circuit breakers

### 7. **Certificates**
- SSL/TLS certificates
- SNI configuration

## 🔧 Troubleshooting

### Lỗi kết nối Kong Admin API
- Kiểm tra Kong đang chạy: `docker-compose ps kong`
- Kiểm tra Kong Admin API: `curl http://localhost:8001/status`
- Đảm bảo URL: http://kong:8001 (trong Docker network)

### Lỗi CORS
- Thêm CORS plugin với config đúng
- Kiểm tra Origins: * hoặc domain cụ thể
- Kiểm tra Methods: GET, POST, PUT, DELETE, OPTIONS

### Lỗi 415 Unsupported Media Type
- Đã được sửa trong cấu hình Kong
- Kiểm tra Content-Type headers
- Sử dụng request-transformer plugin nếu cần

## 📚 Tài liệu tham khảo

- [Kong Admin API Documentation](https://docs.konghq.com/gateway/latest/admin-api/)
- [Konga Documentation](https://github.com/pantsel/konga)
- [Kong Plugin Development](https://docs.konghq.com/gateway/latest/plugin-development/)

## 🎯 Next Steps

1. **Cấu hình Services và Routes** cho tất cả backend services
2. **Thêm Authentication plugins** (JWT, API Key)
3. **Cấu hình Rate Limiting** cho production
4. **Thêm Monitoring và Logging** plugins
5. **Test API endpoints** qua Kong Gateway

---

**Chúc bạn sử dụng Konga GUI thành công! 🎉**
