## 1) Chuẩn bị chung
- Base URL: `http://localhost:3000`
- Header chung cho API có auth:
  - `Authorization: Bearer {{token}}`
  - `Content-Type: application/json`
- Query phân trang dùng được ở hầu hết API list có `paginate`:
  - `page=1`
  - `limit=10`
  - `sort=created_at`
  - `order=desc`

## 2) Tài khoản seed để login
Dùng DB từ file `mysql_fixed_for_saas_zip.sql`.

### Super admin
- Email: `admin@gmail.com`
- Password: `123456`

### Tenant admin
- Email: `admin@market.com`
- Password: `123456`

### Collector
- Email: `collector1@market.com`
- Password: `123456`

## 3) Test theo thứ tự khuyến nghị
1. Login lấy token cho 3 role.
2. Test nhóm Super admin: tenants, plans, subscriptions, super_admins, roles.
3. Test nhóm Tenant admin: markets, zones, kiosk_types, kiosks, merchants, kiosk_assignments.
4. Test nhóm phí/thu: fees, fee_assignments, collection_periods, charges.
5. Test nhóm vận hành: shifts, notifications, debts, reports, audit_logs.
6. Test receipts sau cùng vì route này đang có khả năng lỗi code.

---

# A. AUTH

## A1. Login super admin
**POST** `/api/auth/login`
```json
{
  "email": "admin@gmail.com",
  "password": "123456"
}
```
Kỳ vọng: `200`, có `token`.

## A2. Login tenant admin
**POST** `/api/auth/login`
```json
{
  "email": "admin@market.com",
  "password": "123456"
}
```
Kỳ vọng: `200`, có `token`.

## A3. Login collector
**POST** `/api/auth/login`
```json
{
  "email": "collector1@market.com",
  "password": "123456"
}
```
Kỳ vọng: `200`, có `token`.

## A4. Google login
**POST** `/api/auth/google_login`
Body tùy ý.
Kỳ vọng thực tế: `501`.

---

# B. SUPER ADMIN ROUTES
Dùng token super admin.

## B1. Tạo tenant
**POST** `/api/tenants`
```json
{
  "tenBanQuanLy": "Ban quản lý Chợ Ninh Kiều",
  "diachi": "Cần Thơ",
  "soDienThoai": "0987000001",
  "email": "tenant.ninhkieu@demo.com",
  "trangThai": "active"
}
```
Kỳ vọng: `201`.

### Test duplicate tenant
Gọi lại y chang.
Kỳ vọng: `409`.

## B2. Danh sách tenant + phân trang
**GET** `/api/tenants?page=1&limit=10`
Kỳ vọng: `200`, có `data`, `meta`.

## B3. Get tenant by id
**GET** `/api/tenants/1`
Kỳ vọng: `200`.

## B4. Update tenant
**PUT** `/api/tenants/1`
```json
{
  "tenBanQuanLy": "Ban quan ly Cho Demo Updated",
  "diachi": "Can Tho Updated",
  "soDienThoai": "0987654321",
  "email": "tenant1@demo.com"
}
```
Kỳ vọng: `200`.

## B5. Update trạng thái tenant
**PATCH** `/api/tenants/1/status`
```json
{
  "trangThai": "active"
}
```
Kỳ vọng: `200`.

## B6. Tạo plan
**POST** `/api/plans`
```json
{
  "tenGoi": "Pro Demo",
  "giaTien": 199000,
  "gioiHanSoKiosk": 10,
  "gioiHanUser": 8,
  "gioiHanSoCho": 3,
  "moTa": "Gói pro test"
}
```
Kỳ vọng: `201`.

### Test duplicate plan
Gọi lại cùng `tenGoi`.
Kỳ vọng: `409` hoặc lỗi duplicate.

## B7. List plans
**GET** `/api/plans?page=1&limit=10`

## B8. Get plan by id
**GET** `/api/plans/1`

## B9. Update plan
**PUT** `/api/plans/1`
```json
{
  "tenGoi": "Basic Demo Updated",
  "giaTien": 149000,
  "gioiHanSoKiosk": 3,
  "gioiHanUser": 4,
  "gioiHanSoCho": 2,
  "moTa": "Cap nhat goi"
}
```

