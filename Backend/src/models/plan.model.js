const db = require("../config/db");

//Tạo Plan
exports.createPlan = async (Data) => {
    const { tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho } = Data;

    const [result] = await db.execute(
        "INSERT INTO plan(tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho) VALUES (?,?,?,?,?)",
        [tenGoi,giaTien,gioiHanSoKiosk,gioiHanUser,gioiHanSoCho]
    )

    return result;
};

//Lấy tất cả Plan
exports.getAllPlans = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM plan"
    );

    return rows;
};

//Lấy plan theo id
exports.getPlanById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan WHERE plan_id = ?",
        [id]
    );

    return rows[0];
};

//Cập nhật thông tin Tenant
exports.updatePlan = async (id, data) => {
    const {tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho} = data;

    const [result] = await db.execute(
        "UPDATE plan SET tenGoi=?, giaTien=?, gioiHanSoKiosk=?, gioiHanUser=?, gioiHanSoCho=? WHERE plan_id=?",
        [tenGoi,giaTien,gioiHanSoKiosk,gioiHanUser,gioiHanSoCho,id]
    );

    return result;
};

//Kiểm tra trùng
exports.checkDuplicate = async (tenGoi) => {
    const [rows] = await db.execute(
        "SELECT plan_id FROM plan WHERE tenGoi = ?",
        [tenGoi]
    );

    return rows;
}

//Kiểm tra trùng khi update
exports.checkDuplicateForUpdate = async (id,tenGoi) => {
    const [rows] = await db.execute(
        "SELECT plan_id FROM plan WHERE tenGoi = ? AND plan_id!=?",
        [tenGoi, id]
    );

    return rows;
}