const db = require("../config/database");

// Tạo kỳ thu
exports.createCollectionPeriod = async (data) => {

    const {
        tenant_id,
        tenKyThu,
        ngayBatDau,
        ngayKetThuc,
        loaiKy
    } = data;

    const [result] = await db.execute(
        `INSERT INTO collection_period
        (tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy)
        VALUES (?, ?, ?, ?, ?)`,
        [tenant_id, tenKyThu, ngayBatDau, ngayKetThuc, loaiKy]
    );

    return result;
};


// Lấy danh sách kỳ thu theo tenant
exports.getCollectionPeriodsByTenant = async (tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM collection_period
        WHERE tenant_id = ?
        ORDER BY ngayBatDau DESC`,
        [tenant_id]
    );

    return rows;
};


// Lấy chi tiết kỳ thu
exports.getCollectionPeriodById = async (period_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM collection_period
        WHERE period_id = ?
        AND tenant_id = ?
        LIMIT 1`,
        [period_id, tenant_id]
    );

    return rows[0];
};


// Update kỳ thu
exports.updateCollectionPeriod = async (period_id, tenant_id, data) => {

    const { tenKyThu, ngayBatDau, ngayKetThuc } = data;

    const [result] = await db.execute(
        `UPDATE collection_period
        SET tenKyThu=?, ngayBatDau=?, ngayKetThuc=?
        WHERE period_id=? AND tenant_id=?`,
        [tenKyThu, ngayBatDau, ngayKetThuc, period_id, tenant_id]
    );

    return result;
};


// Delete kỳ thu
exports.deleteCollectionPeriod = async (period_id, tenant_id) => {

    const [result] = await db.execute(
        `DELETE FROM collection_period
        WHERE period_id=? AND tenant_id=?`,
        [period_id, tenant_id]
    );

    return result;
};