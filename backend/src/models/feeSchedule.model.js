const db = require("../config/database");


// Tạo biểu phí
exports.createFeeSchedule = async (data) => {

    const {
        tenant_id,
        tenBieuPhi,
        hinhThuc,
        donGia,
        moTa
    } = data;

    const [result] = await db.execute(
        `INSERT INTO fee_schedule
        (tenant_id, tenBieuPhi, hinhThuc, donGia, moTa)
        VALUES (?, ?, ?, ?, ?)`,
        [tenant_id, tenBieuPhi, hinhThuc, donGia, moTa]
    );

    return result;
};


// Lấy biểu phí theo id
exports.getFeeById = async (fee_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM fee_schedule
        WHERE fee_id = ?
        AND tenant_id = ?
        LIMIT 1`,
        [fee_id, tenant_id]
    );

    return rows[0];
};


// Lấy danh sách biểu phí
exports.getFeesByTenant = async (tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM fee_schedule
        WHERE tenant_id = ?
        ORDER BY created_at DESC`,
        [tenant_id]
    );

    return rows;
};


// Cập nhật biểu phí
exports.updateFeeSchedule = async (fee_id, tenant_id, data) => {

    const {
        tenBieuPhi,
        hinhThuc,
        donGia,
        moTa
    } = data;

    const [result] = await db.execute(
        `UPDATE fee_schedule
        SET tenBieuPhi = ?, 
            hinhThuc = ?, 
            donGia = ?, 
            moTa = ?
        WHERE fee_id = ?
        AND tenant_id = ?`,
        [tenBieuPhi, hinhThuc, donGia, moTa, fee_id, tenant_id]
    );

    return result;
};

// Xóa biểu phí
exports.deleteFeeSchedule = async (fee_id, tenant_id) => {

    const [result] = await db.execute(
        `DELETE FROM fee_schedule
        WHERE fee_id = ?
        AND tenant_id = ?`,
        [fee_id, tenant_id]
    );

    return result;
};