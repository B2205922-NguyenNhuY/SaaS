const db = require("../config/database");


// Danh sách công nợ
exports.getDebts = async (tenant_id, period_id) => {

    const [rows] = await db.execute(
        `SELECT 
            c.charge_id,
            c.soTienPhaiThu,
            c.soTienDaThu,
            (c.soTienPhaiThu - c.soTienDaThu) AS soTienNo,

            m.merchant_id,
            m.hoTen,

            k.kiosk_id,
            k.maKiosk,

            z.zone_id,
            z.tenKhu,

            p.tenKyThu

        FROM charge c

        JOIN merchant m 
        ON c.merchant_id = m.merchant_id
        AND m.tenant_id = c.tenant_id

        JOIN kiosk k 
        ON c.kiosk_id = k.kiosk_id
        AND k.tenant_id = c.tenant_id

        WHERE c.tenant_id = ?
        AND c.trangThai IN ('chua_thu','no')
        AND (? IS NULL OR c.period_id = ?)

        JOIN collection_period p
        ON c.period_id = p.period_id
        AND p.tenant_id = c.tenant_id

        WHERE c.tenant_id = ?
        AND c.trangThai IN ('chua_thu','no')
        AND (? IS NULL OR c.period_id = ?)
        ORDER BY soTienNo DESC
        LIMIT ? OFFSET ?`,
        [tenant_id]
    );

    return rows;
};



// Công nợ theo merchant
exports.getDebtsByMerchant = async (tenant_id, merchant_id) => {

    const [rows] = await db.execute(
        `SELECT 
            c.charge_id,
            c.soTienPhaiThu,
            c.soTienDaThu,
            (c.soTienPhaiThu - c.soTienDaThu) AS soTienNo,

            k.maKiosk,
            p.tenKyThu
            z.tenKhu

        FROM charge c

        JOIN kiosk k 
        ON c.kiosk_id = k.kiosk_id
        AND k.tenant_id = c.tenant_id

        JOIN zone z
        ON k.zone_id = z.zone_id
        AND z.tenant_id = c.tenant_id

        JOIN collection_period p 
        ON c.period_id = p.period_id
        AND p.tenant_id = c.tenant_id

        WHERE c.tenant_id = ?
        AND c.merchant_id = ?
        AND c.trangThai IN ('chua_thu','no')`,
        [tenant_id, merchant_id]
    );

    return rows;
};



// Tổng công nợ
exports.getTotalDebt = async (tenant_id) => {

    const [rows] = await db.execute(
        `SELECT 
            SUM(soTienPhaiThu - soTienDaThu) AS tongNo
        FROM charge
        WHERE tenant_id = ?
        AND trangThai IN ('chua_thu','no')`,
        [tenant_id]
    );

    return rows[0];
};



// Top merchant nợ nhiều nhất
exports.getTopDebtors = async (tenant_id) => {

    const [rows] = await db.execute(
        `SELECT 
            m.merchant_id,
            m.hoTen,

            SUM(c.soTienPhaiThu - c.soTienDaThu) AS tongNo,

            COUNT(DISTINCT c.kiosk_id) AS soKioskNo

        FROM charge c

        JOIN merchant m 
        ON c.merchant_id = m.merchant_id
        AND m.tenant_id = c.tenant_id

        WHERE c.tenant_id = ?
        AND c.trangThai IN ('chua_thu','no')

        GROUP BY m.merchant_id, m.hoTen

        ORDER BY tongNo DESC

        LIMIT 10`,
        [tenant_id]
    );

    return rows;
};