# Auth Service - EV Station Rental System

Auth Service là microservice quản lý xác thực, người dùng và các chức năng liên quan trong hệ thống thuê xe điện.

## 🏗️ Kiến trúc

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Frontend UI   │    │   Auth Service   │    │   MySQL DB      │
│   React/Vite    │◄──►│   Node.js/Express│◄──►│   Database      │
│   Port: 5173    │    │   Port: 8000     │    │   Port: 3306    │
└─────────────────┘    └─────────────────┘    └─────────────────┘
```

## 📋 Yêu cầu hệ thống

- Node.js >= 16.x
- MySQL >= 8.0
- Docker & Docker Compose (optional)
- Ports: 8000 (backend), 5173 (frontend)

## 🚀 Cài đặt và chạy

### Backend

```bash
cd backend
npm install
npm start
```

### Frontend

```bash
cd frontend/auth-ui
npm install
npm run dev
```

### Docker (Development)

```bash
# Backend
docker build -f Dockerfile.dev -t auth-service-dev .
docker run -p 8000:8000 auth-service-dev

# Frontend
cd frontend/auth-ui
docker build -t auth-ui .
docker run -p 5173:80 auth-ui
```

## 🌐 Base URLs

- **Backend API**: `http://localhost:8000`
- **Frontend UI**: `http://localhost:5173`
- **Health Check**: `http://localhost:8000/health`

## 📚 API Endpoints

### 🔐 Authentication (`/api/v1/auth`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/register` | ❌ | Đăng ký tài khoản mới |
| `POST` | `/login` | ❌ | Đăng nhập |
| `POST` | `/logout` | ❌ | Đăng xuất |
| `POST` | `/refresh` | ❌ | Làm mới token |
| `GET` | `/introspect` | ✅ | Kiểm tra token (cho API Gateway) |

#### Request/Response Examples

**Register User**
```bash
POST /api/v1/auth/register
Content-Type: application/json

{
  "username": "john_doe",
  "email": "john@example.com",
  "password": "securePassword123",
  "fullName": "John Doe",
  "phoneNumber": "+84123456789"
}
```

**Login**
```bash
POST /api/v1/auth/login
Content-Type: application/json

{
  "email": "john@example.com",
  "password": "securePassword123"
}
```

**Response**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": 1,
      "username": "john_doe",
      "email": "john@example.com",
      "role": "user"
    },
    "accessToken": "eyJhbGciOiJIUzI1NiIs...",
    "refreshToken": "eyJhbGciOiJIUzI1NiIs..."
  }
}
```

### 👥 User Management (`/api/v1/users`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/` | ✅ | Staff/Admin | Lấy danh sách tất cả users |
| `GET` | `/stats` | ✅ | Staff/Admin | Thống kê users |
| `GET` | `/registration-stats` | ✅ | Staff/Admin | Thống kê đăng ký theo ngày |
| `GET` | `/:id` | ✅ | Staff/Admin | Lấy thông tin user theo ID |
| `PUT` | `/:id` | ✅ | Admin | Cập nhật thông tin user |
| `PUT` | `/profile/me` | ✅ | User | Cập nhật profile của chính mình |
| `DELETE` | `/:id` | ✅ | User/Admin | Xóa user |
| `POST` | `/:id/verify-onsite` | ✅ | Staff/Admin | Xác thực user tại chỗ |
| `GET` | `/:id/verification-logs` | ✅ | Staff/Admin | Lấy lịch sử xác thực |

#### Request/Response Examples

**Get All Users**
```bash
GET /api/v1/users
Authorization: Bearer <access_token>
```

**Update User Profile**
```bash
PUT /api/v1/users/profile/me
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "fullName": "John Smith",
  "phoneNumber": "+84987654321",
  "address": "123 Main Street, Ho Chi Minh City"
}
```

