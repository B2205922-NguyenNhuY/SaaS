const db = require("../config/database");


// Áp dụng biểu phí
exports.createFeeAssignment = async (data) => {

    const {
        tenant_id,
        fee_id,
        target_type,
        target_id,
        ngayApDung,
        mucMienGiam
    } = data;

    const [result] = await db.execute(
        `INSERT INTO fee_assignment
        (tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [
            tenant_id,
            fee_id,
            target_type,
            target_id,
            ngayApDung,
            mucMienGiam
        ]
    );

    return result;
};


// Lấy fee assignment theo target
exports.getFeeAssignments = async (tenant_id, target_type, target_id) => {

    const [rows] = await db.execute(
        `SELECT fa.*, fs.tenBieuPhi, fs.donGia
        FROM fee_assignment fa
        JOIN fee_schedule fs ON fa.fee_id = fs.fee_id
        WHERE fa.tenant_id = ?
        AND fa.target_type = ?
        AND fa.target_id = ?
        AND fa.trangThai = 'active'
            ORDER BY fa.ngayApDung DESC
            LIMIT 1`,
        [tenant_id, target_type, target_id]
    );

    return rows;
};


// Lấy assignment theo fee
exports.getAssignmentsByFee = async (tenant_id, fee_id) => {

    const [rows] = await db.execute(
        `SELECT *
        FROM fee_assignment
        WHERE tenant_id = ?
        AND fee_id = ?`,
        [tenant_id, fee_id]
    );

    return rows;
};


// Deactivate assignment
exports.deactivateAssignment = async (assignment_id, tenant_id) => {

    const [result] = await db.execute(
        `UPDATE fee_assignment
        SET trangThai = 'inactive'
        WHERE assignment_id = ?
        AND tenant_id = ?`,
        [assignment_id, tenant_id]
    );

    return result;
};