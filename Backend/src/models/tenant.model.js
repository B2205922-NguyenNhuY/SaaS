const db = require("../config/db");

//Tạo Tenant
exports.createTenant = async (connection, tenantData) => {
    
    const { tenBanQuanLy, diaChi, soDienThoai, email, trangThai } = tenantData;

    const [result] = await connection.execute(
        "INSERT INTO tenant (tenBanQuanLy, diaChi, soDienThoai, email, trangThai) VALUES (?, ?, ?, ?, ?)",
        [tenBanQuanLy, diaChi, soDienThoai, email, trangThai || 'active',]
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