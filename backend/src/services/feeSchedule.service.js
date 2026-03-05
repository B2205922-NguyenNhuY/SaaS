const feeModel = require("../models/feeSchedule.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo biểu phí
exports.createFee = async (data, user) => {

    const result = await feeModel.createFeeSchedule({
        ...data,
        tenant_id: user.tenant_id
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_FEE",
        entity_type: "fee_schedule",
        entity_id: result.insertId,
        giaTriMoi: data
    });

    return result;
};


// Danh sách biểu phí
exports.getFees = async (user) => {

    return await feeModel.getFeesByTenant(
        user.tenant_id
    );
};


// Chi tiết biểu phí
exports.getFeeDetail = async (fee_id, user) => {

    return await feeModel.getFeeById(
        fee_id,
        user.tenant_id
    );
};


// Cập nhật biểu phí
exports.updateFee = async (fee_id, data, user) => {

    const oldFee = await feeModel.getFeeById(
        fee_id,
        user.tenant_id
    );

    const result = await feeModel.updateFeeSchedule(
        fee_id,
        user.tenant_id,
        data
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "UPDATE_FEE",
        entity_type: "fee_schedule",
        entity_id: fee_id,
        giaTriCu: oldFee,
        giaTriMoi: data
    });

    return result;
};


// Xóa biểu phí
exports.deleteFee = async (fee_id, user) => {

    const oldFee = await feeModel.getFeeById(
        fee_id,
        user.tenant_id
    );

    const result = await feeModel.deleteFeeSchedule(
        fee_id,
        user.tenant_id
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "DELETE_FEE",
        entity_type: "fee_schedule",
        entity_id: fee_id,
        giaTriCu: oldFee
    });

    return result;
};