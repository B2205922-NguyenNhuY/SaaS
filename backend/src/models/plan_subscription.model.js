const db = require("../config/database");

exports.createSubscription = async (connection, data) => {
  const { plan_id, tenant_id } = data;
  const [result] = await connection.execute(
    `INSERT INTO plan_subscription
     (plan_id, tenant_id, trangThai, ngayBatDau, ngayKetThuc)
     VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
    [plan_id, tenant_id],
  );
  return result.insertId;
};

exports.getAllSubscriptions = async () => {
  const [rows] = await db.execute(
    "SELECT * FROM plan_subscription ORDER BY subscription_id DESC",
  );
  return rows;
};

exports.getSubscriptionById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM plan_subscription WHERE subscription_id = ?",
    [id],
  );
  return rows[0];
};

exports.getSubscriptionByStripeId = async (
  _connection,
  _stripe_subscription_id,
) => null;
exports.updateStripeSubscriptionId = async (
  _connection,
  _subscription_id,
  _stripe_subscription_id,
) => ({ affectedRows: 0 });

exports.getSubscriptionByStatus = async (status) => {
  const [rows] = await db.execute(
    "SELECT * FROM plan_subscription WHERE trangThai = ?",
    [status],
  );
  return rows;
};

exports.updateSubscriptionStatus = async (id) => {
  const [result] = await db.execute(
    "UPDATE plan_subscription SET trangThai = 'expired' WHERE subscription_id = ?",
    [id],
  );
  return result;
};

exports.checkSubscription = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT * FROM plan_subscription WHERE tenant_id = ? AND trangThai = 'active' AND ngayKetThuc > NOW()`,
    [tenant_id],
  );
  return rows;
};

exports.checkSubscribed = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT * FROM plan_subscription WHERE tenant_id = ? ORDER BY subscription_id DESC LIMIT 1`,
    [tenant_id],
  );
  return rows;
};

exports.getActiveByTenantForUpdate = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT subscription_id FROM plan_subscription WHERE tenant_id = ? AND trangThai = 'active' FOR UPDATE`,
    [tenant_id],
  );
  return rows;
};

exports.getPlanByTenantSubscribed = async (tenant_id) => {
  const [rows] = await db.execute(
    `SELECT p.*
     FROM plan_subscription ps
     JOIN plan p ON ps.plan_id = p.plan_id
     WHERE ps.tenant_id = ? AND ps.trangThai = 'active'
     ORDER BY ps.subscription_id DESC`,
    [tenant_id],
  );
  return rows;
};

exports.expireSubscription = async (_connection, _stripe_subscription_id) => ({
  affectedRows: 0,
});
exports.activateSubscription = async (connection, subscription_id) => {
  await connection.execute(
    "UPDATE plan_subscription SET trangThai='active' WHERE subscription_id=?",
    [subscription_id],
  );
};
exports.extendSubscription = async (connection, subscription_id) => {
  await connection.execute(
    `UPDATE plan_subscription SET trangThai='active', ngayKetThuc = DATE_ADD(ngayKetThuc, INTERVAL 1 MONTH) WHERE subscription_id = ?`,
    [subscription_id],
  );
};
