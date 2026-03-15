const auditLogModel = require("../models/auditLog.model");
const db = require("../config/database");

// Tạo audit log
exports.createAuditLog = async (data) => {
  return await auditLogModel.createAuditLog(data);
};

// Lấy audit log của super admin
exports.getSuperAdminLogs = async (super_admin_id) => {
  return await auditLogModel.getAuditLogsBySuperAdmin(super_admin_id);
};

// Lấy audit log của tenant
exports.getTenantLogs = async (tenant_id) => {
  return await auditLogModel.getAuditLogsByTenant(tenant_id);
};

// Lấy audit log theo entity
exports.getEntityLogs = async (entity_type, entity_id, tenant_id) => {
  return await auditLogModel.getAuditLogsByEntity(
    entity_type,
    entity_id,
    tenant_id,
  );
};
