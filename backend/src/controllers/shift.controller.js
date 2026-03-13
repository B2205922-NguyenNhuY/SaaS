const shiftService = require("../services/shift.service");


// Bắt đầu ca
exports.startShift = async (req, res, next) => {

    try {

        const result = await shiftService.startShift(req.user);

        res.status(201).json({
            message: "Shift started",
            shift_id: result.insertId
        });

    } catch (err) {

        next(err);

    }

};


// Kết thúc ca
exports.endShift = async (req, res, next) => {
    try {

        if (!req.user) {
            return res.status(401).json({
                message: "User not authenticated"
            });
        }

        console.log("Ending shift with user:", req.user);
        console.log("Shift ID:", req.params.id);

        await shiftService.endShift(
            req.params.id,
            req.user
        );

        res.json({
            message: "Shift ended"
        });
    } catch (err) {
        console.error("Error in endShift controller:", err);
        next(err);
    }
};


// Lấy danh sách ca
exports.getShifts = async (req, res, next) => {

    try {

        const data = await shiftService.getShifts(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy shift đang mở
exports.getActiveShift = async (req, res, next) => {

    try {

        const data = await shiftService.getActiveShift(req.user);

        res.json(data);

    } catch (err) {

        next(err);

    }

};