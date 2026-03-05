const feeService = require("../services/feeSchedule.service");


// Tạo biểu phí
exports.createFee = async (req, res, next) => {

    try {

        const result = await feeService.createFee(
            req.body,
            req.user
        );

        res.status(201).json({
            message: "Fee created",
            fee_id: result.insertId
        });

    } catch (err) {

        next(err);

    }

};


// Danh sách biểu phí
exports.getFees = async (req, res, next) => {

    try {

        const data = await feeService.getFees(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Chi tiết biểu phí
exports.getFeeDetail = async (req, res, next) => {

    try {

        const data = await feeService.getFeeDetail(
            req.params.id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Cập nhật biểu phí
exports.updateFee = async (req, res, next) => {

    try {

        await feeService.updateFee(
            req.params.id,
            req.body,
            req.user
        );

        res.json({
            message: "Fee updated"
        });

    } catch (err) {

        next(err);

    }

};


// Xóa biểu phí
exports.deleteFee = async (req, res, next) => {

    try {

        await feeService.deleteFee(
            req.params.id,
            req.user
        );

        res.json({
            message: "Fee deleted"
        });

    } catch (err) {

        next(err);

    }

};