const planSubscriptionService= require("../services/plan_subscription.service");
const { logAudit } = require("../utils/audit");

//Tạo Subscription
exports.createSubscription = async (req, res, next) => {
  try {
    const result = await planSubscriptionService.createSubscription(req.user, req.body);
    await logAudit(req, {
      action: "CREATE_PLAN_SUBSCRIPTION",
      entity_type: "plan_subscription",
      entity_id: result.subscription_id,
      newValue: req.body,
    });
    res.status(201).json({
      message: "Subscription created successfully",
      subscription_id: result.subscription_id,
    });
  } catch (error) { next(error); }
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
      tenant_id:  req.query.tenant_id,
      plan_id:    req.query.plan_id,
      trangThai:  req.query.trangThai,
      keyword:    req.query.keyword,
      ngayBatDau: req.query.ngayBatDau || req.query.start_date,
      ngayKetThuc:req.query.ngayKetThuc || req.query.end_date,
      page:       Number(req.query.page)  || 1,
      limit:      Number(req.query.limit) || 10,
      sortBy:     req.query.sortBy    || "created_at",
      sortOrder:  req.query.sortOrder || "DESC",
    };
    res.json(await planSubscriptionService.listSubscriptions(filters));
  } catch (error) { next(error); }
};

exports.updateSubscription = async (req, res, next) => {
  try {
    await planSubscriptionService.updateSubscription(req.user);
    await logAudit(req, {
      action: "UPDATE_PLAN_SUBSCRIPTION",
      entity_type: "plan_subscription",
      entity_id: null,
      newValue: req.body,
    });
    res.json({ message: "Updated successfully" });
  } catch (error) { next(error); }
};