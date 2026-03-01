const { PaymentTransaction, Charge, Shift, Kiosk, Merchant, User } = require('../models');
const AppError = require('../utils/AppError');
const catchAsync = require('../utils/catchAsync');
const { successResponse } = require('../utils/responseHandler');
const { Op } = require('sequelize');
const moment = require('moment');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

// @desc    Xuất báo cáo ra file Excel
// @route   GET /api/reports/export/excel
// @access  Private
const exportToExcel = catchAsync(async (req, res, next) => {
  const { type, start_date, end_date, format = 'excel' } = req.query;

  const start = start_date ? moment(start_date).startOf('day').toDate() : moment().startOf('month').toDate();
  const end = end_date ? moment(end_date).endOf('day').toDate() : moment().endOf('month').toDate();

  let data;
  let workbook = new ExcelJS.Workbook();
  workbook.creator = 'Market SaaS';
  workbook.lastModifiedBy = req.user.hoTen;
  workbook.created = new Date();
  workbook.modified = new Date();

  switch (type) {
    case 'collection':
      data = await exportCollectionReport(req.user.tenant_id, start, end);
      await createCollectionExcelSheet(workbook, data, start, end);
      break;
    case 'debt':
      data = await exportDebtReport(req.user.tenant_id);
      await createDebtExcelSheet(workbook, data);
      break;
    case 'shift':
      data = await exportShiftReport(req.user.tenant_id, start, end);
      await createShiftExcelSheet(workbook, data, start, end);
      break;
    default:
      return next(new AppError('Loại báo cáo không hợp lệ', 400));
  }

  // Set response headers
  res.setHeader(
    'Content-Type',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
  );
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=bao-cao-${type}-${moment().format('YYYYMMDD')}.xlsx`
  );

  await workbook.xlsx.write(res);
  res.end();
});

// @desc    Xuất báo cáo ra file PDF
// @route   GET /api/reports/export/pdf
// @access  Private
const exportToPDF = catchAsync(async (req, res, next) => {
  const { type, start_date, end_date } = req.query;

  const start = start_date ? moment(start_date).startOf('day').toDate() : moment().startOf('month').toDate();
  const end = end_date ? moment(end_date).endOf('day').toDate() : moment().endOf('month').toDate();

  let data;
  const doc = new PDFDocument({ margin: 50, size: 'A4' });

  res.setHeader('Content-Type', 'application/pdf');
  res.setHeader(
    'Content-Disposition',
    `attachment; filename=bao-cao-${type}-${moment().format('YYYYMMDD')}.pdf`
  );

  doc.pipe(res);

  switch (type) {
    case 'collection':
      data = await exportCollectionReport(req.user.tenant_id, start, end);
      await createCollectionPDF(doc, data, start, end);
      break;
    case 'debt':
      data = await exportDebtReport(req.user.tenant_id);
      await createDebtPDF(doc, data);
      break;
    default:
      return next(new AppError('Loại báo cáo không hợp lệ', 400));
  }

  doc.end();
});

// Helper functions for data export
const exportCollectionReport = async (tenant_id, start, end) => {
  const payments = await PaymentTransaction.findAll({
    where: {
      tenant_id,
      created_at: { [Op.between]: [start, end] }
    },
    include: [
      {
        model: User,
        as: 'collector',
        attributes: ['user_id', 'hoTen']
      },
      {
        model: Charge,
        as: 'charge',
        include: [
          {
            model: Kiosk,
            as: 'kiosk'
          },
          {
            model: Merchant,
            as: 'merchant'
          }
        ]
      }
    ],
    order: [['created_at', 'ASC']]
  });

  const summary = {
    totalPayments: payments.length,
    totalAmount: payments.reduce((sum, p) => sum + parseFloat(p.soTien), 0),
    totalCash: payments.filter(p => p.hinhThucThu === 'tien_mat').reduce((sum, p) => sum + parseFloat(p.soTien), 0),
    totalBank: payments.filter(p => p.hinhThucThu === 'chuyen_khoan').reduce((sum, p) => sum + parseFloat(p.soTien), 0),
    byCollector: {}
  };

  payments.forEach(p => {
    const collectorId = p.collector.user_id;
    if (!summary.byCollector[collectorId]) {
      summary.byCollector[collectorId] = {
        name: p.collector.hoTen,
        amount: 0,
        count: 0
      };
    }
    summary.byCollector[collectorId].amount += parseFloat(p.soTien);
    summary.byCollector[collectorId].count++;
  });

  return { payments, summary };
};

const exportDebtReport = async (tenant_id) => {
  const debts = await Charge.findAll({
    where: {
      tenant_id,
      soTienConNo: { [Op.gt]: 0 }
    },
    include: [
      {
        model: Kiosk,
        as: 'kiosk'
      },
      {
        model: Merchant,
        as: 'merchant'
      }
    ],
    order: [['soTienConNo', 'DESC']]
  });

  const summary = {
    totalDebt: debts.reduce((sum, d) => sum + parseFloat(d.soTienConNo), 0),
    totalCharges: debts.length,
    byMerchant: {}
  };

  debts.forEach(d => {
    const merchantId = d.merchant.merchant_id;
    if (!summary.byMerchant[merchantId]) {
      summary.byMerchant[merchantId] = {
        name: d.merchant.hoTen,
        debt: 0,
        count: 0
      };
    }
    summary.byMerchant[merchantId].debt += parseFloat(d.soTienConNo);
    summary.byMerchant[merchantId].count++;
  });

  return { debts, summary };
};

const exportShiftReport = async (tenant_id, start, end) => {
  const shifts = await Shift.findAll({
    where: {
      tenant_id,
      thoiGianBatDauCa: { [Op.between]: [start, end] }
    },
    include: [
      {
        model: User,
        as: 'user',
        attributes: ['user_id', 'hoTen']
      }
    ],
    order: [['thoiGianBatDauCa', 'DESC']]
  });

  return { shifts };
};

// Excel sheet creators
const createCollectionExcelSheet = async (workbook, data, start, end) => {
  const sheet = workbook.addWorksheet('Báo cáo thu');

  // Title
  sheet.mergeCells('A1:G1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = `BÁO CÁO THU PHÍ`;
  titleRow.getCell(1).font = { size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: 'center' };

  // Period
  sheet.mergeCells('A2:G2');
  sheet.getRow(2).getCell(1).value = `Từ ngày: ${moment(start).format('DD/MM/YYYY')} - Đến ngày: ${moment(end).format('DD/MM/YYYY')}`;
  sheet.getRow(2).getCell(1).alignment = { horizontal: 'center' };

  // Summary
  sheet.getRow(4).values = ['TỔNG KẾT:'];
  sheet.getRow(4).getCell(1).font = { bold: true };
  
  sheet.getRow(5).values = ['Tổng số giao dịch:', data.summary.totalPayments];
  sheet.getRow(6).values = ['Tổng tiền mặt:', data.summary.totalCash.toLocaleString() + ' VNĐ'];
  sheet.getRow(7).values = ['Tổng chuyển khoản:', data.summary.totalBank.toLocaleString() + ' VNĐ'];
  sheet.getRow(8).values = ['Tổng thu:', data.summary.totalAmount.toLocaleString() + ' VNĐ'];

  // By collector
  sheet.getRow(10).values = ['THU THEO NHÂN VIÊN:'];
  sheet.getRow(10).getCell(1).font = { bold: true };

  sheet.getRow(11).values = ['STT', 'Nhân viên', 'Số giao dịch', 'Số tiền'];
  sheet.getRow(11).font = { bold: true };
  sheet.getRow(11).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  let rowIndex = 12;
  Object.values(data.summary.byCollector).forEach((collector, index) => {
    sheet.getRow(rowIndex).values = [
      index + 1,
      collector.name,
      collector.count,
      collector.amount.toLocaleString() + ' VNĐ'
    ];
    rowIndex++;
  });

  // Details
  sheet.getRow(rowIndex + 2).values = ['CHI TIẾT GIAO DỊCH:'];
  sheet.getRow(rowIndex + 2).getCell(1).font = { bold: true };

  sheet.getRow(rowIndex + 3).values = [
    'STT', 'Thời gian', 'Nhân viên', 'Kiosk', 'Tiểu thương',
    'Hình thức', 'Số tiền'
  ];
  sheet.getRow(rowIndex + 3).font = { bold: true };
  sheet.getRow(rowIndex + 3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  data.payments.forEach((p, index) => {
    sheet.getRow(rowIndex + 4 + index).values = [
      index + 1,
      moment(p.created_at).format('DD/MM/YYYY HH:mm'),
      p.collector.hoTen,
      p.charge.kiosk?.maKiosk || '',
      p.charge.merchant?.hoTen || '',
      p.hinhThucThu === 'tien_mat' ? 'Tiền mặt' : 'Chuyển khoản',
      parseFloat(p.soTien).toLocaleString() + ' VNĐ'
    ];
  });

  // Auto width
  sheet.columns.forEach(column => {
    column.width = 20;
  });
};

const createDebtExcelSheet = async (workbook, data) => {
  const sheet = workbook.addWorksheet('Công nợ');

  // Title
  sheet.mergeCells('A1:F1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = `BÁO CÁO CÔNG NỢ`;
  titleRow.getCell(1).font = { size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: 'center' };

  sheet.getRow(3).values = ['Ngày xuất báo cáo:', moment().format('DD/MM/YYYY HH:mm')];

  // Summary
  sheet.getRow(5).values = ['TỔNG KẾT:'];
  sheet.getRow(5).getCell(1).font = { bold: true };
  
  sheet.getRow(6).values = ['Tổng số khoản nợ:', data.summary.totalCharges];
  sheet.getRow(7).values = ['Tổng nợ:', data.summary.totalDebt.toLocaleString() + ' VNĐ'];

  // By merchant
  sheet.getRow(9).values = ['NỢ THEO TIỂU THƯƠNG:'];
  sheet.getRow(9).getCell(1).font = { bold: true };

  sheet.getRow(10).values = ['STT', 'Tiểu thương', 'Số khoản nợ', 'Tổng nợ'];
  sheet.getRow(10).font = { bold: true };
  sheet.getRow(10).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  let rowIndex = 11;
  Object.values(data.summary.byMerchant).forEach((merchant, index) => {
    sheet.getRow(rowIndex).values = [
      index + 1,
      merchant.name,
      merchant.count,
      merchant.debt.toLocaleString() + ' VNĐ'
    ];
    rowIndex++;
  });

  // Details
  sheet.getRow(rowIndex + 2).values = ['CHI TIẾT CÔNG NỢ:'];
  sheet.getRow(rowIndex + 2).getCell(1).font = { bold: true };

  sheet.getRow(rowIndex + 3).values = [
    'STT', 'Kỳ thu', 'Kiosk', 'Tiểu thương',
    'Số tiền', 'Đã thu', 'Còn nợ', 'Ngày tạo'
  ];
  sheet.getRow(rowIndex + 3).font = { bold: true };
  sheet.getRow(rowIndex + 3).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  data.debts.forEach((d, index) => {
    sheet.getRow(rowIndex + 4 + index).values = [
      index + 1,
      d.period?.tenKyThu || '',
      d.kiosk?.maKiosk || '',
      d.merchant?.hoTen || '',
      parseFloat(d.soTien).toLocaleString() + ' VNĐ',
      parseFloat(d.soTienDaThu).toLocaleString() + ' VNĐ',
      parseFloat(d.soTienConNo).toLocaleString() + ' VNĐ',
      moment(d.created_at).format('DD/MM/YYYY')
    ];
  });

  sheet.columns.forEach(column => {
    column.width = 18;
  });
};

const createShiftExcelSheet = async (workbook, data, start, end) => {
  const sheet = workbook.addWorksheet('Ca thu');

  // Title
  sheet.mergeCells('A1:G1');
  const titleRow = sheet.getRow(1);
  titleRow.getCell(1).value = `BÁO CÁO CA THU`;
  titleRow.getCell(1).font = { size: 16, bold: true };
  titleRow.getCell(1).alignment = { horizontal: 'center' };

  // Period
  sheet.mergeCells('A2:G2');
  sheet.getRow(2).getCell(1).value = `Từ ngày: ${moment(start).format('DD/MM/YYYY')} - Đến ngày: ${moment(end).format('DD/MM/YYYY')}`;

  // Details
  sheet.getRow(4).values = [
    'STT', 'Nhân viên', 'Bắt đầu ca', 'Kết thúc ca',
    'Tiền mặt', 'Chuyển khoản', 'Tổng thu', 'Trạng thái'
  ];
  sheet.getRow(4).font = { bold: true };
  sheet.getRow(4).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFE0E0E0' }
  };

  data.shifts.forEach((s, index) => {
    const trangThai = s.trangThaiDoiSoat === 'da_doi_soat' ? 'Đã đối soát' :
                     s.trangThaiDoiSoat === 'co_sai_lech' ? 'Có sai lệch' : 'Chưa đối soát';

    sheet.getRow(5 + index).values = [
      index + 1,
      s.user.hoTen,
      moment(s.thoiGianBatDauCa).format('DD/MM/YYYY HH:mm'),
      s.thoiGianKetThucCa ? moment(s.thoiGianKetThucCa).format('DD/MM/YYYY HH:mm') : 'Chưa kết thúc',
      parseFloat(s.tongTienMatThuDuoc).toLocaleString() + ' VNĐ',
      parseFloat(s.tongChuyenKhoanThuDuoc).toLocaleString() + ' VNĐ',
      (parseFloat(s.tongTienMatThuDuoc) + parseFloat(s.tongChuyenKhoanThuDuoc)).toLocaleString() + ' VNĐ',
      trangThai
    ];
  });

  sheet.columns.forEach(column => {
    column.width = 18;
  });
};

// PDF creators
const createCollectionPDF = async (doc, data, start, end) => {
  // Title
  doc.fontSize(20).text('BÁO CÁO THU PHÍ', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Từ ngày: ${moment(start).format('DD/MM/YYYY')} - Đến ngày: ${moment(end).format('DD/MM/YYYY')}`, { align: 'center' });
  doc.moveDown(2);

  // Summary
  doc.fontSize(14).text('TỔNG KẾT', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Tổng số giao dịch: ${data.summary.totalPayments}`);
  doc.text(`Tổng tiền mặt: ${data.summary.totalCash.toLocaleString()} VNĐ`);
  doc.text(`Tổng chuyển khoản: ${data.summary.totalBank.toLocaleString()} VNĐ`);
  doc.text(`Tổng thu: ${data.summary.totalAmount.toLocaleString()} VNĐ`);
  doc.moveDown();

  // By collector
  doc.fontSize(14).text('THU THEO NHÂN VIÊN', { underline: true });
  doc.moveDown(0.5);
  
  const collectorTable = {
    headers: ['Nhân viên', 'Số GD', 'Số tiền'],
    rows: Object.values(data.summary.byCollector).map(c => [
      c.name,
      c.count.toString(),
      c.amount.toLocaleString() + ' VNĐ'
    ])
  };

  drawTable(doc, collectorTable);
  doc.moveDown();

  // Recent transactions
  doc.fontSize(14).text('GIAO DỊCH GẦN ĐÂY', { underline: true });
  doc.moveDown(0.5);

  const recentTransactions = data.payments.slice(0, 20);
  const transactionTable = {
    headers: ['Thời gian', 'NV', 'Kiosk', 'Hình thức', 'Số tiền'],
    rows: recentTransactions.map(p => [
      moment(p.created_at).format('DD/MM/YYYY'),
      p.collector.hoTen,
      p.charge.kiosk?.maKiosk || '',
      p.hinhThucThu === 'tien_mat' ? 'TM' : 'CK',
      parseFloat(p.soTien).toLocaleString() + ' VNĐ'
    ])
  };

  drawTable(doc, transactionTable);
};

const createDebtPDF = async (doc, data) => {
  // Title
  doc.fontSize(20).text('BÁO CÁO CÔNG NỢ', { align: 'center' });
  doc.moveDown();
  doc.fontSize(12).text(`Ngày xuất: ${moment().format('DD/MM/YYYY HH:mm')}`, { align: 'center' });
  doc.moveDown(2);

  // Summary
  doc.fontSize(14).text('TỔNG KẾT', { underline: true });
  doc.moveDown(0.5);
  doc.fontSize(12).text(`Tổng số khoản nợ: ${data.summary.totalCharges}`);
  doc.text(`Tổng nợ: ${data.summary.totalDebt.toLocaleString()} VNĐ`);
  doc.moveDown();

  // Top debtors
  doc.fontSize(14).text('TOP 10 TIỂU THƯƠNG NỢ NHIỀU NHẤT', { underline: true });
  doc.moveDown(0.5);

  const topDebtors = Object.values(data.summary.byMerchant)
    .sort((a, b) => b.debt - a.debt)
    .slice(0, 10);

  const debtorTable = {
    headers: ['Tiểu thương', 'Số khoản', 'Tổng nợ'],
    rows: topDebtors.map(d => [
      d.name,
      d.count.toString(),
      d.debt.toLocaleString() + ' VNĐ'
    ])
  };

  drawTable(doc, debtorTable);
  doc.moveDown();

  // Recent debts
  doc.fontSize(14).text('KHOẢN NỢ LỚN NHẤT', { underline: true });
  doc.moveDown(0.5);

  const topDebts = data.debts.slice(0, 15);
  const debtTable = {
    headers: ['Kiosk', 'Tiểu thương', 'Số tiền', 'Còn nợ'],
    rows: topDebts.map(d => [
      d.kiosk?.maKiosk || '',
      d.merchant?.hoTen || '',
      parseFloat(d.soTien).toLocaleString() + ' VNĐ',
      parseFloat(d.soTienConNo).toLocaleString() + ' VNĐ'
    ])
  };

  drawTable(doc, debtTable);
};

// Helper function to draw tables in PDF
const drawTable = (doc, table) => {
  const startX = 50;
  let startY = doc.y;
  const columnWidth = 100;

  // Draw headers
  doc.font('Helvetica-Bold');
  table.headers.forEach((header, i) => {
    doc.text(header, startX + (i * columnWidth), startY);
  });

  // Draw rows
  doc.font('Helvetica');
  table.rows.forEach((row, rowIndex) => {
    startY = doc.y + 20;
    row.forEach((cell, cellIndex) => {
      doc.text(cell, startX + (cellIndex * columnWidth), startY + (rowIndex * 20));
    });
  });

  doc.y = startY + (table.rows.length * 20) + 10;
};

module.exports = {
  exportToExcel,
  exportToPDF
};