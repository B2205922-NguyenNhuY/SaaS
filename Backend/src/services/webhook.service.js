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

    console.log("Stripe event:", event.type);

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

        console.log("Stripe Subscription:", stripeSubId);
        console.log("payment_id:", payment_id);
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
                stripe_subscription_id: stripeSubId
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

        console.log("EVENT:", event.type);
        console.log("INVOICE:", invoice.id);
        console.log("SUB:", stripeSubId);
        console.log("AMOUNT:", invoice.amount_paid);
        console.log("STATUS:", invoice.status);

        if (!stripeSubId) {
            console.log("No stripe subscription id");
          return;
        }

        await connection.beginTransaction();

        const sub =
          await planSubscriptionModel.getSubscriptionByStripeId(
            connection,
            stripeSubId
          );
          console.log("sub:", sub);

        if (!sub || sub.length === 0) {
          console.log("Subscription not found:", stripeSubId);
          await connection.rollback();
          return;
        }

        const stripeSub =
          await stripe.subscriptions.retrieve(stripeSubId);

        const periodEnd = invoice.lines.data[0].period.end;;

        if (!periodEnd) {
          console.log("Invalid period end");
          await connection.rollback();
          return;
        }

        const newEnd = new Date(periodEnd * 1000)
          .toISOString()
          .slice(0, 19)
          .replace("T", " ");
        
        console.log("newEne",newEnd);

        await planSubscriptionModel.updateEndDate(
          connection,
          sub.subscription_id,
          newEnd
        );
        console.log("stripeSubId:", stripeSubId);
        console.log("invoiceId:", invoice.id);
        console.log("AMOUNT:", invoice.amount_paid);

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

    console.log("Webhook error:", error);

    try {
      await connection.rollback();
    } catch {}
    throw error;

  } finally {
    connection.release();
  }
};