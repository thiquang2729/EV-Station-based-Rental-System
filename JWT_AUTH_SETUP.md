# JWT Authentication Setup cho APISIX

## ✅ Đã Setup:

### 1. Consumer JWT
- **Username**: `ev-rental-jwt-user`
- **Key**: `ev-rental-jwt-key`
- **Algorithm**: `HS256`
- **Expiration**: 3600 seconds (1 hour)

### 2. Plugin Config
- **ID**: `jwt-auth-verify`
- **Cookie support**: `accessToken`
- **Header support**: `Authorization`

### 3. Protected Routes
- `/api/v1/users*` - All methods
- `/api/v1/stations` - POST, PUT, DELETE, PATCH
- `/api/v1/complaints*` - All methods

### 4. Public Routes
- `/api/v1/stations` - GET (no auth required)

---

## 🔧 CẦN ĐIỀN SECRET KEY:

Bạn cần update Consumer với **JWT secret key từ Auth Service**:

### Bước 1: Lấy JWT secret key từ Auth Service

Kiểm tra file `.env` của Auth Service:
```bash
# File: EV-Station-based-Rental-System/AuthService/backend/.env
JWT_ACCESS_KEY=your_secret_key_here
```

### Bước 2: Update Consumer với secret key

```bash
curl -X PATCH http://127.0.0.1:9180/apisix/admin/consumers/ev-rental-jwt-user \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" \
  -H "Content-Type: application/json" \
  -d '{
    "plugins": {
      "jwt-auth": {
        "key": "ev-rental-jwt-key",
        "secret": "PASTE_YOUR_JWT_ACCESS_KEY_HERE",
        "algorithm": "HS256",
        "exp": 3600
      }
    }
  }'
```

**LƯU Ý:** 
- Secret phải GIỐNG CHÍNH XÁC với `JWT_ACCESS_KEY` trong Auth Service
- Algorithm phải là `HS256` (hoặc theo config của Auth Service)

---

## 📝 PowerShell Commands:

### Lấy secret từ .env file:
```powershell
Get-Content "EV-Station-based-Rental-System\AuthService\backend\.env" | Select-String "JWT_ACCESS_KEY"
```

### Update consumer (PowerShell):
```powershell
$jwtSecret = "PASTE_YOUR_SECRET_HERE"

$body = @{
  plugins = @{
    "jwt-auth" = @{
      key = "ev-rental-jwt-key"
      secret = $jwtSecret
      algorithm = "HS256"
      exp = 3600
    }
  }
} | ConvertTo-Json -Depth 10

curl.exe -X PATCH http://127.0.0.1:9180/apisix/admin/consumers/ev-rental-jwt-user `
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1" `
  -H "Content-Type: application/json" `
  -d $body
```

---

## ✅ Verify Setup:

### Kiểm tra Consumer config:
```bash
curl http://127.0.0.1:9180/apisix/admin/consumers/ev-rental-jwt-user \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1"
```

### Test với token:
```bash
# Lấy token từ login
curl -X POST http://localhost:9080/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@example.com", "password": "password"}'

# Test protected endpoint với Bearer token
curl http://localhost:9080/api/v1/users \
  -H "Authorization: Bearer YOUR_TOKEN_HERE"

# Test với Cookie
curl http://localhost:9080/api/v1/users \
  -H "Cookie: accessToken=YOUR_TOKEN_HERE"
```

---

## 🔍 Troubleshooting:

### Lỗi 401 Unauthorized:
1. **Kiểm tra secret key**: Phải giống chính xác với Auth Service
2. **Kiểm tra algorithm**: Phải match (HS256, HS512, RS256, etc.)
3. **Kiểm tra token expiration**: Token có thể đã hết hạn
4. **Kiểm tra token format**: Phải là JWT hợp lệ

### Debug APISIX logs:
```bash
docker logs compose-apisix-1 --tail 100 -f
```

### Xem Consumer hiện tại:
```bash
curl http://127.0.0.1:9180/apisix/admin/consumers \
  -H "X-API-KEY: edd1c9f034335f136f87ad84b625c8f1"
```

---

## 📊 Cách JWT Auth hoạt động:

```
1. User login → Auth Service trả về JWT token
   ↓
2. Frontend lưu token vào:
   - Cookie: accessToken=xxx
   - Header: Authorization: Bearer xxx
   ↓
3. Request đến APISIX
   → jwt-auth plugin extract token từ Cookie hoặc Header
   ↓
4. APISIX verify token với secret key
   → Decode JWT payload
   → Kiểm tra signature
   → Kiểm tra expiration
   ↓
5. Nếu valid:
   → Set X-Consumer-Username header
   → Forward request đến upstream
   
6. Nếu invalid:
   → Return 401 Unauthorized
```

---

## 🎯 Next Steps:

1. ✅ Điền JWT secret key từ Auth Service
2. ✅ Test với token thật
3. ✅ Verify tất cả routes hoạt động
4. ✅ Update Auth Service Frontend để không cần gửi token trong header (APISIX tự động extract từ cookie)


