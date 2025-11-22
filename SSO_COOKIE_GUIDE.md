# Hướng Dẫn SSO với Cookie giữa các Frontend

## 🎯 Mục tiêu
Đăng nhập một lần ở **Auth Frontend (port 8060)** thì tất cả frontend khác tự động biết:
- **Booking Frontend** (port 3004 - Docker) 
- **Billing/Analytics Frontend** (port 5173 - Vite dev)
- **Auth Frontend** (port 8060 - Docker)

---

## 🔑 Cách hoạt động

### Kiến trúc SSO với Cookie
```
┌─────────────────────────────────────────────────────────────────┐
│                        localhost                                 │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                      │
│  │ Port 8060│  │ Port 3004│  │ Port 5173│                      │
│  │   Auth   │  │ Booking  │  │ Billing  │                      │
│  │ Frontend │  │ Frontend │  │ Frontend │                      │
│  └────┬─────┘  └────┬─────┘  └────┬─────┘                      │
│       │             │             │                              │
│       └─────────────┴─────────────┘                              │
│                     │                                             │
│                     ▼                                             │
│              ┌─────────────┐                                     │
│              │   Cookie    │                                     │
│              │  Storage    │                                     │
│              │ (Shared!)   │                                     │
│              └──────┬──────┘                                     │
│                     │                                             │
│                     ▼                                             │
│         ┌────────────────────────┐                              │
│         │   API Gateway :9080    │                              │
│         └───────────┬────────────┘                              │
│                     │                                             │
│                     ▼                                             │
│         ┌────────────────────────┐                              │
│         │   Auth Service :8000   │                              │
│         └────────────────────────┘                              │
└─────────────────────────────────────────────────────────────────┘
```

### Luồng đăng nhập SSO

```
1. User mở Booking Frontend (http://localhost:3004)
   → Click "Đăng nhập"
   → Redirect: http://localhost:8060/login
   
2. User đăng nhập ở Auth Frontend (port 8060)
   → Nhập email/password
   → Submit form
   
3. Auth Frontend gọi API qua Gateway
   → POST http://localhost:9080/api/v1/auth/login
   → Auth Service xác thực
   
4. Auth Service trả về token + Set Cookie
   → Cookie: accessToken=xxx; domain=localhost; path=/
   → Cookie: refreshToken=yyy; domain=localhost; path=/
   → ✨ Cookie được share cho TẤT CẢ port trên localhost!
   
5. Redirect về Booking Frontend
   → http://localhost:3004/auth/callback
   → Booking Frontend gọi GET /api/v1/auth/me
   → Browser tự động gửi cookie
   → Nhận được user info
   
6. User mở Billing Frontend (port 5173)
   → Billing Frontend gọi GET /api/v1/auth/me
   → Browser tự động gửi cookie (cùng domain!)
   → Nhận được user info
   → ✅ User đã đăng nhập tự động!
```

---

## 📝 Các thay đổi quan trọng

### 1. Auth Service Backend
**File: `authController.js`**
```javascript
// Cookie được set với domain="localhost" để share giữa tất cả ports
const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: isProduction,
  path: "/",
  domain: "localhost", // ⭐ Quan trọng!
  sameSite: "lax",
};

// Set cả 2 tokens vào cookie
res.cookie("accessToken", accessToken, COOKIE_OPTIONS);
res.cookie("refreshToken", refreshToken, COOKIE_OPTIONS);
```

### 2. CORS Configuration
**File: `index.js`**
```javascript
const whitelist = [
  "http://localhost:5173",  // Billing/Analytics Frontend
  "http://localhost:3004",  // Booking Frontend (Docker)
  "http://localhost:8060",  // Auth Frontend (Docker)
  "http://localhost:9080",  // API Gateway
];

const corsOptions = {
  origin: (origin, callback) => {
    if (!origin || whitelist.includes(origin)) {
      callback(null, true);
    }
  },
  credentials: true, // ⭐ Quan trọng cho cookie!
};
```

### 3. Frontend - AuthContext
**Booking Frontend: `AuthContext.jsx`**
```javascript
const GATEWAY_URL = 'http://localhost:9080';
const AUTH_FRONTEND_URL = 'http://localhost:8060';

// Fetch user từ cookie
useEffect(() => {
  fetchCurrentUser();
}, []);

const fetchCurrentUser = async () => {
  const response = await fetch(`${GATEWAY_URL}/api/v1/auth/me`, {
    credentials: 'include', // ⭐ Gửi cookie
  });
  // ...
};
```

