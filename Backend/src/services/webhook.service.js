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

    // ===============================
    // checkout.session.completed
    // ===============================
    if (event.type === "checkout.session.completed") {

      const session = event.data.object;

      if (session.mode === "subscription") {

        await connection.beginTransaction();

        const tenant_id = session.metadata.tenant_id;
        const plan_id = session.metadata.plan_id;
        //const subscription_id = session.metadata.subscription_id;
        const payment_id = session.metadata.payment_id;
        const stripeSubId = session.subscription;

        await planSubscriptionModel.expireActiveByTenant(
          connection,
          tenant_id
        );

        const subscription_id =
            await planSubscriptionModel.createSubscription(
            connection,
            {
                tenant_id,
                plan_id,
                stripe_subscription_id: stripeSubId,
                trangThai: "pending",
                ngayBatDau: new Date(),
                ngayKetThuc: new Date(new Date().setFullYear(new Date().getFullYear() + 1))
            }
        );

        await paymentModel.updateSubscriptionId(
            connection,
            payment_id,
            subscription_id
        );

        // update payment intent
        await paymentModel.updatePaymentIntent(
          connection,
          payment_id,
          session.payment_intent
        );

        await connection.commit();
      }
    }

    // ===============================
    // invoice.payment_succeeded
    // ===============================
    else if (
      event.type === "invoice.payment_succeeded" ||
      event.type === "invoice_payment.paid"
    ) {
        const invoice = event.data.object;

        const stripeSubId =
          invoice.subscription ||
          invoice.parent?.subscription_details?.subscription;

        //const meta = invoice.parent?.subscription_details?.metadata || {};

        if (!stripeSubId) {
          return;
        }

        await connection.beginTransaction();

        const sub =
          await planSubscriptionModel.getSubscriptionByStripeId(
            connection,
            stripeSubId
          );
          

        if (!sub || sub.length === 0) {
          await connection.rollback();
          return;
        }

        const stripeSub =
          await stripe.subscriptions.retrieve(stripeSubId);

        const periodEnd = invoice.lines.data[0].period.end;;

        if (!periodEnd) {
          await connection.rollback();
          return;
        }

        const newEnd = new Date(periodEnd * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        

        await planSubscriptionModel.updateEndDate(
          connection,
          sub.subscription_id,
          newEnd
        );
        await paymentModel.updateInvoiceInfo(
          connection,
          stripeSubId,
          invoice.id,
          invoice.payment_intent || null,
          invoice.amount_paid
        );

      await connection.commit();
    }
    // ===============================
    // invoice.payment_failed
    // ===============================
    else if (event.type === "invoice.payment_failed") {

      const invoice = event.data.object;
      const stripeSubId = invoice.subscription;

      await connection.beginTransaction();

      const sub =
        await planSubscriptionModel.getByStripeSubId(
          connection,
          stripeSubId
        );

      if (sub.length) {

        await planSubscriptionModel.expire(
          connection,
          sub[0].subscription_id
        );

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