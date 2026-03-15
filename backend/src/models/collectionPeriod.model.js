const db = require("../config/database");

// Tạo kỳ thu
exports.createCollectionPeriod = async (connection, data) => {
  const { tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy } = data;

  const [result] = await connection.execute(
    `INSERT INTO collection_period
        (tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy)
        VALUES (?, ?, ?, ?, ?)`,
    [tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy],
  );

  return result;
};

// Lấy danh sách kỳ thu theo tenant
exports.getCollectionPeriodsByTenant = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT *
        FROM collection_period
        WHERE tenant_id = ?
        ORDER BY ngayBatDau DESC`,
    [tenant_id],
  );

  return rows;
};

// Lấy chi tiết kỳ thu
exports.getCollectionPeriodById = async (period_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT *
        FROM collection_period
        WHERE period_id = ?
        AND tenant_id = ?
        LIMIT 1`,
    [period_id, tenant_id],
  );

  return rows[0];
};

// Update kỳ thu
exports.updateCollectionPeriod = async (period_id, tenant_id, data) => {
  const { tenKyThu, ngayBatDau, ngayKetThuc, loaiKy } = data;

  const [result] = await db.execute(
    `UPDATE collection_period
        SET tenKyThu=?, ngayBatDau=?, ngayKetThuc=?, loaiKy=?
        WHERE period_id=? AND tenant_id=?`,
    [tenKyThu, ngayBatDau, ngayKetThuc, loaiKy, period_id, tenant_id],
  );
  return result;
};

// Delete kỳ thu
exports.deleteCollectionPeriod = async (period_id, tenant_id) => {
  const [checkRows] = await db.execute(
    `SELECT COUNT(*) as charge_count 
         FROM charge 
         WHERE period_id = ? AND tenant_id = ?`,
    [period_id, tenant_id],
  );

  const chargeCount = checkRows[0].charge_count;

  if (chargeCount > 0) {
    const error = new Error(
      `Cannot delete period because it has ${chargeCount} existing charges`,
    );
    error.status = 400;
    error.code = "PERIOD_HAS_CHARGES";
    throw error;
  }

  const [result] = await db.execute(
    `DELETE FROM collection_period
         WHERE period_id = ? AND tenant_id = ?`,
    [period_id, tenant_id],
  );

  return result;
};
