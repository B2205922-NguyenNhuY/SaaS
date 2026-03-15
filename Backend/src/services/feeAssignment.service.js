const db = require("../config/db");
const chargeModel = require("../models/charge.model");
const feeAssignmentModel = require("../models/feeAssignment.model");
const auditLogModel = require("../models/auditLog.model");

// Tạo fee assignment
exports.createAssignment = async (data, user) => {
  const result = await feeAssignmentModel.createFeeAssignment({
    ...data,
    tenant_id: user.tenant_id,
  });

  await auditLogModel.createAuditLog({
    tenant_id: user.tenant_id,
    user_id: user.id,
    hanhDong: "CREATE_FEE_ASSIGNMENT",
    entity_type: "fee_assignment",
    entity_id: result.insertId,
    giaTriMoi: data,
  });

  return result;
};

// Lấy assignment theo target -
exports.getAssignmentsByTarget = async (target_type, target_id, user) => {
  if (!target_type || !target_id || !user?.tenant_id) {
    console.error("Missing parameters:", { target_type, target_id, user });
    throw new Error("Missing required parameters for fee assignment query");
  }

  try {
    const result = await feeAssignmentModel.getActiveFeeAssignment(
      user.tenant_id,
      target_type,
      target_id,
    );

    return result;
  } catch (error) {
    console.error("Service error in getAssignmentsByTarget:", error);
    throw error;
  }
};

// lấy assignment theo fee
exports.getAssignmentsByFee = async (fee_id, user) => {
  if (!fee_id || !user?.tenant_id) {
    throw new Error("Missing required parameters");
  }

  return await feeAssignmentModel.getAssignmentsByFee(user.tenant_id, fee_id);
};

// Deactivate assignment
exports.deactivateAssignment = async (assignment_id, user) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const tenant_id = user.tenant_id;

    const assignment = await feeAssignmentModel.getById(
      assignment_id,
      tenant_id,
    );

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    await feeAssignmentModel.deactivateAssignment(assignment_id, tenant_id);

    await chargeModel.recalculateChargesByTarget(
      connection,
      tenant_id,
      assignment.target_type,
      assignment.target_id,
      assignment.donGia,
      0,
    );

    await auditLogModel.createAuditLog({
      tenant_id,
      user_id: user.id,
      hanhDong: "DEACTIVATE_FEE_ASSIGNMENT",
      entity_type: "fee_assignment",
      entity_id: assignment_id,
    });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};

// Cập nhật mức miễn giảm
exports.updateDiscount = async (assignment_id, data, user) => {
  if (data.mucMienGiam < 0 || data.mucMienGiam > 100) {
    throw new Error("Invalid discount value");
  }

  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const tenant_id = user.tenant_id;

    const assignment = await feeAssignmentModel.getById(
      assignment_id,
      tenant_id,
    );

    if (!assignment) {
      throw new Error("Assignment not found");
    }

    const oldDiscount = assignment.mucMienGiam;

    await feeAssignmentModel.updateDiscount(
      connection,
      assignment_id,
      tenant_id,
      data.mucMienGiam,
    );

    await chargeModel.recalculateChargesByTarget(
      connection,
      tenant_id,
      assignment.target_type,
      assignment.target_id,
      assignment.donGia,
      data.mucMienGiam,
    );

    await auditLogModel.createAuditLog({
      tenant_id,
      user_id: user.id,
      hanhDong: "UPDATE_FEE_DISCOUNT",
      entity_type: "fee_assignment",
      entity_id: assignment_id,
      giaTriCu: { mucMienGiam: oldDiscount },
      giaTriMoi: { mucMienGiam: data.mucMienGiam },
    });

    await connection.commit();
  } catch (err) {
    await connection.rollback();
    throw err;
  } finally {
    connection.release();
  }
};
