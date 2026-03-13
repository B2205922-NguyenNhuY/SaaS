const chargeService = require("../services/charge.service");


// Tạo charge
exports.createCharge = async (req, res, next) => {

    try {

        const result = await chargeService.createCharge(
            req.body,
            req.user
        );

        res.status(201).json({
            message: "Charge created",
            charge_id: result.insertId
        });

    } catch (err) {

        next(err);

    }
};


// Lấy charge theo period
exports.getChargesByPeriod = async (req, res, next) => {

    try {

        const data = await chargeService.getChargesByPeriod(
            req.params.period_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy charge theo merchant
exports.getChargesByMerchant = async (req, res, next) => {

    try {

        const data = await chargeService.getChargesByMerchant(
            req.params.merchant_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Update trạng thái
exports.updateChargeStatus = async (req, res, next) => {
    try {

        await chargeService.updateChargeStatus(
            req.params.id,
            req.body,
            req.user
        );

        res.json({
            message: "Charge status updated"
        });
    } catch (err) {
        next(err);
    }
};


// Update trạng thái nợ
exports.updateDebtStatus = async (req, res, next) => {

    try {

        await chargeService.updateDebtStatus(
            req.params.id,
            req.body,
            req.user
        );

        res.json({
            message: "Debt status updated"
        });

    } catch (err) {

        next(err);

    }

};


// Lấy lịch sử charge
exports.getChargeHistory = async (req, res, next) => {

    try {

        const data = await chargeService.getChargeHistory(
            req.params.id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};