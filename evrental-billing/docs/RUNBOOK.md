# EV‑Rental Billing — Runbook

Tài liệu vận hành nhanh cho payment-svc và analytics-svc.

## 1) Rotate JWT Public Key (RS256)
1. Tạo cặp khóa mới (offline, bảo mật).
   - Private key (auth-svc giữ), Public key (chia sẻ read-only).
2. Cập nhật biến môi trường `JWT_PUBLIC_KEY` cho:
   - `payment-svc`, `analytics-svc`, gateway (nếu verify).
   - Trong Docker/Compose: set qua env/secret; không commit khóa.
3. Triển khai rolling (không downtime):
   - B1: Auth-svc có thể dual-sign một thời gian (nếu hỗ trợ) hoặc chọn thời điểm T chuyển hẳn sang khóa mới.
   - B2: Roll `payment-svc`, `analytics-svc` với public key mới (trước thời điểm T nếu dual-sign).
   - B3: Giám sát 5–10 phút, xác nhận request verify OK.
4. Rollback: đổi lại env `JWT_PUBLIC_KEY` cũ và redeploy.

Lưu ý: Không log payload JWT; chỉ log `sub`, `role`, `stationIds` khi cần debug.

## 2) Đổi domain gateway → cập nhật VNPAY URLs
Khi domain/cổng gateway thay đổi, cập nhật env của `payment-svc`:
- `VNPAY_RETURN_URL=https://<new-domain>/api/v1/webhooks/vnpay/return`
- `VNPAY_IPN_URL=https://<new-domain>/api/v1/webhooks/vnpay/ipn`
- `VNPAY_PAY_URL` giữ nguyên (URL sandbox/prod của VNPAY).

Quy trình:
1. Sửa env trong hệ thống deploy (Compose/K8s/Secrets).
2. Redeploy `payment-svc`.
3. Tạo intent thử, kiểm tra redirectUrl chứa domain mới.
4. Thanh toán nhỏ xác nhận IPN về 200 OK.

## 3) Xử lý khi VNPAY IPN gửi nhiều lần
Hệ thống idempotent theo khóa `key = vnp_TxnRef:(vnp_TransactionNo||vnp_PayDate)` scope `VNPAY_IPN`.
- Luồng xử lý:
  1) Verify HMAC SHA512 và kiểm `vnp_ResponseCode==='00'`.
  2) `idempotency.ensure(key)`:
     - Chưa có: tạo `PENDING` và xử lý.
     - Đã `SUCCEEDED`: trả 200 `OK`, không đổi trạng thái/log.
     - `FAILED`: cho phép retry, set `PENDING` rồi xử lý lại.
  3) OK: Payment→`SUCCEEDED`, log `VNPAY_SUCCESS` (raw=query params), gọi `rental-svc.markBookingPaid` (best-effort). `idempotency.markSucceeded(key)`.
  4) Fail: Payment→`FAILED`, log lỗi, `idempotency.markFailed(key, reason)`.

Khi nghi ngờ double-charge:
- Tra `Payment.vnpTxnRef` và transaction logs; xác nhận chỉ một lần `PENDING→SUCCEEDED`.
- Đối chiếu amount giữa VNPAY và hệ thống.

## 4) Ý nghĩa transaction logs
- `INTENT_CREATED`: tạo lệnh thanh toán (PENDING).
- `POS_COLLECTED`: thu tiền tại quầy (CASH/CARD), Payment `SUCCEEDED` ngay.
- `VNPAY_SUCCESS`/`VNPAY_FAILED`: kết quả IPN/return VNPAY; `raw` là query string (không chứa secret).
- `DEPOSIT_HELD`: tạo đặt cọc (Deposit=HELD), Payment PENDING (VNPAY) hoặc SUCCEEDED (CASH/CARD).
- `DEPOSIT_RELEASED`: hoàn cọc (refund âm) full/partial.
- `DEPOSIT_FORFEIT`: khấu trừ cọc, tạo Payment `FINE`.

## 5) Check‑list khi revenue/analytics lệch
1. Time & TZ
   - `TZ=Asia/Ho_Chi_Minh` đã set cho containers?
   - Kiểm tra clock skew giữa DB và containers (`date -R`).
2. Dải thời gian truy vấn
   - `from/to` chuẩn YYYY-MM-DD, `from <= to`.
   - Có dữ liệu `Payment.status=SUCCEEDED` trong khoảng?
3. Cron job tổng hợp
   - `ENABLE_CRON=true`? Cron chạy 01:00 local? Log `Nightly aggregate started/finished`.
   - Bảng tổng hợp (`StationStatsDaily`, `HourlyHeatmap`, `UserRentalStats`) có dòng ngày D-1?
4. Dữ liệu nguồn
   - `payment-svc`: Payment có chuyển `PENDING→SUCCEEDED`/refund đúng?
   - `rental-svc`: capacity/booking trả về bình thường (ảnh hưởng utilization)?
5. Gateway/URLs
   - Đổi domain đã cập nhật `VNPAY_RETURN_URL`/`VNPAY_IPN_URL` và redeploy?
6. Lặp IPN/verify fail
   - Log `INVALID_HASH`, `VNPAY_ERROR_*`; kiểm tra bảng `idempotency_keys` theo key.

## 6) Thao tác khẩn cấp thường gặp
- Force cancel Payment còn `PENDING`: `POST /payments/:id/cancel` (log `CANCELED`).
- Hoàn tiền thủ công: `POST /payments/:id/refund` (chỉ khi `SUCCEEDED`).
- Tắt cron tạm thời: `ENABLE_CRON=false` và redeploy analytics-svc.

## 7) Logging & Metrics
- Logs:
  - `docker compose logs -f payment-svc`
  - `docker compose logs -f analytics-svc`
- Metrics Prometheus: `GET /metrics` trên từng service.
