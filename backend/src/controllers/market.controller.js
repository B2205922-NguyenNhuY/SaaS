const { Market, Zone, Kiosk, KioskType } = require('../models');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');

class MarketController {
  // ==================== MARKET ====================
  async createMarket(req, res) {
    try {
      const { tenCho, diaChi, dienTich } = req.body;

      const market = await Market.create({
        tenant_id: req.tenant_id,
        tenCho,
        diaChi,
        dienTich
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_MARKET',
        entity_type: 'market',
        entity_id: market.market_id,
        giaTriMoi: market.toJSON()
      });

      res.status(201).json(market);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Market name already exists in this tenant' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  async getAllMarkets(req, res) {
    try {
      const { page = 1, limit = 10, search, trangThai } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (search) {
        where[Op.or] = [
          { tenCho: { [Op.like]: `%${search}%` } },
          { diaChi: { [Op.like]: `%${search}%` } }
        ];
      }
      if (trangThai) where.trangThai = trangThai;

      const { count, rows } = await Market.findAndCountAll({
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

  async getMarketById(req, res) {
    try {
      const market = await Market.findOne({
        where: {
          market_id: req.params.id,
          tenant_id: req.tenant_id
        },
        include: [{
          model: Zone,
          as: 'Zones',
          include: [{
            model: Kiosk,
            as: 'Kiosks'
          }]
        }]
      });

      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }

      res.json(market);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateMarket(req, res) {
    try {
      const market = await Market.findOne({
        where: {
          market_id: req.params.id,
          tenant_id: req.tenant_id
        }
      });

      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }

      const oldData = market.toJSON();
      await market.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_MARKET',
        entity_type: 'market',
        entity_id: market.market_id,
        giaTriCu: oldData,
        giaTriMoi: market.toJSON()
      });

      res.json(market);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ==================== ZONE ====================
  async createZone(req, res) {
    try {
      const { market_id, tenKhu } = req.body;

      // Kiểm tra market thuộc tenant
      const market = await Market.findOne({
        where: {
          market_id,
          tenant_id: req.tenant_id
        }
      });

      if (!market) {
        return res.status(404).json({ message: 'Market not found' });
      }

      const zone = await Zone.create({
        tenant_id: req.tenant_id,
        market_id,
        tenKhu
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_ZONE',
        entity_type: 'zone',
        entity_id: zone.zone_id,
        giaTriMoi: zone.toJSON()
      });

      res.status(201).json(zone);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Zone name already exists in this market' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  async getZonesByMarket(req, res) {
    try {
      const zones = await Zone.findAll({
        where: {
          market_id: req.params.marketId,
          tenant_id: req.tenant_id
        },
        include: [{
          model: Kiosk,
          as: 'Kiosks'
        }]
      });

      res.json(zones);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ==================== KIOSK TYPE ====================
  async createKioskType(req, res) {
    try {
      const { tenLoai, moTa } = req.body;

      const kioskType = await KioskType.create({
        tenLoai,
        moTa
      });

      res.status(201).json(kioskType);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Kiosk type name already exists' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  async getAllKioskTypes(req, res) {
    try {
      const types = await KioskType.findAll({
        order: [['tenLoai', 'ASC']]
      });
      res.json(types);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // ==================== KIOSK ====================
  async createKiosk(req, res) {
    try {
      const { zone_id, type_id, maKiosk, viTri, dienTich } = req.body;

      // Kiểm tra zone thuộc tenant
      const zone = await Zone.findOne({
        where: {
          zone_id,
          tenant_id: req.tenant_id
        }
      });

      if (!zone) {
        return res.status(404).json({ message: 'Zone not found' });
      }

      const kiosk = await Kiosk.create({
        tenant_id: req.tenant_id,
        zone_id,
        type_id,
        maKiosk,
        viTri,
        dienTich
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_KIOSK',
        entity_type: 'kiosk',
        entity_id: kiosk.kiosk_id,
        giaTriMoi: kiosk.toJSON()
      });

      res.status(201).json(kiosk);
    } catch (error) {
      if (error.name === 'SequelizeUniqueConstraintError') {
        return res.status(400).json({ message: 'Kiosk code already exists in this zone' });
      }
      res.status(500).json({ message: error.message });
    }
  }

  async getAllKiosks(req, res) {
    try {
      const { page = 1, limit = 10, zone_id, type_id, trangThai, search } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (zone_id) where.zone_id = zone_id;
      if (type_id) where.type_id = type_id;
      if (trangThai) where.trangThai = trangThai;
      if (search) {
        where[Op.or] = [
          { maKiosk: { [Op.like]: `%${search}%` } },
          { viTri: { [Op.like]: `%${search}%` } }
        ];
      }

      const { count, rows } = await Kiosk.findAndCountAll({
        where,
        include: [
          {
            model: Zone,
            as: 'zone',
            include: [{
              model: Market,
              as: 'market'
            }]
          },
          {
            model: KioskType,
            as: 'type'
          }
        ],
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

  async getKioskById(req, res) {
    try {
      const kiosk = await Kiosk.findOne({
        where: {
          kiosk_id: req.params.id,
          tenant_id: req.tenant_id
        },
        include: [
          {
            model: Zone,
            as: 'zone',
            include: [{
              model: Market,
              as: 'market'
            }]
          },
          {
            model: KioskType,
            as: 'type'
          }
        ]
      });

      if (!kiosk) {
        return res.status(404).json({ message: 'Kiosk not found' });
      }

      res.json(kiosk);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  async updateKiosk(req, res) {
    try {
      const kiosk = await Kiosk.findOne({
        where: {
          kiosk_id: req.params.id,
          tenant_id: req.tenant_id
        }
      });

      if (!kiosk) {
        return res.status(404).json({ message: 'Kiosk not found' });
      }

      const oldData = kiosk.toJSON();
      await kiosk.update(req.body);

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'UPDATE_KIOSK',
        entity_type: 'kiosk',
        entity_id: kiosk.kiosk_id,
        giaTriCu: oldData,
        giaTriMoi: kiosk.toJSON()
      });

      res.json(kiosk);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new MarketController();