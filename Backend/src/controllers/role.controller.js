const roleService = require("../services/role.service");
const { logAudit } = require("../utils/audit");

//Tạo role
exports.createRole = async (req, res, next) => {
    try{
        const result = await roleService.createRole(req.body)

        await logAudit(req, {
            action: "CREATE_ROLE",
            entity_type: "role",
            entity_id: result.role_id,
            newValue: req.body,
        });
            
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
        const id = Number(req.params.id);

        const old = await roleService.getRoleById(id);

        await roleService.updateRole(req.params.id,req.body);

        await logAudit(req, {
            action: "UPDATE_ROLE",
            entity_type: "role",
            entity_id: id,
            oldValue: old,
            newValue: { ...old, ...req.body },
        });

        res.json({message: "Role updated successfully"});

    } catch (error) {
        next(error);
    }
};