const debtService = require("../services/debt.service");


// Lấy danh sách công nợ
exports.getDebts = async (req, res, next) => {

    try {

        const data = await debtService.getDebts(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy công nợ theo merchant
exports.getDebtsByMerchant = async (req, res, next) => {

    try {

        const data = await debtService.getDebtsByMerchant(
            req.params.merchant_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy tổng công nợ
exports.getTotalDebt = async (req, res, next) => {

    try {

        const data = await debtService.getTotalDebt(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy top merchant nợ nhiều nhất
exports.getTopDebtors = async (req, res, next) => {

    try {

        const data = await debtService.getTopDebtors(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};