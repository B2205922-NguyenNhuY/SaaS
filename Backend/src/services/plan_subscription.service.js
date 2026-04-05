const planSubscriptionModel = require("../models/plan_subscription.model");
const planModel = require("../models/plan.model");
const paymentModel = require("../models/payment.model");
const db = require("../config/db");

const stripe = require("../config/stripe");

//Tạo Subscription
exports.createSubscription = async (user, body) => {
        const { tenant_id, plan_id } = body;

        if (!plan_id || !tenant_id) {
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

        await planSubscriptionModel.expireActiveByTenant(
                  db,
                  tenant_id
                );

        // Tính thời gian thủ công
        const ngayBatDau = new Date();
        const ngayKetThuc = new Date(ngayBatDau);
        ngayKetThuc.setFullYear(ngayKetThuc.getFullYear() + 1);

        // Gọi model với đúng field DB
        const result = await planSubscriptionModel.createSubscription(
            db,
            {
                tenant_id: tenant_id ?? null,
                plan_id: plan_id ?? null,
                stripe_subscription_id: null, // chưa có thì set null
                trangThai: "active",
                ngayBatDau,
                ngayKetThuc
            }
        );

        return {
            subscription_id: result.insertId
        };
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