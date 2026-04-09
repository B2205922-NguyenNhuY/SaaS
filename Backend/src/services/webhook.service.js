const stripe = require("../config/stripe");
const db = require("../config/db");
const paymentModel = require("../models/payment.model");
const planSubscriptionModel = require("../models/plan_subscription.model");

exports.handleStripeWebhook = async (req) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
  } catch (err) {
    throw Object.assign(
      new Error("Invalid webhook signature"),
      { statusCode: 400 }
    );
  }

  const connection = await db.getConnection();

  try {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object;

      if (session.mode === "subscription") {
        await connection.beginTransaction();

        const tenant_id = session.metadata.tenant_id;
        const plan_id = session.metadata.plan_id;
        const payment_id = session.metadata.payment_id;
        const stripeSubId = session.subscription;

        await planSubscriptionModel.expireActiveByTenant(connection, tenant_id);

        const subscription_id = await planSubscriptionModel.createSubscription(
          connection,
          {
            tenant_id,
            plan_id,
            stripe_subscription_id: stripeSubId,
            trangThai: "active",
            payment_status: "paid",
            ngayBatDau: new Date(),
            ngayKetThuc: new Date(new Date().setMonth(new Date().getMonth() + 1))
          }
        );

        await paymentModel.updateSubscriptionId(connection, payment_id, subscription_id);
        await paymentModel.updatePaymentIntent(connection, payment_id, session.payment_intent);
        
        await connection.execute(
          "UPDATE payment SET tenant_id = ? WHERE payment_id = ?",
          [tenant_id, payment_id]
        );

        await connection.commit();
      }
    }

    else if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object;
      const stripeSubId = invoice.subscription;

      if (!stripeSubId) {
        return;
      }

      await connection.beginTransaction();

      const sub = await planSubscriptionModel.getSubscriptionByStripeId(connection, stripeSubId);

      if (!sub || sub.length === 0) {
        await connection.rollback();
        return;
      }

      const periodEnd = invoice.lines.data[0].period.end;
      const newEnd = new Date(periodEnd * 1000).toISOString().slice(0, 19).replace("T", " ");

      await planSubscriptionModel.updateEndDate(connection, sub.subscription_id, newEnd);
      
      await paymentModel.updateInvoiceInfo(
        connection,
        stripeSubId,
        invoice.id,
        invoice.payment_intent || null,
        invoice.amount_paid
      );

      await connection.execute(
        "UPDATE payment SET tenant_id = ? WHERE stripe_invoice_id = ? AND tenant_id IS NULL",
        [sub.tenant_id, invoice.id]
      );

      await connection.commit();
    }

    else if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object;
      const stripeSubId = invoice.subscription;

      await connection.beginTransaction();

      const sub = await planSubscriptionModel.getSubscriptionByStripeId(connection, stripeSubId);

      if (sub && sub.length > 0) {
        await planSubscriptionModel.updateSubscriptionStatus(sub[0].subscription_id);
      }

      await connection.commit();
    }

  } catch (error) {
    try {
      await connection.rollback();
    } catch {}
    throw error;
  } finally {
    connection.release();
  }
};