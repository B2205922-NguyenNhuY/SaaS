const stripe = require("../config/stripe");
const db = require("../config/database");
const paymentModel = require("../models/payment.model");
const planSubscriptionModel = require("../models/plan_subscription.model");

exports.createCheckoutSession = async (req, res) => {
  const connection = await db.getConnection();

  try {
    await connection.beginTransaction();

    const { tenant_id } = req.user;
    const { priceId, plan_id } = req.body;

    // tạo subscription local
    const subscription_id = await planSubscriptionModel.createSubscription(
      connection,
      { tenant_id, plan_id }
    );

    // tạo payment pending
    const payment_id = await paymentModel.createPendingPayment(
      connection,
      tenant_id,
      subscription_id
    );

    // tạo checkout session
    const session = await stripe.checkout.sessions.create({
      mode: "subscription",

      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],

      metadata: {
        tenant_id,
        plan_id,
        subscription_id,
        payment_id,
      },

      // metadata gắn trực tiếp vào subscription stripe
      subscription_data: {
        metadata: {
          tenant_id,
          plan_id,
          subscription_id,
          payment_id,
        },
      },

      client_reference_id: subscription_id,

      success_url: "http://localhost:3000/payment-success",
      cancel_url: "http://localhost:3000/payment-cancel",
    });

    await connection.commit();
    connection.release();

    res.json({
      url: session.url,
      session_id: session.id
    });

  } catch (error) {
    await connection.rollback();
    connection.release();

    console.error("Create checkout error:", error);

    res.status(500).json({
      error: error.message
    });
  }
};