const stripe = require("../config/stripe");
const db = require("../config/db");
const paymentModel = require("../models/payment.model");
const planSubscriptionModel = require("../models/plan_subscription.model");

exports.createCheckoutSession = async (user, body) => {
  const connection = await db.getConnection();

  try {

    const  tenant_id  = user.tenant_id;
    const { priceId, plan_id } = body;

    if (!priceId || !plan_id) {
      throw Object.assign(
        new Error("Missing required fields"),
        { statusCode: 400 }
      );
    }

    await connection.beginTransaction();
/*
    // tạo subscription local
    const subscription_id = await planSubscriptionModel.createSubscription(
      connection,
      { tenant_id, plan_id }
    );
*/
    // tạo payment pending
    const payment_id = await paymentModel.createPendingPayment(
      connection,
      tenant_id,
      null
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
        payment_id,
      },

      // metadata gắn trực tiếp vào subscription stripe
      subscription_data: {
        metadata: {
          tenant_id,
          plan_id,
          payment_id,
        },
      },

      //client_reference_id: subscription_id,

      success_url: "http://localhost:3000/payment-success",
      cancel_url: "http://localhost:3000/payment-cancel",
    });

    await connection.commit();

    return {
      url: session.url,
      session_id: session.id
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};