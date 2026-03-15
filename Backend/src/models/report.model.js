const db = require("../config/db");

// Tổng thu
exports.getTotalRevenue = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
            COALESCE(SUM(soTienThu),0) AS tongThu
        FROM receipt
        WHERE tenant_id = ?
        AND thoiGianThu BETWEEN ? AND ?`,
    [tenant_id, from, to],
  );

  return rows[0];
};

// Thu theo khu
exports.getRevenueByZone = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
            z.tenKhu,
            SUM(rc.soTienDaTra) AS tongThu
        FROM receipt_charge rc

        JOIN charge c 
        ON rc.charge_id = c.charge_id
        AND c.tenant_id = rc.tenant_id

        JOIN kiosk k 
        ON c.kiosk_id = k.kiosk_id
        AND k.tenant_id = rc.tenant_id

        JOIN zone z 
        ON k.zone_id = z.zone_id
        AND z.tenant_id = rc.tenant_id

        JOIN receipt r 
        ON rc.receipt_id = r.receipt_id
        AND r.tenant_id = rc.tenant_id

        WHERE rc.tenant_id = ?
        AND r.thoiGianThu BETWEEN ? AND ?

        GROUP BY z.zone_id`,
    [tenant_id, from, to],
  );

  return rows;
};

// Thu theo nhân viên
exports.getRevenueByCollector = async (tenant_id, from, to) => {
  const [rows] = await db.execute(
    `SELECT 
            u.hoTen,
            SUM(r.soTienThu) AS tongThu

        FROM receipt r
        
        JOIN users u 
        ON r.user_id = u.user_id
        AND u.tenant_id = r.tenant_id

        WHERE r.tenant_id = ?
        AND r.thoiGianThu BETWEEN ? AND ?

        GROUP BY u.user_id`,
    [tenant_id, from, to],
  );

  return rows;
};
