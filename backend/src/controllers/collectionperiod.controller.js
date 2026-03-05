const periodService = require("../services/collectionperiod.service");


// Tạo kỳ thu
exports.createPeriod = async (req, res, next) => {

    try {

        const result = await periodService.createPeriod(
            req.body,
            req.user
        );

        res.status(201).json({
            message: "Collection period created",
            period_id: result.insertId
        });

    } catch (err) {

        next(err);

    }
};


// List kỳ thu
exports.getPeriods = async (req, res, next) => {

    try {

        const data = await periodService.getPeriods(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Chi tiết kỳ thu
exports.getPeriodDetail = async (req, res, next) => {

    try {

        const data = await periodService.getPeriodDetail(
            req.params.id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Update kỳ thu
exports.updatePeriod = async (req, res, next) => {

    try {

        await periodService.updatePeriod(
            req.params.id,
            req.body,
            req.user
        );

        res.json({
            message: "Period updated"
        });

    } catch (err) {

        next(err);

    }

};


// Delete kỳ thu
exports.deletePeriod = async (req, res, next) => {

    try {

        await periodService.deletePeriod(
            req.params.id,
            req.user
        );

        res.json({
            message: "Period deleted"
        });

    } catch (err) {

        next(err);

    }

};