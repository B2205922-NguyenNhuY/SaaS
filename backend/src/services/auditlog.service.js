const { AuditLog } = require('../models');

class AuditService {
  static async log({
    tenant_id,
    user_id,
    hanhDong,
    entity_type,
    entity_id,
    giaTriCu = null,
    giaTriMoi = null
  }) {
    try {
      await AuditLog.create({
        tenant_id,
        user_id,
        hanhDong,
        entity_type,
        entity_id,
        giaTriCu: giaTriCu ? JSON.stringify(giaTriCu) : null,
        giaTriMoi: giaTriMoi ? JSON.stringify(giaTriMoi) : null
      });
    } catch (error) {
      console.error('Audit log error:', error);
    }
  }
}

module.exports = AuditService;