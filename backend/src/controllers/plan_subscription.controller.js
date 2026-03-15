const db = require("../config/db");
const { logAudit } = require("../utils/audit");

async function createOrUpgrade(tenant_id, plan_id) {
  const conn = await db.getConnection();
  try {
    await conn.beginTransaction();
    const [planRows] = await conn.query(
      "SELECT * FROM plan WHERE plan_id = ? LIMIT 1",
      [plan_id],
    );
    if (!planRows.length)
      throw Object.assign(new Error("Plan not found"), { statusCode: 404 });
    await conn.query(
      "UPDATE plan_subscription SET trangThai = 'expired' WHERE tenant_id = ? AND trangThai = 'active'",
      [tenant_id],
    );
    const [r] = await conn.query(
      `INSERT INTO plan_subscription (tenant_id, plan_id, trangThai, ngayBatDau, ngayKetThuc)
       VALUES (?, ?, 'active', NOW(), DATE_ADD(NOW(), INTERVAL 1 YEAR))`,
      [tenant_id, plan_id],
    );
    await conn.commit();
    return r.insertId;
  } catch (e) {
    await conn.rollback();
    throw e;
  } finally {
    conn.release();
  }
}

exports.createSubscription = async (req, res) => {
  try {
    const tenant_id = Number(req.body.tenant_id || req.user.tenant_id);
    const { plan_id } = req.body;
    if (!tenant_id || !plan_id)
      return res
        .status(400)
        .json({ message: "tenant_id and plan_id are required" });
    const subscription_id = await createOrUpgrade(tenant_id, plan_id);
    await logAudit(req, {
      action: "CREATE_SUBSCRIPTION",
      entity_type: "plan_subscription",
      entity_id: subscription_id,
      newValue: { tenant_id, plan_id },
    });
    res
      .status(201)
      .json({ message: "Subscription created successfully", subscription_id });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.upgradeSubscription = async (req, res) => {
  try {
    const tenant_id = Number(req.body.tenant_id || req.user.tenant_id);
    const { plan_id } = req.body;
    if (!tenant_id || !plan_id)
      return res
        .status(400)
        .json({ message: "tenant_id and plan_id are required" });
    const subscription_id = await createOrUpgrade(tenant_id, plan_id);
    await logAudit(req, {
      action: "UPGRADE_SUBSCRIPTION",
      entity_type: "plan_subscription",
      entity_id: subscription_id,
      newValue: { tenant_id, plan_id },
    });
    res.json({
      message: "Subscription upgraded successfully",
      subscription_id,
    });
  } catch (error) {
    res.status(error.statusCode || 500).json({ error: error.message });
  }
};

exports.getSubscriptionById = async (req, res) => {
  try {
    if (req.params.id) {
      const [rows] = await db.query(
        "SELECT ps.*, p.tenGoi, p.giaTien FROM plan_subscription ps JOIN plan p ON p.plan_id = ps.plan_id WHERE ps.subscription_id = ? LIMIT 1",
        [Number(req.params.id)],
      );
      if (!rows.length)
        return res.status(404).json({ message: "subscription not found" });
      const row = rows[0];
      if (
        req.user.tenant_id &&
        String(req.user.role).toUpperCase() !== "SUPER_ADMIN" &&
        Number(row.tenant_id) !== Number(req.user.tenant_id)
      )
        return res.status(403).json({ message: "Forbidden" });
      return res.json(row);
    }
    const tenant_id = Number(req.user.tenant_id || req.query.tenant_id);
    const [rows] = await db.query(
      "SELECT ps.*, p.tenGoi, p.giaTien FROM plan_subscription ps JOIN plan p ON p.plan_id = ps.plan_id WHERE ps.tenant_id = ? ORDER BY ps.subscription_id DESC LIMIT 1",
      [tenant_id],
    );
    if (!rows.length)
      return res.status(404).json({ message: "subscription not found" });
    res.json(rows[0]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

exports.listSubscriptions = async (req, res) => {
  try {
    const where = [];
    const params = [];
    if (
      req.user.tenant_id &&
      String(req.user.role).toUpperCase() !== "SUPER_ADMIN"
    ) {
      where.push("ps.tenant_id = ?");
      params.push(req.user.tenant_id);
    } else if (req.query.tenant_id) {
      where.push("ps.tenant_id = ?");
      params.push(req.query.tenant_id);
    }
    const clause = where.length ? `WHERE ${where.join(" AND ")}` : "";
    const [[{ total }]] = await db.query(
      `SELECT COUNT(*) total FROM plan_subscription ps ${clause}`,
      params,
    );
    const [rows] = await db.query(
      `SELECT ps.*, p.tenGoi FROM plan_subscription ps JOIN plan p ON p.plan_id = ps.plan_id ${clause} ORDER BY ps.subscription_id DESC LIMIT ? OFFSET ?`,
      [...params, req.pagination.limit, req.pagination.offset],
    );
    res.json({
      data: rows,
      meta: {
        page: req.pagination.page,
        limit: req.pagination.limit,
        total,
        totalPages: Math.ceil(total / req.pagination.limit) || 0,
      },
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
