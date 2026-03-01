const { Charge, Merchant, Kiosk, CollectionPeriod } = require('../models');
const { Op } = require('sequelize');

class DebtController {
  // Xem công nợ
  async getDebts(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        merchant_id,
        kiosk_id,
        fromDate,
        toDate,
        trangThai = 'no'
      } = req.query;
      const offset = (page - 1) * limit;

      const where = {
        tenant_id: req.tenant_id,
        trangThai
      };

      if (merchant_id) where.merchant_id = merchant_id;
      if (kiosk_id) where.kiosk_id = kiosk_id;

      if (fromDate || toDate) {
        where.created_at = {};
        if (fromDate) where.created_at[Op.gte] = fromDate;
        if (toDate) where.created_at[Op.lte] = toDate;
      }

      const { count, rows } = await Charge.findAndCountAll({
        where,
        include: [
          {
            model: Merchant,
            as: 'merchant',
            attributes: ['hoTen', 'soDienThoai']
          },
          {
            model: Kiosk,
            as: 'kiosk',
            attributes: ['maKiosk', 'viTri']
          },
          {
            model: CollectionPeriod,
            as: 'period',
            attributes: ['tenKyThu', 'ngayBatDau', 'ngayKetThuc']
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['created_at', 'DESC']]
      });

      // Tính tổng nợ
      const totalDebt = await Charge.sum('soTienPhaiThu - soTienDaThu', {
        where: {
          tenant_id: req.tenant_id,
          trangThai: 'no'
        }
      });

      res.json({
        total: count,
        totalDebt: totalDebt || 0,
        page: parseInt(page),
        limit: parseInt(limit),
        data: rows
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Tổng hợp công nợ theo tiểu thương
  async getDebtSummary(req, res) {
    try {
      const { fromDate, toDate } = req.query;

      const where = {
        tenant_id: req.tenant_id,
        trangThai: 'no'
      };

      if (fromDate || toDate) {
        where.created_at = {};
        if (fromDate) where.created_at[Op.gte] = fromDate;
        if (toDate) where.created_at[Op.lte] = toDate;
      }

      const charges = await Charge.findAll({
        where,
        include: [
          {
            model: Merchant,
            as: 'merchant'
          }
        ]
      });

      // Nhóm theo merchant
      const summary = {};
      charges.forEach(charge => {
        const merchantId = charge.merchant_id;
        const debt = parseFloat(charge.soTienPhaiThu) - parseFloat(charge.soTienDaThu);

        if (!summary[merchantId]) {
          summary[merchantId] = {
            merchant_id: merchantId,
            merchant_name: charge.merchant?.hoTen,
            total_debt: 0,
            charges: []
          };
        }

        summary[merchantId].total_debt += debt;
        summary[merchantId].charges.push({
          charge_id: charge.charge_id,
          soTienPhaiThu: charge.soTienPhaiThu,
          soTienDaThu: charge.soTienDaThu,
          debt: debt,
          period: charge.period_id
        });
      });

      res.json(Object.values(summary));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new DebtController();

