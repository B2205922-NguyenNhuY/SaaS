const db = require("../config/database");

exports.createUser = async ({
  email,
  password_hash,
  hoTen,
  soDienThoai,
  tenant_id,
  role_id,
  trangThai,
}) => {
  const [result] = await db.execute(
    "INSERT INTO users (email, password_hash, hoTen, soDienThoai, tenant_id, role_id, trangThai) VALUES (?, ?, ?, ?, ?, ?, ?)",
    [
      email,
      password_hash,
      hoTen,
      soDienThoai,
      tenant_id,
      role_id,
      trangThai || "active",
    ],
  );
  return result;
};

exports.countAccountsByTenant = async (tenant_id) => {
  const [rows] = await db.query(
    "SELECT COUNT(*) total FROM users WHERE tenant_id = ? AND trangThai <> 'deleted'",
    [tenant_id],
  );
  return Number(rows[0].total);
};

exports.getUserById = async (id) => {
  const [rows] = await db.execute(
    `SELECT u.*, r.tenVaiTro
     FROM users u
     LEFT JOIN role r ON r.role_id = u.role_id
     WHERE u.user_id = ?`,
    [id],
  );
  return rows[0];
};

exports.getUsersByTenant = async (tenant_id, pagination) => {
  const params = [tenant_id];
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) total FROM users WHERE tenant_id = ? AND trangThai <> 'deleted'",
    params,
  );
  const [rows] = await db.query(
    `SELECT u.*, r.tenVaiTro
     FROM users u
     LEFT JOIN role r ON r.role_id = u.role_id
     WHERE u.tenant_id = ? AND u.trangThai <> 'deleted'
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
    [tenant_id, pagination.limit, pagination.offset],
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

exports.getAllUsersPaged = async (pagination, query = {}) => {
  const where = ["u.trangThai <> 'deleted'"];
  const params = [];
  if (query.tenant_id) {
    where.push("u.tenant_id = ?");
    params.push(query.tenant_id);
  }
  if (query.q) {
    where.push("(u.email LIKE ? OR u.hoTen LIKE ? OR u.soDienThoai LIKE ?)");
    params.push(`%${query.q}%`, `%${query.q}%`, `%${query.q}%`);
  }
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM users u WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await db.query(
    `SELECT u.*, r.tenVaiTro
     FROM users u
     LEFT JOIN role r ON r.role_id = u.role_id
     WHERE ${where.join(" AND ")}
     ORDER BY u.created_at DESC
     LIMIT ? OFFSET ?`,
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

exports.updateUserInfo = async (id, data) => {
  const { hoTen, email, soDienThoai } = data;
  const [result] = await db.execute(
    "UPDATE users SET hoTen = COALESCE(?, hoTen), email = COALESCE(?, email), soDienThoai = COALESCE(?, soDienThoai) WHERE user_id = ?",
    [hoTen ?? null, email ?? null, soDienThoai ?? null, id],
  );
  return result;
};

exports.updateUserStatus = async (id, trangThai) => {
  const [result] = await db.execute(
    "UPDATE users SET trangThai = ? WHERE user_id = ?",
    [trangThai, id],
  );
  return result;
};

exports.updatePassword = async (user_id, password_hash) => {
  const [result] = await db.execute(
    "UPDATE users SET password_hash = ? WHERE user_id = ?",
    [password_hash, user_id],
  );
  return result;
};

exports.checkDuplicateAdmin = async (email, soDienThoai) => {
  const [rows] = await db.execute(
    "SELECT user_id FROM users WHERE email = ? OR soDienThoai = ?",
    [email, soDienThoai],
  );
  return rows;
};

exports.checkDuplicate = async (email, soDienThoai, tenant_id) => {
  const [rows] = await db.execute(
    "SELECT user_id FROM users WHERE tenant_id = ? AND (email = ? OR soDienThoai = ?)",
    [tenant_id, email, soDienThoai],
  );
  return rows;
};

exports.checkDuplicateForUpdate = async (
  id,
  email,
  soDienThoai,
  tenant_id = null,
) => {
  let sql =
    "SELECT user_id FROM users WHERE user_id <> ? AND (email = ? OR soDienThoai = ?)";
  const params = [id, email, soDienThoai];
  if (tenant_id) {
    sql += " AND tenant_id = ?";
    params.push(tenant_id);
  }
  const [rows] = await db.execute(sql, params);
  return rows;
};
