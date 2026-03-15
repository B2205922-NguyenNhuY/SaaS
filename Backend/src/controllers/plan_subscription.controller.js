const planSubscriptionService= require("../services/plan_subscription.service");
//Tạo Subscription
exports.createSubscription = async (req, res, next) => {
    try{
        const result = await planSubscriptionService.createSubscription(req.user, req.body);

        res.status(201).json({
            message: "Subscription created successfully",
            subscription_id: result.subscription_id,
            checkout_url: result.checkout_url
        });
    } catch (error) {
        next(error);
    }
};

//Lấy tất cả Subscription
exports.getAllSubscription = async (req, res, next) => {
    try{
        const rows = await planSubscriptionService.getAllSubscriptions();

        res.json(rows);
    } catch (error) {
        next(error);
    }
}

exports.getSubscriptionById = async (req, res, next) => {
    try{
        const rows = await planSubscriptionService.getSubscriptiontById(req.user);

        res.json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getSubscriptionbyStatus = async (req, res, next) => {
    try{
        const rows = await planSubscriptionService.getSubscriptiontByStatus(req.query.status);

        res.json(rows);
    } catch (error) {
        next(error);
    }
};

exports.updateSubscription = async (req, res, next) => {
    try {
        await planSubscriptionService.updateSubscriptionStatus(subscription[0].subscription_id);

        res.json({
            message: "updated successfully",
        })
    } catch (error) {
        next(error);
    }
};