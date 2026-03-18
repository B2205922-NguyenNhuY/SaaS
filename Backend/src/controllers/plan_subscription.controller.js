const planSubscriptionService= require("../services/plan_subscription.service");
const { logAudit } = require("../utils/audit");

//Tạo Subscription
exports.createSubscription = async (req, res, next) => {
    try{
        const result = await planSubscriptionService.createSubscription(req.user, req.body);

        await logAudit(req,{
            action: "CREATE_PLAN_SUBSCRIPTION",
            entity_type: "plan_subscription",
            entity_id: result.subscription_id,
            newValue: req.body,
        });

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
        const rows = await planSubscriptionService.getAllSubscription();

        res.json(rows);
    } catch (error) {
        next(error);
    }
}

exports.getSubscriptionById = async (req, res, next) => {
    try{
        const rows = await planSubscriptionService.getSubscriptionById(req.user);

        res.json(rows);
    } catch (error) {
        next(error);
    }
};

exports.getSubscriptionbyStatus = async (req, res, next) => {
    try{
        const rows = await planSubscriptionService.getSubscriptionbyStatus(req.query.status);

        res.json(rows);
    } catch (error) {
        next(error);
    }
};


exports.listSubscriptions = async (req, res, next) => {
  try {

    const filters = {
      tenant_id: req.query.tenant_id,
      plan_id: req.query.plan_id,
      trangThai: req.query.trangThai,
      keyword: req.query.keyword,
      start_date: req.query.start_date,
      end_date: req.query.end_date,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "DESC"
    };

    const result = await planSubscriptionService.listSubscriptions(filters);

    res.json(result);

  } catch (error) {
    next(error);
  }
};

exports.updateSubscription = async (req, res, next) => {
    try {
        await planSubscriptionService.updateSubscription(subscription[0].subscription_id);

        res.json({
            message: "updated successfully",
        })
    } catch (error) {
        next(error);
    }
};