const receiptChargeModel = require("../models/receiptCharge.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo mapping receipt - charge
exports.createReceiptCharge = async (data, user) => {

    const result = await receiptChargeModel.createReceiptCharge({
        ...data,
        tenant_id: user.tenant_id
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_RECEIPT_CHARGE",
        entity_type: "receipt_charge",
        entity_id: data.charge_id,
        giaTriMoi: data
    });

    return result;
};


// Lấy charge trong receipt
exports.getChargesByReceipt = async (receipt_id, user) => {

    return await receiptChargeModel.getChargesByReceipt(
        receipt_id,
        user.tenant_id
    );
};


// Lấy receipt của 1 charge
exports.getReceiptsByCharge = async (charge_id, user) => {

    return await receiptChargeModel.getReceiptsByCharge(
        charge_id,
        user.tenant_id
    );
};