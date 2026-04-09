const paymentModel = require("../models/payment.model");
const stripe = require("../config/stripe");
const db = require("../config/db");

exports.createCheckoutSession = async (user, body) => {
  const connection = await db.getConnection();

  try {
    const tenant_id = user.tenant_id;
    const { priceId, plan_id } = body;

    if (!priceId || !plan_id) {
      throw Object.assign(
        new Error("Missing required fields"),
        { statusCode: 400 }
      );
    }

    await connection.beginTransaction();

    const payment_id = await paymentModel.createPendingPayment(
      connection,
      tenant_id,
      null
    );

    const session = await stripe.checkout.sessions.create({
      mode: "subscription",
      line_items: [{ price: priceId, quantity: 1 }],
      metadata: {
        tenant_id,
        plan_id,
        payment_id,
      },
      subscription_data: {
        metadata: { tenant_id, plan_id, payment_id },
      },
      success_url: "http://localhost:5173/tenant-admin/payment-success",
      cancel_url: "http://localhost:5173/tenant-admin/payment-cancel",
    });

    await connection.commit();

    return {
      url: session.url,
      session_id: session.id,
      payment_id: payment_id
    };

  } catch (error) {
    await connection.rollback();
    throw error;
  } finally {
    connection.release();
  }
};

exports.getPaymentHistory = async (tenant_id, page = 1, limit = 20) => {
  const offset = (page - 1) * limit;
  
  const data = await paymentModel.getPaymentHistory(tenant_id, limit, offset);
  const total = await paymentModel.countPaymentHistory(tenant_id);
  
  const formattedData = data.map(payment => ({
    payment_id: payment.payment_id,
    amount: payment.amount,
    amount_formatted: new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(payment.amount),
    payment_type: payment.payment_type,
    status: payment.status,
    status_label: payment.status === 'succeeded' ? 'Thành công' : 
                  payment.status === 'pending' ? 'Đang xử lý' : 'Thất bại',
    description: payment.description,
    plan_name: payment.plan_name,
    created_at: payment.created_at,
    created_at_formatted: new Date(payment.created_at).toLocaleString('vi-VN'),
    invoice_url: payment.stripe_invoice_id ? `https://dashboard.stripe.com/invoices/${payment.stripe_invoice_id}` : null
  }));
  
  return {
    data: formattedData,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.getPaymentDetail = async (payment_id, tenant_id) => {
  const [payment] = await db.execute(
    `SELECT p.*, 
      ps.ngayBatDau, ps.ngayKetThuc,
      pl.tenGoi as plan_name, pl.giaTien as plan_price
    FROM payment p
    LEFT JOIN plan_subscription ps ON p.subscription_id = ps.subscription_id
    LEFT JOIN plan pl ON ps.plan_id = pl.plan_id
    WHERE p.payment_id = ? AND p.tenant_id = ?`,
    [payment_id, tenant_id]
  );
  return payment[0];
};