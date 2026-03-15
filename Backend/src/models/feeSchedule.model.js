const db = require("../config/db");
exports.createFeeSchedule = async (data) => {
  const { tenant_id, tenBieuPhi, hinhThuc, donGia, moTa } = data;
  const [result] = await db.execute(
    `INSERT INTO fee_schedule (tenant_id, tenBieuPhi, hinhThuc, donGia, moTa) VALUES (?, ?, ?, ?, ?)`,
    [tenant_id, tenBieuPhi, hinhThuc, donGia, moTa || null],
  );
  return result;
};
exports.getFeeById = async (fee_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT * FROM fee_schedule WHERE fee_id = ? AND tenant_id = ? LIMIT 1`,
    [fee_id, tenant_id],
  );
  return rows[0];
};
exports.getFeesByTenant = async (tenant_id, pagination = null, q = {}) => {
  const where = ["tenant_id = ?"];
  const params = [tenant_id];
  if (q.q) {
    where.push("(tenBieuPhi LIKE ? OR moTa LIKE ?)");
    params.push(`%${q.q}%`, `%${q.q}%`);
  }
  if (q.hinhThuc) {
    where.push("hinhThuc = ?");
    params.push(q.hinhThuc);
  }
  if (!pagination) {
    const [rows] = await db.execute(
      `SELECT * FROM fee_schedule WHERE ${where.join(" AND ")} ORDER BY created_at DESC`,
      params,
    );
    return rows;
  }
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM fee_schedule WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await db.query(
    `SELECT * FROM fee_schedule WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pagination.limit, pagination.offset],
  );
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
exports.updateFeeSchedule = async (fee_id, tenant_id, data) => {
  const { tenBieuPhi, hinhThuc, donGia, moTa } = data;
  const [result] = await db.execute(
    `UPDATE fee_schedule SET tenBieuPhi = COALESCE(?, tenBieuPhi), hinhThuc = COALESCE(?, hinhThuc), donGia = COALESCE(?, donGia), moTa = COALESCE(?, moTa) WHERE fee_id = ? AND tenant_id = ?`,
    [
      tenBieuPhi ?? null,
      hinhThuc ?? null,
      donGia ?? null,
      moTa ?? null,
      fee_id,
      tenant_id,
    ],
  );
  return result;
};
exports.deleteFeeSchedule = async (fee_id, tenant_id) => {
  const [result] = await db.execute(
    `DELETE FROM fee_schedule WHERE fee_id = ? AND tenant_id = ?`,
    [fee_id, tenant_id],
  );
  return result;
};
exports.checkDuplicate = async (tenant_id, tenBieuPhi, excludeId = null) => {
  let sql =
    "SELECT fee_id FROM fee_schedule WHERE tenant_id = ? AND tenBieuPhi = ?";
  const params = [tenant_id, tenBieuPhi];
  if (excludeId) {
    sql += " AND fee_id <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.execute(sql, params);
  return rows;
};
