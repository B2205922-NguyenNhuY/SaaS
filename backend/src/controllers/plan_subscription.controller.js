const planSubscriptionModel = require("../models/plan_subscription.model");
const planModel = require("../models/plan.model");
const paymentModel = require("../models/payment.model");
const db = require("../config/database");

const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);


//Tạo Subscription
exports.createSubscription = async (req, res) => {

    const connection = await db.getConnection();

    try {

        const tenant_id = req.user.tenant_id;
        const { plan_id } = req.body;

        if (!plan_id) {
            return res.status(400).json({ message: "Missing required fields" });
        }

        const plan = await planModel.getPlanById(plan_id);

        if (!plan || plan.length === 0) {
            return res.status(404).json({ message: "Plan not found" });
        }

        await connection.beginTransaction();

        const start = new Date();

        const end = new Date();
        end.setDate(end.getDate() + plan[0].duration_days);

        const result = await planSubscriptionModel.createSubscription(
            connection,
            {
                tenant_id,
                plan_id,
                trangThai: "pending",
                start,
                end
            }
        );

        await paymentModel.createPending(connection, {
            tenant_id,
            subscription_id: result.insertId,
            amount: plan[0].price,
            payment_type: "subscription"
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
                subscription_id: result.insertId
            }
        });

        res.status(201).json({
            message: "Subscription created successfully",
            subscription_id: result.insertId,
            checkout_url: session.url
        });

    } catch (error) {

        await connection.rollback();

        res.status(500).json({ error: error.message });

    } finally {

        connection.release();

    }
};


//Lấy tất cả Subscription
exports.getAllSubscription = async (req, res) => {

    try {

        const rows = await planSubscriptionModel.getAllSubscriptions();

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};


//Lấy subscription của tenant
exports.getSubscriptionById = async (req, res) => {

    try {

        const tenant_id = req.user.tenant_id;

        const subscription = await planSubscriptionModel.getActiveByTenantForUpdate(
            tenant_id
        );

        if (!subscription || subscription.length === 0) {

            return res.status(404).json({
                message: "subscription not found"
            });

        }

        const rows = await planSubscriptionModel.getSubscriptionById(
            subscription[0].subscription_id
        );

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};


//Lấy subscription theo status
exports.getSubscriptionbyStatus = async (req, res) => {

    try {

        const { status } = req.query;

        if (!status) {
            return res.status(400).json({
                message: "Status is required"
            });
        }

        const allowedStatus = ['active', 'expired', 'trial', 'pending'];

        if (!allowedStatus.includes(status)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const rows = await planSubscriptionModel.getSubscriptionByStatus(status);

        res.json(rows);

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};


//Cập nhật subscription
exports.updateSubscription = async (req, res) => {

    try {

        const tenant_id = req.user.tenant_id;

        const subscription = await planSubscriptionModel.getActiveByTenantForUpdate(
            tenant_id
        );

        if (!subscription || subscription.length === 0) {

            return res.status(404).json({
                message: "subscription not found"
            });

        }

        await planSubscriptionModel.updateSubscriptionStatus(
            subscription[0].subscription_id
        );

        res.json({
            message: "updated successfully"
        });

    } catch (error) {

        res.status(500).json({ error: error.message });

    }

};