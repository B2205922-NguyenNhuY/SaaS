const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo charge
exports.createCharge = async (data, user) => {

    const result = await chargeModel.createCharge({
        ...data,
        tenant_id: user.tenant_id
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_CHARGE",
        entity_type: "charge",
        entity_id: result.insertId,
        giaTriMoi: data
    });

    return result;
};


// Lấy charge theo period
exports.getChargesByPeriod = async (period_id, user) => {

    return await chargeModel.getChargesByPeriod(
        user.tenant_id,
        period_id
    );
};


// Lấy charge theo merchant
exports.getChargesByMerchant = async (merchant_id, user) => {

    return await chargeModel.getChargesByMerchant(
        user.tenant_id,
        merchant_id
    );
};


// Cập nhật trạng thái charge
exports.updateChargeStatus = async (charge_id, status, user) => {

    const oldCharge = await chargeModel.getChargeById(
        user.tenant_id,
        charge_id
    );

    const result = await chargeModel.updateChargeStatus(
        charge_id,
        user.tenant_id,
        status
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "UPDATE_CHARGE_STATUS",
        entity_type: "charge",
        entity_id: charge_id,
        giaTriCu: oldCharge,
        giaTriMoi: { trangThai: status }
    });

    return result;
};


// Cập nhật trạng thái nợ
exports.updateDebtStatus = async (charge_id, data, user) => {

    const oldCharge = await chargeModel.getChargeById(
        user.tenant_id,
        charge_id
    );

    const result = await chargeModel.updateDebtStatus(
        charge_id,
        user.tenant_id,
        data
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "UPDATE_DEBT_STATUS",
        entity_type: "charge",
        entity_id: charge_id,
        giaTriCu: oldCharge,
        giaTriMoi: data
    });

    return result;
};


// Lấy lịch sử thay đổi charge
exports.getChargeHistory = async (charge_id, user) => {

    return await chargeModel.getChargeHistory(
        user.tenant_id,
        charge_id
    );
};