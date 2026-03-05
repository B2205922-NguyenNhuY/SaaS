const db = require("../config/database");


// Tạo mapping receipt - charge
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



// Lấy charge trong receipt
exports.getChargesByReceipt = async (receipt_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT rc.*, c.kiosk_id, c.merchant_id, c.soTienPhaiThu
        FROM receipt_charge rc
        JOIN charge c ON rc.charge_id = c.charge_id
        WHERE rc.receipt_id = ?
        AND rc.tenant_id = ?`,
        [receipt_id, tenant_id]
    );

    return rows;
};



// Lấy receipt của 1 charge
exports.getReceiptsByCharge = async (charge_id, tenant_id) => {

    const [rows] = await db.execute(
        `SELECT rc.*, r.thoiGianThu
        FROM receipt_charge rc
        JOIN receipt r ON rc.receipt_id = r.receipt_id
        WHERE rc.charge_id = ?
        AND rc.tenant_id = ?`,
        [charge_id, tenant_id]
    );

    return rows;
};