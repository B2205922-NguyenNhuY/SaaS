const planService = require("../services/plan.service");

//Tạo plan
exports.createPlan = async (req, res, next) => {
    try{
        const result = await planService.createPlan(req.body)

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

//Update Plan
exports.updatePlan = async (req, res, next) => {
    try{
        await planService.updatePlan(req.params.id, req.body);

        res.json({message: "Plan updated successfully"});

    } catch (error) {
        next(error);
    }
};