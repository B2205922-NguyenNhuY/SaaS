const db = require("../config/db");

exports.createPendingPayment = async (
  connection,
  tenant_id,
  subscription_id,
) => {
  const [result] = await connection.execute(
    "INSERT INTO payment (tenant_id, subscription_id, amount, payment_type, status) VALUES (?, ?, 0, 'subscription', 'pending')",
    [tenant_id, subscription_id],
  );

  return result.insertId;
};

exports.insertSucceededPayment = async (
  connection,
  tenant_id,
  subscription_id,
  amount,
) => {
  await connection.execute(
    "INSERT INTO payment (tenant_id, subscription_id, amount, payment_type, status) VALUES (?, ?, ?, 'subscription', 'succeeded')",
    [tenant_id, subscription_id, amount],
  );
};

exports.markPaymentSucceeded = async (connection, payment_id) => {
  await connection.execute(
    "UPDATE payment SET status = 'succeeded' WHERE payment_id = ?",
    [payment_id],
  );
};

exports.updateInvoiceInfo = async (
  connection,
  stripeSubId,
  stripeInvoiceId,
  paymentIntentId,
  amount,
) => {
  console.log("Updating payment for subscription:", stripeSubId);
  console.log("Updating StripeInvoiceId:", stripeInvoiceId);
  console.log("Updating paymentIntentId:", paymentIntentId);
  await connection.execute(
    "UPDATE payment p JOIN plan_subscription ps  ON p.subscription_id = ps.subscription_id SET p.stripe_invoice_id = ?, p.stripe_payment_intent_id = ?, p.status = 'succeeded', amount=? WHERE ps.stripe_subscription_id = ?",
    [stripeInvoiceId, paymentIntentId, amount, stripeSubId],
  );
};

exports.updatePaymentIntent = async (
  connection,
  payment_id,
  paymentIntentId,
) => {
  await connection.execute(
    "UPDATE payment SET stripe_payment_intent_id = ? WHERE payment_id = ?",
    [paymentIntentId, payment_id],
  );
};

exports.updatePaymentSuccess = async ({
  payment_id,
  tenant_id,
  stripe_payment_intent_id,
}) => {
  await db.execute(
    "UPDATE payment SET status = 'succeeded', stripe_payment_intent_id = ? WHERE payment_id = ? AND tenant_id = ?",
    [stripe_payment_intent_id, payment_id, tenant_id],
  );
};

exports.updatePaymentFailed = async ({ payment_id, tenant_id }) => {
  await db.execute(
    "UPDATE payment SET status = 'failed' WHERE payment_id = ? AND tenant_id = ?",
    [payment_id, tenant_id],
  );
};
