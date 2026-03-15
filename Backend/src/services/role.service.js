const roleModel = require("../models/role.model");

//Tạo role
exports.createRole = async (body) => {
        if(!body.tenVaiTro || !body.danhSachQuyen) {
            throw Object.assign(new Error("Missing required fields"),{ statusCode: 400 });
        }

        const duplicate = await roleModel.checkDuplicate(body.tenVaiTro);

        if(duplicate.length > 0){
            throw Object.assign(new Error("Vai trò đã tồn tại"),{ statusCode: 409 });
        }

        const result = await roleModel.createRole(body)

        return {
            role_id: result.insertId
        };
};

//Lấy tất cả Role
exports.getAllRoles = async() => {
        return await roleModel.getAllRoles();
};

//Lấy Role theo Id
exports.getRoleById = async (id) => {
        const role = await roleModel.getRoleById(id);

        if(!role){
            throw Object.assign(new Error("Vai trò không tồn tại"),{ statusCode: 404 });
        }

        return role;
};

//Update Role
exports.updateRole = async (id,body) => {

        const existing = await roleModel.checkDuplicate(body.tenVaiTro);

        if(!existing){
            throw Object.assign(new Error("Vai trò không tồn tại"),{ statusCode: 404 });
        }

        const duplicate = await roleModel.checkDuplicateForUpdate(id, body.tenVaiTro);

        if(duplicate.length>0){
            throw Object.assign(new Error("Vai trò đã tồn tại"),{ statusCode: 400 });
        }

        await roleModel.updateRole(id,body);

};