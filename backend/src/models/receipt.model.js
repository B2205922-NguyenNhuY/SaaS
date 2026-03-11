const db = require("../config/database");


// Tạo receipt
exports.createReceipt = async (connection, data) => {

    const {
        tenant_id,
        soTienThu,
        hinhThucThanhToan,
        ghiChu,
        anhChupThanhToan,
        thoiGianThu,
        user_id,
        shift_id
    } = data;

    const [result] = await connection.execute(
        `INSERT INTO receipt
        (tenant_id, soTienThu, hinhThucThanhToan, ghiChu,
        anhChupThanhToan, thoiGianThu, user_id, shift_id)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
            tenant_id,
            soTienThu,
            hinhThucThanhToan,
            ghiChu,
            anhChupThanhToan,
            thoiGianThu,
            user_id,
            shift_id
        ]
    );

    return result;
};



// Gắn receipt với charge
exports.createReceiptCharge = async (data) => {

    const {
        receipt_id,
        charge_id,
        tenant_id,
        soTienDaTra
    } = data;

    const [result] = await db.execute(
        `INSERT INTO receipt_charge
        (receipt_id, charge_id, tenant_id, soTienDaTra)
        VALUES (?, ?, ?, ?)`,
        [
            receipt_id,
            charge_id,
            tenant_id,
            soTienDaTra
        ]
    );

    return result;
};



// Lấy receipt theo id
exports.getReceiptById = async (receipt_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM receipt
        WHERE receipt_id = ?
        AND tenant_id = ?
        LIMIT 1`,
        [receipt_id, tenant_id]
    );

    return rows[0];
};



// Danh sách receipt
exports.getReceiptsByTenant = async (tenant_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM receipt
        WHERE tenant_id = ?
        ORDER BY thoiGianThu DESC`,
        [tenant_id]
    );

    return rows;
};



// Charge trong receipt
exports.getReceiptCharges = async (receipt_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT rc.*, c.kiosk_id, c.merchant_id
        FROM receipt_charge rc
        JOIN charge c ON rc.charge_id = c.charge_id
        WHERE rc.receipt_id = ?
        AND rc.tenant_id = ?`,
        [receipt_id, tenant_id]
    );

    return rows;
};



// Chi tiết biên lai
exports.getReceiptDetail = async (receipt_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT 

            r.receipt_id,
            r.soTienThu,
            r.hinhThucThanhToan,
            r.ghiChu,
            r.anhChupThanhToan,
            r.thoiGianThu,

            u.hoTen AS nhanVienThu,

            c.charge_id,
            c.soTienPhaiThu,
            rc.soTienDaTra,

            k.maKiosk,
            m.hoTen AS merchant,
            p.tenKyThu,
            f.tenBieuPhi

        FROM receipt r

        LEFT JOIN users u 
        ON r.user_id = u.user_id

        JOIN receipt_charge rc
        ON r.receipt_id = rc.receipt_id

        JOIN charge c
        ON rc.charge_id = c.charge_id
        AND c.tenant_id = r.tenant_id

        JOIN kiosk k
        ON c.kiosk_id = k.kiosk_id
        AND k.tenant_id = r.tenant_id

        JOIN merchant m
        ON c.merchant_id = m.merchant_id
        AND m.tenant_id = r.tenant_id

        JOIN collection_period p
        ON c.period_id = p.period_id
        AND p.tenant_id = r.tenant_id

        JOIN fee_schedule f
        ON c.fee_id = f.fee_id
        AND f.tenant_id = r.tenant_id

        WHERE r.receipt_id = ?
        AND r.tenant_id = ?`,
        [receipt_id, tenant_id]
    );

    return rows;
};