const receiptChargeService = require("../services/receiptCharge.service");



// Lấy charge trong receipt
exports.getChargesByReceipt = async (req, res, next) => {

    try {

        const data = await receiptChargeService.getChargesByReceipt(
            req.params.receipt_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy receipt của 1 charge
exports.getReceiptsByCharge = async (req, res, next) => {

    try {

        const data = await receiptChargeService.getReceiptsByCharge(
            req.params.charge_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};