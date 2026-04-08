const db = require("../config/db");

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
    discountApDung, 
    soTienPhaiThu,
    soTienDaThu,
    trangThai,
    version,
  } = data;

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
    discountApDung ?? 0,
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
exports.getChargesById = async (tenant_id, charge_id) => {
  const [rows] = await db.execute(
    `SELECT 
            c.charge_id,
            c.tenant_id,
            c.period_id,
            c.kiosk_id,
            c.merchant_id,
            c.fee_id,
            CAST(c.donGiaApDung AS DECIMAL(12,2)) as donGiaApDung,
            c.hinhThucApDung,
            CAST(c.discountApDung AS DECIMAL(5,2)) as discountApDung,
            CAST(c.soTienPhaiThu AS DECIMAL(12,2)) as soTienPhaiThu,
            CAST(c.soTienDaThu AS DECIMAL(12,2)) as soTienDaThu,
            c.trangThai,
            k.maKiosk,
            cp.tenKyThu
        FROM charge c
        JOIN kiosk k ON c.kiosk_id = k.kiosk_id
        JOIN collection_period cp ON c.period_id = cp.period_id
        WHERE c.tenant_id = ? AND c.charge_id = ?`,
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
exports.updateDebtStatus = async (charge_id, tenant_id, data, conn) => {
  const { soTienDaThu, trangThai } = data;
  connection = conn || db;
  const [result] = await connection.execute(
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

exports.getPaymentHistoryByCharge = async (chargeId, tenantId) => {
  
  console.log("chargeId", chargeId);
  console.log("tenantid", tenantId);

  const [rows] = await db.execute(
    `SELECT 
      r.receipt_id,
      r.soTienThu,
      rc.soTienDaTra,
      r.hinhThucThanhToan,
      r.thoiGianThu,
      r.ghiChu,
      r.anhChupThanhToan
    FROM receipt_charge rc
    JOIN receipt r 
      ON rc.receipt_id = r.receipt_id 
      AND rc.tenant_id = r.tenant_id
    WHERE rc.charge_id = ?
      AND rc.tenant_id = ?
    ORDER BY r.thoiGianThu DESC`,
    [chargeId, tenantId]
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

// SQL sinh phí hàng loạt
exports.insertAutoCharges = async (tenant_id, period_id, loaiKy) => {
    const sql = `
        INSERT INTO charge (
            tenant_id, period_id, kiosk_id, merchant_id, fee_id, 
            donGiaApDung, hinhThucApDung, discountApDung, soTienPhaiThu, trangThai
        )
        SELECT 
            k.tenant_id, ?, k.kiosk_id, ka.merchant_id, 
            fs.fee_id, fs.donGia, fs.hinhThuc, fa.mucMienGiam,
            fs.donGia * (1 - fa.mucMienGiam / 100),
            'chua_thu'
        FROM kiosk k
        JOIN kiosk_assignment ka 
          ON k.kiosk_id = ka.kiosk_id 
          AND ka.tenant_id = k.tenant_id
          AND ka.trangThai = 'active'
          AND ka.ngayBatDau <= (SELECT ngayKetThuc FROM collection_period WHERE period_id = ? AND tenant_id = ?)
        JOIN fee_assignment fa ON (
            (fa.target_type = 'kiosk'      AND fa.target_id = k.kiosk_id) OR
            (fa.target_type = 'zone'       AND fa.target_id = k.zone_id)  OR
            (fa.target_type = 'kiosk_type' AND fa.target_id = k.type_id)
        )
        AND fa.tenant_id = k.tenant_id
        AND fa.trangThai = 'active'
        JOIN fee_schedule fs 
            ON fa.fee_id = fs.fee_id
            AND fs.tenant_id = k.tenant_id
            AND fs.hinhThuc = ?
        WHERE k.tenant_id = ? 
          AND k.trangThai = 'occupied'
          -- Chưa có khoản thu cho kiosk+period+fee này
          AND NOT EXISTS (
              SELECT 1 FROM charge c 
              WHERE c.kiosk_id = k.kiosk_id 
                AND c.period_id = ?
                AND c.fee_id = fs.fee_id
                AND c.tenant_id = k.tenant_id
          )
    `;

    const [result] = await db.execute(sql, [period_id, period_id, tenant_id, loaiKy, tenant_id, period_id]);

    const [rows] = await db.execute(
        `SELECT DISTINCT merchant_id FROM charge WHERE tenant_id = ? AND period_id = ?`,
        [tenant_id, period_id]
    );

    return {
        count: result.affectedRows,
        Ids: rows.map(r => r.merchant_id)
    };
};

exports.getExpiredCharges = async () => {
  const sql = `
            SELECT 
                c.tenant_id, 
                c.merchant_id
            FROM charge c
            JOIN collection_period p ON c.period_id = p.period_id AND c.tenant_id = p.tenant_id
            WHERE c.trangThai NOT IN ('da_thu', 'mien') 
              AND p.ngayKetThuc < NOW()
            GROUP BY c.tenant_id, c.merchant_id
        `;

  const [result] = await db.query(sql);
  return result;
}

exports.updatePendingCharges = async () => {
  const [result] = await db.query(`
      UPDATE charge c
      JOIN collection_period p 
        ON p.period_id = c.period_id 
       AND p.tenant_id = c.tenant_id
      SET c.trangThai = 'no'
      WHERE 
        p.ngayKetThuc < NOW()
        AND c.soTienDaThu < c.soTienPhaiThu
        AND c.trangThai NOT IN ('da_thu','mien')
    `);
  return result;
}