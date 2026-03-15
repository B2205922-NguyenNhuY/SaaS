const receiptChargeModel = require("../models/receiptCharge.model");
const auditLogModel = require("../models/auditLog.model");
const receiptModel = require("../models/receipt.model");
const chargeModel = require("../models/charge.model");

// Lấy charge trong receipt
exports.getChargesByReceipt = async (receipt_id, user) => {
  const receipt = await receiptModel.getReceiptById(receipt_id, user.tenant_id);

  if (!receipt) {
    throw new Error("Receipt not found");
  }

  return await receiptChargeModel.getChargesByReceipt(
    receipt_id,
    user.tenant_id,
  );
};

// Lấy receipt của 1 charge
exports.getReceiptsByCharge = async (charge_id, user) => {
  const charge = await chargeModel.getChargeById(user.tenant_id, charge_id);

  if (!charge) {
    throw new Error("Charge not found");
  }

  return await receiptChargeModel.getReceiptsByCharge(
    charge_id,
    user.tenant_id,
  );
};
