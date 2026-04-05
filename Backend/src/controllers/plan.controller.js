const planService = require("../services/plan.service");
const { logAudit } = require("../utils/audit");

//Tạo plan
exports.createPlan = async (req, res, next) => {
    try{
        const result = await planService.createPlan(req.body)

        await logAudit(req, {
            action: "CREATE_PLAN",
            entity_type: "plan",
            entity_id: result.plan_id,
            newValue: req.body,
        });
            
        return res.status(202).json({
            message: "Plan created successfully",
            plan_id: result.plan_id
        })
    } catch (error) {
        next(error);
    }
};

//Lấy tất cả Plan
exports.getAllPlans = async(req, res, next) => {
    try{
        const rows = await planService.getAllPlans();

        res.json(rows);
    } catch (error){
        next(error);
    }
};

//Lấy Plan theo Id
exports.getPlanById = async (req, res, next) => {
    try{
        const plan = await planService.getPlanById(req.params.id);

        res.json(plan);
    } catch (error) {
        next(error);
    }
};

exports.listPlans = async (req, res, next) => {
  try {

    const filters = {
      keyword: req.query.keyword,
      trangThai: req.query.trangThai,
      gia_min: req.query.gia_min,
      gia_max: req.query.gia_max,
      page: Number(req.query.page) || 1,
      limit: Number(req.query.limit) || 10,
      sortBy: req.query.sortBy || "created_at",
      sortOrder: req.query.sortOrder || "DESC"
    };

    const result = await planService.listPlans(filters);

    res.json(result);

  } catch (error) {
    next(error);
  }
};

//Update Plan
exports.updatePlan = async (req, res, next) => {
    try{
        const id = Number(req.params.id);

        const old = await planService.getPlanById(id);

        await planService.updatePlan(req.params.id, req.body);

        await logAudit(req, {
            action: "UPDATE_PLAN",
            entity_type: "plan",
            entity_id: id,
            oldValue: old,
            newValue: { ...old, ...req.body },
        });
        res.json({message: "Plan updated successfully"});

    } catch (error) {
        next(error);
    }
};

exports.inactivePlan = async (req, res, next) => {
    try {
        const plan_id = req.params.id;

        const old = await planService.getPlanById(plan_id);

        const result = await planService.inactivePlan(plan_id);

        await logAudit(req, {
            action: "INACTIVE_PLAN",
            entity_type: "plan",
            entity_id: plan_id,
            oldValue: old,
            newValue: { ...old, trangThai: "inactive" },
        });

        res.json({
            message: "Plan inactivated successfully",
            plan_id
        });

    } catch (error) {
        next(error);
    }
};