const tenantService = require("../services/tenant.service");

//Tạo Tennat mới
exports.createTenant = async (req, res, next) => {
    try{
        const result = await tenantService.createTenant(req.body);

        res.status(201).json({
            message: "Tenant created successfully",
            tenant_id: result.tenant_id
        });

    } catch (error) {
        next(error);
    }
};

//Lấy tất cả Tenant
exports.getAllTenants = async (req, res, next) => {
    try {
        const rows = await tenantService.getAllTenants();
        res.json(rows);

    } catch (error) {
        next(error);
    }
};

//Lấy Tenant theo ID
exports.getTenantById = async (req, res, next) => {
    try{
        const tenant = await tenantService.getTenantById(req.params.id);

        res.json(tenant);
        
    } catch (error) {
        next(error);
    }
};

//Update Tenant
exports.updateTenantStatus = async(req, res, next) => {
    try{
        await tenantService.updateTenantStatus(req.params.id, req.body.trangThai);

        res.json({message: "Tenant status updated susscessfully"});
    } catch (error) {
        next(error);
    }
};

//Update thông tin Tenant
exports.updateTenantInfo = async (req, res, next) => {
    try {
        await tenantService.updateTenantInfo(req.params.id, req.body);

        res.json({message: "Tenant updated successfully"});
    } catch (error) {
        next(error);
    }
};