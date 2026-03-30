const shiftModel = require("../models/shift.model");
const auditLogModel = require("../models/auditLog.model");
const db = require("../config/db");

// Bắt đầu ca
exports.startShift = async (user, body) => {
  const connection = await db.getConnection();
  console.log(body.market_id);
  try {
    const activeShift = await shiftModel.getActiveShift(
      user.id,
      body.market_id,
      user.tenant_id,
    );

    if (activeShift) {
      throw new Error("Shift already active");
    }

    await connection.beginTransaction();

    const result = await shiftModel.startShift({
      tenant_id: user.tenant_id,
      market_id: body.market_id,
      user_id: user.id,
      thoiGianBatDauCa: new Date(),
    });

    await auditLogModel.createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      market_id: body.market_id,
      hanhDong: "START_SHIFT",
      entity_type: "shift",
      entity_id: result.insertId,
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

// Kết thúc ca
exports.endShift = async (shift_id, user) => {
  const connection = await db.getConnection();
  
  try {
    if (!user) {
      throw new Error("User information is required");
    }

    if (!user.tenant_id || !user.id) {
      throw new Error("Invalid user information");
    }

    const shift = await shiftModel.getShiftById(shift_id, user.tenant_id);

    if (!shift) {
      throw new Error("Shift not found");
    }

    if (shift.user_id !== user.id) {
      throw new Error("You cannot close another user's shift");
    }

    if (shift.thoiGianKetThucCa) {
      throw new Error("Shift already closed");
    }

    await connection.beginTransaction();

    const totals = await shiftModel.calculateShiftTotal(
      shift_id,
      user.tenant_id,
    );

    await shiftModel.updateShiftTotal(
      shift_id,
      user.tenant_id,
      totals.tienMat || 0,
      totals.chuyenKhoan || 0,
    );

    await shiftModel.endShift(shift_id, user.tenant_id, new Date());

    console.log("Writing audit log with data:", {
      tenant_id: user.tenant_id,
      user_id: user.id,
      hanhDong: "END_SHIFT",
      entity_type: "shift",
      entity_id: shift_id,
    });

    await auditLogModel.createAuditLog({
      tenant_id: user.tenant_id,
      user_id: user.id,
      hanhDong: "END_SHIFT",
      entity_type: "shift",
      entity_id: parseInt(shift_id),
    });

    await connection.commit();
    return true;
  } catch (err) {
    await connection.rollback();
    console.error("Error in endShift:", err);
    throw err;
  } finally {
    connection.release();
  }
};

// Lấy danh sách ca
exports.getShifts = async (user) => {
  return await shiftModel.getShifts(user.tenant_id);
};

// Lấy shift đang mở
exports.getActiveShift = async (user) => {
  return await shiftModel.getActiveShift(user.id, user.tenant_id);
};
