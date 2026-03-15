drop database saas;
CREATE DATABASE IF NOT EXISTS saas
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;
USE saas;

-- Kiểm tra timezone hiện tại
SELECT @@global.time_zone, @@session.time_zone;

-- Set timezone cho session hiện tại
SET time_zone = '+07:00';

-- Set timezone global (cần quyền root)
-- NOTE: bỏ SET GLOBAL time_zone vì thường cần quyền root

SET FOREIGN_KEY_CHECKS = 0;
DROP TABLE IF EXISTS notification_read;
DROP TABLE IF EXISTS notification;
DROP TABLE IF EXISTS audit_log;
DROP TABLE IF EXISTS receipt_charge;
DROP TABLE IF EXISTS receipt;
DROP TABLE IF EXISTS charge;
DROP TABLE IF EXISTS shift;
DROP TABLE IF EXISTS collection_period;
DROP TABLE IF EXISTS fee_assignment;
DROP TABLE IF EXISTS fee_schedule;
DROP TABLE IF EXISTS kiosk_assignment;
DROP TABLE IF EXISTS merchant;
DROP TABLE IF EXISTS kiosk;
DROP TABLE IF EXISTS kiosk_type;
DROP TABLE IF EXISTS zone;
DROP TABLE IF EXISTS market;
DROP TABLE IF EXISTS users;
DROP TABLE IF EXISTS role;
DROP TABLE IF EXISTS plan_subscription;
DROP TABLE IF EXISTS plan;
DROP TABLE IF EXISTS tenant;
DROP TABLE IF EXISTS super_admin;
SET FOREIGN_KEY_CHECKS = 1;

