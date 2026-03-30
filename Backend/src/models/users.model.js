const db = require("../config/db");

//Tạo User
exports.createUser = async (conn, data) => {
  connection = conn || db;
  const {
        email,
        password_hash,
        hoTen,
        soDienThoai,
        tenant_id,
        role_id,
        trangThai
    } = data;

    const [result] = await connection.execute(
        "INSERT INTO users (email, password_hash, hoTen, soDienThoai, tenant_id, role_id, trangThai) VALUES (?, ?, ?, ?, ?, ?, ?)",
        [email, password_hash, hoTen, soDienThoai, tenant_id, role_id, trangThai]
    );
    return result;
};

//Đếm số account hiện tại của tenant
exports.countAccountsByTenant = async (tenant_id) => {
  const [rows] = await db.query(
    `
    SELECT 
      (
        (SELECT COUNT(*) 
         FROM users 
         WHERE tenant_id = ? 
           AND trangThai = 'active' 
           AND deleted_at IS NULL)
       +
        (SELECT COUNT(*) 
         FROM merchant 
         WHERE tenant_id = ?
            AND trangThai = 'active')
      ) AS total
    `,
    [tenant_id, tenant_id]
  );
 /**/
  return Number(rows[0].total);
};

//Lấy tất cả Users
exports.getAllUsers = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM users"
    );

    return rows;
};

//Lấy user theo id
exports.getUserById = async (id) => {
    const [rows] = await db.execute(
        "SELECT u.*, r.tenVaiTro FROM users u JOIN role r ON u.role_id=r.role_id WHERE u.user_id = ?",
        [id]
    );

    return rows[0];
};

//Lấy user thoe tenant
exports.getUsersByTenant = async (filters, offset, limit) => {

  let sql = `
    SELECT 
      u.user_id,
      u.email,
      u.hoTen,
      u.soDienThoai,
      u.trangThai,
      u.created_at,
      r.tenVaiTro
    FROM users u
    LEFT JOIN role r ON u.role_id = r.role_id
    WHERE u.tenant_id = ?
  `;

  const params = [filters.tenant_id];

  if (filters.role_id) {
    sql += ` AND u.role_id = ?`;
    params.push(filters.role_id);
  }

  if (filters.trangThai) {
    sql += ` AND u.trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.keyword) {
    sql += ` AND (
      u.email LIKE ?
      OR u.hoTen LIKE ?
      OR u.soDienThoai LIKE ?
    )`;

    params.push(
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`
    );
  }

  const allowedSort = ["created_at", "email", "hoTen"];

  const sortBy = allowedSort.includes(filters.sortBy)
    ? filters.sortBy
    : "created_at";

  const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";

  sql += ` ORDER BY u.${sortBy} ${sortOrder}`;

  sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;


  const [rows] = await db.execute(sql, params);

  return rows;
};

exports.listUsers = async (filters, offset, limit) => {

  let sql = `
    SELECT 
      u.user_id,
      u.email,
      u.hoTen,
      u.soDienThoai,
      u.trangThai,
      u.created_at,
      r.tenVaiTro,
      t.tenBanQuanLy
    FROM users u
    LEFT JOIN role r ON u.role_id = r.role_id
    LEFT JOIN tenant t ON u.tenant_id = t.tenant_id
    WHERE 1=1
  `;

  const params = [];

  if (filters.tenant_id) {
    sql += ` AND u.tenant_id = ?`;
    params.push(filters.tenant_id);
  }

  if (filters.role_id) {
    sql += ` AND u.role_id = ?`;
    params.push(filters.role_id);
  }

  if (filters.trangThai) {
    sql += ` AND u.trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.keyword) {
    sql += ` AND (
      u.email LIKE ? 
      OR u.hoTen LIKE ? 
      OR u.soDienThoai LIKE ?
    )`;
    params.push(
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`
    );
  }

  if (filters.created_from) {
    sql += ` AND u.created_at >= ?`;
    params.push(filters.created_from);
  }

  if (filters.created_to) {
    sql += ` AND u.created_at <= ?`;
    params.push(filters.created_to);
  }

  const allowedSort = ["created_at","email","hoTen"];

  const sortBy = allowedSort.includes(filters.sortBy)
    ? filters.sortBy
    : "created_at";

  const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";

  sql += ` ORDER BY u.${sortBy} ${sortOrder}`;

  sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

  const [rows] = await db.execute(sql, params);

  return rows;
};

