const db = require("../config/db");

exports.createPendingPayment = async (connection, tenant_id, subscription_id) => {
  const [result] = await connection.execute(
    "INSERT INTO payment (tenant_id, subscription_id, amount, payment_type, status) VALUES (?, ?, 0, 'subscription', 'pending')",
    [tenant_id, subscription_id]
  );
  return result.insertId;
};

exports.insertSucceededPayment = async (connection, tenant_id, subscription_id, amount) => {
  await connection.execute(
    "INSERT INTO payment (tenant_id, subscription_id, amount, payment_type, status) VALUES (?, ?, ?, 'subscription', 'succeeded')",
    [tenant_id, subscription_id, amount]
  );
};

exports.markPaymentSucceeded = async (connection, payment_id) => {
  await connection.execute(
    "UPDATE payment SET status = 'succeeded' WHERE payment_id = ?",
    [payment_id]
  );
};

exports.updateSubscriptionId = async (connection, payment_id, subscription_id) => {
  await connection.execute(
    "UPDATE payment SET subscription_id = ? WHERE payment_id = ?",
    [subscription_id, payment_id]
  );
};

exports.updatePaymentIntent = async (connection, payment_id, paymentIntentId) => {
  await connection.execute(
    "UPDATE payment SET stripe_payment_intent_id = ? WHERE payment_id = ?",
    [paymentIntentId, payment_id]
  );
};

exports.updateInvoiceInfo = async (connection, stripeSubId, stripeInvoiceId, paymentIntentId, amount) => {
  await connection.execute(
    `UPDATE payment p 
     JOIN plan_subscription ps ON p.subscription_id = ps.subscription_id 
     SET p.stripe_invoice_id = ?, 
         p.stripe_payment_intent_id = ?, 
         p.status = 'succeeded', 
         p.amount = ?,
         p.tenant_id = ps.tenant_id
     WHERE ps.stripe_subscription_id = ?`,
    [stripeInvoiceId, paymentIntentId, amount, stripeSubId]
  );
};

exports.updatePaymentSuccess = async (payment_id, tenant_id, stripe_payment_intent_id) => {
  await db.execute(
    "UPDATE payment SET status = 'succeeded', stripe_payment_intent_id = ? WHERE payment_id = ? AND tenant_id = ?",
    [stripe_payment_intent_id, payment_id, tenant_id]
  );
};

exports.updatePaymentFailed = async (payment_id, tenant_id) => {
  await db.execute(
    "UPDATE payment SET status = 'failed' WHERE payment_id = ? AND tenant_id = ?",
    [payment_id, tenant_id]
  );
};

exports.getPaymentHistory = async (tenant_id, limit, offset) => {
  const safeLimit = Number(limit) || 10;
  const safeOffset = Number(offset) || 0;
  const [rows] = await db.execute(
    `SELECT 
      p.payment_id,
      p.amount,
      p.payment_type,
      p.status,
      p.stripe_payment_intent_id,
      p.stripe_invoice_id,
      p.created_at,
      ps.subscription_id,
      ps.ngayBatDau,
      ps.ngayKetThuc,
      pl.tenGoi as plan_name,
      pl.giaTien as plan_price,
      CASE 
        WHEN p.payment_type = 'subscription' THEN 'Thanh toán gói cước'
        WHEN p.payment_type = 'charge' THEN 'Thanh toán phí'
        ELSE 'Thanh toán'
      END as description
    FROM payment p
    LEFT JOIN plan_subscription ps ON p.subscription_id = ps.subscription_id
    LEFT JOIN plan pl ON ps.plan_id = pl.plan_id
    WHERE p.tenant_id = ?
    ORDER BY p.created_at DESC
    LIMIT ${safeLimit} OFFSET ${safeOffset}`,
    [tenant_id, limit, offset]
  );
  return rows;
};

exports.countPaymentHistory = async (tenant_id) => {
  const [rows] = await db.execute(
    "SELECT COUNT(*) as total FROM payment WHERE tenant_id = ?",
    [tenant_id]
  );
  return rows[0].total;
};

exports.getPaymentsBySubscription = async (subscription_id) => {
  const [rows] = await db.execute(
    "SELECT * FROM payment WHERE subscription_id = ? ORDER BY created_at DESC",
    [subscription_id]
  );
  return rows;
};