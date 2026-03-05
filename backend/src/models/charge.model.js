const db = require("../config/database");


// Tạo charge
exports.createCharge = async (data) => {

    const {
        tenant_id,
        period_id,
        kiosk_id,
        merchant_id,
        fee_id,
        soTienPhaiThu,
        soTienDaThu,
        trangThai,
        version,
        donGiaApDung,
        hinhThucApDung
    } = data;

    const [result] = await db.execute(
        `INSERT INTO charge (tenant_id, period_id, kiosk_id, merchant_id, fee_id, soTienPhaiThu, soTienDaThu, trangThai, version, donGiaApDung, hinhThucApDung) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tenant_id,
            period_id,
            kiosk_id,
            merchant_id,
            fee_id,
            soTienPhaiThu,
            soTienDaThu,
            trangThai,
            version,
            donGiaApDung,
            hinhThucApDung
        ]
    );

    return result;
};


// Lấy danh sách charge theo kỳ
exports.getChargesByPeriod = async (tenant_id, period_id) => {

    const [rows] = await db.execute(
        `SELECT c.*, k.maKiosk, m.hoTen
        FROM charge c
        JOIN kiosk k ON c.kiosk_id = k.kiosk_id
        JOIN merchant m ON c.merchant_id = m.merchant_id
        WHERE c.tenant_id = ?
        AND c.period_id = ?`,
        [tenant_id, period_id]
    );

    return rows;
};


// Lấy charge theo merchant
exports.getChargesByMerchant = async (tenant_id, merchant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM charge
        WHERE tenant_id = ?
        AND merchant_id = ?`,
        [tenant_id, merchant_id]
    );

    return rows;
};


// Lấy charge theo id
exports.getChargeById = async (tenant_id, charge_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM charge
        WHERE charge_id = ?
        AND tenant_id = ?
        LIMIT 1`,
        [charge_id, tenant_id]
    );

    return rows[0];
};


// Cập nhật trạng thái charge
exports.updateChargeStatus = async (charge_id, tenant_id, status) => {

    const [result] = await db.execute(
        `UPDATE charge
        SET trangThai = ?
        WHERE charge_id = ?
        AND tenant_id = ?`,
        [status, charge_id, tenant_id]
    );

    return result;
};


// Cập nhật trạng thái nợ
exports.updateDebtStatus = async (charge_id, tenant_id, data) => {

    const {
        soTienDaThu,
        trangThai
    } = data;

    const [result] = await db.execute(
        `UPDATE charge
        SET soTienDaThu = ?,
            trangThai = ?
        WHERE charge_id = ?
        AND tenant_id = ?`,
        [
            soTienDaThu,
            trangThai,
            charge_id,
            tenant_id
        ]
    );

    return result;
};


// Lấy lịch sử chỉnh sửa công nợ
exports.getChargeHistory = async (tenant_id, charge_id) => {

    const [rows] = await db.execute(
        `SELECT 
            al.*,
            u.hoTen

        FROM audit_log al
        LEFT JOIN users u ON al.user_id = u.user_id

        WHERE al.entity_type = 'charge'
        AND al.entity_id = ?
        AND al.tenant_id = ?

        ORDER BY al.thoiGianThucHien DESC`,
        [
            charge_id,
            tenant_id
        ]
    );

    return rows;
};