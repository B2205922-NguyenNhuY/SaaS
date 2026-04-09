const db = require("../config/db");

async function getActivePlan(tenant_id) {
  const [rows] = await db.query(
    `SELECT p.*
     FROM plan_subscription ps
     JOIN plan p ON p.plan_id = ps.plan_id
     WHERE ps.tenant_id = ? AND ps.trangThai IN ('active','trial')
     ORDER BY ps.subscription_id DESC
     LIMIT 1`,
    [tenant_id],
  );
  return rows[0] || null;
}

async function assertMarketQuota(tenant_id) {
  
  const plan = await getActivePlan(tenant_id);
  if (!plan) return;

  const limit = Number(plan.gioiHanSoCho || 0);
  if (limit <= 0) return;
  
  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) total FROM market WHERE tenant_id = ?",
    [tenant_id],
  );
  
  if (Number(total) >= limit) {
    const err = new Error("Đã vượt quá số lượng chợ cho phép của gói");
    err.statusCode = 400;
    throw err;
  }
}

async function assertKioskQuota(tenant_id) {
  const plan = await getActivePlan(tenant_id);
  if (!plan) return;

  const limit = Number(plan.gioiHanSoKiosk || 0);
  if (limit <= 0) return;

  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) total FROM kiosk WHERE tenant_id = ?",
    [tenant_id],
  );

  if (Number(total) >= limit) {
    const err = new Error("Đã vượt quá số lượng kiosk cho phép của gói");
    err.statusCode = 400;
    throw err;
  }
}

async function assertUserQuota(tenant_id) {
  const plan = await getActivePlan(tenant_id);
  if (!plan) return;

  const limit = Number(plan.gioiHanUser || 0);
  if (limit <= 0) return;

  const [[{ total }]] = await db.query(
    "SELECT COUNT(*) total FROM users WHERE tenant_id = ? AND trangThai <> 'deleted'",
    [tenant_id],
  );

  if (Number(total) >= limit) {
    const err = new Error("Đã vượt quá số lượng user cho phép của gói");
    err.statusCode = 400;
    throw err;
  }
}

module.exports = {
  getActivePlan,
  assertMarketQuota,
  assertKioskQuota,
  assertUserQuota,
};
