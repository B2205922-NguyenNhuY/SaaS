const { Receipt, Charge, Shift, User, Market, Kiosk, Merchant } = require('../models');
const { Op } = require('sequelize');
const ExcelJS = require('exceljs');
const moment = require('moment');

class ReportController {
  // Báo cáo tổng thu
  async getRevenueReport(req, res) {
    try {
      const { fromDate, toDate, groupBy = 'day' } = req.query;

      const where = {
        tenant_id: req.tenant_id
      };

      if (fromDate || toDate) {
        where.thoiGianThu = {};
        if (fromDate) where.thoiGianThu[Op.gte] = fromDate;
        if (toDate) where.thoiGianThu[Op.lte] = toDate;
      }

      const receipts = await Receipt.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['hoTen']
        }]
      });

      // Nhóm theo ngày/tháng
      const groupedData = {};
      receipts.forEach(receipt => {
        let key;
        const date = moment(receipt.thoiGianThu);
        
        if (groupBy === 'day') {
          key = date.format('YYYY-MM-DD');
        } else if (groupBy === 'month') {
          key = date.format('YYYY-MM');
        } else {
          key = date.format('YYYY');
        }

        if (!groupedData[key]) {
          groupedData[key] = {
            period: key,
            tien_mat: 0,
            chuyen_khoan: 0,
            total: 0,
            count: 0
          };
        }

        const amount = parseFloat(receipt.soTienThu);
        groupedData[key][receipt.hinhThucThanhToan] += amount;
        groupedData[key].total += amount;
        groupedData[key].count += 1;
      });

      // Tính tổng
      const summary = {
        total_tien_mat: receipts.filter(r => r.hinhThucThanhToan === 'tien_mat').reduce((sum, r) => sum + parseFloat(r.soTienThu), 0),
        total_chuyen_khoan: receipts.filter(r => r.hinhThucThanhToan === 'chuyen_khoan').reduce((sum, r) => sum + parseFloat(r.soTienThu), 0),
        total_receipts: receipts.length
      };

      res.json({
        summary,
        data: Object.values(groupedData).sort((a, b) => a.period.localeCompare(b.period))
      });
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Báo cáo thu theo khu vực
  async getRevenueByLocation(req, res) {
    try {
      const { fromDate, toDate } = req.query;

      const where = { tenant_id: req.tenant_id };
      if (fromDate || toDate) {
        where.thoiGianThu = {};
        if (fromDate) where.thoiGianThu[Op.gte] = fromDate;
        if (toDate) where.thoiGianThu[Op.lte] = toDate;
      }

      const receipts = await Receipt.findAll({
        where,
        include: [{
          model: Charge,
          as: 'Charges',
          include: [{
            model: Kiosk,
            as: 'kiosk',
            include: [{
              model: Zone,
              as: 'zone',
              include: [{
                model: Market,
                as: 'market'
              }]
            }]
          }]
        }]
      });

      // Nhóm theo market và zone
      const marketData = {};
      
      receipts.forEach(receipt => {
        receipt.Charges?.forEach(charge => {
          const kiosk = charge.kiosk;
          if (!kiosk) return;

          const marketId = kiosk.zone?.market?.market_id;
          const marketName = kiosk.zone?.market?.tenCho || 'Unknown';
          const zoneName = kiosk.zone?.tenKhu || 'Unknown';

          if (!marketData[marketId]) {
            marketData[marketId] = {
              market_id: marketId,
              market_name: marketName,
              total: 0,
              zones: {}
            };
          }

          if (!marketData[marketId].zones[zoneName]) {
            marketData[marketId].zones[zoneName] = {
              zone_name: zoneName,
              total: 0,
              count: 0
            };
          }

          marketData[marketId].total += parseFloat(receipt.soTienThu);
          marketData[marketId].zones[zoneName].total += parseFloat(receipt.soTienThu);
          marketData[marketId].zones[zoneName].count += 1;
        });
      });

      res.json(Object.values(marketData));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Báo cáo theo nhân viên thu
  async getRevenueByCollector(req, res) {
    try {
      const { fromDate, toDate } = req.query;

      const where = { tenant_id: req.tenant_id };
      if (fromDate || toDate) {
        where.thoiGianThu = {};
        if (fromDate) where.thoiGianThu[Op.gte] = fromDate;
        if (toDate) where.thoiGianThu[Op.lte] = toDate;
      }

      const receipts = await Receipt.findAll({
        where,
        include: [{
          model: User,
          as: 'user',
          attributes: ['hoTen', 'email']
        }]
      });

      const collectorData = {};
      
      receipts.forEach(receipt => {
        const userId = receipt.user_id;
        const userName = receipt.user?.hoTen || 'Unknown';

        if (!collectorData[userId]) {
          collectorData[userId] = {
            user_id: userId,
            user_name: userName,
            tien_mat: 0,
            chuyen_khoan: 0,
            total: 0,
            count: 0
          };
        }

        collectorData[userId][receipt.hinhThucThanhToan] += parseFloat(receipt.soTienThu);
        collectorData[userId].total += parseFloat(receipt.soTienThu);
        collectorData[userId].count += 1;
      });

      res.json(Object.values(collectorData));
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Xuất báo cáo Excel
  async exportReport(req, res) {
    try {
      const { type, fromDate, toDate } = req.query;

      let data = [];
      let title = '';

      // Lấy dữ liệu theo loại báo cáo
      switch (type) {
        case 'revenue':
          title = 'BÁO CÁO TỔNG THU';
          data = await this.getRevenueData(req.tenant_id, fromDate, toDate);
          break;
        case 'debt':
          title = 'BÁO CÁO CÔNG NỢ';
          data = await this.getDebtData(req.tenant_id);
          break;
        case 'collector':
          title = 'BÁO CÁO THEO NHÂN VIÊN';
          data = await this.getCollectorData(req.tenant_id, fromDate, toDate);
          break;
        default:
          return res.status(400).json({ message: 'Invalid report type' });
      }

      // Tạo workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet(title);

      // Thêm tiêu đề
      worksheet.addRow([title]);
      worksheet.addRow([`Từ ngày: ${fromDate || 'N/A'} - Đến ngày: ${toDate || 'N/A'}`]);
      worksheet.addRow([]);

      // Thêm header
      const headers = Object.keys(data[0] || {});
      worksheet.addRow(headers);

      // Thêm dữ liệu
      data.forEach(row => {
        worksheet.addRow(Object.values(row));
      });

      // Format
      worksheet.getRow(1).font = { bold: true, size: 16 };
      worksheet.getRow(4).font = { bold: true };
      
      // Auto-fit columns
      worksheet.columns.forEach(column => {
        column.width = 20;
      });

      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=${title}_${moment().format('YYYYMMDD')}.xlsx`
      );

      await workbook.xlsx.write(res);
      res.end();
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }

  // Helper methods
  async getRevenueData(tenant_id, fromDate, toDate) {
    const receipts = await Receipt.findAll({
      where: {
        tenant_id,
        thoiGianThu: {
          [Op.between]: [fromDate, toDate]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['hoTen']
      }]
    });

    return receipts.map(r => ({
      'Ngày thu': moment(r.thoiGianThu).format('DD/MM/YYYY'),
      'Số tiền': r.soTienThu,
      'Hình thức': r.hinhThucThanhToan === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản',
      'Nhân viên thu': r.user?.hoTen,
      'Ghi chú': r.ghiChu
    }));
  }

  async getDebtData(tenant_id) {
    const charges = await Charge.findAll({
      where: {
        tenant_id,
        trangThai: 'no'
      },
      include: [
        {
          model: Merchant,
          as: 'merchant',
          attributes: ['hoTen']
        },
        {
          model: Kiosk,
          as: 'kiosk',
          attributes: ['maKiosk']
        }
      ]
    });

    return charges.map(c => ({
      'Tiểu thương': c.merchant?.hoTen,
      'Mã ki-ốt': c.kiosk?.maKiosk,
      'Số tiền phải thu': c.soTienPhaiThu,
      'Đã thu': c.soTienDaThu,
      'Còn nợ': c.soTienPhaiThu - c.soTienDaThu,
      'Trạng thái': c.trangThai
    }));
  }

  async getCollectorData(tenant_id, fromDate, toDate) {
    const receipts = await Receipt.findAll({
      where: {
        tenant_id,
        thoiGianThu: {
          [Op.between]: [fromDate, toDate]
        }
      },
      include: [{
        model: User,
        as: 'user',
        attributes: ['hoTen']
      }]
    });

    const collectorMap = {};
    receipts.forEach(r => {
      const userId = r.user_id;
      if (!collectorMap[userId]) {
        collectorMap[userId] = {
          'Nhân viên': r.user?.hoTen,
          'Số phiếu': 0,
          'Tiền mặt': 0,
          'Chuyển khoản': 0,
          'Tổng thu': 0
        };
      }
      collectorMap[userId]['Số phiếu']++;
      collectorMap[userId][r.hinhThucThanhToan === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản'] += parseFloat(r.soTienThu);
      collectorMap[userId]['Tổng thu'] += parseFloat(r.soTienThu);
    });

    return Object.values(collectorMap);
  }
}

module.exports = new ReportController();
