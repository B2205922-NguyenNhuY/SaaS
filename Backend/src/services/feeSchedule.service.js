const db = require("../config/db");
const feeScheduleModel = require("../models/feeSchedule.model");
const feeAssignmentModel = require("../models/feeAssignment.model");
const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");

// Tạo biểu phí
exports.createFee = async (data, user) => {
  const result = await feeScheduleModel.createFeeSchedule({
    ...data,
    tenant_id: user.tenant_id,
  });

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "CREATE_FEE",
    entity_type: "fee_schedule",
    entity_id: result.insertId,
    giaTriMoi: data,
  });

  return result;
};

// Danh sách biểu phí
exports.getFees = async (user) => {
  return await feeScheduleModel.getFeesByTenant(user.tenant_id);
};

// Chi tiết biểu phí
exports.getFeeDetail = async (fee_id, user) => {
  return await feeScheduleModel.getFeeById(fee_id, user.tenant_id);
};

// Cập nhật biểu phí
exports.updateFee = async (fee_id, data, user) => {
  if (!fee_id) throw new Error("Fee ID is required");
  if (!user || !user.tenant_id) throw new Error("User information is missing");

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const tenant_id = user.tenant_id;
    const oldFee = await feeScheduleModel.getFeeById(fee_id, tenant_id);
    if (!oldFee) throw new Error("Fee not found");

    await feeScheduleModel.updateFeeSchedule(fee_id, tenant_id, data);

    await auditLogModel.createAuditLog({
      tenant_id,
      user_id: user.id,
      hanhDong: "UPDATE_FEE",
      entity_type: "fee_schedule",
      entity_id: parseInt(fee_id),
      giaTriCu: oldFee,
      giaTriMoi: data,
    });

    await connection.commit();
    return { success: true };
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// Xóa biểu phí
exports.deleteFee = async (fee_id, user) => {
  try {
    const oldFee = await feeScheduleModel.getFeeById(fee_id, user.tenant_id);

    const result = await feeScheduleModel.deleteFeeSchedule(
      fee_id,
      user.tenant_id,
    );

    await auditLogModel.createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      hanhDong: "DELETE_FEE",
      entity_type: "fee_schedule",
      entity_id: fee_id,
      giaTriCu: oldFee,
    });

    return result;
   } catch (err) {

    // 💥 FK constraint → đang bị dùng
    if (err.code === 'ER_ROW_IS_REFERENCED_2') {
      const error = new Error("Phí này đang được áp dụng");
      error.statusCode = 400;
      throw error;
    }

    // lỗi khác → ném tiếp
    throw err;
  }
};
