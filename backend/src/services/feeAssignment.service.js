const feeAssignmentModel = require("../models/feeAssignment.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo fee assignment
exports.createAssignment = async (data, user) => {

    const result = await feeAssignmentModel.createFeeAssignment({
        ...data,
        tenant_id: user.tenant_id
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_FEE_ASSIGNMENT",
        entity_type: "fee_assignment",
        entity_id: result.insertId,
        giaTriMoi: data
    });

    return result;
};


// Lấy assignment theo target
exports.getAssignmentsByTarget = async (target_type, target_id, user) => {

    return await feeAssignmentModel.getFeeAssignments(
        user.tenant_id,
        target_type,
        target_id
    );
};


// lấy assignment theo fee
exports.getAssignmentsByFee = async (fee_id, user) => {

    return await feeAssignmentModel.getAssignmentsByFee(
        user.tenant_id,
        fee_id
    );
};


// Deactivate assignment
exports.deactivateAssignment = async (assignment_id, user) => {

    const result = await feeAssignmentModel.deactivateAssignment(
        assignment_id,
        user.tenant_id
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "DEACTIVATE_FEE_ASSIGNMENT",
        entity_type: "fee_assignment",
        entity_id: assignment_id
    });

    return result;
};