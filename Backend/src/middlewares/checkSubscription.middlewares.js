const { ROLES } = require("../constants/role");
const planSubscriptionModel = require("../models/plan_subscription.model");

exports.checkSubscriptionStatus = async (req, res, next) => {

    const { tenant_id, role} = req.user;
    if(role === ROLES.SUPER_ADMIN) {
        return next();
    }

    const subscription = await planSubscriptionModel.checkSubscribed(tenant_id);
    
    if(subscription.length === 0) {
        return res.status(403).json({message: "Chưa đăng ký gói"});
    }

    const isExpired = await planSubscriptionModel.checkSubscription(tenant_id);

    if (isExpired.length === 0) {
        if (req.method === "GET") {
            return next();
        }

        if (req.path.includes("/plan_subscription")) {
            return next();
        }

        return res.status(403).json({ message: "Gói đã hết hạn" });
    }

    next();
};