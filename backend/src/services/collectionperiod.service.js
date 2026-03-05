const periodModel = require("../models/collectionPeriod.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo kỳ thu
exports.createPeriod = async (data, user) => {

    const result = await periodModel.createCollectionPeriod({
        ...data,
        tenant_id: user.tenant_id
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_COLLECTION_PERIOD",
        entity_type: "collection_period",
        entity_id: result.insertId,
        giaTriMoi: data
    });

    return result;
};


// Danh sách kỳ thu
exports.getPeriods = async (user) => {

    return await periodModel.getCollectionPeriodsByTenant(
        user.tenant_id
    );
};


// Chi tiết kỳ thu
exports.getPeriodDetail = async (period_id, user) => {

    return await periodModel.getCollectionPeriodById(
        period_id,
        user.tenant_id
    );
};


// Update kỳ thu
exports.updatePeriod = async (period_id, data, user) => {

    const oldData = await periodModel.getCollectionPeriodById(
        period_id,
        user.tenant_id
    );

    const result = await periodModel.updateCollectionPeriod(
        period_id,
        user.tenant_id,
        data
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "UPDATE_COLLECTION_PERIOD",
        entity_type: "collection_period",
        entity_id: period_id,
        giaTriCu: oldData,
        giaTriMoi: data
    });

    return result;
};


// Delete kỳ thu
exports.deletePeriod = async (period_id, user) => {

    const oldData = await periodModel.getCollectionPeriodById(
        period_id,
        user.tenant_id
    );

    const result = await periodModel.deleteCollectionPeriod(
        period_id,
        user.tenant_id
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "DELETE_COLLECTION_PERIOD",
        entity_type: "collection_period",
        entity_id: period_id,
        giaTriCu: oldData
    });

    return result;
};