### 4. API Client
**File: `apiClient.js`**
```javascript
export async function api(path, options = {}) {
  const opts = {
    ...options,
    credentials: 'include', // ⭐ Luôn gửi cookie
  };
  
  return fetch(path, opts);
}
```

---

## 🚀 Cách sử dụng

### Test SSO

1. **Start tất cả services:**
```bash
# Terminal 1: Auth Service (Docker)
cd EV-Station-based-Rental-System
docker-compose up

# Terminal 2: API Gateway
cd apisix-docker/example
docker-compose up

# Terminal 3: Booking Frontend
cd booking-svc/ev-rental/frontend
npm run dev  # Port 5173 hoặc build Docker cho 3004

# Terminal 4: Billing Frontend
cd evrental-billing/frontend/ev-rental-analytics-pos-dashboard
npm run dev  # Port 5173
```

2. **Kiểm tra SSO:**
   - Mở `http://localhost:3004` (Booking)
   - Click "Đăng nhập" → Redirect đến `http://localhost:8060/login`
   - Đăng nhập với email/password
   - Kiểm tra Header → Có hiển thị tên user ✅
   - Mở tab mới: `http://localhost:5173` (Billing)
   - Kiểm tra Header → Tự động hiển thị tên user ✅

3. **Kiểm tra Cookie trong DevTools:**
   - Mở DevTools (F12) → Application → Cookies → `http://localhost:8060`
   - Sẽ thấy:
     - `accessToken` (HttpOnly)
     - `refreshToken` (HttpOnly)
   - Cookie này được share cho tất cả localhost ports!

---

## ⚠️ Lưu ý quan trọng

### Development
- Cookie `domain=localhost` → Share giữa tất cả ports
- `sameSite=lax` → Cho phép cookie được gửi trong redirects
- `secure=false` → Không cần HTTPS (dev)

### Production
- Nên đổi `domain` thành domain thật: `.yourdomain.com`
- Set `secure=true` → Yêu cầu HTTPS
- Set `sameSite=none` nếu cross-domain
- Cập nhật CORS whitelist với domain thật

### Troubleshooting

**Vấn đề: Cookie không được share**
- Kiểm tra domain của cookie phải là `localhost` (không có port)
- Kiểm tra `credentials: 'include'` trong tất cả fetch requests
- Kiểm tra CORS có `credentials: true`

**Vấn đề: Bị CORS error**
- Kiểm tra origin có trong whitelist
- Kiểm tra APISIX có config `allow_credential: true`
- Restart Auth Service sau khi đổi CORS config

**Vấn đề: User không tự động login**
- Kiểm tra endpoint `/api/v1/auth/me` hoạt động
- Kiểm tra cookie có được set (DevTools)
- Kiểm tra AuthContext có gọi `fetchCurrentUser()` khi mount

---

## 📚 API Endpoints

### Auth Endpoints (qua Gateway)

| Method | Endpoint | Description | Cookie Required |
|--------|----------|-------------|-----------------|
| POST | `/api/v1/auth/login` | Đăng nhập | ❌ |
| GET | `/api/v1/auth/me` | Lấy user hiện tại | ✅ |
| POST | `/api/v1/auth/logout` | Đăng xuất | ✅ |
| POST | `/api/v1/auth/refresh` | Refresh token | ✅ |

### Frontend URLs

| Service | URL | Description |
|---------|-----|-------------|
| Auth Frontend | http://localhost:8060 | Trang đăng nhập/đăng ký (Docker) |
| Booking Frontend | http://localhost:3004 | Đặt xe (Docker) |
| Billing Frontend | http://localhost:5173 | Analytics/POS (Vite dev) |
| API Gateway | http://localhost:9080 | APISIX Gateway |

---

## ✅ Checklist triển khai

- [x] Auth Service set cookie với `domain=localhost`
- [x] Auth Service có endpoint `/api/v1/auth/me`
- [x] CORS config có `credentials: true`
- [x] Tất cả frontend gọi API qua Gateway (9080)
- [x] Tất cả fetch requests có `credentials: 'include'`
- [x] AuthContext fetch user khi app mount
- [x] Login/Logout redirect đến đúng URL (8060)

---

## 🎉 Kết quả

✨ **Đăng nhập một lần ở port 8060 → Tất cả ports khác (3004, 3000, 5173) tự động biết user đã đăng nhập!**

Cookie được share giữa tất cả ports trên localhost, tạo trải nghiệm SSO (Single Sign-On) mượt mà cho người dùng.

