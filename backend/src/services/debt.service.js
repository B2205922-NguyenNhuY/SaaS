const debtModel = require("../models/debt.model");


// Danh sách công nợ
exports.getDebts = async (user) => {

    return await debtModel.getDebts(
        user.tenant_id
    );

};


// Công nợ theo merchant
exports.getDebtsByMerchant = async (merchant_id, user) => {

    return await debtModel.getDebtsByMerchant(
        user.tenant_id,
        merchant_id
    );

};


// Tổng công nợ
exports.getTotalDebt = async (user) => {

    return await debtModel.getTotalDebt(
        user.tenant_id
    );

};


// Top merchant nợ nhiều nhất
exports.getTopDebtors = async (user) => {

    return await debtModel.getTopDebtors(
        user.tenant_id
    );

};