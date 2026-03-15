const roleService = require("../services/role.service");

//Tạo role
exports.createRole = async (req, res, next) => {
    try{
        const result = await roleService.createRole(req.body)

        return res.status(202).json({
            message: "Role created successfully",
            role_id: result.role_id
        })
    } catch (error) {
        next(error);
    }
};

//Lấy tất cả Role
exports.getAllRoles = async(req, res, next) => {
    try{
        const rows = await roleService.getAllRoles();

        res.json(rows);
    } catch (error){
        next(error);
    }
};

//Lấy Role theo Id
exports.getRoleById = async (req, res, next) => {
    try{
        const role = await roleService.getRoleById(req.params.id);

        res.json(role);
    } catch (error) {
        next(error);
    }
};

//Update Role
exports.updateRole = async (req, res, next) => {
    try{
        await roleService.updateRole(req.params.id,req.body);

        res.json({message: "Role updated successfully"});

    } catch (error) {
        next(error);
    }
};