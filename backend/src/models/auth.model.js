const db = require("../config/database");
exports.findSuperAdminByEmail = async (email) => {
  const [rows] = await db.execute(
    "SELECT * FROM super_admin WHERE email = ? LIMIT 1",
    [email],
  );
  return rows[0];
};
exports.findUserByEmail = async (email) => {
  const [rows] = await db.execute(
    `SELECT u.*, r.tenVaiTro FROM users u JOIN role r ON r.role_id = u.role_id WHERE u.email = ? AND u.trangThai = 'active' LIMIT 1`,
    [email],
  );
  return rows[0];
};

exports.findTenantByEmail = async (_email) => null;
