const db = require("../config/database");

// Tạo charge
exports.createCharge = async (connection, data) => {
  const {
    tenant_id,
    period_id,
    kiosk_id,
    merchant_id,
    fee_id,
    donGiaApDung,
    hinhThucApDung,
    discountApDung, // THÊM TRƯỜNG NÀY
    soTienPhaiThu,
    soTienDaThu,
    trangThai,
    version,
  } = data;

  // Đảm bảo số lượng dấu ? khớp với số lượng phần tử trong mảng (11 trường)
  const sql = `
        INSERT INTO charge
        (
            tenant_id,
            period_id,
            kiosk_id,
            merchant_id,
            fee_id,
            donGiaApDung,
            hinhThucApDung,
            discountApDung,
            soTienPhaiThu,
            soTienDaThu,
            trangThai,
            version
        )
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `;

  const [result] = await connection.execute(sql, [
    tenant_id ?? null,
    period_id ?? null,
    kiosk_id ?? null,
    merchant_id ?? null,
    fee_id ?? null,
    donGiaApDung ?? 0,
    hinhThucApDung ?? "thang",
    discountApDung ?? 0, // Giá trị mặc định là 0
    soTienPhaiThu ?? 0,
    soTienDaThu ?? 0,
    trangThai ?? "chua_thu",
    version ?? 1,
  ]);

  return result;
};

// Lấy danh sách charge theo kỳ
exports.getChargesByPeriod = async (tenant_id, period_id) => {
  const [rows] = await db.execute(
    `SELECT c.*, k.maKiosk, m.hoTen
        FROM charge c
        JOIN kiosk k 
            ON c.kiosk_id = k.kiosk_id
            AND k.tenant_id = c.tenant_id

        JOIN merchant m 
            ON c.merchant_id = m.merchant_id
            AND m.tenant_id = c.tenant_id
        WHERE c.tenant_id = ?
        AND c.period_id = ?`,
    [tenant_id, period_id],
  );

  return rows;
};

// Lấy charge theo merchant
exports.getChargesByMerchant = async (tenant_id, merchant_id) => {
  const [rows] = await db.execute(
    `SELECT *
        FROM charge
        WHERE tenant_id = ?
        AND merchant_id = ?`,
    [tenant_id, merchant_id],
  );

  return rows;
};

// Lấy charge theo id
exports.getChargeById = async (tenant_id, charge_id) => {
  const [rows] = await db.execute(
    `SELECT 
            charge_id,
            tenant_id,
            period_id,
            kiosk_id,
            merchant_id,
            fee_id,
            CAST(donGiaApDung AS DECIMAL(12,2)) as donGiaApDung,
            hinhThucApDung,
            CAST(discountApDung AS DECIMAL(5,2)) as discountApDung,
            CAST(soTienPhaiThu AS DECIMAL(12,2)) as soTienPhaiThu,
            CAST(soTienDaThu AS DECIMAL(12,2)) as soTienDaThu,
            trangThai,
            version
        FROM charge
        WHERE tenant_id = ? AND charge_id = ?`,
    [tenant_id, charge_id],
  );

  if (rows[0]) {
    rows[0].soTienPhaiThu = parseFloat(rows[0].soTienPhaiThu);
    rows[0].soTienDaThu = parseFloat(rows[0].soTienDaThu);
  }

  return rows[0];
};

// Cập nhật trạng thái charge
exports.updateChargeStatus = async (charge_id, tenant_id, data) => {
  const { trangThai, soTienDaThu } = data;

  let sql = `UPDATE charge SET trangThai = ?`;
  let params = [trangThai];

  if (soTienDaThu !== undefined) {
    sql += `, soTienDaThu = ?`;
    params.push(soTienDaThu);
  }

  sql += ` WHERE charge_id = ? AND tenant_id = ?`;
  params.push(charge_id, tenant_id);

  const [result] = await db.execute(sql, params);
  return result;
};

// Cập nhật trạng thái nợ
exports.updateDebtStatus = async (charge_id, tenant_id, data) => {
  const { soTienDaThu, trangThai } = data;

  const [result] = await db.execute(
    `UPDATE charge
        SET soTienDaThu = ?,
            trangThai = ?
        WHERE charge_id = ?
        AND tenant_id = ?`,
    [soTienDaThu, trangThai, charge_id, tenant_id],
  );

  return result;
};

// Lấy lịch sử chỉnh sửa công nợ
exports.getChargeHistory = async (tenant_id, charge_id) => {
  const [rows] = await db.execute(
    `SELECT 
            al.*,
            u.hoTen

        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.user_id

        WHERE al.entity_type = 'charge'
        AND al.entity_id = ?
        AND al.tenant_id = ?

        ORDER BY al.thoiGianThucHien DESC`,
    [charge_id, tenant_id],
  );

  return rows;
};

// Recalculate charges khi có thay đổi giá hoặc discount
exports.recalculateChargesByTarget = async (
  connection,
  tenant_id,
  target_type,
  target_id,
  newPrice,
  discount,
) => {
  discount = discount || 0;

  const finalAmount = newPrice - (newPrice * discount) / 100;

  let condition = "";

  if (target_type === "zone") {
    condition = "k.zone_id = ?";
  }

  if (target_type === "kiosk") {
    condition = "c.kiosk_id = ?";
  }

  if (target_type === "kiosk_type") {
    condition = "k.type_id = ?";
  }

  const sql = `
        UPDATE charge c
        JOIN kiosk k 
        ON c.kiosk_id = k.kiosk_id 
        AND k.tenant_id = c.tenant_id
        SET
            c.donGiaApDung = ?,
            c.soTienPhaiThu = ?,
            c.version = c.version + 1
        WHERE c.tenant_id = ?
        AND c.trangThai != 'da_thu'
        AND ${condition}
    `;

  const [result] = await connection.execute(sql, [
    newPrice,
    finalAmount,
    tenant_id,
    target_id,
  ]);

  return result;
};

// Kiểm tra charge đã tồn tại theo kiosk và period
exports.getChargeByKioskAndPeriod = async (tenant_id, kiosk_id, period_id) => {
  const [rows] = await db.execute(
    `SELECT * FROM charge 
         WHERE tenant_id = ? 
         AND kiosk_id = ? 
         AND period_id = ?
         LIMIT 1`,
    [tenant_id, kiosk_id, period_id],
  );
  return rows[0];
};