**Verify User Onsite**
```bash
POST /api/v1/users/123/verify-onsite
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "verificationMethod": "id_card",
  "notes": "Verified with national ID"
}
```

### 📄 Document Management (`/api/v1/documents`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `GET` | `/pending` | ✅ | Admin | Lấy danh sách documents chờ duyệt |
| `GET` | `/stats` | ✅ | Admin | Thống kê documents |
| `GET` | `/user/:userId` | ✅ | User | Lấy documents của user |
| `GET` | `/:id` | ✅ | User | Lấy document theo ID |
| `POST` | `/` | ✅ | User | Tạo document mới |
| `PATCH` | `/:id/status` | ✅ | Admin | Cập nhật trạng thái document |
| `DELETE` | `/:id` | ✅ | User/Admin | Xóa document |

#### Request/Response Examples

**Create Document**
```bash
POST /api/v1/documents
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "documentType": "driver_license",
  "description": "Driver's License",
  "fileUrl": "https://storage.example.com/documents/license.pdf"
}
```

**Update Document Status**
```bash
PATCH /api/v1/documents/456/status
Authorization: Bearer <admin_token>
Content-Type: application/json

{
  "status": "approved",
  "adminNotes": "Document verified successfully"
}
```

### 📝 Complaint Management (`/api/v1/complaints`)

| Method | Endpoint | Auth Required | Role Required | Description |
|--------|----------|---------------|---------------|-------------|
| `POST` | `/` | ✅ | User | Tạo complaint mới |
| `GET` | `/stats` | ✅ | Staff/Admin | Thống kê complaints |
| `GET` | `/renter/:renterId` | ✅ | User | Lấy complaints của renter |
| `GET` | `/` | ✅ | Staff/Admin | Lấy tất cả complaints |
| `GET` | `/:id` | ✅ | Staff/Admin | Lấy complaint theo ID |
| `PUT` | `/:id` | ✅ | Staff/Admin | Cập nhật complaint |
| `DELETE` | `/:id` | ✅ | Admin | Xóa complaint |

#### Request/Response Examples

**Create Complaint**
```bash
POST /api/v1/complaints
Authorization: Bearer <access_token>
Content-Type: application/json

{
  "title": "Vehicle not working properly",
  "description": "The electric vehicle I rented has battery issues",
  "category": "technical",
  "priority": "medium",
  "renterId": 123
}
```

**Update Complaint**
```bash
PUT /api/v1/complaints/789
Authorization: Bearer <staff_token>
Content-Type: application/json

{
  "status": "in_progress",
  "assignedTo": "staff_member_1",
  "resolution": "Technician dispatched to check vehicle"
}
```

### 📤 File Upload (`/api/v1/upload`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `POST` | `/document` | ✅ | Upload document file |

#### Request/Response Examples

**Upload Document**
```bash
POST /api/v1/upload/document
Authorization: Bearer <access_token>
Content-Type: multipart/form-data

file: <file_data>
```

**Response**
```json
{
  "success": true,
  "message": "File uploaded successfully",
  "data": {
    "fileUrl": "https://storage.example.com/documents/abc123.pdf",
    "fileName": "license.pdf",
    "fileSize": 1024000,
    "mimeType": "application/pdf"
  }
}
```

