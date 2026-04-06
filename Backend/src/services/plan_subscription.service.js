const planSubscriptionModel = require("../models/plan_subscription.model");
const planModel = require("../models/plan.model");
const paymentModel = require("../models/payment.model");
const db = require("../config/db");

const stripe = require("../config/stripe");

//Tạo Subscription
exports.createSubscription = async (user, body) => {
    const { tenant_id, plan_id } = body;
    const connection = await db.getConnection();

    try {
        await connection.beginTransaction();

        const existing = await planSubscriptionModel.checkDuplicate(tenant_id);
        
        let subscription_id;
        let checkout_url = null;
        
        if (existing && existing.length > 0) {
            throw Object.assign(
                new Error("Tenant already has an active subscription. Please renew instead."),
                { statusCode: 400 }
            );
        } else {
            const trialDays = 7;
            subscription_id = await planSubscriptionModel.createTrialSubscription(
                connection, 
                tenant_id, 
                plan_id, 
                trialDays
            );
        }

        await connection.commit();

        return {
            subscription_id,
            status: existing ? null : 'trial',
            trial_days: existing ? null : 7,
            checkout_url
        };

    } catch (error) {
        await connection.rollback();
        throw error;
    } finally {
        connection.release();
    }
};

//Lấy tất cả Subscription
exports.getAllSubscription = async () => {
        return await planSubscriptionModel.getAllSubscriptions();

}

exports.getSubscriptionById = async (user) => {
  const tenant_id = user.tenant_id;

  const subscriptions = await planSubscriptionModel.getSubscriptionsByTenantId(tenant_id);

  if (!subscriptions || subscriptions.length === 0) {
    return null;
  }

  const active = subscriptions.find(s => s.trangThai === 'active');
  return active || subscriptions[0];
};


exports.getSubscriptionbyStatus = async (status) => {

        if(!status) {
            throw Object.assign(
                new Error("Status is required"),
                { statusCode: 400 }
            );
        }

        const allowedStatus = ['active', 'expired', 'trial'];

        if(!allowedStatus.includes(status)) {
            throw Object.assign(
                new Error("Invalid status"),
                { statusCode: 400 }
            );
        }

        return await planSubscriptionModel.getSubscriptiontByStatus(status);
};

exports.listSubscriptions = async (filters) => {

  const { page, limit } = filters;

  const offset = (page - 1) * limit;

  const rows = await planSubscriptionModel.listSubscriptions(filters, offset, limit);

  const total = await planSubscriptionModel.countSubscriptions(filters);

  return {
    data: rows,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit)
    }
  };
};

exports.updateSubscription = async (user) => {
        const tenant_id = user.tenant_id;

        const subscription = await planSubscriptionModel.getActiveByTenantForUpdate(tenant_id);
        
        if(!subscription){
            throw Object.assign(
                new Error("subscription not found"),
                { statusCode: 404 }
            );
        }

        await planSubscriptionModel.updateSubscriptionStatus(subscription[0].subscription_id);
};