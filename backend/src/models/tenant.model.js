const db = require("../config/database");

//Tạo Tenant
exports.createTenant = async (tenantData) => {
    const { tenBanQuanLy, diachi, soDienThoai, email, trangThai } = tenantData;

    const [result] = await db.execute(
        "INSERT INTO tenant (tenBanQuanLy, diachi, soDienThoai, email, trangThai) VALUES (?, ?, ?, ?, ?)",
        [tenBanQuanLy, diachi, soDienThoai, email, trangThai || 'active',]
    );

    return result;
};

//Lấy tất cả Tenant
exports.getAllTenants = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM tenant"
    );
    
    return rows;
};

//Lấy tenant theo id
exports.getTenantById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM tenant WHERE tenant_id = ?",
        [id]
    );

    return rows[0];
};

//Cập nhật thông tin Tenant
exports.updateTenantInfo = async (id, data) => {
    const {
        tenBanQuanLy,
        diachi,
        soDienThoai,
        email
    } = data;

    const [result] = await db.execute(
        "UPDATE tenant SET tenBanQuanLy = ?, diachi = ?, soDienThoai = ?, email = ? WHERE tenant_id = ?",
        [tenBanQuanLy, diachi, soDienThoai, email, id]
    );

    return result;
};

//Cập nhật trạng thái Tenant
exports.updateTenantStatus = async(id, trangThai) => {
    const [result] = await db.execute(
        "UPDATE tenant SET trangThai = ? WHERE tenant_id = ?",
        [trangThai, id]
    );

    return result;
};

//Kiểm tra trùng
exports.checkDuplicate = async (email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT tenant_id FROM tenant WHERE email = ? OR soDienThoai = ?",
        [email, soDienThoai]
    );

    return rows;
}

//Kiểm tra trùng khi update
exports.checkDuplicateForUpdate = async (id, email, soDienThoai) => {
    const [rows] = await db.execute(
        "SELECT tenant_id FROM tenant WHERE (email = ? OR soDienThoai = ?) AND tenant_id!=?",
        [email, soDienThoai, id]
    );

    return rows;
}