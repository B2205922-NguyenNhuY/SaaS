const receiptService = require("../services/receipt.service");


// Tạo receipt
exports.createReceipt = async (req, res, next) => {

    try {

        const result = await receiptService.createReceipt(
            req.body,
            req.user
        );

        res.status(201).json({
            message: "Receipt created",
            receipt_id: result.insertId
        });

    } catch (err) {

        next(err);

    }

};


// Lấy danh sách receipt
exports.getReceipts = async (req, res, next) => {

    try {

        const data = await receiptService.getReceipts(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy chi tiết receipt
exports.getReceiptDetail = async (req, res, next) => {

    try {

        const data = await receiptService.getReceiptDetail(
            req.params.id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};