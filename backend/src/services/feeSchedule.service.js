const db = require("../config/database");

const feeScheduleModel = require("../models/feeSchedule.model");
const feeAssignmentModel = require("../models/feeAssignment.model");
const chargeModel = require("../models/charge.model");
const auditLogModel = require("../models/auditLog.model");


// Tạo biểu phí
exports.createFee = async (data, user) => {

    const result = await feeScheduleModel.createFeeSchedule({
        ...data,
        tenant_id: user.tenant_id
    });

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "CREATE_FEE",
        entity_type: "fee_schedule",
        entity_id: result.insertId,
        giaTriMoi: data
    });

    return result;
};


// Danh sách biểu phí
exports.getFees = async (user) => {

    return await feeScheduleModel.getFeesByTenant(
        user.tenant_id
    );
};


// Chi tiết biểu phí
exports.getFeeDetail = async (fee_id, user) => {

    return await feeScheduleModel.getFeeById(
        fee_id,
        user.tenant_id
    );
};


// Cập nhật biểu phí
exports.updateFee = async (fee_id, data, user) => {

    const connection = await db.getConnection();

    try {

        await connection.beginTransaction();

        const tenant_id = user.tenant_id;

        const oldFee =
            await feeModel.getFeeById(
                fee_id,
                tenant_id
            );

        if (!oldFee)
            throw new Error("Fee not found");

        await feeModel.updateFeeSchedule(
            fee_id,
            tenant_id,
            data
        );

        const assignments =
            await feeAssignmentModel.getAssignmentsByFee(
                tenant_id,
                fee_id
            );

        for (const a of assignments) {

            await chargeModel.recalculateChargesByTarget(
                connection,
                tenant_id,
                a.target_type,
                a.target_id,
                data.donGia,
                a.mucMienGiam || 0
            );

        }

        await auditLogModel.createAuditLog({
            tenant_id,
            user_id: user.id,
            hanhDong: "UPDATE_FEE",
            entity_type: "fee_schedule",
            entity_id: fee_id,
            giaTriCu: oldFee,
            giaTriMoi: data
        });

        await connection.commit();

    } catch (err) {

        await connection.rollback();
        throw err;

    } finally {

        connection.release();

    }

};


// Xóa biểu phí
exports.deleteFee = async (fee_id, user) => {

    const oldFee = await feeScheduleModel.getFeeById(
        fee_id,
        user.tenant_id
    );

    const result = await feeScheduleModel.deleteFeeSchedule(
        fee_id,
        user.tenant_id
    );

    await auditLogModel.createAuditLog({
        tenant_id: user.tenant_id,
        user_id: user.id,
        hanhDong: "DELETE_FEE",
        entity_type: "fee_schedule",
        entity_id: fee_id,
        giaTriCu: oldFee
    });

    return result;
};