## B10. Inactive plan
**PATCH** `/api/plans/1/inactive`
```json
{
  "trangThai": "inactive"
}
```

## B11. Tạo subscription cho tenant
**POST** `/api/subscriptions`
```json
{
  "tenant_id": 1,
  "plan_id": 1
}
```
Kỳ vọng: `201`.

## B12. Upgrade subscription
**POST** `/api/subscriptions/upgrade`
```json
{
  "tenant_id": 1,
  "plan_id": 1
}
```
Kỳ vọng: `200`.

## B13. List subscriptions
**GET** `/api/subscriptions?page=1&limit=10`

## B14. Get subscription status mới nhất của tenant hiện tại / theo tenant query
**GET** `/api/subscriptions/status?tenant_id=1`

## B15. Get subscription by id
**GET** `/api/subscriptions/1`

## B16. Tạo super admin mới
**POST** `/c`
```json
{
  "email": "super2@demo.com",
  "password": "123456",
  "hoTen": "Super Admin 2",
  "soDienThoai": "0900999999",
  "trangThai": "active"
}
```

## B17. List super admins
**GET** `/api/super_admins`

## B18. Get super admin by id
**GET** `/api/super_admins/1`

## B19. Update super admin info
**PUT** `/api/super_admins/1`
```json
{
  "hoTen": "Super Admin Updated",
  "soDienThoai": "0900000000",
  "email": "admin@gmail.com"
}
```

## B20. Update super admin status
**PATCH** `/api/super_admins/1/status`
```json
{
  "trangThai": "inactive"
}
```

## B21. Tạo role
**POST** `/api/roles`
```json
{
  "tenVaiTro": "custom_role_demo",
  "danhSachQuyen": ["VIEW_MARKET"]
}
```

## B22. List roles
**GET** `/api/roles`

## B23. Get role by id
**GET** `/api/roles/1`

## B24. Update role
**PUT** `/api/roles/1`
```json
{
  "tenVaiTro": "super_admin",
  "danhSachQuyen": ["*"]
}
```

---

# C. TENANT ADMIN ROUTES
Dùng token tenant admin.

## C1. List users
**GET** `/api/users?page=1&limit=10`

## C2. Get user by id
**GET** `/api/users/1`
Lưu ý: với DB seed hiện tại, user tenant admin thường là `1`, collector là `2`,`3`.

## C3. Tạo collector mới
**POST** `/api/users`
```json
{
  "email": "collector3@market.com",
  "password": "123456",
  "hoTen": "Collector Three",
  "soDienThoai": "0900000099",
  "role_id": 3,
  "trangThai": "active"
}
```
Kỳ vọng: `201`.

### Test duplicate user
Gọi lại cùng email hoặc số điện thoại.
Kỳ vọng: `409`.

### Test quota user
Plan seed ban đầu giới hạn `gioiHanUser = 3`, DB seed đã có 3 user tenant. Tạo thêm có thể ra lỗi quota. Nếu ra `409/400` quota thì đó là đúng business rule.

## C4. Update user info
**PUT** `/api/users/2`
```json
{
  "hoTen": "Collector One Updated",
  "email": "collector1@market.com",
  "soDienThoai": "0900000002"
}
```

## C5. Change password user hiện tại
**PATCH** `/api/users/change_password`
```json
{
  "newPassword": "12345678"
}
```

## C6. Update user status
**PATCH** `/api/users/2/status`
```json
{
  "trangThai": "active"
}
```

---

# D. MARKET / ZONE / KIOSK TYPE / KIOSK / MERCHANT / ASSIGNMENT

## D1. Tạo market
**POST** `/api/markets`
```json
{
  "tenCho": "Cho Noi O Mon",
  "diaChi": "O Mon, Can Tho",
  "dienTich": 500
}
```
Kỳ vọng: `201`.

### Test duplicate market
Gọi lại cùng `tenCho` trong cùng tenant.
Kỳ vọng: `409`.

### Test quota market
Plan seed giới hạn `gioiHanSoCho = 2`, DB seed đã có 2 market. Tạo thêm có thể lỗi quota. Đây là test quan trọng.

