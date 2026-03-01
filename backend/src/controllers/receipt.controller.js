const { Receipt, ReceiptCharge, Charge, Shift, User } = require('../models');
const AuditService = require('../services/auditlog.service');
const { Op } = require('sequelize');
const upload = require('../middleware/upload.middleware');

class ReceiptController {
  // Tạo phiếu thu (có hỗ trợ offline sync)
  async create(req, res) {
    try {
      const {
        charge_id,
        soTienThu,
        hinhThucThanhToan,
        ghiChu,
        thoiGianThu,
        local_id // ID từ local SQLite để sync
      } = req.body;

      // Kiểm tra shift đang mở
      const activeShift = await Shift.findOne({
        where: {
          tenant_id: req.tenant_id,
          user_id: req.user.user_id,
          thoiGianKetThucCa: null
        }
      });

      if (!activeShift) {
        return res.status(400).json({ message: 'No active shift. Please start a shift first.' });
      }

      // Kiểm tra charge
      const charge = await Charge.findOne({
        where: {
          charge_id,
          tenant_id: req.tenant_id
        }
      });

      if (!charge) {
        return res.status(404).json({ message: 'Charge not found' });
      }

      if (charge.trangThai === 'da_thu') {
        return res.status(400).json({ message: 'This charge is already paid' });
      }

      // Tạo receipt
      const receipt = await Receipt.create({
        tenant_id: req.tenant_id,
        soTienThu,
        hinhThucThanhToan,
        ghiChu,
        anhChupThanhToan: req.file?.path,
        thoiGianThu: thoiGianThu || new Date(),
        user_id: req.user.user_id,
        shift_id: activeShift.shift_id
      });

      // Tạo liên kết receipt-charge
      await ReceiptCharge.create({
        receipt_id: receipt.receipt_id,
        charge_id,
        tenant_id: req.tenant_id,
        soTienDaTra: soTienThu
      });

      // Cập nhật charge
      const soTienDaThu = parseFloat(charge.soTienDaThu) + parseFloat(soTienThu);
      const soTienPhaiThu = parseFloat(charge.soTienPhaiThu);
      
      let trangThai = charge.trangThai;
      if (soTienDaThu >= soTienPhaiThu) {
        trangThai = 'da_thu';
      } else if (soTienDaThu > 0) {
        trangThai = 'no';
      }

      await charge.update({
        soTienDaThu,
        trangThai
      });

      await AuditService.log({
        tenant_id: req.tenant_id,
        user_id: req.user.user_id,
        hanhDong: 'CREATE_RECEIPT',
        entity_type: 'receipt',
        entity_id: receipt.receipt_id,
        giaTriMoi: receipt.toJSON()
      });

      res.status(201).json({
        receipt,
        local_id, 
        sync_status: 'synced'
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Upload ảnh chứng từ
  async uploadImage(req, res) {
    try {
      if (!req.file) {
        return res.status(400).json({ message: 'No file uploaded' });
      }

      res.json({
        url: req.file.path,
        public_id: req.file.filename
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Lấy danh sách phiếu thu
  async getAll(req, res) {
    try {
      const {
        page = 1,
        limit = 10,
        user_id,
        shift_id,
        charge_id,
        fromDate,
        toDate,
        hinhThucThanhToan
      } = req.query;
      const offset = (page - 1) * limit;

      const where = { tenant_id: req.tenant_id };
      if (user_id) where.user_id = user_id;
      if (shift_id) where.shift_id = shift_id;
      if (hinhThucThanhToan) where.hinhThucThanhToan = hinhThucThanhToan;

      if (fromDate || toDate) {
        where.thoiGianThu = {};
        if (fromDate) where.thoiGianThu[Op.gte] = fromDate;
        if (toDate) where.thoiGianThu[Op.lte] = toDate;
      }

      // Nếu có charge_id, tìm receipt qua bảng trung gian
      let receiptIds = [];
      if (charge_id) {
        const receiptCharges = await ReceiptCharge.findAll({
          where: { charge_id, tenant_id: req.tenant_id },
          attributes: ['receipt_id']
        });
        receiptIds = receiptCharges.map(rc => rc.receipt_id);
        where.receipt_id = { [Op.in]: receiptIds };
      }

      const { count, rows } = await Receipt.findAndCountAll({
        where,
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['hoTen', 'email']
          },
          {
            model: Shift,
            as: 'shift',
            attributes: ['shift_id', 'thoiGianBatDauCa', 'thoiGianKetThucCa']
          },
          {
            model: Charge,
            as: 'Charges',
            through: { attributes: ['soTienDaTra'] },
            include: [
              {
                model: Kiosk,
                as: 'kiosk',
                attributes: ['maKiosk']
              },
              {
                model: Merchant,
                as: 'merchant',
                attributes: ['hoTen']
              }
            ]
          }
        ],
        limit: parseInt(limit),
        offset: parseInt(offset),
        order: [['thoiGianThu', 'DESC']]
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

  // Lấy chi tiết phiếu thu
  async getById(req, res) {
    try {
      const receipt = await Receipt.findOne({
        where: {
          receipt_id: req.params.id,
          tenant_id: req.tenant_id
        },
        include: [
          {
            model: User,
            as: 'user',
            attributes: ['hoTen', 'email']
          },
          {
            model: Shift,
            as: 'shift'
          },
          {
            model: Charge,
            as: 'Charges',
            through: { attributes: ['soTienDaTra'] },
            include: [
              {
                model: Kiosk,
                as: 'kiosk'
              },
              {
                model: Merchant,
                as: 'merchant'
              },
              {
                model: CollectionPeriod,
                as: 'period'
              }
            ]
          }
        ]
      });

      if (!receipt) {
        return res.status(404).json({ message: 'Receipt not found' });
      }

      res.json(receipt);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Đồng bộ dữ liệu offline
  async syncOffline(req, res) {
    try {
      const { receipts } = req.body;

      const syncedReceipts = [];
      const errors = [];

      for (const localReceipt of receipts) {
        try {
          // Kiểm tra receipt đã được đồng bộ chưa
          const existingReceipt = await Receipt.findOne({
            where: {
              tenant_id: req.tenant_id,
              [Op.and]: [
                { ghiChu: { [Op.like]: `%local_id:${localReceipt.local_id}%` } }
              ]
            }
          });

          if (existingReceipt) {
            errors.push({
              local_id: localReceipt.local_id,
              error: 'Receipt already synced'
            });
            continue;
          }

          // Tạo receipt mới
          const receipt = await Receipt.create({
            tenant_id: req.tenant_id,
            soTienThu: localReceipt.soTienThu,
            hinhThucThanhToan: localReceipt.hinhThucThanhToan,
            ghiChu: `${localReceipt.ghiChu || ''} | local_id:${localReceipt.local_id}`,
            anhChupThanhToan: localReceipt.anhChupThanhToan,
            thoiGianThu: localReceipt.thoiGianThu,
            user_id: req.user.user_id,
            shift_id: localReceipt.shift_id
          });

          // Tạo liên kết với charge
          if (localReceipt.charge_id) {
            await ReceiptCharge.create({
              receipt_id: receipt.receipt_id,
              charge_id: localReceipt.charge_id,
              tenant_id: req.tenant_id,
              soTienDaTra: localReceipt.soTienThu
            });

            // Cập nhật charge
            const charge = await Charge.findByPk(localReceipt.charge_id);
            if (charge) {
              const soTienDaThu = parseFloat(charge.soTienDaThu) + parseFloat(localReceipt.soTienThu);
              await charge.update({ soTienDaThu });
            }
          }

          syncedReceipts.push({
            local_id: localReceipt.local_id,
            server_id: receipt.receipt_id
          });
        } catch (error) {
          errors.push({
            local_id: localReceipt.local_id,
            error: error.message
          });
        }
      }

      res.json({
        message: `Synced ${syncedReceipts.length} receipts`,
        synced: syncedReceipts,
        errors
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
}

module.exports = new ReceiptController();
