const tenantModel = require("../models/tenant.model");

//Tạo Tennat mới
exports.createTenant = async (body) => {
        const {
            tenBanQuanLy,
            diachi,
            soDienThoai,
            email
        } = body;

        if (!email || !diachi || !tenBanQuanLy || !soDienThoai) {
            throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
        }

        const duplicate = await tenantModel.checkDuplicate(
            body.email, body.soDienThoai
        );

        if (duplicate.length>0) {
            throw Object.assign(new Error("Email hoặc Số điện thoại đã tồn tại"),{ statusCode: 400 });
        }

        const result = await tenantModel.createTenant(body);

        return{
            tenant_id: result.insertId
        };
};

//Lấy tất cả Tenant
exports.getAllTenants = async () => {
        return await tenantModel.getAllTenants();
};

//Lấy Tenant theo ID
exports.getTenantById = async (id) => {
        const tenant = await tenantModel.getTenantById(id);

        if(!tenant) {
            throw Object.assign(new Error("Tenant not found"),{ statusCode: 404 });
        }

        return tenant;
};

//Update Tenant
exports.updateTenantStatus = async(id, trangThai) => {
        if(!["active", "suspended"].includes(trangThai)) {
            throw Object.assign(new Error("Invalid status"),{ statusCode: 400 });
        }

        const existing = await tenantModel.getTenantById(id);

        if(!existing){
            throw Object.assign(new Error("Tenant not found"),{ statusCode: 404 });
        }

        await tenantModel.updateTenantStatus(id, trangThai);
};

//Update thông tin Tenant
exports.updateTenantInfo = async (id, body) => {
        const {
            tenBanQuanLy,
            diachi,
            soDienThoai,
            email
        } = body;

        if (!email || !diachi || !tenBanQuanLy || !soDienThoai) {
            throw Object.assign(new Error("Missing required fields"), { statusCode: 400 });
        }

        const existing = await tenantModel.getTenantById(id);

        if(!existing) {
            throw Object.assign(new Error("Tenant not found"),{ statusCode: 404 });
        }

        const duplicate = await tenantModel.checkDuplicateForUpdate(id, body.email, body.soDienThoai);

        if(duplicate.length>0) {
            throw Object.assign(new Error("Email hoặc Số điện thoại đã tồn tại"),{ statusCode: 400 });
        }

        await tenantModel.updateTenantInfo(id, body);
};