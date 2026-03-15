const periodModel = require("../models/collectionPeriod.model");
const auditLogModel = require("../models/auditLog.model");
const db = require("../config/db");
const chargeModel = require("../models/charge.model");

// 1. TẠO KỲ THU (CREATE)
exports.createPeriod = async (data, user) => {
  const connection = await db.getConnection();
  try {
    const tenant_id = user.tenant_id;
    await connection.beginTransaction();

    const { ngayBatDau, ngayKetThuc } = data;

    // KIỂM TRA TRÙNG LẤN (OVERLAP)
    const [exist] = await connection.execute(
      `SELECT period_id FROM collection_period 
             WHERE tenant_id = ? 
             AND ((? BETWEEN ngayBatDau AND ngayKetThuc) 
                  OR (? BETWEEN ngayBatDau AND ngayKetThuc))`,
      [tenant_id, ngayBatDau, ngayKetThuc],
    );

    if (exist.length > 0) {
      const error = new Error(
        "Collection period overlaps with an existing one",
      );
      error.status = 409;
      throw error;
    }

    // TẠO KỲ THU TRONG DATABASE
    const result = await periodModel.createCollectionPeriod(connection, {
      tenant_id,
      ...data,
    });
    const period_id = result.insertId;

    // QUÉT KIOSK ĐANG HOẠT ĐỘNG ĐỂ TẠO PHÍ (CHARGE)
    const [kiosks] = await connection.execute(
      `SELECT ka.kiosk_id, ka.merchant_id, k.zone_id, k.type_id
             FROM kiosk_assignment ka
             JOIN kiosk k ON ka.kiosk_id = k.kiosk_id
             WHERE ka.trangThai = 'active'
             AND (ka.ngayKetThuc IS NULL OR ka.ngayKetThuc >= ?)
             AND ka.tenant_id = ?`,
      [ngayBatDau, tenant_id],
    );

    for (const kiosk of kiosks) {
      let fee = null;

      // Ưu tiên 1: Phí theo Kiosk
      const [feeKiosk] = await connection.execute(
        `SELECT fs.* FROM fee_assignment fa
                 JOIN fee_schedule fs ON fs.fee_id = fa.fee_id
                 WHERE fa.tenant_id = ? AND fa.target_type = 'kiosk' 
                 AND fa.target_id = ? AND fa.trangThai = 'active' LIMIT 1`,
        [tenant_id, kiosk.kiosk_id],
      );

      if (feeKiosk.length > 0) fee = feeKiosk[0];

      // Ưu tiên 2: Phí theo Loại Kiosk
      if (!fee) {
        const [feeType] = await connection.execute(
          `SELECT fs.* FROM fee_assignment fa
                     JOIN fee_schedule fs ON fs.fee_id = fa.fee_id
                     WHERE fa.tenant_id = ? AND fa.target_type = 'kiosk_type' 
                     AND fa.target_id = ? AND fa.trangThai = 'active' LIMIT 1`,
          [tenant_id, kiosk.type_id],
        );
        if (feeType.length > 0) fee = feeType[0];
      }

      // Ưu tiên 3: Phí theo Khu vực (Zone)
      if (!fee) {
        const [feeZone] = await connection.execute(
          `SELECT fs.*, fa.mucMienGiam FROM fee_assignment fa
                     JOIN fee_schedule fs ON fs.fee_id = fa.fee_id
                     WHERE fa.tenant_id = ? AND fa.target_type = 'zone' 
                     AND fa.target_id = ? AND fa.trangThai = 'active' 
                     AND fa.ngayApDung <= ? ORDER BY fa.ngayApDung DESC LIMIT 1`,
          [tenant_id, kiosk.zone_id, ngayBatDau],
        );
        if (feeZone.length > 0) fee = feeZone[0];
      }

      if (!fee) continue;

      const discount = fee.mucMienGiam || 0;
      const finalAmount = fee.donGia - (fee.donGia * discount) / 100;

      await chargeModel.createCharge(connection, {
        tenant_id,
        period_id,
        kiosk_id: kiosk.kiosk_id,
        merchant_id: kiosk.merchant_id,
        fee_id: fee.fee_id,
        donGiaApDung: fee.donGia,
        hinhThucApDung: fee.hinhThuc,
        soTienPhaiThu: finalAmount,
        soTienDaThu: 0,
        trangThai: "chua_thu",
        version: 1,
      });
    }

    // GHI LOG
    await auditLogModel.createAuditLog({
      tenant_id,
      user_id: user.id,
      hanhDong: "CREATE_COLLECTION_PERIOD",
      entity_type: "collection_period",
      entity_id: period_id,
      giaTriMoi: data,
    });

    await connection.commit();
    return { insertId: period_id };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// 2. DANH SÁCH KỲ THU
exports.getPeriods = async (user) => {
  return await periodModel.getCollectionPeriodsByTenant(user.tenant_id);
};

// 3. CHI TIẾT KỲ THU
exports.getPeriodDetail = async (period_id, user) => {
  return await periodModel.getCollectionPeriodById(period_id, user.tenant_id);
};

// 4. CẬP NHẬT KỲ THU
exports.updatePeriod = async (period_id, data, user) => {
  const oldData = await periodModel.getCollectionPeriodById(
    period_id,
    user.tenant_id,
  );
  const result = await periodModel.updateCollectionPeriod(
    period_id,
    user.tenant_id,
    data,
  );

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "UPDATE_COLLECTION_PERIOD",
    entity_type: "collection_period",
    entity_id: period_id,
    giaTriCu: oldData,
    giaTriMoi: data,
  });
  return result;
};

// 5. XÓA KỲ THU
exports.deletePeriod = async (period_id, user) => {
  const oldData = await periodModel.getCollectionPeriodById(
    period_id,
    user.tenant_id,
  );
  const result = await periodModel.deleteCollectionPeriod(
    period_id,
    user.tenant_id,
  );

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "DELETE_COLLECTION_PERIOD",
    entity_type: "collection_period",
    entity_id: period_id,
    giaTriCu: oldData,
  });
  return result;
};
