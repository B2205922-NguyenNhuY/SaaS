const receiptService = require("../services/receipt.service");
const auditLogModel = require("../models/auditLog.model");
const { logAudit } = require("../utils/audit");

// Tạo receipt
exports.createReceipt = async (req, res, next) => {
  try {
    const result = await receiptService.createReceipt(req.body, req.user);
    await logAudit(req, {
      action: "CREATE_RECEIPT",
      entity_type: "receipt",
      entity_id: result.insertId,
      newValue: req.body,
    });
    res.status(201).json({ message: "Receipt created", receipt_id: result.insertId });
  } catch (err) { next(err); }
};

exports.getMyReceipts = async (req, res, next) => {
  try {
    const data = await receiptService.getMyReceipts(
      req.user,
      req.pagination,
      req.query,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getReceipts = async (req, res, next) => {
  try {
    const data = await receiptService.getReceipts(
      req.user,
      req.pagination,
      req.query,
    );
    res.json(data);
  } catch (err) {
    next(err);
  }
};

exports.getReceiptDetail = async (req, res, next) => {
  try {
    const data = await receiptService.getReceiptDetail(req.params.id, req.user);
    res.json(data);
  } catch (err) {
    next(err);
  }
};