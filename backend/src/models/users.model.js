const db = require("../config/database");

//Tạo User
exports.createUser = async (data) => {
    const {
        email,
        password_hash,
        hoTen,
        soDienThoai,
        tenant_id,
        role_id,
        trangThai
    } = data;

    const [result] = await db.execute(
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
           AND status = 'active' 
           AND deleted_at IS NULL)
        +
        (SELECT COUNT(*) 
         FROM merchants 
         WHERE tenant_id = ?)
      ) AS total
    `,
    [tenant_id, tenant_id]
  );

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
        "SELECT * FROM users WHERE user_id = ?",
        [id]
    );

    return rows[0];
};

//Lấy user thoe tenant
exports.getUsersByTenant = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT u.*, r.role_name
     FROM users u
     JOIN role r ON u.role_id = r.role_id
     WHERE u.tenant_id = ?
     AND u.trangThai != 'deleted'
     ORDER BY u.created_at DESC`,
    [tenant_id]
  );

  return rows;
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
exports.checkDuplicate = async (email, soDienThoai, tenant_id) => {
    const [rows] = await db.execute(
        "SELECT user_id FROM users WHERE (email = ? AND tenant_id=?) OR (soDienThoai = ? AND tenant_id=?)",
        [email, soDienThoai]
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