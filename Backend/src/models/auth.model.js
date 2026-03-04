const db = require("../config/db");

//login user
exports.findUserByEmail = async (email) => {
    const [rows] = await db.execute(
        "SELECT u.*, r.tenVaiTro FROM users u JOIN role r ON u.role_id = r.role_id WHERE u.email = ? AND u.trangThai != 'deleted' LIMIT 1",
        [email]
    );

    return rows[0];
};

//
exports.findSuperAdminByEmail = async (email) => {
    const [rows] = await db.execute(
        "SELECT * FROM super_admin WHERE email = ? AND trangThai != 'inactive' LIMIT 1",
        [email]
    );

    return rows[0];
};

//Tạo User
exports.createUser = async (data) => {
    const {
        email,
        password_hash,
        hoTen,
        soDienThoai,
        tenant_id,
        role_id
    } = data;

    const [result] = await db.execute(
        "INSERT INTO users (email, password_hash, hoTen, soDienThoai, tenant_id, role_id) VALUES (?, ?, ?, ?, ?, ?)",
        [email, password_hash, hoTen, soDienThoai, tenant_id, role_id]
    );

    return result;
};

//Kiểm tra trùng
exports.checkDuplicate = async (email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT user_id FROM users WHERE email = ? OR soDienThoai = ?",
        [email, soDienThoai]
    );

    return rows;
}