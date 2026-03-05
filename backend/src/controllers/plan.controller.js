const planModel = require("../models/plan.model");

//Tạo plan
exports.createPlan = async (req, res) => {
    try{
        const {tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho} = req.body;

        if(!tenGoi || !giaTien || !gioiHanSoKiosk || !gioiHanUser || !gioiHanSoCho) {
            return res.status(400).json({message: "Missing required fields"});
        }

        const duplicate = await planModel.checkDuplicate(tenGoi);

        if(duplicate.length > 0){
            return res.status(400).json({message: "Gói đã tồn tại"})
        }

        const result = await planModel.createPlan(req.body)

        return res.status(202).json({
            message: "Plan created successfully",
            plan_id: result.insertId
        })
    } catch (error) {
        if(error.code === "ER_DUP_ENTRY"){
            return res.status(400).json({message: "Gói đã tồn tại"});
        }

        res.status(500).json({error: error.message});
    }
};

//Lấy tất cả Plan
exports.getAllPlans = async(req, res) => {
    try{
        const rows = await planModel.getAllPlans();

        res.json(rows);
    } catch (error){
        res.status(500).json({error: error.message});
    }
};

//Lấy Plan theo Id
exports.getPlanById = async (req, res) => {
    try{
        const {id} = req.params;

        const plan = await planModel.getPlanById(id);

        if(!plan){
            return res.status(404).json({message: "Gói không tồn tại"});
        }

        res.json(plan);
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Update Plan
exports.updatePlan = async (req, res) => {
    try{
        const {tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho} = req.body;

        const{id} = req.params;

        const existing = await planModel.getPlanById(id);

        if(!existing){
            return res.status(404).json({message: "Gói không tồn tại"})
        }

        const duplicate = await planModel.checkDuplicateForUpdate(id, tenGoi);

        if(duplicate.length>0){
            return res.status(400).json({message: "Gói đã tồn tại"})
        }

        await planModel.updatePlan(id, req.body);

        res.json({message: "Plan updated successfully"});

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};