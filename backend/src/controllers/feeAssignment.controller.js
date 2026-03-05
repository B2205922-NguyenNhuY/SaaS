const feeAssignmentService = require("../services/feeAssignment.service");


// Tạo assignment
exports.createAssignment = async (req, res, next) => {

    try {

        const result = await feeAssignmentService.createAssignment(
            req.body,
            req.user
        );

        res.status(201).json({
            message: "Fee assignment created",
            assignment_id: result.insertId
        });

    } catch (err) {

        next(err);

    }

};


// Lấy theo target
exports.getAssignmentsByTarget = async (req, res, next) => {

    try {

        const data = await feeAssignmentService.getAssignmentsByTarget(
            req.query.target_type,
            req.query.target_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Lấy theo fee
exports.getAssignmentsByFee = async (req, res, next) => {

    try {

        const data = await feeAssignmentService.getAssignmentsByFee(
            req.params.fee_id,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Deactivate
exports.deactivateAssignment = async (req, res, next) => {

    try {

        await feeAssignmentService.deactivateAssignment(
            req.params.id,
            req.user
        );

        res.json({
            message: "Assignment deactivated"
        });

    } catch (err) {

        next(err);

    }

};