const db = require("../config/db");

//Tạo role
exports.createRole = async (data) => {
    const {tenVaiTro, danhSachQuyen} = data;

    const [result] = await db.execute(
        "INSERT INTO role(tenVaiTro, danhSachQuyen) VALUES (?,?)",
        [tenVaiTro,JSON.stringify(danhSachQuyen)]
    );

    return result;
}

//Lấy tất cả Role
exports.getAllRoles = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM role"
    );

    return rows;
};

//Lấy role theo id
exports.getRoleById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM role WHERE role_id = ?",
        [id]
    );

    return rows[0];
};

//Cập nhật thông tin Role
exports.updateRole = async (id, data) => {
    const {
        tenVaiTro,
        danhSachQuyen
    } = data;

    const [result] = await db.execute(
        "UPDATE role SET tenVaiTro = ?, danhSachQuyen = ? WHERE role_id = ?",
        [tenVaiTro,danhSachQuyen, id]
    );

    return result;
};

//Kiểm tra trùng
exports.checkDuplicate = async (tenVaiTro) => {
    const [rows] = await db.execute(
        "SELECT role_id FROM role WHERE tenVaiTro = ?",
        [tenVaiTro]
    );

    return rows;
}

//Kiểm tra trùng khi update
exports.checkDuplicateForUpdate = async (id, tenVaiTro) => {
    const [rows] = await db.execute(
        "SELECT role_id FROM role WHERE tenVaiTro = ? AND role_id!=?",
        [tenVaiTro, id]
    );

    return rows;
}