### 🏢 Station Proxy (`/api/v1/stations`)

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/` | ❌ | Proxy đến station service |

#### Request/Response Examples

**Get Stations**
```bash
GET /api/v1/stations?location=ho_chi_minh&type=charging
```

**Response**
```json
{
  "data": [
    {
      "id": 1,
      "name": "Station Central",
      "location": "District 1, HCMC",
      "type": "charging",
      "status": "active",
      "coordinates": {
        "lat": 10.7769,
        "lng": 106.7009
      }
    }
  ],
  "source": "upstream_service"
}
```

### 🏥 Health Check

| Method | Endpoint | Auth Required | Description |
|--------|----------|---------------|-------------|
| `GET` | `/health` | ❌ | Kiểm tra sức khỏe service |

#### Response Example

```json
{
  "status": "ok",
  "service": "auth-service",
  "uptime": 3600.5,
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

## 🔒 Authentication & Authorization

### Token Types

- **Access Token**: JWT token có thời hạn ngắn (15 phút)
- **Refresh Token**: Token để làm mới access token (7 ngày)

### User Roles

- **user**: Người dùng thông thường
- **staff**: Nhân viên hệ thống
- **admin**: Quản trị viên

### Authorization Levels

- **verifyToken**: Yêu cầu token hợp lệ
- **verifyTokenAndStaff**: Yêu cầu role staff hoặc admin
- **verifyTokenAndAdmin**: Yêu cầu role admin
- **verifyTokenAndUserAuthorization**: User có thể truy cập dữ liệu của chính mình hoặc admin

## 🔧 Environment Variables

### Backend (.env)

```env
# Server
PORT=8000
NODE_ENV=development

# Database
DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_password
DB_NAME=auth_service

# JWT
JWT_SECRET=your_jwt_secret
JWT_REFRESH_SECRET=your_refresh_secret
JWT_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# CORS
CLIENT_URL=http://localhost:5173,http://127.0.0.1:5173

# AWS S3 (for file uploads)
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=ap-southeast-1
AWS_S3_BUCKET=your_bucket_name

# Station Service
STATION_PROXY_TARGETS=http://station-service:3002/api/v1/stations
STATION_FALLBACK_URL=http://localhost:3002/api/v1/stations
STATION_SAMPLE_FALLBACK=true
```

### Frontend (.env)

```env
VITE_API_BASE_URL=http://localhost:8000/api/v1
VITE_APP_NAME=EV Rental Auth Service
```

## 🛠️ Development Commands

### Backend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Start production server
npm start

# Run tests
npm test

# Lint code
npm run lint
```

### Frontend

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

## 🐛 Troubleshooting

### Common Issues

1. **Database Connection Error**
   ```bash
   # Check MySQL service
   sudo systemctl status mysql
   
   # Check connection
   mysql -u root -p -h localhost -P 3306
   ```

2. **CORS Issues**
   - Đảm bảo `CLIENT_URL` trong .env bao gồm frontend URL
   - Kiểm tra origin trong browser developer tools

3. **JWT Token Issues**
   ```bash
   # Check token expiration
   jwt.io
   
   # Verify secret key
   echo $JWT_SECRET
   ```

4. **File Upload Issues**
   - Kiểm tra AWS credentials
   - Verify S3 bucket permissions
   - Check file size limits

### Logs

```bash
# Backend logs
docker logs auth-service-backend

# Frontend logs
docker logs auth-service-frontend

# Database logs
docker logs mysql-container
```

## 📊 API Testing

### Using curl

```bash
# Health check
curl http://localhost:8000/health

# Register user
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{"username":"test","email":"test@example.com","password":"password123","fullName":"Test User"}'

# Login
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"password123"}'
```

### Using Postman

Import collection từ file `EV-Rental.postman_collection.json` trong thư mục `docs/`.

## 📚 Database Schema

### Users Table
- `id`, `username`, `email`, `password_hash`
- `full_name`, `phone_number`, `address`
- `role`, `status`, `created_at`, `updated_at`

### User Documents Table
- `id`, `user_id`, `document_type`, `file_url`
- `status`, `admin_notes`, `created_at`, `updated_at`

### Complaints Table
- `id`, `renter_id`, `title`, `description`
- `category`, `priority`, `status`, `assigned_to`
- `resolution`, `created_at`, `updated_at`

## 🤝 Contributing

1. Fork the repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'Add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Open Pull Request

## 📄 License

This project is licensed under the MIT License - see the LICENSE file for details.

---

**Lưu ý**: Đây là tài liệu cho development environment. Để deploy production, hãy tham khảo deployment guide riêng.
