const db = require("../config/db");

//Tạo Subscription
exports.createSubscription = async (connection,data) => {
    const {plan_id, tenant_id, stripe_subscription_id} = data;

    const [result] = await connection.execute(
        "INSERT INTO plan_subscription (plan_id, tenant_id, stripe_subscription_id, trangThai, ngayBatDau, ngayKetThuc) VALUES (?, ?, ?, 'pending', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))",
        [plan_id, tenant_id, stripe_subscription_id]
    );

    return result.insertId;
};

//Tạo Pending
exports.createPending = async ({tenant_id, plan_id, ngayBatDau, ngayKetThuc}) => {

    const [result] = await connection.execute(
        "INSERT INTO plan_subscription (plan_id, tenant_id, trangThai, ngayBatDau, ngayKetThuc) VALUES (?, ?, 'pending', ?, ?)",
        [plan_id, tenant_id, ngayBatDau, ngayKetThuc]
    );

    return result.insertId;
};

//Lấy tất cả Subscription
exports.getAllSubscriptions = async () => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription"
    );

    return rows;
};

//Lấy subscription theo id
exports.getSubscriptiontById = async (id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE subscription_id = ?",
        [id]
    );

    return rows[0];
};

//Lấy subscription theo stripe_subscription_id
exports.getSubscriptionByStripeId = async (connection, stripe_subscription_id) => {
    const [rows] = await connection.execute(
        "SELECT * FROM plan_subscription WHERE stripe_subscription_id = ?",
        [stripe_subscription_id]
    );
    console.log("sub:",rows);

    return rows[0];
};

//Lấy subscription theo id
exports.getSubscriptiontByStatus = async (status) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE status = ?",
        [status]
    );

    return rows;
};

exports.updateEndDate = async (connection,subscription_id,endDate) => {
    await connection.execute(
    "UPDATE plan_subscription SET ngayKetThuc = ?, trangThai = 'active' WHERE subscription_id = ?",
    [endDate, subscription_id]
  );
};


//Cập nhật stripe_subscription
exports.updateStripeSubscriptionId = async (connection,subscription_id,stripe_subscription_id) => {
    await connection.execute(
    "UPDATE plan_subscription SET stripe_subscription_id = ?, trangThai = 'active' WHERE subscription_id = ?",
    [stripe_subscription_id, subscription_id]
  );
};

//Cập nhật trạng thái Subscription
exports.updateSubscriptionStatus = async (id) => {
    
    const [result] = await db.execute(
        "UPDATE plan_subscription SET trangThai = 'expired' WHERE subscription_id=?",
        [id]
    );

    return result;
};


//Kiểm tra trùng
exports.checkDuplicate = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT subscription_id FROM plan_subscription WHERE tenant_id=? AND trangThai='active'",
        [tenant_id]
    );

    return rows;
}

//Kiểm tra Gói còn hiệu lực
exports.checkSubscription = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE tenant_id=? AND trangThai='active' AND ngayKetThuc>NOW()",
        [tenant_id]
    );

    return rows;
}

//Kiểm tra đăng ký gói
exports.checkSubscribed = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT * FROM plan_subscription WHERE tenant_id=? ORDER BY subscription_id DESC LIMIT 1",
        [tenant_id]
    );

    return rows;
}
//Tìm Subscription active
exports.getActiveByTenantForUpdate = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT subscription_id FROM plan_subscription WHERE tenant_id=? AND trangThai='active' FOR UPDATE",
        [tenant_id]
    );

    return rows
};

//Tìm gói tenant đang đăng ký
exports.getPlanByTenantSubscribed = async (tenant_id) => {
    const [rows] = await db.execute(
        "SELECT p.* FROM plan_subscription ps JOIN plan p ON ps.plan_id = p.plan_id WHERE ps.tenant_id=? AND ps.trangThai='active'",
        [tenant_id]
    );

    return rows
};

//Update Subscription active thành hết hạn
exports.expireActiveByTenant = async (connection, tenant_id) => {
    await connection.execute(
        "UPDATE plan_subscription SET trangThai='expired' WHERE tenant_id=? AND trangThai = 'active'",
        [tenant_id]
    );
};

//Update Subscription hết hạn
exports.expire = async (subscription_id) => {
    await connection.execute(
        "UPDATE plan_subscription SET trangThai='expired' WHERE subscription_id=?",
        [subscription_id]
    );
};

//Kích hoạt subscription sau thanh toán
exports.activateSubscription = async (connection,subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active' WHERE subscription_id = ?",
    [subscription_id]
  );
};

//Kích hoạt subscription sau thanh toán
exports.activate = async (subscription_id, stripe_subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active', stripe_subsciption_id=? WHERE subscription_id = ?",
    [stripe_subscription_id, subscription_id]
  );
};

//Gia hạn gói
exports.extendSubscription = async (connection, subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active', ngayKetThuc = DATE_ADD(ngayKetThuc, INTERVAL 1 MONTH) WHERE subscription_id = ?",
    [subscription_id]
  );
};

//Gia hạn gói
exports.extendEndDate = async (subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai = 'active', ngayKetThuc = DATE_ADD(ngayKetThuc, INTERVAL 1 MONTH) WHERE subscription_id = ?",
    [subscription_id]
  );
};