## D2. List markets
**GET** `/api/markets?page=1&limit=10&q=Cho&trangThai=active`

## D3. Get market by id
**GET** `/api/markets/1`

## D4. Update market
**PUT** `/api/markets/1`
```json
{
  "tenCho": "Cho Trung Tam Updated",
  "diaChi": "Can Tho",
  "dienTich": 1200
}
```

## D5. Lock / unlock market
**PATCH** `/api/markets/1/status`
```json
{
  "trangThai": "locked"
}
```
Hoặc:
```json
{
  "trangThai": "active"
}
```

## D6. Tạo zone
**POST** `/api/zones`
```json
{
  "market_id": 1,
  "tenKhu": "Hai San"
}
```

### Test duplicate zone
Tạo lại cùng `market_id` và `tenKhu`.
Kỳ vọng: `409`.

## D7. List zones
**GET** `/api/zones?page=1&limit=10&market_id=1&q=Thuc&trangThai=active`

## D8. Get zone by id
**GET** `/api/zones/1`

## D9. Update zone
**PUT** `/api/zones/1`
```json
{
  "market_id": 1,
  "tenKhu": "Thuc Pham Tuoi Updated"
}
```

## D10. Lock/unlock zone
**PATCH** `/api/zones/1/status`
```json
{
  "trangThai": "locked"
}
```

## D11. Tạo kiosk type
**POST** `/api/kiosk_types`
```json
{
  "tenLoai": "VIP",
  "moTa": "Loai kiosk VIP"
}
```

## D12. List kiosk types
**GET** `/api/kiosk_types?page=1&limit=10&q=Small`

## D13. Get kiosk type by id
**GET** `/api/kiosk_types/1`

## D14. Update kiosk type
**PUT** `/api/kiosk_types/1`
```json
{
  "tenLoai": "Small Updated",
  "moTa": "Loai kiosk nho updated"
}
```

## D15. Tạo kiosk
**POST** `/api/kiosks`
```json
{
  "zone_id": 1,
  "type_id": 1,
  "maKiosk": "K99",
  "viTri": "Day Z",
  "dienTich": 9
}
```

### Test duplicate kiosk
Tạo lại cùng `zone_id` và `maKiosk`.
Kỳ vọng: `409`.

### Test quota kiosk
Plan seed giới hạn `gioiHanSoKiosk = 2`, nhưng seed DB đã có nhiều kiosk. Vì vậy API tạo kiosk rất dễ trả lỗi quota. Nếu lỗi quota thì business rule đang hoạt động.

## D16. List kiosks
**GET** `/api/kiosks?page=1&limit=10&zone_id=1&q=K0&trangThai=available`

## D17. Get kiosk by id
**GET** `/api/kiosks/1`

## D18. Update kiosk
**PUT** `/api/kiosks/1`
```json
{
  "zone_id": 1,
  "type_id": 1,
  "maKiosk": "K01",
  "viTri": "Day A Updated",
  "dienTich": 10
}
```

## D19. Update trạng thái kiosk
**PATCH** `/api/kiosks/1/status`
```json
{
  "trangThai": "locked"
}
```

## D20. Tạo merchant
**POST** `/api/merchants`
```json
{
  "hoTen": "Pham Van G",
  "soDienThoai": "0900000010",
  "CCCD": "777777777777",
  "maSoThue": "MST007",
  "diaChiThuongTru": "Can Tho",
  "ngayThamGiaKinhDoanh": "2026-03-01"
}
```

### Test duplicate merchant
Tạo lại cùng `CCCD`.
Kỳ vọng: `409`.

## D21. List merchants
**GET** `/api/merchants?page=1&limit=10&q=Nguyen&trangThai=active&soDienThoai=0900000001`

## D22. Get merchant by id
**GET** `/api/merchants/1`

## D23. Update merchant
**PUT** `/api/merchants/1`
```json
{
  "hoTen": "Nguyen Van A Updated",
  "soDienThoai": "0900000001",
  "CCCD": "111111111111",
  "maSoThue": "MST001",
  "diaChiThuongTru": "Can Tho Updated",
  "ngayThamGiaKinhDoanh": "2026-01-01",
  "trangThai": "active"
}
```

