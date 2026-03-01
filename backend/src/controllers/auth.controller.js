const jwt = require('jsonwebtoken');
const { User, Role, Tenant } = require('../models');
const { JWT_SECRET, JWT_EXPIRE } = require('../config/auth');
const AuditService = require('../services/auditlog.service');

class AuthController {
  // Đăng nhập
  async login(req, res) {
    try {
      const { email, password, tenant_id } = req.body;

      const user = await User.findOne({
        where: {
          email,
          tenant_id,
          trangThai: 'active'
        },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['tenVaiTro', 'danhSachQuyen']
        }]
      });

      if (!user) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const isValidPassword = await user.comparePassword(password);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Invalid credentials' });
      }

      const token = jwt.sign(
        {
          user_id: user.user_id,
          tenant_id: user.tenant_id,
          role: user.role?.tenVaiTro
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRE }
      );

      await AuditService.log({
        tenant_id: user.tenant_id,
        user_id: user.user_id,
        hanhDong: 'LOGIN',
        entity_type: 'user',
        entity_id: user.user_id
      });

      res.json({
        message: 'Login successful',
        token,
        user: {
          user_id: user.user_id,
          email: user.email,
          hoTen: user.hoTen,
          role: user.role?.tenVaiTro,
          permissions: user.role?.danhSachQuyen || []
        }
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Đăng xuất
  async logout(req, res) {
    try {
      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'LOGOUT',
        entity_type: 'user',
        entity_id: req.user.user_id
      });

      res.json({ message: 'Logout successful' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Đổi mật khẩu
  async changePassword(req, res) {
    try {
      const { oldPassword, newPassword } = req.body;
      const user = await User.findByPk(req.user.user_id);

      const isValidPassword = await user.comparePassword(oldPassword);
      if (!isValidPassword) {
        return res.status(401).json({ message: 'Current password is incorrect' });
      }

      user.password_hash = newPassword;
      await user.save();

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CHANGE_PASSWORD',
        entity_type: 'user',
        entity_id: req.user.user_id
      });

      res.json({ message: 'Password changed successfully' });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy thông tin profile
  async getProfile(req, res) {
    try {
      const user = await User.findByPk(req.user.user_id, {
        attributes: { exclude: ['password_hash'] },
        include: [{
          model: Role,
          as: 'role',
          attributes: ['tenVaiTro', 'danhSachQuyen']
        }]
      });

      res.json(user);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new AuthController();