CREATE TABLE super_admin (
  admin_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  email VARCHAR(150) NOT NULL UNIQUE,
  password_hash VARCHAR(255) NOT NULL,
  hoTen VARCHAR(150) NULL,
  soDienThoai VARCHAR(15) NULL UNIQUE,
  trangThai ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE tenant (
  tenant_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenBanQuanLy VARCHAR(150) NOT NULL,
  diachi VARCHAR(255) NULL,
  soDienThoai VARCHAR(15) NOT NULL,
  email VARCHAR(150) NOT NULL,
  trangThai ENUM('active','suspended') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_tenant_email (email),
  UNIQUE KEY uq_tenant_phone (soDienThoai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE plan (
  plan_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenGoi VARCHAR(100) NOT NULL,
  giaTien DECIMAL(12,2) NOT NULL DEFAULT 0,
  gioiHanSoKiosk INT UNSIGNED NOT NULL,
  gioiHanUser INT UNSIGNED NOT NULL,
  gioiHanSoCho INT UNSIGNED NOT NULL,
  moTa TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_plan_name (tenGoi)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

ALTER TABLE plan
ADD COLUMN trangThai ENUM('active','inactive') NOT NULL DEFAULT 'active';

CREATE TABLE plan_subscription (
  subscription_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  plan_id INT UNSIGNED NOT NULL,
  trangThai ENUM('active','expired','trial','cancelled') NOT NULL,
  ngayBatDau DATETIME NOT NULL,
  ngayKetThuc DATETIME NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  active_flag TINYINT GENERATED ALWAYS AS (
    CASE WHEN trangThai = 'active' THEN 1 ELSE NULL END
  ) STORED,
  UNIQUE KEY uq_active_subscription_per_tenant (tenant_id, active_flag),
  KEY idx_ps_tenant (tenant_id),
  KEY idx_ps_plan (plan_id),
  CONSTRAINT fk_ps_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ps_plan FOREIGN KEY (plan_id) REFERENCES plan(plan_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE role (
  role_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenVaiTro VARCHAR(100) NOT NULL,
  danhSachQuyen JSON NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_role_name (tenVaiTro)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE users (
  user_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  role_id INT UNSIGNED NOT NULL,
  email VARCHAR(150) NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  hoTen VARCHAR(150) NOT NULL,
  soDienThoai VARCHAR(15) NOT NULL,
  trangThai ENUM('active','suspended','deleted') NOT NULL DEFAULT 'active',
  deleted_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_user_tenant_email (tenant_id, email),
  UNIQUE KEY uq_user_tenant_phone (tenant_id, soDienThoai),
  KEY idx_user_tenant (tenant_id),
  KEY idx_user_role (role_id),
  CONSTRAINT fk_user_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_user_role FOREIGN KEY (role_id) REFERENCES role(role_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE market (
  market_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  tenCho VARCHAR(150) NOT NULL,
  diaChi VARCHAR(255) NULL,
  dienTich INT UNSIGNED NULL,
  trangThai ENUM('active','locked') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_market_tenant_name (tenant_id, tenCho),
  KEY idx_market_tenant (tenant_id),
  CONSTRAINT fk_market_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE zone (
  zone_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  market_id INT UNSIGNED NOT NULL,
  tenKhu VARCHAR(150) NOT NULL,
  trangThai ENUM('active','locked') NOT NULL DEFAULT 'active',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_zone_market_name (market_id, tenKhu),
  KEY idx_zone_tenant (tenant_id),
  KEY idx_zone_market (market_id),
  CONSTRAINT fk_zone_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_zone_market FOREIGN KEY (market_id) REFERENCES market(market_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kiosk_type (
  type_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenLoai VARCHAR(150) NOT NULL,
  moTa VARCHAR(255) NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kiosk_type_name (tenLoai)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kiosk (
  kiosk_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  zone_id INT UNSIGNED NOT NULL,
  type_id INT UNSIGNED NOT NULL,
  maKiosk VARCHAR(100) NOT NULL,
  viTri VARCHAR(255) NULL,
  dienTich INT UNSIGNED NULL,
  trangThai ENUM('available','occupied','maintenance','locked') NOT NULL DEFAULT 'available',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_kiosk_zone_code (zone_id, maKiosk),
  KEY idx_kiosk_tenant (tenant_id),
  KEY idx_kiosk_zone (zone_id),
  KEY idx_kiosk_type (type_id),
  CONSTRAINT fk_kiosk_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_kiosk_zone FOREIGN KEY (zone_id) REFERENCES zone(zone_id) ON DELETE RESTRICT,
  CONSTRAINT fk_kiosk_type FOREIGN KEY (type_id) REFERENCES kiosk_type(type_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE merchant (
  merchant_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  hoTen VARCHAR(150) NOT NULL,
  soDienThoai VARCHAR(15) NULL,
  CCCD CHAR(12) NOT NULL,
  maSoThue VARCHAR(20) NULL,
  diaChiThuongTru VARCHAR(255) NULL,
  ngayThamGiaKinhDoanh DATE NULL,
  trangThai ENUM('active','inactive') NOT NULL DEFAULT 'active',
  inactive_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_merchant_tenant_cccd (tenant_id, CCCD),
  KEY idx_merchant_tenant (tenant_id),
  CONSTRAINT fk_merchant_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE kiosk_assignment (
  assignment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  kiosk_id INT UNSIGNED NOT NULL,
  merchant_id INT UNSIGNED NOT NULL,
  ngayBatDau DATE NOT NULL,
  ngayKetThuc DATE NULL,
  trangThai ENUM('active','ended') NOT NULL DEFAULT 'active',
  active_kiosk_id INT GENERATED ALWAYS AS (
    CASE WHEN trangThai='active' THEN kiosk_id ELSE NULL END
  ) STORED,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_one_active_assignment_per_kiosk (tenant_id, active_kiosk_id),
  KEY idx_ka_tenant (tenant_id),
  KEY idx_ka_kiosk (kiosk_id),
  KEY idx_ka_merchant (merchant_id),
  CONSTRAINT fk_ka_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ka_kiosk FOREIGN KEY (kiosk_id) REFERENCES kiosk(kiosk_id) ON DELETE RESTRICT,
  CONSTRAINT fk_ka_merchant FOREIGN KEY (merchant_id) REFERENCES merchant(merchant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fee_schedule (
  fee_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  tenBieuPhi VARCHAR(150) NOT NULL,
  hinhThuc ENUM('ngay','thang') NOT NULL,
  donGia DECIMAL(12,2) NOT NULL,
  moTa TEXT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fee_tenant_name (tenant_id, tenBieuPhi),
  KEY idx_fee_tenant (tenant_id),
  CONSTRAINT fk_fee_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE fee_assignment (
  assignment_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  fee_id INT UNSIGNED NOT NULL,
  target_type ENUM('kiosk','zone','kiosk_type') NOT NULL,
  target_id INT UNSIGNED NOT NULL,
  ngayApDung DATE NOT NULL,
  trangThai ENUM('active','inactive') NOT NULL DEFAULT 'active',
  mucMienGiam DECIMAL(5,2) NOT NULL DEFAULT 0,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_fee_assign (tenant_id, fee_id, target_type, target_id, ngayApDung),
  KEY idx_fa_fee (fee_id),
  KEY idx_fa_target (tenant_id, target_type, target_id),
  CONSTRAINT fk_fa_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_fa_fee FOREIGN KEY (fee_id) REFERENCES fee_schedule(fee_id) ON DELETE RESTRICT,
  CONSTRAINT chk_discount_pct CHECK (mucMienGiam >= 0 AND mucMienGiam <= 100)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE collection_period (
  period_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  tenKyThu VARCHAR(150) NULL,
  ngayBatDau DATETIME NOT NULL,
  ngayKetThuc DATETIME NOT NULL,
  loaiKy ENUM('ngay','thang') NOT NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  UNIQUE KEY uq_period_range (tenant_id, ngayBatDau, ngayKetThuc),
  KEY idx_period_tenant (tenant_id),
  CONSTRAINT fk_period_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE shift (
  shift_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  user_id INT UNSIGNED NOT NULL,
  thoiGianBatDauCa DATETIME NOT NULL,
  thoiGianKetThucCa DATETIME NULL,
  tongTienMatThuDuoc DECIMAL(12,2) NOT NULL DEFAULT 0,
  tongChuyenKhoanThuDuoc DECIMAL(12,2) NOT NULL DEFAULT 0,
  trangThaiDoiSoat ENUM('pending','completed','discrepancy') NOT NULL DEFAULT 'pending',
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  KEY idx_shift_tenant (tenant_id),
  KEY idx_shift_user (user_id),
  CONSTRAINT fk_shift_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_shift_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


-- Thêm index cho bảng kiosk
ALTER TABLE kiosk ADD UNIQUE KEY uq_kiosk_id_tenant (kiosk_id, tenant_id);

-- Thêm index cho bảng merchant
ALTER TABLE merchant ADD UNIQUE KEY uq_merchant_id_tenant (merchant_id, tenant_id);

-- Thêm index cho bảng collection_period
ALTER TABLE collection_period ADD UNIQUE KEY uq_period_id_tenant (period_id, tenant_id);

-- Thêm index cho bảng fee_schedule
ALTER TABLE fee_schedule ADD UNIQUE KEY uq_fee_id_tenant (fee_id, tenant_id);

-- Thêm index cho bảng users
ALTER TABLE users ADD UNIQUE KEY uq_user_id_tenant (user_id, tenant_id);

-- Thêm index cho bảng shift (để phục vụ fk_receipt_shift)
ALTER TABLE shift ADD UNIQUE KEY uq_shift_id_tenant (shift_id, tenant_id);

CREATE TABLE charge (
  charge_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,
  period_id INT UNSIGNED NOT NULL,
  kiosk_id INT UNSIGNED NOT NULL,
  merchant_id INT UNSIGNED NOT NULL,
  fee_id INT UNSIGNED NOT NULL,
  
  donGiaApDung DECIMAL(12,2) NOT NULL,
  hinhThucApDung ENUM('ngay','thang') NOT NULL,
  discountApDung DECIMAL(5,2) DEFAULT 0,
  soTienPhaiThu DECIMAL(12,2) NOT NULL,
  soTienDaThu DECIMAL(12,2) DEFAULT 0,
  CHECK (soTienDaThu <= soTienPhaiThu),
  
  trangThai ENUM('chua_thu','da_thu','no','mien') DEFAULT 'chua_thu',
  version INT DEFAULT 1,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  -- Các Index quan trọng cho SaaS
  UNIQUE KEY uq_charge_one_per_kiosk_period (tenant_id, period_id, kiosk_id),
  UNIQUE KEY uq_charge_id_tenant (charge_id, tenant_id),
  KEY idx_charge_status (tenant_id, trangThai),

  -- Thiết lập Foreign Keys kép để siết chặt Tenant
  CONSTRAINT fk_charge_period FOREIGN KEY (period_id, tenant_id) REFERENCES collection_period(period_id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_charge_kiosk FOREIGN KEY (kiosk_id, tenant_id) REFERENCES kiosk(kiosk_id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_charge_merchant FOREIGN KEY (merchant_id, tenant_id) REFERENCES merchant(merchant_id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_charge_fee FOREIGN KEY (fee_id, tenant_id) REFERENCES fee_schedule(fee_id, tenant_id) ON DELETE RESTRICT,
  CONSTRAINT fk_charge_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE receipt (
  receipt_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NOT NULL,

  soTienThu DECIMAL(12,2) NOT NULL,
  hinhThucThanhToan ENUM('tien_mat','chuyen_khoan') NOT NULL,
  ghiChu VARCHAR(255),
  anhChupThanhToan VARCHAR(255) null,
  thoiGianThu DATETIME NOT NULL,

  user_id INT UNSIGNED NULL,
  shift_id INT UNSIGNED NULL,

  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,

  UNIQUE KEY uq_receipt_id_tenant (receipt_id, tenant_id),
  KEY idx_receipt_tenant_time (tenant_id, thoiGianThu),

  CONSTRAINT fk_receipt_user   FOREIGN KEY (user_id, tenant_id)   REFERENCES users(user_id, tenant_id) ON DELETE RESTRICT,
  
  -- SỬA Ở ĐÂY: Đổi SET NULL thành RESTRICT
  CONSTRAINT fk_receipt_shift  FOREIGN KEY (shift_id, tenant_id)  REFERENCES shift(shift_id, tenant_id) ON DELETE RESTRICT,
  
  CONSTRAINT fk_receipt_tenant FOREIGN KEY (tenant_id)            REFERENCES tenant(tenant_id) ON DELETE RESTRICT
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


CREATE TABLE receipt_charge (
  receipt_id INT UNSIGNED NOT NULL,
  charge_id INT UNSIGNED NOT NULL,
  tenant_id INT UNSIGNED NOT NULL,
  soTienDaTra DECIMAL(12,2) NOT NULL,
  PRIMARY KEY (receipt_id, charge_id),
  KEY idx_rc_charge (tenant_id, charge_id),
  CONSTRAINT fk_rc_receipt FOREIGN KEY (receipt_id, tenant_id) REFERENCES receipt(receipt_id, tenant_id),
  CONSTRAINT fk_rc_charge FOREIGN KEY (charge_id, tenant_id) REFERENCES charge(charge_id, tenant_id)
);

CREATE TABLE audit_log (
  log_id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NULL,
  user_id INT UNSIGNED NULL,
  super_admin_id INT UNSIGNED NULL,
  hanhDong VARCHAR(255) NOT NULL,
  thoiGianThucHien DATETIME DEFAULT CURRENT_TIMESTAMP,
  entity_type VARCHAR(50) NULL,
  entity_id BIGINT UNSIGNED NULL,
  giaTriCu JSON NULL,
  giaTriMoi JSON NULL,
  KEY idx_audit_tenant_time (tenant_id, thoiGianThucHien),
  KEY idx_audit_user (user_id),
  KEY idx_audit_super_admin (super_admin_id),
  CONSTRAINT fk_audit_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_user FOREIGN KEY (user_id) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_audit_super_admin FOREIGN KEY (super_admin_id) REFERENCES super_admin(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification (
  notification_id INT UNSIGNED AUTO_INCREMENT PRIMARY KEY,
  tenant_id INT UNSIGNED NULL,
  title VARCHAR(150) NOT NULL,
  content TEXT NOT NULL,
  type ENUM('tenant','system') NOT NULL DEFAULT 'tenant',
  created_by_tenantadmin INT UNSIGNED NULL,
  created_by_superadmin INT UNSIGNED NULL,
  expires_at DATETIME NULL,
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  KEY idx_notification_tenant (tenant_id),
  KEY idx_notification_type (type),
  CONSTRAINT fk_notification_tenant FOREIGN KEY (tenant_id) REFERENCES tenant(tenant_id) ON DELETE SET NULL,
  CONSTRAINT fk_notification_user FOREIGN KEY (created_by_tenantadmin) REFERENCES users(user_id) ON DELETE SET NULL,
  CONSTRAINT fk_notification_super_admin FOREIGN KEY (created_by_superadmin) REFERENCES super_admin(admin_id) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

CREATE TABLE notification_read (
  -- Sửa từ BIGINT thành INT để khớp với bảng notification
  notification_id INT UNSIGNED NOT NULL, 
  user_id INT UNSIGNED NOT NULL,
  tenant_id INT UNSIGNED NOT NULL,
  read_at DATETIME DEFAULT CURRENT_TIMESTAMP,

  PRIMARY KEY(notification_id, user_id),

  CONSTRAINT fk_nr_notification
    FOREIGN KEY(notification_id)
    REFERENCES notification(notification_id)
    ON DELETE CASCADE,

  CONSTRAINT fk_nr_user
    FOREIGN KEY(user_id, tenant_id)
    REFERENCES users(user_id, tenant_id)
    ON DELETE CASCADE
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

INSERT INTO super_admin (email, password_hash, hoTen, soDienThoai, trangThai)
VALUES (
  'admin@gmail.com',
  '$2a$10$JCyEZvzvw1O6r5urt/nDdeCVrVUpYdvtwf7hn294S7F0ysZWlJFPW',
  'Super Admin',
  '0900000000',
  'active'
);

INSERT INTO tenant (tenBanQuanLy, diachi, soDienThoai, email, trangThai)
VALUES ('Ban quan ly Cho Demo', 'Can Tho', '0987654321', 'tenant1@demo.com', 'active');

INSERT INTO plan (tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, moTa)
VALUES ('Basic Demo', 99000, 2, 3, 2, 'Plan demo de test duplicate va quota');

INSERT INTO plan_subscription (tenant_id, plan_id, trangThai, ngayBatDau, ngayKetThuc)
VALUES (
  (SELECT tenant_id FROM tenant WHERE email='tenant1@demo.com' LIMIT 1),
  (SELECT plan_id FROM plan WHERE tenGoi='Basic Demo' LIMIT 1),
  'active',
  NOW(),
  DATE_ADD(NOW(), INTERVAL 12 MONTH)
);

INSERT INTO role (tenVaiTro, danhSachQuyen) VALUES
('super_admin', NULL),
('tenant_admin', NULL),
('collector', NULL),
('merchant', NULL);


INSERT INTO notification (tenant_id, title, content, type, created_by_superadmin)
VALUES (
  NULL,
  'Thong bao he thong',
  'Thong bao system de test API notification',
  'system',
  (SELECT admin_id FROM super_admin WHERE email='admin@gmail.com' LIMIT 1)
);

-- NOTE: bỏ seed tenant_admin vì schema hiện tại không có bảng này; tenant admin sẽ nằm trong bảng users

-- NOTE: bỏ seed role theo tenant_id vì bảng role không có cột tenant_id

-- NOTE: giữ users.soDienThoai NOT NULL để khớp validation createUser
INSERT INTO users (tenant_id, role_id, email, password_hash, hoTen, soDienThoai)
VALUES 
(1, 2, 'tenant@gmail.com', '$2b$10$L/bz5GsrawAGopfCUDeHY.SBECw0K0b7l/qWt10EQFtorqetEitRq', 'Tenant Admin', '0911111111'),
(1, 3, 'collector1@market.com', '$2b$10$L/bz5GsrawAGopfCUDeHY.SBECw0K0b7l/qWt10EQFtorqetEitRq', 'Collector One', '0922222222'),
(1, 3, 'collector2@market.com', '$2b$10$L/bz5GsrawAGopfCUDeHY.SBECw0K0b7l/qWt10EQFtorqetEitRq', 'Collector Two', '0933333333');
