const shiftModel = require("../models/shift.model");
const auditLogModel = require("../models/auditLog.model");


// Bắt đầu ca
exports.startShift = async (user) => {

    const activeShift = await shiftModel.getActiveShift(
        user.id,
        user.tenant_id
    );

    if (activeShift) {
        throw new Error("Shift already active");
    }

    const result = await shiftModel.startShift({
        tenant_id: user.tenant_id,
        user_id: user.id,
        thoiGianBatDauCa: new Date()
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "START_SHIFT",
        entity_type: "shift",
        entity_id: result.insertId
    });

    return result;
};


// Kết thúc ca
exports.endShift = async (shift_id, user) => {

    const totals = await shiftModel.calculateShiftTotal(
        shift_id,
        user.tenant_id
    );

    await shiftModel.updateShiftTotal(
        shift_id,
        user.tenant_id,
        totals.tienMat || 0,
        totals.chuyenKhoan || 0
    );

    await shiftModel.endShift(
        shift_id,
        user.tenant_id,
        new Date()
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "END_SHIFT",
        entity_type: "shift",
        entity_id: shift_id
    });

    return true;
};


// Lấy shift đang mở
exports.getShifts = async (user) => {

    return await shiftModel.getShifts(
        user.tenant_id
    );
};