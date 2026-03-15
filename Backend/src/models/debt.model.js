const db = require("../config/db");

// Danh sách công nợ
exports.getDebts = async (tenant_id, limit, offset) => {
  const sql = `SELECT 
            c.charge_id, c.soTienPhaiThu, c.soTienDaThu,
            (c.soTienPhaiThu - c.soTienDaThu) AS soTienNo,
            m.hoTen, k.maKiosk, z.tenKhu, p.tenKyThu
        FROM charge c
        JOIN merchant m ON c.merchant_id = m.merchant_id AND m.tenant_id = c.tenant_id
        JOIN kiosk k ON c.kiosk_id = k.kiosk_id AND k.tenant_id = c.tenant_id
        JOIN zone z ON k.zone_id = z.zone_id AND z.tenant_id = c.tenant_id
        JOIN collection_period p ON c.period_id = p.period_id AND p.tenant_id = c.tenant_id
        WHERE c.tenant_id = ?
            AND c.trangThai IN ('chua_thu', 'no')
        ORDER BY soTienNo DESC
        LIMIT ? OFFSET ?`;

  // Sử dụng db.query thay vì db.execute nếu vẫn gặp lỗi với LIMIT/OFFSET
  // Hoặc đảm bảo các tham số LIMIT, OFFSET là Number
  const [rows] = await db.query(sql, [
    tenant_id,
    Number(limit),
    Number(offset),
  ]);

  return rows;
};

// Công nợ theo merchant
exports.getDebtsByMerchant = async (tenant_id, merchant_id) => {
  const [rows] = await db.execute(
    `SELECT 
            c.charge_id,
            c.soTienPhaiThu,
            c.soTienDaThu,
            (c.soTienPhaiThu - c.soTienDaThu) AS soTienNo,
            k.kiosk_id,
            k.maKiosk,
            z.zone_id,
            z.tenKhu,
            p.period_id,
            p.tenKyThu
        FROM charge c
        JOIN kiosk k 
            ON c.kiosk_id = k.kiosk_id
            AND k.tenant_id = c.tenant_id
        JOIN zone z
            ON k.zone_id = z.zone_id
            AND z.tenant_id = c.tenant_id
        JOIN collection_period p 
            ON c.period_id = p.period_id
            AND p.tenant_id = c.tenant_id
        WHERE c.tenant_id = ?
            AND c.merchant_id = ?
            AND c.trangThai IN ('chua_thu', 'no')`,
    [tenant_id, merchant_id],
  );
  return rows;
};

// Tổng công nợ
exports.getTotalDebt = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT 
            COALESCE(SUM(soTienPhaiThu - soTienDaThu), 0) AS tongNo
        FROM charge
        WHERE tenant_id = ?
            AND trangThai IN ('chua_thu', 'no')`,
    [tenant_id],
  );
  return rows[0];
};

// Top merchant nợ nhiều nhất
exports.getTopDebtors = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT 
            m.merchant_id,
            m.hoTen,
            COALESCE(SUM(c.soTienPhaiThu - c.soTienDaThu), 0) AS tongNo,
            COUNT(DISTINCT c.kiosk_id) AS soKioskNo
        FROM merchant m
        LEFT JOIN charge c 
            ON c.merchant_id = m.merchant_id
            AND c.tenant_id = m.tenant_id
            AND c.trangThai IN ('chua_thu', 'no')
        WHERE m.tenant_id = ?
            AND m.trangThai = 'active'
        GROUP BY m.merchant_id, m.hoTen
        HAVING tongNo > 0
        ORDER BY tongNo DESC
        LIMIT 10`,
    [tenant_id],
  );
  return rows;
};
