const { User, Role } = require('../models');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');

class UserController {
  // Tạo user mới
  async create(req, res) {
    try {
      const { email, password, hoTen, soDienThoai, role_id } = req.body;

      // Kiểm tra email đã tồn tại trong tenant
      const existingUser = await User.findOne({
        where: {
          tenant_id: req.tenant_id,
          email
        }
      });

      if (existingUser) {
        return res.status(400).json({ message: 'Email already exists in this tenant' });
      }

      // Kiểm tra role thuộc tenant
      const role = await Role.findOne({
        where: {
          role_id,
          tenant_id: req.tenant_id
        }
      });

      if (!role) {
        return res.status(400).json({ message: 'Invalid role for this tenant' });
      }

      const user = await User.create({
        tenant_id: req.tenant_id,
        role_id,
        email,
        password_hash: password,
        hoTen,
        soDienThoai
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_USER',
        entity_type: 'user',
        entity_id: user.user_id,
        giaTriMoi: { ...user.toJSON(), password_hash: undefined }
      });

      res.status(201).json({
        ...user.toJSON(),
        password_hash: undefined
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách users
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search, role_id, trangThai } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      
      if (search) {
        where[Op.or] = [
          { hoTen: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { soDienThoai: { [Op.like]: `%${search}%` } }
        ];
      }

      if (role_id) where.role_id = role_id;
      if (trangThai) where.trangThai = trangThai;

      const { count, rows } = await User.findAndCountAll({
        where,
        attributes: { exclude: ['password_hash'] },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['tenVaiTro', 'danhSachQuyen']
        }],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      res.json({
        total: count,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy chi tiết user
  async getById(req, res) {
    try {
      const user = await User.findOne({
        where: {
          user_id: req.params.id,
          tenant_id: req.tenant_id
        },
        attributes: { exclude: ['password_hash'] },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['tenVaiTro', 'danhSachQuyen']
        }]
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật user
  async update(req, res) {
    try {
      const user = await User.findOne({
        where: {
          user_id: req.params.id,
          tenant_id: req.tenant_id
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      const oldData = user.toJSON();
      await user.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_USER',
        entity_type: 'user',
        entity_id: user.user_id,
        giaTriCu: { ...oldData, password_hash: undefined },
        giaTriMoi: { ...user.toJSON(), password_hash: undefined }
      });

      res.json({
        ...user.toJSON(),
        password_hash: undefined
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Xóa user (soft delete)
  async delete(req, res) {
    try {
      const user = await User.findOne({
        where: {
          user_id: req.params.id,
          tenant_id: req.tenant_id
        }
      });

      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      if (user.role?.tenVaiTro === 'TENANT_ADMIN') {
        return res.status(400).json({ message: 'Cannot delete tenant admin' });
      }

      await user.update({
        trangThai: 'deleted',
        deleted_at: new Date()
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'DELETE_USER',
        entity_type: 'user',
        entity_id: user.user_id
      });

      res.json({ message: 'User deleted successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new UserController();