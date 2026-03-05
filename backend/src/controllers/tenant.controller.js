const tenantModel = require("../models/tenant.model");

//Tạo Tennat mới
exports.createTenant = async (req, res) => {
    try{
        const duplicate = await tenantModel.checkDuplicate(
            req.body.email, req.body.soDienThoai
        );

        if (duplicate.length>0) {
            return res.status(400).json({
                message: "Email hoặc Số điện thoại đã tồn tại"
            });
        }

        const result = await tenantModel.createTenant(req.body);

        res.status(201).json({
            message: "Tenant created successfully",
            tenant_id: result.insertId
        });

    } catch (error) {
        if (error.code === "ER_DUP_ENTRY") {
            return res.status(400).json({ message: "Email hoặc số điện thoại đã tồn tại"});
        }

        res.status(500).json({error: error.message});
    }
};

//Lấy tất cả Tenant
exports.getAllTenants = async (req, res) => {
    try {
        const rows = await tenantModel.getAllTenants();

        res.json(rows);

    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Lấy Tenant theo ID
exports.getTenantById = async (req, res) => {
    try{
        const { id } = req.params;

        const tenant = await tenantModel.getTenantById(id);

        if(!tenant) {
            return res.status(404).json({message: "Tenant not found"});
        }

        res.json(tenant);
        
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Update Tenant
exports.updateTenantStatus = async(req, res) => {
    try{
        const { id } = req.params;
        const { trangThai } = req.body;

        if(!["active", "suspended"].includes(trangThai)) {
            return res.status(400).json({
                message: "Invalid status"
            });
        }

        const existing = await tenantModel.getTenantById(id);

        if(!existing){
            return res.status(400).json({message: "Tenant not found"});
        }

        await tenantModel.updateTenantStatus(id, trangThai);

        res.json({message: "Tenant status updated susscessfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};

//Update thông tin Tenant
exports.updateTenantInfo = async (req, res) => {
    try {
        const { id } = req.params;
        const {
            tenBanQuanLy,
            diachi,
            soDienThoai,
            email
        } = req.body;

        const existing = await tenantModel.getTenantById(id);

        if(!existing) {
            return res.status(404).json({message: "Tenant not found"});
        }

        const duplicate = await tenantModel.checkDuplicateForUpdate(id, email, soDienThoai);

        if(duplicate.length>0) {
            return res.status(400).json({
                message: "Email hoặc Số điện thoại đã tồn tại"
            });
        }

        await tenantModel.updateTenantInfo(id, req.body);

        res.json({message: "Tenant updated successfully"});
    } catch (error) {
        res.status(500).json({error: error.message});
    }
};