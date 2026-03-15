const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");
const db = require("../config/db");

// Tạo charge
exports.createCharge = async (data, user) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const existing = await chargeModel.getChargeByKioskAndPeriod(
      user.tenant_id,
      data.period_id,
      data.kiosk_id,
    );

    if (existing) {
      throw new Error("Charge already exists");
    }

    const result = await chargeModel.createCharge(connection, {
      ...data,
      tenant_id: user.tenant_id,
    });

    await auditLogModel.createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      hanhDong: "CREATE_CHARGE",
      entity_type: "charge",
      entity_id: result.insertId,
      giaTriMoi: data,
    });

    await connection.commit();

    return result;
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// Lấy charge theo period
exports.getChargesByPeriod = async (period_id, user) => {
  return await chargeModel.getChargesByPeriod(user.tenant_id, period_id);
};

// Lấy charge theo merchant
exports.getChargesByMerchant = async (merchant_id, user) => {
  return await chargeModel.getChargesByMerchant(user.tenant_id, merchant_id);
};

// Cập nhật trạng thái charge
exports.updateChargeStatus = async (charge_id, data, user) => {
  const oldCharge = await chargeModel.getChargeById(user.tenant_id, charge_id);

  const result = await chargeModel.updateChargeStatus(
    charge_id,
    user.tenant_id,
    data,
  );

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "UPDATE_CHARGE_STATUS",
    entity_type: "charge",
    entity_id: charge_id,
    giaTriCu: oldCharge,
    giaTriMoi: data,
  });

  return result;
};

// Cập nhật trạng thái nợ
exports.updateDebtStatus = async (charge_id, data, user) => {
  const oldCharge = await chargeModel.getChargeById(user.tenant_id, charge_id);

  if (!oldCharge) {
    throw new Error("Charge not found");
  }

  const newPaidAmount = data.soTienDaThu;

  if (newPaidAmount > oldCharge.soTienPhaiThu) {
    throw new Error("Payment exceeds required amount");
  }

  let status = "chua_thu";

  if (newPaidAmount >= oldCharge.soTienPhaiThu) {
    status = "da_thu";
  } else if (newPaidAmount > 0) {
    status = "no";
  }

  const result = await chargeModel.updateDebtStatus(charge_id, user.tenant_id, {
    soTienDaThu: newPaidAmount,
    trangThai: status,
  });

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "UPDATE_DEBT_STATUS",
    entity_type: "charge",
    entity_id: charge_id,
    giaTriCu: oldCharge,
    giaTriMoi: {
      soTienDaThu: newPaidAmount,
      trangThai: status,
    },
  });

  return result;
};

// Lấy lịch sử thay đổi charge
exports.getChargeHistory = async (charge_id, user) => {
  return await chargeModel.getChargeHistory(user.tenant_id, charge_id);
};
