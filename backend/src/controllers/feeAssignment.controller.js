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
        const { target_type, target_id } = req.query;
        
        if (!target_type) {
            return res.status(400).json({
                message: "Missing required param: target_type"
            });
        }
        
        if (!target_id) {
            return res.status(400).json({
                message: "Missing required param: target_id"
            });
        }
        
        const validTargetTypes = ['kiosk', 'zone', 'kiosk_type'];
        if (!validTargetTypes.includes(target_type)) {
            return res.status(400).json({
                message: "Invalid target_type. Must be 'kiosk', 'zone', or 'kiosk_type'"
            });
        }
        
        const targetIdNum = parseInt(target_id);
        if (isNaN(targetIdNum)) {
            return res.status(400).json({
                message: "target_id must be a number"
            });
        }

        console.log("Getting assignments for:", { 
            target_type, 
            target_id: targetIdNum,
            user: req.user 
        });

        const data = await feeAssignmentService.getAssignmentsByTarget(
            target_type,
            targetIdNum,
            req.user
        );

        res.json({
            success: true,
            data: data || null
        });
    } catch (err) {
        console.error("Error in getAssignmentsByTarget:", err);
        next(err);
    }
};


// Lấy theo fee
exports.getAssignmentsByFee = async (req, res, next) => {
    try {
        const { fee_id } = req.params;
        
        if (!fee_id) {
            return res.status(400).json({
                message: "Missing required param: fee_id"
            });
        }

        const data = await feeAssignmentService.getAssignmentsByFee(
            fee_id,
            req.user
        );

        res.json({
            success: true,
            data: data || []
        });
    } catch (err) {
        next(err);
    }
};


// Deactivate
exports.deactivateAssignment = async (req, res, next) => {
    try {
        const { id } = req.params;
        
        if (!id) {
            return res.status(400).json({
                message: "Missing required param: id"
            });
        }

        await feeAssignmentService.deactivateAssignment(
            id,
            req.user
        );

        res.json({
            success: true,
            message: "Assignment deactivated"
        });
    } catch (err) {
        next(err);
    }
};