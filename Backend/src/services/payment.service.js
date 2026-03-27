const stripe = require("../config/stripe");
const db = require("../config/db");
const paymentModel = require("../models/payment.model");
const planSubscriptionModel = require("../models/plan_subscription.model");
const planModel = require("../models/plan.model");

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

    const plan = await planModel.getPlanById(plan_id);
    
    if (!plan || plan.length === 0) {
        throw Object.assign(
            new Error("Plan not found"),
            { statusCode: 404 }
        );
    }

    // nếu đã inactive rồi
    if (!await planModel.isPlanActive(plan_id)) {
        throw Object.assign(
            new Error("Plan already inactive"),
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

exports.createCheckoutSessionForCharge = async (user, body) => {
  const connection = await db.getConnection();

  try {
    const tenant_id = user.tenant_id;
    const { charge_id, soTien } = body;

    if (!charge_id || !soTien) {
      throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
    }

    await connection.beginTransaction();

    const payment_id = await paymentModel.createPendingPayment(
      connection,
      tenant_id,
      charge_id
    );

    const session = await stripe.checkout.sessions.create({
      mode: "payment",

      line_items: [
        {
          price_data: {
            currency: "vnd",
            product_data: {
              name: `Charge #${charge_id}`,
            },
            unit_amount: soTien,
          },
          quantity: 1,
        },
      ],

      metadata: {
        tenant_id,
        charge_id,
        payment_id,
        type: "charge",
      },

      success_url: "http://localhost:3000/payment-success",
      cancel_url: "http://localhost:3000/payment-cancel",
    });

    await connection.commit();

    return {
      url: session.url,
      session_id: session.id,
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};