## D24. Gán kiosk
**POST** `/api/kiosk_assignments`
```json
{
  "kiosk_id": 4,
  "merchant_id": 1,
  "ngayBatDau": "2026-03-15"
}
```

### Test trùng active assignment
Dùng kiosk đang active rồi, ví dụ `kiosk_id = 1`.
Kỳ vọng: lỗi duplicate hoặc business rule conflict.

## D25. List kiosk assignments
**GET** `/api/kiosk_assignments?page=1&limit=10&q=K0&trangThai=active&kiosk_id=1&merchant_id=1`

## D26. Get assignment by id
**GET** `/api/kiosk_assignments/1`

## D27. Kết thúc gán kiosk
**POST** `/api/kiosk_assignments/1/ended`
Body rỗng `{}`
Kỳ vọng: `200`.

---

# E. FEES / FEE ASSIGNMENTS / COLLECTION PERIODS / CHARGES

## E1. Tạo biểu phí
**POST** `/api/fees`
```json
{
  "tenBieuPhi": "Phi test moi",
  "hinhThuc": "thang",
  "donGia": 250000,
  "moTa": "Phi test"
}
```

### Test duplicate fee
Tạo lại cùng `tenBieuPhi` trong cùng tenant.
Kỳ vọng: `409`.

## E2. List fees
**GET** `/api/fees?page=1&limit=10`

## E3. Get fee by id
**GET** `/api/fees/1`

## E4. Update fee
**PUT** `/api/fees/1`
```json
{
  "tenBieuPhi": "Phi kiosk small updated",
  "hinhThuc": "thang",
  "donGia": 550000,
  "moTa": "Cap nhat fee"
}
```

## E5. Delete fee
**DELETE** `/api/fees/1`
Lưu ý: nếu fee đang được tham chiếu bởi charge/assignment có thể lỗi FK.

## E6. Tạo fee assignment
**POST** `/api/fee_assignments`
```json
{
  "fee_id": 1,
  "target_type": "kiosk",
  "target_id": 4,
  "ngayApDung": "2026-04-01",
  "mucMienGiam": 5
}
```

### Test duplicate fee assignment
Gọi lại cùng bộ `fee_id + target_type + target_id + ngayApDung`.
Kỳ vọng: `409`.

## E7. List fee assignments
**GET** `/api/fee_assignments?page=1&limit=10`

## E8. Get assignment by target
**GET** `/api/fee_assignments/target?target_type=kiosk&target_id=1`

## E9. Get assignments by fee
**GET** `/api/fee_assignments/fee/1?page=1&limit=10`

## E10. Get fee assignment by id
**GET** `/api/fee_assignments/1`

## E11. Update fee assignment
**PUT** `/api/fee_assignments/1`
```json
{
  "fee_id": 1,
  "target_type": "kiosk",
  "target_id": 1,
  "ngayApDung": "2026-04-01",
  "mucMienGiam": 8,
  "trangThai": "active"
}
```

## E12. Deactivate fee assignment
**PATCH** `/api/fee_assignments/1/deactivate`
Body `{}`

## E13. Tạo kỳ thu
**POST** `/api/collection_periods`
```json
{
  "tenKyThu": "Thang 08/2026 Test",
  "ngayBatDau": "2026-08-01 00:00:00",
  "ngayKetThuc": "2026-08-31 23:59:59",
  "loaiKy": "thang"
}
```

### Test overlap kỳ thu
Tạo kỳ thu chồng lên kỳ đã có, ví dụ tháng 03/2026.
Kỳ vọng: lỗi business rule.

## E14. List kỳ thu
**GET** `/api/collection_periods?page=1&limit=10&q=Thang`

## E15. Get kỳ thu by id
**GET** `/api/collection_periods/1`

## E16. Update kỳ thu
**PUT** `/api/collection_periods/1`
```json
{
  "tenKyThu": "Thang 1/2026 Updated",
  "ngayBatDau": "2026-01-01 00:00:00",
  "ngayKetThuc": "2026-01-31 23:59:59",
  "loaiKy": "thang"
}
```

## E17. Delete kỳ thu
**DELETE** `/api/collection_periods/9999`
Dùng id không tồn tại để test `404` an toàn.

