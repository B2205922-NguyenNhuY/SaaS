const planModel = require("../models/plan.model");

//Tạo plan
exports.createPlan = async (body) => {
        const {tenGoi, giaTien,  moTa, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho} = body;

        if(!tenGoi || !giaTien || !moTa || !gioiHanSoKiosk || !gioiHanUser || !gioiHanSoCho) {
            throw Object.assign(
                new Error("Missing required fields"),
                { statusCode: 400 }
            );
        }

        const duplicate = await planModel.checkDuplicate(tenGoi);

        if(duplicate.length > 0){
            throw Object.assign(
                new Error("Gói đã tồn tại"),
                { statusCode: 409 }
            );
        }

        const result = await planModel.createPlan({
            tenGoi,
            giaTien,
            moTa,
            gioiHanSoKiosk,
            gioiHanUser,
            gioiHanSoCho
        });

        return {
            plan_id: result.insertId
        }
};

//Lấy tất cả Plan
exports.getAllPlans = async() => {
        return rows = await planModel.getAllPlans();
};

//Lấy Plan theo Id
exports.getPlanById = async (id) => {
        const plan = await planModel.getPlanById(id);

        if(!plan){
            throw Object.assign(
                new Error("Gói không tồn tại"),
                { statusCode: 404 }
            );
        }

        return plan;
};

exports.listPlans = async (filters) => {

  const { page, limit } = filters;

  const offset = (page - 1) * limit;

  const rows = await planModel.listPlans(filters, offset, limit);

  const total = await planModel.countPlans(filters);

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

//Update Plan
exports.updatePlan = async (id, body) => {
        const {tenGoi, moTa} = body;

        const existing = await planModel.getPlanById(id);

        if(!existing){
           throw Object.assign(
            new Error("Gói không tồn tại"),
            { statusCode: 404 }
           );
        }

        const duplicate = await planModel.checkDuplicateForUpdate(id, tenGoi);

        if(duplicate.length>0){
            throw Object.assign(
                new Error("Gói đã tồn tại"),
                { statusCode: 409 }
            );
        }

        await planModel.updatePlan(id, body);
};

exports.inactivePlan = async (plan_id) => {
    if (!plan_id) {
        throw Object.assign(
            new Error("Missing plan_id"),
            { statusCode: 400 }
        );
    }

    // check tồn tại
    const plan = await planModel.getPlanById(plan_id);

    if (!plan || plan.length === 0) {
        throw Object.assign(
            new Error("Plan not found"),
            { statusCode: 404 }
        );
    }
    console.log(plan);

    // nếu đã inactive rồi
    if (!await planModel.isPlanActive(plan_id)) {
        throw Object.assign(
            new Error("Plan already inactive"),
            { statusCode: 400 }
        );
    }

    await planModel.inactivePlan(plan_id);

    return true;
};