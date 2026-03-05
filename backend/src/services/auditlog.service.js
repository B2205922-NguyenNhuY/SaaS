const auditLogModel = require("../models/auditLog.model");


// Tạo audit log
exports.createAuditLog = async (data) => {

    return await auditLogModel.createAuditLog(data);

};


// Lấy audit log của tenant
exports.getTenantLogs = async (tenant_id) => {

    return await auditLogModel.getAuditLogsByTenant(tenant_id);

};


// Lấy audit log theo entity
exports.getEntityLogs = async (entity_type, entity_id) => {

    return await auditLogModel.getAuditLogsByEntity(
        entity_type,
        entity_id
    );

};