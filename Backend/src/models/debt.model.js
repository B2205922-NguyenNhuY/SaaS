const db = require("../config/db");

exports.getDebts = async (tenant_id, pagination, query = {}) => {
  const where = ["c.tenant_id = ?", "c.trangThai IN ('chua_thu', 'no')"];
  const params = [tenant_id];

  if (query.merchant_id) {
    where.push("c.merchant_id = ?");
    params.push(Number(query.merchant_id));
  }

  if (query.zone_id) {
    where.push("z.zone_id = ?");
    params.push(Number(query.zone_id));
  }

  if (query.market_id) {
    where.push("mk.market_id = ?");
    params.push(Number(query.market_id));
  }

  if (query.q) {
    where.push("(m.hoTen LIKE ? OR k.maKiosk LIKE ? OR p.tenKyThu LIKE ?)");
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
  }

  const baseJoin = `
    FROM charge c
    JOIN merchant m ON c.merchant_id = m.merchant_id AND m.tenant_id = c.tenant_id
    JOIN kiosk k ON c.kiosk_id = k.kiosk_id AND k.tenant_id = c.tenant_id
    JOIN zone z ON k.zone_id = z.zone_id AND z.tenant_id = c.tenant_id
    JOIN market mk ON mk.market_id = z.market_id AND mk.tenant_id = z.tenant_id
    JOIN collection_period p ON c.period_id = p.period_id AND p.tenant_id = c.tenant_id
  `;

  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total ${baseJoin} WHERE ${where.join(" AND ")}`,
    params,
  );

  const [rows] = await db.query(
    `SELECT
      c.charge_id,
      c.merchant_id,
      c.kiosk_id,
      z.zone_id,
      mk.market_id,
      c.soTienPhaiThu,
      c.soTienDaThu,
      (c.soTienPhaiThu - c.soTienDaThu) AS soTienNo,
      m.hoTen,
      k.maKiosk,
      z.tenKhu,
      p.tenKyThu
     ${baseJoin}
     WHERE ${where.join(" AND ")}
     ORDER BY soTienNo DESC, c.created_at DESC
     LIMIT ? OFFSET ?`,
    [...params, Number(pagination.limit), Number(pagination.offset)],
  );

  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 0,
    },
  };
};

exports.getDebtsByCharge = async (tenant_id, charge_id) => {
  const [rows] = await db.execute(
    `SELECT 
            c.charge_id,
            c.soTienPhaiThu,
            c.soTienDaThu,
            (c.soTienPhaiThu - c.soTienDaThu) AS amount,
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
            AND c.charge_id = ?`,
    [tenant_id, charge_id],
  );
  return rows;
};

// Công nợ theo merchant
exports.getDebtsByMerchant = async (tenant_id, merchant_id) => {
  const [rows] = await db.execute(
    `SELECT 
      c.charge_id,
      c.soTienPhaiThu,
      c.soTienDaThu,
      c.donGiaApDung,
      c.discountApDung,
      (c.soTienPhaiThu - c.soTienDaThu) AS soTienNo,
      c.merchant_id,
      k.kiosk_id,
      k.maKiosk,
      z.zone_id,
      z.tenKhu,
      mk.market_id,
      p.period_id,
      p.tenKyThu
    FROM charge c
    JOIN kiosk k ON c.kiosk_id = k.kiosk_id AND k.tenant_id = c.tenant_id
    JOIN zone z ON k.zone_id = z.zone_id AND z.tenant_id = c.tenant_id
    JOIN market mk ON mk.market_id = z.market_id AND mk.tenant_id = z.tenant_id
    JOIN collection_period p ON c.period_id = p.period_id AND p.tenant_id = c.tenant_id
    WHERE c.tenant_id = ?
      AND c.merchant_id = ?
      AND c.trangThai IN ('chua_thu', 'no')`,
    [tenant_id, merchant_id],
  );
  return rows;
};

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
