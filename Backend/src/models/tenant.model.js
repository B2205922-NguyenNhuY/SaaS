const db = require("../config/db");

//Tạo Tenant
exports.createTenant = async (connection, tenantData) => {
    const { 
        tenBanQuanLy, 
        diaChi, 
        soDienThoai, 
        email, 
        maSoThue,
        tenCongTy,
        nguoiDaiDien,
        chucVu,
        giayPhepKinhDoanh,
        ngayCapPhep,
        noiCapPhep,
        trangThai 
    } = tenantData;

    const [result] = await connection.execute(
        `INSERT INTO tenant (
            tenBanQuanLy, diaChi, soDienThoai, email, 
            maSoThue, tenCongTy, nguoiDaiDien, chucVu,
            giayPhepKinhDoanh, ngayCapPhep, noiCapPhep, trangThai
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tenBanQuanLy, diaChi, soDienThoai, email,
            maSoThue, tenCongTy, nguoiDaiDien, chucVu,
            giayPhepKinhDoanh, ngayCapPhep, noiCapPhep, 
            trangThai || 'active'
        ]
    );

    return result;
};

//Lấy tất cả Tenant
exports.getAllTenants = async () => {
    const [rows] = await db.execute(
        `SELECT tenant_id, tenBanQuanLy, diaChi, soDienThoai, email, 
                maSoThue, tenCongTy, nguoiDaiDien, chucVu,
                giayPhepKinhDoanh, ngayCapPhep, noiCapPhep, trangThai, created_at 
         FROM tenant`
    );
    return rows;
};

//Lấy tenant theo id
exports.getTenantById = async (id) => {
    const [rows] = await db.execute(
        `SELECT tenant_id, tenBanQuanLy, diaChi, soDienThoai, email, 
                maSoThue, tenCongTy, nguoiDaiDien, chucVu,
                giayPhepKinhDoanh, ngayCapPhep, noiCapPhep, trangThai, created_at 
         FROM tenant WHERE tenant_id = ?`,
        [id]
    );
    return rows[0];
};

//lọc
exports.listTenants = async (filters, offset, limit) => {

  let sql = `
    SELECT *
    FROM tenant
    WHERE 1=1
  `;

  const params = [];

  if (filters.keyword) {
    sql += ` AND (tenBanQuanLy LIKE ? OR email LIKE ?)`;
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

  sql += ` ORDER BY ${filters.sortBy} ${filters.sortOrder}`;

  sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;
  
  const [rows] = await db.execute(sql, params);

  return rows;
};

//đếm
exports.countTenants = async (filters) => {

  let sql = `
    SELECT COUNT(*) as total
    FROM tenant
    WHERE 1=1
  `;

  const params = [];

  if (filters.keyword) {
    sql += ` AND (tenBanQuanLy LIKE ? OR email LIKE ?)`;
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

//Cập nhật thông tin Tenant
exports.updateTenantInfo = async (id, data) => {
    const {
        tenBanQuanLy,
        diachi,
        soDienThoai,
        email,
        maSoThue,
        tenCongTy,
        nguoiDaiDien,
        chucVu,
        giayPhepKinhDoanh,
        ngayCapPhep,
        noiCapPhep
    } = data;

    const params = [
        tenBanQuanLy !== undefined ? tenBanQuanLy : null,
        diachi !== undefined ? diachi : null,
        soDienThoai !== undefined ? soDienThoai : null,
        email !== undefined ? email : null,
        maSoThue !== undefined ? maSoThue : null,
        tenCongTy !== undefined ? tenCongTy : null,
        nguoiDaiDien !== undefined ? nguoiDaiDien : null,
        chucVu !== undefined ? chucVu : null,
        giayPhepKinhDoanh !== undefined ? giayPhepKinhDoanh : null,
        ngayCapPhep !== undefined ? ngayCapPhep : null,
        noiCapPhep !== undefined ? noiCapPhep : null,
        id
    ];

    const [result] = await db.execute(
        `UPDATE tenant SET 
            tenBanQuanLy = ?, 
            diachi = ?, 
            soDienThoai = ?, 
            email = ?, 
            maSoThue = ?,
            tenCongTy = ?,
            nguoiDaiDien = ?,
            chucVu = ?,
            giayPhepKinhDoanh = ?,
            ngayCapPhep = ?,
            noiCapPhep = ?
        WHERE tenant_id = ?`,
        params
    );

    return result;
};

//Kiểm tra trùng mã số thuế
exports.checkDuplicateMST = async (maSoThue) => {
    const [rows] = await db.execute(
        "SELECT tenant_id FROM tenant WHERE maSoThue = ?",
        [maSoThue]
    );
    return rows;
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
exports.checkDuplicateForUpdate = async (id, email, soDienThoai, maSoThue) => {
    const [rows] = await db.execute(
        "SELECT tenant_id FROM tenant WHERE (email = ? OR soDienThoai = ? OR maSoThue = ?) AND tenant_id != ?",
        [email, soDienThoai, maSoThue, id]
    );
    return rows;
};

exports.deleteTenant = async (tenant_id) => {
  const [result] = await db.execute(
    "DELETE FROM tenant WHERE tenant_id = ?",
    [tenant_id]
  );
  return result;
};