const planSubscriptionModel = require("../models/plan_subscription.model");
const planModel = require("../models/plan.model");
const paymentModel = require("../models/payment.model");
const db = require("../config/db");

const stripe = require("../config/stripe");

//Tạo Subscription
exports.createSubscription = async (user, body) => {
    const connection = await db.getConnection();
    try{
        const tenant_id = user.tenant_id;
        const { plan_id } = body;

        if(!plan_id){
            throw Object.assign(
                new Error("Missing required fields"),
                { statusCode: 400 }
            );
        }

        const plan = await planModel.getPlanById(plan_id);

        if(!plan || plan.length === 0) {
           throw Object.assign(
                new Error("Plan not found"),
                { statusCode: 404 }
            );
        }

        await connection.beginTransaction();

        const start = new Date();
        const end = new Date();
        end.setDate(end.getDate() + plan[0].duration_days);

        const result = await planSubscriptionModel.createSubscription(connection,{tenant_id, plan_id, trangThai: 'pending', start, end});

        await paymentModel.createPending(connection, {
            tenant_id,
            subscription_id: result.insertId,
            amount: plan[0].price,
            payment_type: 'subscription'
        });

        await connection.commit();

        const session = await stripe.checkout.sessions.create({
            mode: "subscription",
            payment_method_types: ["card"],
            line_items: [
                {
                price: plan[0].stripe_price_id,
                quantity: 1
                }
            ],
            success_url: `${process.env.CLIENT_URL}/success`,
            cancel_url: `${process.env.CLIENT_URL}/cancel`,
            metadata: {
                tenant_id,
                subscription_id
            }
        });

       return {
            subscription_id: result.insertId,
            checkout_url: session.url
        };
    } catch (error) {
        await connection.rollback()
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

        const subscription = await planSubscriptionModel.getSubscriptiontById(tenant_id);
        
        if(subscription.length === 0){
            throw Object.assign(
                new Error("subscription not found"),
                { statusCode: 404 }
            );
        }

        return await planSubscriptionModel.getSubscriptiontById(subscription[0].subscription_id);
};

exports.getSubscriptionbyStatus = async (status) => {

        if(!status) {
            throw Object.assign(
                new Error("Status is required"),
                { statusCode: 400 }
            );
        }

        const allowesStatus = ['active', 'expired', 'trial'];

        if(!allowedStatus.includes(status)) {
            throw Object.assign(
                new Error("Invalid status"),
                { statusCode: 400 }
            );
        }

        return await planSubscriptionModel.getSubscriptiontByStatus(status);
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