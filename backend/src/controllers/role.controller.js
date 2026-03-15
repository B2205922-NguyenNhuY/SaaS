const roleModel = require("../models/role.model");

//Tạo role
exports.createRole = async (req, res) => {
  try {
    const { tenVaiTro, danhSachQuyen } = req.body;

    if (!tenVaiTro || !danhSachQuyen) {
      return res.status(400).json({ message: "Missing required fields" });
    }

    const duplicate = await roleModel.checkDuplicate(tenVaiTro);

    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Vai trò đã tồn tại" });
    }

    const result = await roleModel.createRole(req.body);

    return res.status(202).json({
      message: "Role created successfully",
      role_id: result.insertId,
    });
  } catch (error) {
    if (error.code === "ER_DUP_ENTRY") {
      return res.status(400).json({ message: "Vai trò đã tồn tại" });
    }

    res.status(500).json({ error: error.message });
  }
};

//Lấy tất cả Role
exports.getAllRoles = async (req, res) => {
  try {
    const rows = await roleModel.getAllRoles();

    res.json(rows);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Lấy Role theo Id
exports.getRoleById = async (req, res) => {
  try {
    const { id } = req.params;

    const role = await roleModel.getRoleById(id);

    if (!role) {
      return res.status(404).json({ message: "Vai trò không tồn tại" });
    }

    res.json(role);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};

//Update Role
exports.updateRole = async (req, res) => {
  try {
    const { tenVaiTro, danhSachQuyen } = req.body;

    const { id } = req.params;

    const existing = await roleModel.checkDuplicate(tenVaiTro);

    if (!existing) {
      return res.status(404).json({ message: "Vai trò không tồn tại" });
    }

    const duplicate = await roleModel.checkDuplicateForUpdate(id, tenVaiTro);

    if (duplicate.length > 0) {
      return res.status(400).json({ message: "Vai trò đã tồn tại" });
    }

    await roleModel.updateRole(id, req.body);

    res.json({ message: "Role updated successfully" });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
