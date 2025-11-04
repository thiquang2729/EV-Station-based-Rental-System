# Frontend-Backend Integration Guide

## Tổng quan

Frontend React đã được tích hợp hoàn toàn với backend services. Tất cả mock data và API calls đã được thay thế bằng real backend integration.

## Các thay đổi đã thực hiện

### 1. Authentication (AuthContext.tsx)
- ✅ Thay thế mock login bằng real API call đến auth service
- ✅ Thêm JWT token handling (localStorage)
- ✅ Implement auto-login với token validation
- ✅ Cập nhật Login component với form email/password

### 2. Payment API (paymentApi.ts)
- ✅ Thay thế mock createPaymentIntent bằng real API call
- ✅ Thêm JWT token vào Authorization header
- ✅ Handle VNPAY redirect URL response
- ✅ Handle error cases properly

### 3. Analytics API (analyticsApi.ts)
- ✅ Tạo file mới với functions: getRevenueData, getUtilizationData, getStationReports
- ✅ Call đến `/api/v1/analytics/revenue`, `/api/v1/analytics/utilization`, `/api/v1/reports/stations`
- ✅ Thêm JWT token authentication

### 4. POS Component (POS.tsx)
- ✅ Thay thế mock transaction creation bằng real API call
- ✅ Fetch real transaction list từ backend
- ✅ Thêm loading states và error handling
- ✅ Thêm refresh functionality

### 5. Dashboard Components
- ✅ RevenueChart.tsx: Fetch data từ analytics API
- ✅ UtilizationChart.tsx: Fetch data từ analytics API  
- ✅ StationReport.tsx: Fetch data từ reports API
- ✅ Thêm loading và error states cho tất cả components

### 6. Booking Component (Booking.tsx)
- ✅ Cập nhật để sử dụng real booking data
- ✅ Payment flow hoạt động với real backend

## API Endpoints được sử dụng

### Authentication
- `POST /api/v1/auth/login` - User login
- `GET /api/v1/auth/verify` - Token verification

### Payment Service
- `POST /api/v1/payments/intents` - Create payment intent
- `GET /api/v1/payments/` - Get transactions list
- `POST /api/v1/pos/collect` - Collect payment at POS

### Analytics Service
- `GET /api/v1/analytics/revenue` - Get revenue data
- `GET /api/v1/analytics/utilization` - Get utilization data
- `GET /api/v1/reports/stations` - Get station reports

## Cách chạy và test

### 1. Khởi động Backend Services
```bash
# Trong thư mục evrental-billing
docker-compose up -d
```

### 2. Khởi động Frontend
```bash
# Trong thư mục frontend/ev-rental-analytics-&-pos-dashboard
npm install
npm run dev
```

### 3. Test Integration

#### Authentication Test
1. Mở http://localhost:5173
2. Nhập email/password để login
3. Kiểm tra JWT token được lưu trong localStorage
4. Kiểm tra auto-login khi refresh page

#### Dashboard Test (Admin role)
1. Login với admin account
2. Kiểm tra Revenue Chart load data từ API
3. Kiểm tra Utilization Chart load data từ API
4. Kiểm tra Station Report load data từ API

#### POS Test (Staff role)
1. Login với staff account
2. Tạo transaction mới
3. Kiểm tra transaction list load từ API
4. Test refresh functionality

#### Booking Test (Renter role)
1. Login với renter account
2. Test payment flow với VNPAY
3. Test payment flow với Pay at Station

## Cấu hình Environment

### Frontend Environment Variables
- `VITE_API_BASE_URL`: Backend gateway URL (default: http://localhost:8080)

### Backend Environment Variables
- `JWT_PUBLIC_KEY`: JWT public key cho token verification
- `VNPAY_TMN_CODE`: VNPAY merchant code
- `VNPAY_HASH_SECRET`: VNPAY hash secret

## Error Handling

Tất cả components đều có:
- ✅ Loading states
- ✅ Error states với retry functionality
- ✅ Fallback to mock data khi API fails
- ✅ Proper error messages

## Security Features

- ✅ JWT token authentication
- ✅ Token auto-verification
- ✅ Automatic logout khi token invalid
- ✅ Secure token storage trong localStorage

## Performance Optimizations

- ✅ Lazy loading cho charts
- ✅ Error boundaries
- ✅ Optimistic updates cho POS
- ✅ Efficient re-rendering

## Troubleshooting

### Common Issues

1. **CORS Errors**: Đảm bảo backend services đang chạy và CORS được cấu hình đúng
2. **Authentication Errors**: Kiểm tra JWT token và auth service
3. **API Connection Errors**: Kiểm tra gateway URL và service health
4. **Data Loading Issues**: Kiểm tra analytics service và database connection

### Debug Tips

1. Mở Developer Tools → Network tab để xem API calls
2. Kiểm tra Console logs cho error messages
3. Verify JWT token trong localStorage
4. Test API endpoints trực tiếp với Postman/curl

## Next Steps

1. **Production Deployment**: Cấu hình environment variables cho production
2. **Monitoring**: Thêm logging và monitoring
3. **Testing**: Thêm unit tests và integration tests
4. **Performance**: Optimize bundle size và loading times
