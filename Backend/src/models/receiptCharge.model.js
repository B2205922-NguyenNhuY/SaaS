const db = require("../config/db");

// Lấy charge trong receipt
exports.getChargesByReceipt = async (receipt_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT rc.*, c.*, k.maKiosk, cp.tenKyThu
        FROM receipt_charge rc
        JOIN charge c ON rc.charge_id = c.charge_id
        JOIN kiosk k ON c.kiosk_id = k.kiosk_id
        JOIN collection_period cp ON c.period_id = cp.period_id
        AND c.tenant_id = rc.tenant_id
        WHERE rc.receipt_id = ?
        AND rc.tenant_id = ?`,
    [receipt_id, tenant_id],
  );

  return rows;
};

// Lấy receipt của 1 charge
exports.getReceiptsByCharge = async (charge_id, tenant_id) => {
  const [rows] = await db.execute(
    `SELECT rc.*, r.thoiGianThu
        FROM receipt_charge rc
        JOIN receipt r 
        ON rc.receipt_id = r.receipt_id
        AND r.tenant_id = rc.tenant_id
        WHERE rc.charge_id = ?
        AND rc.tenant_id = ?`,
    [charge_id, tenant_id],
  );

  return rows;
};
