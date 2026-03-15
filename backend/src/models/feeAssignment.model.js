const db = require("../config/database");
exports.createFeeAssignment = async (data) => {
  const { tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam } =
    data;
  const [result] = await db.execute(
    `INSERT INTO fee_assignment (tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam) VALUES (?, ?, ?, ?, ?, ?)`,
    [tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam],
  );
  return result;
};
exports.getActiveFeeAssignment = async (tenant_id, target_type, target_id) => {
  const [rows] = await db.execute(
    `SELECT fa.*, fs.tenBieuPhi, fs.donGia, fs.hinhThuc FROM fee_assignment fa JOIN fee_schedule fs ON fa.fee_id = fs.fee_id AND fa.tenant_id = fs.tenant_id WHERE fa.tenant_id = ? AND fa.target_type = ? AND fa.target_id = ? AND fa.trangThai = 'active' ORDER BY fa.ngayApDung DESC LIMIT 1`,
    [tenant_id, target_type, target_id],
  );
  return rows[0] || null;
};
exports.getAssignmentsByFee = async (tenant_id, fee_id, pagination = null) => {
  if (!pagination) {
    const [rows] = await db.execute(
      `SELECT * FROM fee_assignment WHERE tenant_id = ? AND fee_id = ? ORDER BY created_at DESC`,
      [tenant_id, fee_id],
    );
    return rows;
  }
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM fee_assignment WHERE tenant_id = ? AND fee_id = ?`,
    [tenant_id, fee_id],
  );
  const [rows] = await db.query(
    `SELECT * FROM fee_assignment WHERE tenant_id = ? AND fee_id = ? ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [tenant_id, fee_id, pagination.limit, pagination.offset],
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
exports.getById = async (assignment_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT fa.*, fs.donGia, fs.tenBieuPhi FROM fee_assignment fa JOIN fee_schedule fs ON fa.fee_id = fs.fee_id AND fa.tenant_id = fs.tenant_id WHERE fa.assignment_id = ? AND fa.tenant_id = ? LIMIT 1`,
    [assignment_id, tenant_id],
  );
  return rows[0];
};
exports.deactivateAssignment = async (assignment_id, tenant_id) => {
  const [result] = await db.execute(
    `UPDATE fee_assignment SET trangThai = 'inactive' WHERE assignment_id = ? AND tenant_id = ?`,
    [assignment_id, tenant_id],
  );
  return result;
};
exports.updateAssignment = async (assignment_id, tenant_id, data) => {
  const [result] = await db.execute(
    `UPDATE fee_assignment SET fee_id = COALESCE(?, fee_id), target_type = COALESCE(?, target_type), target_id = COALESCE(?, target_id), ngayApDung = COALESCE(?, ngayApDung), trangThai = COALESCE(?, trangThai), mucMienGiam = COALESCE(?, mucMienGiam) WHERE assignment_id = ? AND tenant_id = ?`,
    [
      data.fee_id ?? null,
      data.target_type ?? null,
      data.target_id ?? null,
      data.ngayApDung ?? null,
      data.trangThai ?? null,
      data.mucMienGiam ?? null,
      assignment_id,
      tenant_id,
    ],
  );
  return result;
};
exports.listByTenant = async (tenant_id, pagination, query = {}) => {
  const where = ["fa.tenant_id = ?"];
  const params = [tenant_id];
  if (query.target_type) {
    where.push("fa.target_type = ?");
    params.push(query.target_type);
  }
  if (query.target_id) {
    where.push("fa.target_id = ?");
    params.push(query.target_id);
  }
  if (query.fee_id) {
    where.push("fa.fee_id = ?");
    params.push(query.fee_id);
  }
  if (query.trangThai) {
    where.push("fa.trangThai = ?");
    params.push(query.trangThai);
  }
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM fee_assignment fa WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await db.query(
    `SELECT fa.*, fs.tenBieuPhi, fs.donGia, fs.hinhThuc FROM fee_assignment fa JOIN fee_schedule fs ON fa.fee_id = fs.fee_id AND fa.tenant_id = fs.tenant_id WHERE ${where.join(" AND ")} ORDER BY fa.created_at DESC LIMIT ? OFFSET ?`,
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
exports.checkDuplicate = async (
  tenant_id,
  fee_id,
  target_type,
  target_id,
  ngayApDung,
  excludeId = null,
) => {
  let sql =
    "SELECT assignment_id FROM fee_assignment WHERE tenant_id=? AND fee_id=? AND target_type=? AND target_id=? AND ngayApDung=?";
  const params = [tenant_id, fee_id, target_type, target_id, ngayApDung];
  if (excludeId) {
    sql += " AND assignment_id <> ?";
    params.push(excludeId);
  }
  const [rows] = await db.execute(sql, params);
  return rows;
};
