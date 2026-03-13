const db = require("../config/database");


// Áp dụng biểu phí
exports.createFeeAssignment = async (data) => {
    const { tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam } = data;

    const [result] = await db.execute(
        `INSERT INTO fee_assignment
        (tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam)
        VALUES (?, ?, ?, ?, ?, ?)`,
        [tenant_id, fee_id, target_type, target_id, ngayApDung, mucMienGiam]
    );

    return result;
};


// Lấy fee assignment theo target
exports.getActiveFeeAssignment = async (tenant_id, target_type, target_id) => {

    if (!tenant_id || !target_type || !target_id) {
        console.error("getActiveFeeAssignment - Missing params:", {
            tenant_id,
            target_type,
            target_id
        });
        throw new Error("Missing required parameters for fee assignment query");
    }

    try {
        console.log("Querying with:", { tenant_id, target_type, target_id });

        const [rows] = await db.execute(
            `
            SELECT 
                fa.*,
                fs.tenBieuPhi,
                fs.donGia,
                fs.hinhThuc
            FROM fee_assignment fa
            JOIN fee_schedule fs 
                ON fa.fee_id = fs.fee_id
                AND fa.tenant_id = fs.tenant_id
            WHERE fa.tenant_id = ?
                AND fa.target_type = ?
                AND fa.target_id = ?
                AND fa.trangThai = 'active'
            ORDER BY fa.ngayApDung DESC
            LIMIT 1
            `,
            [tenant_id, target_type, target_id]
        );

        console.log("Query result:", rows[0] || "No active assignment found");
        return rows[0] || null;

    } catch (error) {
        console.error("Database error in getActiveFeeAssignment:", error);
        throw error;
    }
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


// Lấy assignment theo ID
exports.getById = async (assignment_id, tenant_id) => {
    const [rows] = await db.execute(
        `SELECT fa.*, fs.donGia
        FROM fee_assignment fa
        JOIN fee_schedule fs 
            ON fa.fee_id = fs.fee_id
        WHERE fa.assignment_id = ?
        AND fa.tenant_id = ?
        LIMIT 1`,
        [assignment_id, tenant_id]
    );

    return rows[0];
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


// Update mức miễn giảm
exports.updateDiscount = async (connection, assignment_id, tenant_id, discount) => {
    const [result] = await connection.execute(
        `UPDATE fee_assignment
        SET mucMienGiam = ?
        WHERE assignment_id = ?
        AND tenant_id = ?`,
        [discount, assignment_id, tenant_id]
    );

    return result;
};