exports.countUsersByTenant = async (filters) => {

  let sql = `
    SELECT COUNT(*) as total
    FROM users u
    WHERE u.tenant_id = ?
  `;

  const params = [filters.tenant_id];

  if (filters.role_id) {
    sql += ` AND u.role_id = ?`;
    params.push(filters.role_id);
  }

  if (filters.trangThai) {
    sql += ` AND u.trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.keyword) {
    sql += ` AND (
      u.email LIKE ?
      OR u.hoTen LIKE ?
      OR u.soDienThoai LIKE ?
    )`;

    params.push(
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`
    );
  }

  const [rows] = await db.execute(sql, params);

  return rows[0].total;
};

exports.countUsers = async (filters) => {

  let sql = `
    SELECT COUNT(*) as total
    FROM users u
    WHERE 1=1
  `;

  const params = [];

  if (filters.tenant_id) {
    sql += ` AND u.tenant_id = ?`;
    params.push(filters.tenant_id);
  }

  if (filters.role_id) {
    sql += ` AND u.role_id = ?`;
    params.push(filters.role_id);
  }

  if (filters.trangThai) {
    sql += ` AND u.trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.keyword) {
    sql += ` AND (
      u.email LIKE ? 
      OR u.hoTen LIKE ? 
      OR u.soDienThoai LIKE ?
    )`;

    params.push(
      `%${filters.keyword}%`,
      `%${filters.keyword}%`,
      `%${filters.keyword}%`
    );
  }

  if (filters.created_from) {
    sql += ` AND u.created_at >= ?`;
    params.push(filters.created_from);
  }

  if (filters.created_to) {
    sql += ` AND u.created_at <= ?`;
    params.push(filters.created_to);
  }

  const [rows] = await db.execute(sql, params);

  return rows[0].total;
};

//Cập nhật thông tin user
exports.updateUserInfo = async (id, data) => {
    const {hoTen, email, soDienThoai} = data;

    const [result] = await db.execute(
        "UPDATE users SET hoTen = ?, email= ?, soDienThoai = ? WHERE user_id = ?",
        [hoTen, email, soDienThoai, id]
    );

    return result;
};

//Cập nhật trạng thái User
exports.updateUserStatus = async(id, trangThai) => {
    const [result] = await db.execute(
        "UPDATE users SET trangThai = ? WHERE user_id = ?",
        [trangThai, id]
    );

    return result;
};

//Đổi mật khẩu
exports.updatePassword = async (user_id, password_hash) => {
  const [result] = await db.execute(
    "UPDATE users SET password_hash = ? WHERE user_id = ?",
    [password_hash, user_id]
  );

  return result;
};

//Soft delete
exports.softDelete = async (user_id) => {
  const [result] = await db.execute(
    "UPDATE users SET trangThai = 'deleted', deleted_at = NOW() WHERE user_id = ?",
    [user_id]
  );

  return result;
};

//Kiểm tra trùng
exports.checkDuplicateAdmin = async (email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT user_id FROM users WHERE email = ? OR soDienThoai = ?",
        [email, soDienThoai]
    );

    return rows;
}

//Kiểm tra trùng
exports.checkDuplicate = async (conn, email, soDienThoai, tenant_id) => {
  const connection = conn || db;  
  const [rows] = await connection.execute(
        "SELECT user_id FROM users WHERE (email = ? AND tenant_id=?) OR (soDienThoai = ? AND tenant_id=?)",
        [email, tenant_id, soDienThoai, tenant_id]
    );

    return rows;
}

//Kiểm tra trùng khi update
exports.checkDuplicateForUpdate = async (id, email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT user_id FROM users WHERE (email = ? OR soDienThoai = ?) AND user_id!=?",
        [email, soDienThoai, id]
    );

    return rows;
}