## E18. Sinh khoản thu
**POST** `/api/collection_periods/3/generate_chages`
Body `{}`
Lưu ý route đang typo `generate_chages` theo code.

## E19. Tạo charge thủ công
**POST** `/api/charges`
```json
{
  "period_id": 3,
  "kiosk_id": 4,
  "merchant_id": 1,
  "fee_id": 3,
  "donGiaApDung": 1200000,
  "hinhThucApDung": "thang",
  "discountApDung": 0,
  "soTienPhaiThu": 1200000,
  "soTienDaThu": 0,
  "trangThai": "chua_thu"
}
```

### Test duplicate charge theo kiosk + period
Tạo lại cùng `period_id=3, kiosk_id=4`.
Kỳ vọng: duplicate.

## E20. List charges + phân trang
**GET** `/api/charges?page=1&limit=10&period_id=3&merchant_id=1&trangThai=no&q=K0`
Alias typo cũng test được:
**GET** `/api/chages?page=1&limit=10`

## E21. Charges by period
**GET** `/api/charges/period/3`

## E22. Charges by merchant
**GET** `/api/charges/merchant/1`

## E23. Update charge status
**PATCH** `/api/charges/3/status`
```json
{
  "trangThai": "mien"
}
```

## E24. Update debt status
**PATCH** `/api/charges/3/debt_status`
```json
{
  "soTienDaThu": 1200000,
  "trangThai": "da_thu"
}
```

## E25. Get charge history
**GET** `/api/charges/3/history`

## E26. Tạo receipt cho 1 charge
**POST** `/api/charges/3/receipts`
```json
{
  "soTien": 100000,
  "hinhThucThanhToan": "tien_mat",
  "ghiChu": "Thu them cho charge 3",
  "thoiGianThu": "2026-03-15 09:00:00",
  "shift_id": 1
}
```
**Lưu ý rất quan trọng:** route này nhiều khả năng lỗi `500` do code đang insert `receipt_charge` 2 lần.

---

# F. RECEIPTS / RECEIPT_CHARGES

## F1. Tạo receipt
**POST** `/api/receipts`
```json
{
  "soTienThu": 300000,
  "hinhThucThanhToan": "tien_mat",
  "ghiChu": "Thu test receipt",
  "thoiGianThu": "2026-03-15 10:00:00",
  "shift_id": 1,
  "charges": [
    {
      "charge_id": 3,
      "soTien": 300000
    }
  ]
}
```
**Lưu ý:** route này cũng có khả năng lỗi `500` vì bug duplicate insert `receipt_charge` trong service.

## F2. List receipts
**GET** `/api/receipts?page=1&limit=10&hinhThucThanhToan=tien_mat`

## F3. Get receipt detail
**GET** `/api/receipts/1`

## F4. Get charges by receipt
**GET** `/api/receipt_charges/receipt/1`

## F5. Get receipts by charge
**GET** `/api/receipt_charges/charge/1`

---

# G. SHIFTS
Dùng token collector cho start/end/active. Dùng tenant admin cho list.

## G1. Start shift
**POST** `/api/shifts/start`
Body `{}`
Kỳ vọng: `201`.

## G2. Active shift
**GET** `/api/shifts/active`

## G3. End shift qua body
**POST** `/api/shifts/end`
```json
{
  "shift_id": 1
}
```

## G4. End shift qua id
**PUT** `/api/shifts/end/1`
Body `{}`

## G5. List shifts
**GET** `/api/shifts?page=1&limit=10`
Dùng token tenant admin.

---

# H. NOTIFICATIONS

## H1. Tạo notification tenant admin
**POST** `/api/notifications`
```json
{
  "title": "Thong bao test moi",
  "content": "Noi dung test",
  "type": "tenant",
  "tenant_id": 1,
  "expires_at": "2026-12-31 23:59:59"
}
```

## H2. Tạo notification system bằng super admin
**POST** `/api/notifications`
```json
{
  "title": "System maintenance",
  "content": "Bao tri he thong",
  "type": "system",
  "expires_at": "2026-12-31 23:59:59"
}
```

## H3. List notifications
**GET** `/api/notifications?page=1&limit=10`

