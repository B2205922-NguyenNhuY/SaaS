const auditLogModel = require("../models/auditLog.model");

function normalizeJson(v) {
  try {
    return typeof v === "string" ? JSON.parse(v) : v;
  } catch {
    return v;
  }
}

exports.getLogs = async (user, query, pagination) => {
  const role = user.role;

  const where = [];
  const params = [];

  if (role === "super_admin") {
    where.push("1=1");
  } else {
    where.push("tenant_id = ?");
    params.push(user.tenant_id);
  }

  if (query.entity_type) {
    where.push("entity_type = ?");
    params.push(query.entity_type);
  }

  if (query.entity_id) {
    where.push("entity_id = ?");
    params.push(query.entity_id);
  }

  const whereSQL = where.join(" AND ");

  const total = await auditLogModel.count(whereSQL, params);

  const rows = await auditLogModel.list(
    whereSQL,
    params,
    pagination.limit,
    pagination.offset
  );

  rows.forEach((r) => {
    r.giaTriCu = normalizeJson(r.giaTriCu);
    r.giaTriMoi = normalizeJson(r.giaTriMoi);
  });

  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 0,
    },
  };
};