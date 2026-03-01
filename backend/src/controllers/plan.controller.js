const { Plan, PlanSubscription, Tenant } = require('../models');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');
const NotificationService = require('../services/notification.service');

class PlanController {
  // Tạo gói cước mới
  async create(req, res) {
    try {
      const plan = await Plan.create(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_PLAN',
        entity_type: 'plan',
        entity_id: plan.plan_id,
        giaTriMoi: plan.toJSON()
      });

      res.status(201).json(plan);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách gói cước
  async getAll(req, res) {
    try {
      const plans = await Plan.findAll({
        order: [['giaTien', 'ASC']]
      });
      res.json(plans);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Cập nhật gói cước
  async update(req, res) {
    try {
      const plan = await Plan.findByPk(req.params.id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      const oldData = plan.toJSON();
      await plan.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_PLAN',
        entity_type: 'plan',
        entity_id: plan.plan_id,
        giaTriCu: oldData,
        giaTriMoi: plan.toJSON()
      });

      res.json(plan);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Gán gói cước cho tenant
  async assignToTenant(req, res) {
    try {
      const { tenant_id, plan_id, ngayBatDau, ngayKetThuc } = req.body;

      const tenant = await Tenant.findByPk(tenant_id);
      if (!tenant) {
        return res.status(404).json({ message: 'Tenant not found' });
      }

      const plan = await Plan.findByPk(plan_id);
      if (!plan) {
        return res.status(404).json({ message: 'Plan not found' });
      }

      // Hủy subscription cũ nếu có
      await PlanSubscription.update(
        { trangThai: 'expired' },
        {
          where: {
            tenant_id,
            trangThai: { [Op.in]: ['active', 'trial'] }
          }
        }
      );

      const subscription = await PlanSubscription.create({
        tenant_id,
        plan_id,
        ngayBatDau,
        ngayKetThuc,
        trangThai: 'active'
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'ASSIGN_PLAN',
        entity_type: 'subscription',
        entity_id: subscription.subscription_id,
        giaTriMoi: subscription.toJSON()
      });

      await NotificationService.createNotification({
        tenant_id,
        type: 'subscription_activated',
        title: 'Gói dịch vụ đã được kích hoạt',
        content: `Gói ${plan.tenGoi} đã được kích hoạt từ ${ngayBatDau} đến ${ngayKetThuc}`,
        target_users: 'admin_only'
      });

      res.status(201).json(subscription);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Kiểm tra hạn sử dụng (cron job)
  async checkExpiredSubscriptions() {
    try {
      const expiredSubs = await PlanSubscription.findAll({
        where: {
          ngayKetThuc: { [Op.lt]: new Date() },
          trangThai: 'active'
        },
        include: [{
          model: Tenant,
          as: 'tenant'
        }]
      });

      for (const sub of expiredSubs) {
        await sub.update({ trangThai: 'expired' });
        
        // Khóa tenant
        await sub.tenant.update({ trangThai: 'suspended' });

        await NotificationService.createNotification({
          tenant_id: sub.tenant_id,
          type: 'subscription_expired',
          title: 'Gói dịch vụ đã hết hạn',
          content: 'Gói dịch vụ của bạn đã hết hạn. Vui lòng gia hạn để tiếp tục sử dụng.',
          target_users: 'admin_only'
        });
      }

      // Kiểm tra sắp hết hạn (7 ngày)
      const sevenDaysLater = new Date();
      sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);

      const soonExpire = await PlanSubscription.findAll({
        where: {
          ngayKetThuc: { [Op.lte]: sevenDaysLater },
          trangThai: 'active'
        }
      });

      for (const sub of soonExpire) {
        const daysLeft = Math.ceil((sub.ngayKetThuc - new Date()) / (1000 * 60 * 60 * 24));
        await NotificationService.sendSubscriptionExpiryWarning(sub.tenant_id, daysLeft);
      }
    } catch (error) {
      console.error('Check expired subscriptions error:', error);
    }
  }
}

module.exports = new PlanController();