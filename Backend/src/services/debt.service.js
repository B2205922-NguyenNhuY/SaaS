const debtModel = require("../models/debt.model");

// Danh sách công nợ
exports.getDebts = async (page, limit, user) => {
  // Ép kiểu chắc chắn là số nguyên (Integer)
  const p = parseInt(page) || 1;
  const l = parseInt(limit) || 10;
  const offset = (p - 1) * l;

  return await debtModel.getDebts(
    user.tenant_id,
    l, // Đảm bảo là Number
    offset, // Đảm bảo là Number
  );
};

exports.getDebtsByCharge = async (charge_id, user) => {
  return await debtModel.getDebtsByCharge(user.tenant_id, charge_id);
};

// Công nợ theo merchant
exports.getDebtsByMerchant = async (merchant_id, user) => {
  return await debtModel.getDebtsByMerchant(user.tenant_id, merchant_id);
};

// Tổng công nợ
exports.getTotalDebt = async (user) => {
  return await debtModel.getTotalDebt(user.tenant_id);
};

// Top merchant nợ nhiều nhất
exports.getTopDebtors = async (user) => {
  return await debtModel.getTopDebtors(user.tenant_id);
};