## H4. Unread count
**GET** `/api/notifications/unread_count`

## H5. Mark as read
**POST** `/api/notifications/1/read`
Body `{}`

## H6. Get notification detail
**GET** `/api/notifications/1`

---

# I. DEBTS
Dùng token tenant admin.

## I1. List debts
**GET** `/api/debts?page=1&limit=10`

## I2. Debts by merchant
**GET** `/api/debts/merchant/1`

## I3. Total debt
**GET** `/api/debts/total`

## I4. Top debtors
**GET** `/api/debts/top`

---

# J. REPORTS
Dùng token tenant admin.

## J1. Tổng hợp report
**GET** `/api/reports?from=2026-03-01&to=2026-03-31`

## J2. Total revenue
**GET** `/api/reports/total_revenue?from=2026-03-01&to=2026-03-31`

## J3. Revenue by zone
**GET** `/api/reports/zone?from=2026-03-01&to=2026-03-31`

## J4. Revenue by collector
**GET** `/api/reports/collector?from=2026-03-01&to=2026-03-31`

## J5. Export excel
**GET** `/api/reports/export?from=2026-03-01&to=2026-03-31`
Hoặc:
**GET** `/api/reports/export_excel?from=2026-03-01&to=2026-03-31`

---

# K. AUDIT LOGS

## K1. All logs
**GET** `/api/audit_logs?page=1&limit=10`
Dùng super admin hoặc tenant admin.

## K2. Super admin logs
**GET** `/api/audit_logs/superadmin?page=1&limit=10`
Dùng super admin.

## K3. Tenant logs
**GET** `/api/audit_logs/tenant?page=1&limit=10`
Dùng tenant admin.

## K4. Entity logs
**GET** `/api/audit_logs/entity/receipt/1?page=1&limit=10`

---

# L. PAYMENTS / WEBHOOK

## L1. Checkout payment
**POST** `/api/payments`
```json
{
  "priceId": "price_test_123",
  "plan_id": 1
}
```
Hoặc:
**POST** `/api/payments/checkout`

**Kỳ vọng thực tế:** nếu chưa cấu hình Stripe, trả `501`.

## L2. Stripe webhook
**POST** `/api/payments/webhook`
Body raw JSON.
Kỳ vọng: chỉ test được khi có Stripe webhook secret thật.

---

# M. CHECKLIST NHANH CHO YÊU CẦU CỦA BẠN

## 1. Get by id
- `/api/tenants/:id`
- `/api/plans/:id`
- `/api/subscriptions/:id`
- `/api/super_admins/:id`
- `/api/roles/:id`
- `/api/users/:id`
- `/api/markets/:id`
- `/api/zones/:id`
- `/api/kiosk_types/:id`
- `/api/kiosks/:id`
- `/api/merchants/:id`
- `/api/kiosk_assignments/:id`
- `/api/fees/:id`
- `/api/fee_assignments/:id`
- `/api/collection_periods/:id`
- `/api/receipts/:id`
- `/api/notifications/:id`

## 2. Phân trang
Test với `page=1&limit=5` cho:
- tenants
n- plans
- subscriptions
- users
- markets
- zones
- kiosk_types
- kiosks
- merchants
- kiosk_assignments
- fees
- fee_assignments
- collection_periods
- charges
- receipts
- shifts
- notifications
- audit_logs
- debts

## 3. Check trùng
Nên test lại create lần 2 cho:
- tenants
- plans
- users
- markets
- zones
- kiosk_types
- kiosks
- merchants
- kiosk_assignments
- fees
- fee_assignments
- charges
- collection_periods overlap

## 4. Quota
Nên test:
- `POST /api/users`
- `POST /api/markets`
- `POST /api/kiosks`

---

# N. ROUTE NÀO DỄ LỖI DO CODE
- `POST /api/auth/google_login` → `501`
- `POST /api/payments` / `/checkout` → `501` nếu chưa cấu hình Stripe
- `POST /api/receipts` → có nguy cơ `500` do insert `receipt_charge` trùng
- `POST /api/charges/:id/receipts` → có nguy cơ `500` do cùng bug ở trên
- `DELETE /api/fees/:id` → có thể lỗi FK nếu fee đã được dùng

