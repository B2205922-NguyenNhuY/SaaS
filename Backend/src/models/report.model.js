const db = require("../config/db");

// Tổng thu (tiền mặt + chuyển khoản)
exports.getTotalRevenue = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
      COALESCE(SUM(soTienThu), 0) AS tongThu
    FROM receipt
    WHERE tenant_id = ?
    AND DATE(thoiGianThu) BETWEEN ? AND ?`,
    [tenant_id, from, to]
  );
  return rows[0];
};

// Doanh thu theo chợ
exports.getRevenueByMarket = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
      m.market_id,
      m.tenCho,
      COALESCE(SUM(r.soTienThu), 0) AS tongThu
    FROM market m
    LEFT JOIN zone z ON z.market_id = m.market_id AND z.tenant_id = m.tenant_id
    LEFT JOIN kiosk k ON k.zone_id = z.zone_id AND k.tenant_id = z.tenant_id
    LEFT JOIN charge c ON c.kiosk_id = k.kiosk_id AND c.tenant_id = k.tenant_id
    LEFT JOIN receipt_charge rc ON rc.charge_id = c.charge_id AND rc.tenant_id = c.tenant_id
    LEFT JOIN receipt r ON r.receipt_id = rc.receipt_id AND r.tenant_id = rc.tenant_id
    WHERE m.tenant_id = ?
    AND (r.thoiGianThu IS NULL OR DATE(r.thoiGianThu) BETWEEN ? AND ?)
    GROUP BY m.market_id, m.tenCho
    ORDER BY tongThu DESC`,
    [tenant_id, from, to]
  );
  return rows;
};

// Doanh thu theo khu vực (zone)
exports.getRevenueByZone = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
      z.zone_id,
      z.tenKhu,
      COALESCE(SUM(r.soTienThu), 0) AS tongThu
    FROM zone z
    LEFT JOIN kiosk k ON k.zone_id = z.zone_id AND k.tenant_id = z.tenant_id
    LEFT JOIN charge c ON c.kiosk_id = k.kiosk_id AND c.tenant_id = k.tenant_id
    LEFT JOIN receipt_charge rc ON rc.charge_id = c.charge_id AND rc.tenant_id = c.tenant_id
    LEFT JOIN receipt r ON r.receipt_id = rc.receipt_id AND r.tenant_id = rc.tenant_id
    WHERE z.tenant_id = ?
    AND (r.thoiGianThu IS NULL OR DATE(r.thoiGianThu) BETWEEN ? AND ?)
    GROUP BY z.zone_id, z.tenKhu
    ORDER BY tongThu DESC`,
    [tenant_id, from, to]
  );
  return rows;
};

// Doanh thu theo nhân viên thu (tiền mặt)
exports.getRevenueByCollector = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
      u.user_id,
      u.hoTen,
      COALESCE(SUM(r.soTienThu), 0) AS tongThu
    FROM users u
    LEFT JOIN receipt r ON r.user_id = u.user_id AND r.tenant_id = u.tenant_id
    WHERE u.tenant_id = ?
    AND u.role_id = (SELECT role_id FROM role WHERE tenVaiTro = 'ThuNgan')
    AND (r.thoiGianThu IS NULL OR DATE(r.thoiGianThu) BETWEEN ? AND ?)
    GROUP BY u.user_id, u.hoTen
    ORDER BY tongThu DESC`,
    [tenant_id, from, to]
  );
  return rows;
};

// Doanh thu chuyển khoản (Stripe)
exports.getRevenueByStripe = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
      COALESCE(SUM(amount), 0) AS tongThuChuyenKhoan
    FROM payment
    WHERE tenant_id = ?
    AND payment_type = 'subscription'
    AND status = 'succeeded'
    AND DATE(created_at) BETWEEN ? AND ?`,
    [tenant_id, from, to]
  );
  return rows[0];
};

// Doanh thu tiền mặt
exports.getRevenueByCash = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
      COALESCE(SUM(soTienThu), 0) AS tongThuTienMat
    FROM receipt
    WHERE tenant_id = ?
    AND hinhThucThanhToan = 'tien_mat'
    AND DATE(thoiGianThu) BETWEEN ? AND ?`,
    [tenant_id, from, to]
  );
  return rows[0];
};

// Tổng hợp đầy đủ
exports.getFullReport = async (tenant_id, from, to) => {
  const totalRevenue = await exports.getTotalRevenue(tenant_id, from, to);
  const stripeRevenue = await exports.getRevenueByStripe(tenant_id, from, to);
  const cashRevenue = await exports.getRevenueByCash(tenant_id, from, to);
  const byMarket = await exports.getRevenueByMarket(tenant_id, from, to);
  const byZone = await exports.getRevenueByZone(tenant_id, from, to);
  const byCollector = await exports.getRevenueByCollector(tenant_id, from, to);

  return {
    from,
    to,
    tongThu: totalRevenue.tongThu,
    tongThuChuyenKhoan: stripeRevenue.tongThuChuyenKhoan,
    tongThuTienMat: cashRevenue.tongThuTienMat,
    theoCho: byMarket,
    theoKhu: byZone,
    theoNhanVien: byCollector
  };
};