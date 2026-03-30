const db = require("../config/db");

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


// Tìm kỳ thu theo ngày cụ thể
exports.findPeriodByDate = async (tenant_id, dateString, loaiKy = 'ngay') => {
    const sql = `
        SELECT * FROM collection_period 
        WHERE tenant_id = ? 
          AND DATE(ngayBatDau) = ? 
          AND loaiKy = ?
        LIMIT 1
    `;
    const [rows] = await db.execute(sql, [tenant_id, dateString, loaiKy]);
    return rows[0];
};

// Tìm kỳ thu dựa trên tháng và năm
exports.findPeriodByMonth = async (tenant_id, month, year, loaiKy = 'thang') => {
    const sql = `
        SELECT * FROM collection_period 
        WHERE tenant_id = ? 
          AND MONTH(ngayBatDau) = ? 
          AND YEAR(ngayBatDau) = ?
          AND loaiKy = ?
        LIMIT 1
    `;
    const [rows] = await db.execute(sql, [tenant_id, month, year, loaiKy]);
    return rows[0];
};

// Tạo mới một kỳ thu
exports.createPeriod = async (data) => {
    const { tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy } = data;
    const sql = `
        INSERT INTO collection_period (tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy)
        VALUES (?, ?, ?, ?, ?)
    `;
    const [result] = await db.execute(sql, [tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy]);
    return result.insertId;
};
