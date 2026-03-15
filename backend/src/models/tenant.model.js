const db = require("../config/database");

exports.createTenant = async (tenantData) => {
  const { tenBanQuanLy, diaChi, diachi, soDienThoai, email, trangThai } =
    tenantData;
  const [result] = await db.execute(
    "INSERT INTO tenant (tenBanQuanLy, diachi, soDienThoai, email, trangThai) VALUES (?, ?, ?, ?, ?)",
    [
      tenBanQuanLy,
      diaChi ?? diachi ?? null,
      soDienThoai,
      email,
      trangThai || "active",
    ],
  );
  return result;
};
exports.getAllTenants = async (pagination, q) => {
  const where = ["1=1"];
  const params = [];
  if (q?.trangThai) {
    where.push("trangThai = ?");
    params.push(q.trangThai);
  }
  if (q?.q) {
    where.push("(tenBanQuanLy LIKE ? OR email LIKE ? OR soDienThoai LIKE ?)");
    params.push(`%${q.q}%`, `%${q.q}%`, `%${q.q}%`);
  }
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM tenant WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await db.query(
    `SELECT * FROM tenant WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
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
exports.getTenantById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM tenant WHERE tenant_id = ?", [
    id,
  ]);
  return rows[0];
};
exports.updateTenantInfo = async (id, data) => {
  const { tenBanQuanLy, diaChi, diachi, soDienThoai, email } = data;
  const [result] = await db.execute(
    "UPDATE tenant SET tenBanQuanLy = COALESCE(?, tenBanQuanLy), diachi = COALESCE(?, diachi), soDienThoai = COALESCE(?, soDienThoai), email = COALESCE(?, email) WHERE tenant_id = ?",
    [
      tenBanQuanLy ?? null,
      diaChi ?? diachi ?? null,
      soDienThoai ?? null,
      email ?? null,
      id,
    ],
  );
  return result;
};
exports.updateTenantStatus = async (id, trangThai) => {
  const [result] = await db.execute(
    "UPDATE tenant SET trangThai = ? WHERE tenant_id = ?",
    [trangThai, id],
  );
  return result;
};
exports.checkDuplicate = async (email, soDienThoai) => {
  const [rows] = await db.execute(
    "SELECT tenant_id FROM tenant WHERE email = ? OR soDienThoai = ?",
    [email, soDienThoai],
  );
  return rows;
};
exports.checkDuplicateForUpdate = async (id, email, soDienThoai) => {
  const [rows] = await db.execute(
    "SELECT tenant_id FROM tenant WHERE (email = ? OR soDienThoai = ?) AND tenant_id <> ?",
    [email, soDienThoai, id],
  );
  return rows;
};
