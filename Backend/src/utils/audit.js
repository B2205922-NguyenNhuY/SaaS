const auditLogModel = require('../models/auditLog.model');

async function logAudit(req, { action, entity_type = null, entity_id = null, oldValue = null, newValue = null }) {
  try {
    
    if (!req || !req.user || !action) return;

    const isSuperAdmin = req.user.role === 'super_admin';
    const ip = req.headers['x-forwarded-for']?.split(',')[0]?.trim()
      || req.socket?.remoteAddress
      || req.ip
      || null;

    await auditLogModel.createAuditLog({
      tenant_id: req.user.tenant_id || null,
      user_id: isSuperAdmin || req.user.role === 'merchant' ? null : req.user.id,
      super_admin_id: isSuperAdmin ? req.user.id : null,
      merchant_id: req.user.role === 'merchant' ? req.user.id : null, 
      hanhDong: action,
      entity_type: entity_type || null,
      entity_id: entity_id ? Number(entity_id) : null,
      giaTriCu: oldValue,
      giaTriMoi: newValue,
      ip_address: ip,
    });
  } catch (_) {}
}

module.exports = { logAudit };