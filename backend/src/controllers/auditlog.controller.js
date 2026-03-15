const db = require("../config/db");
const { normalizeRole, ROLES } = require("../constants/role");
function normalizeJson(v) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return v;
  }
}
exports.getAllLogs = async (req, res, next) => {
  try {
    const role = normalizeRole(req.user.role);
    const where = [];
    const params = [];
    if (role === ROLES.SUPER_ADMIN) {
      where.push("1=1");
    } else {
      where.push("tenant_id = ?");
      params.push(req.user.tenant_id);
    }
    if (req.query.entity_type) {
      where.push("entity_type = ?");
      params.push(req.query.entity_type);
    }
    if (req.query.entity_id) {
      where.push("entity_id = ?");
      params.push(req.query.entity_id);
    }
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM audit_log WHERE ${where.join(" AND ")}`,
      params,
    );
    const [rows] = await db.query(
      `SELECT * FROM audit_log WHERE ${where.join(" AND ")} ORDER BY thoiGianThucHien DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset],
    );
    rows.forEach((r) => {
      r.giaTriCu = normalizeJson(r.giaTriCu);
      r.giaTriMoi = normalizeJson(r.giaTriMoi);
    });
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 0,
      },
    });
  } catch (err) {
    next(err);
  }
};
exports.getSuperAdminLogs = exports.getAllLogs;
exports.getTenantLogs = exports.getAllLogs;
exports.getEntityLogs = async (req, res, next) => {
  req.query.entity_type = req.params.entity_type;
  req.query.entity_id = req.params.entity_id;
  return exports.getAllLogs(req, res, next);
};
