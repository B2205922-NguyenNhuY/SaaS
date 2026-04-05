const debtModel = require("../models/debt.model");

exports.getDebts = async (pagination, user, query = {}) => {
  return await debtModel.getDebts(user.tenant_id, pagination, query);
};

exports.getDebtsByCharge = async (charge_id, user) => {
  return await debtModel.getDebtsByCharge(user.tenant_id, charge_id);
};

// Công nợ theo merchant
exports.getDebtsByMerchant = async (merchant_id, user) => {
  return await debtModel.getDebtsByMerchant(user.tenant_id, merchant_id);
};

exports.getTotalDebt = async (user) => {
  return await debtModel.getTotalDebt(user.tenant_id);
};

exports.getTopDebtors = async (user) => {
  return await debtModel.getTopDebtors(user.tenant_id);
};
