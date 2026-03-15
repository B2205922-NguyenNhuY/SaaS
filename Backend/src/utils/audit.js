const auditLogModel = require('../models/auditLog.model');
const { normalizeRole, ROLES } = require('../constants/role');

async function logAudit(req, { action, entity_type = null, entity_id = null, oldValue = null, newValue = null }) {
  try {
    if (!req || !req.user || !action) return;
    const role = normalizeRole(req.user.role);
    await auditLogModel.createAuditLog({
      tenant_id: req.user.tenant_id || null,
      user_id: role === ROLES.SUPER_ADMIN ? null : (req.user.user_id || req.user.id || null),
      super_admin_id: role === ROLES.SUPER_ADMIN ? (req.user.user_id || req.user.id || null) : null,
      hanhDong: action,
      entity_type,
      entity_id,
      giaTriCu: oldValue,
      giaTriMoi: newValue,
    });
  } catch (_) {}
}
module.exports = { logAudit };