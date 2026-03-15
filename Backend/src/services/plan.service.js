const planModel = require("../models/plan.model");

//Tạo plan
exports.createPlan = async (body) => {
        const {tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho} = body;

        if(!tenGoi || !giaTien || !gioiHanSoKiosk || !gioiHanUser || !gioiHanSoCho) {
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

        const result = await planModel.createPlan(body);

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

//Update Plan
exports.updatePlan = async (id, body) => {
        const {tenGoi} = body;

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