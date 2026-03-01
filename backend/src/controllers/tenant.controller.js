const { Tenant, Plan, PlanSubscription, User, Role } = require('../models');
const { PERMISSIONS, ROLES } = require('../config/auth');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');

class TenantController {
  // Tạo tenant mới (Super Admin)
  async create(req, res) {
    try {
      const { tenBanQuanLy, diaChi, soDienThoai, email, matkhau } = req.body;

      const existingTenant = await Tenant.findOne({
        where: {
          [Op.or]: [{ email }, { soDienThoai }]
        }
      });

      if (existingTenant) {
        return res.status(400).json({ message: 'Email or phone already exists' });
      }

      const tenant = await Tenant.create({
        tenBanQuanLy,
        diaChi,
        soDienThoai,
        email,
        matkhau
      });

      // Tạo role mặc định cho tenant
      await this.createDefaultRoles(tenant.tenant_id);

      // Tạo user admin cho tenant
      await User.create({
        tenant_id: tenant.tenant_id,
        role_id: await this.getRoleId(tenant.tenant_id, 'TENANT_ADMIN'),
        email,
        password_hash: matkhau,
        hoTen: tenBanQuanLy,
        soDienThoai
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_TENANT',
        entity_type: 'tenant',
        entity_id: tenant.tenant_id,
        giaTriMoi: tenant.toJSON()
      });

      res.status(201).json(tenant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách tenants (Super Admin)
  async getAll(req, res) {
    try {
      const { page = 1, limit = 10, search } = req.query;
      const offset = (page - 1) * limit;

      const where = {};
      if (search) {
        where[Op.or] = [
          { tenBanQuanLy: { [Op.like]: `%${search}%` } },
          { email: { [Op.like]: `%${search}%` } },
          { soDienThoai: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Tenant.findAndCountAll({
        where,
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

  // Lấy chi tiết tenant
  async getById(req, res) {
    try {
      const tenant = await Tenant.findByPk(req.params.id, {
        include: [{
          model: PlanSubscription,
          as: 'PlanSubscriptions',
          include: [{
            model: Plan,
            as: 'plan'
          }]
        }]
      });

      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      res.json(tenant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật tenant
  async update(req, res) {
    try {
      const tenant = await Tenant.findByPk(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      const oldData = tenant.toJSON();
      await tenant.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_TENANT',
        entity_type: 'tenant',
        entity_id: tenant.tenant_id,
        giaTriCu: oldData,
        giaTriMoi: tenant.toJSON()
      });

      res.json(tenant);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Khóa/mở khóa tenant
  async toggleStatus(req, res) {
    try {
      const tenant = await Tenant.findByPk(req.params.id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      const newStatus = tenant.trangThai === 'active' ? 'suspended' : 'active';
      await tenant.update({ trangThai: newStatus });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: `TOGGLE_TENANT_${newStatus.toUpperCase()}`,
        entity_type: 'tenant',
        entity_id: tenant.tenant_id
      });

      res.json({ message: `Tenant ${newStatus} successfully` });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Helper methods
  async createDefaultRoles(tenant_id) {
    const roles = [
      {
        tenant_id,
        tenVaiTro: 'TENANT_ADMIN',
        danhSachQuyen: Object.values(PERMISSIONS)
      },
      {
        tenant_id,
        tenVaiTro: 'COLLECTOR',
        danhSachQuyen: [
          PERMISSIONS.VIEW_KIOSK,
          PERMISSIONS.VIEW_CHARGE,
          PERMISSIONS.COLLECT_FEE,
          PERMISSIONS.VIEW_RECEIPT,
          PERMISSIONS.START_SHIFT,
          PERMISSIONS.END_SHIFT,
          PERMISSIONS.VIEW_SHIFT
        ]
      },
      {
        tenant_id,
        tenVaiTro: 'ACCOUNTANT',
        danhSachQuyen: [
          PERMISSIONS.VIEW_MARKET,
          PERMISSIONS.VIEW_ZONE,
          PERMISSIONS.VIEW_KIOSK,
          PERMISSIONS.VIEW_MERCHANT,
          PERMISSIONS.VIEW_FEE,
          PERMISSIONS.VIEW_PERIOD,
          PERMISSIONS.VIEW_CHARGE,
          PERMISSIONS.VIEW_RECEIPT,
          PERMISSIONS.VIEW_DEBT,
          PERMISSIONS.VIEW_REPORT,
          PERMISSIONS.EXPORT_REPORT
        ]
      }
    ];

    await Role.bulkCreate(roles);
  }

  async getRoleId(tenant_id, roleName) {
    const role = await Role.findOne({
      where: { tenant_id, tenVaiTro: roleName }
    });
    return role.role_id;
  }
}

module.exports = new TenantController();