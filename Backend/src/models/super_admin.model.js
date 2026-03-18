const db = require("../config/db");

//Tạo User
exports.createSuperAdmin = async (data) => {
    const {
        email,
        password_hash,
        soDienThoai,
        hoTen,
        trangThai
    } = data;

    const [result] = await db.execute(
        "INSERT INTO super_admin (email, password_hash, soDienThoai, hoTen, trangThai) VALUES (?, ?, ?, ?, ?)",
        [email, password_hash, soDienThoai, hoTen, trangThai]
    );

    return result;
};

//Lấy tất cả Users
exports.getAllSuperAdmins = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM super_admin"
    );

    return rows;
};

//Lấy user theo id
exports.getSuperAdminById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM super_admin WHERE admin_id = ?",
        [id]
    );

    return rows[0];
};

exports.listSuperAdmins = async (filters, offset, limit) => {

  let sql = `
    SELECT admin_id, email, hoTen, trangThai, created_at
    FROM super_admin
    WHERE 1=1
  `;

  const params = [];

  if (filters.keyword) {
    sql += ` AND (email LIKE ? OR hoTen LIKE ?)`;
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  if (filters.trangThai) {
    sql += ` AND trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.created_from) {
    sql += ` AND created_at >= ?`;
    params.push(filters.created_from);
  }

  if (filters.created_to) {
    sql += ` AND created_at <= ?`;
    params.push(filters.created_to);
  }

  const allowedSort = ["created_at","email","hoTen"];

  const sortBy = allowedSort.includes(filters.sortBy)
    ? filters.sortBy
    : "created_at";

  const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";

  sql += ` ORDER BY ${sortBy} ${sortOrder}`;

  sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;


  const [rows] = await db.execute(sql, params);

  return rows;
};

exports.countSuperAdmins = async (filters) => {

  let sql = `
    SELECT COUNT(*) as total
    FROM super_admin
    WHERE 1=1
  `;

  const params = [];

  if (filters.keyword) {
    sql += ` AND (email LIKE ? OR hoTen LIKE ?)`;
    params.push(`%${filters.keyword}%`, `%${filters.keyword}%`);
  }

  if (filters.trangThai) {
    sql += ` AND trangThai = ?`;
    params.push(filters.trangThai);
  }

  if (filters.created_from) {
    sql += ` AND created_at >= ?`;
    params.push(filters.created_from);
  }

  if (filters.created_to) {
    sql += ` AND created_at <= ?`;
    params.push(filters.created_to);
  }

  const [rows] = await db.execute(sql, params);

  return rows[0].total;
};

//Cập nhật thông tin user
exports.updateSuperAdminInfo = async (id, data) => {
    const { email, soDienThoai, hoTen } = data;

    const [result] = await db.execute(
        "UPDATE super_admin SET email= ?, soDienThoai= ?, hoTen= ? WHERE admin_id = ?",
        [email, soDienThoai, hoTen, id]
    );

    return result;
};

//Cập nhật trạng thái User
exports.updateSuperAdminStatus = async(id, trangThai) => {
    const [result] = await db.execute(
        "UPDATE super_admin SET trangThai = ? WHERE admin_id = ?",
        [trangThai, id]
    );

    return result;
};

//Đổi mật khẩu
exports.updatePassword = async (admin_id, password_hash) => {
  const [result] = await db.execute(
    "UPDATE super_admin SET password_hash = ? WHERE admin_id = ?",
    [password_hash, admin_id]
  );

  return result;
};


//Kiểm tra trùng
exports.checkDuplicate = async (email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT admin_id FROM super_admin WHERE email = ? OR soDienThoai = ?",
        [email, soDienThoai]
    );

    return rows;
}

//Kiểm tra trùng khi update
exports.checkDuplicateForUpdate = async (id, email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT admin_id FROM super_admin WHERE (email = ? OR soDienThoai = ?) AND admin_id!=?",
        [email, soDienThoai, id]
    );

    return rows;
}