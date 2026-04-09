const db = require("../config/db");
const ExcelJS = require("exceljs");
const reportModel = require("../models/report.model");

async function getSummary(query, user) {
  const from = query.from || "1970-01-01";
  const to = query.to || "2999-12-31";
  return await reportModel.getFullReport(user.tenant_id, from, to);
}

exports.getReport = async (req, res, next) => {
  try {
    res.json(await getSummary(req.query, req.user));
  } catch (err) {
    next(err);
  }
};

exports.getTotalRevenue = async (req, res, next) => {
  try {
    const from = req.query.from || "1970-01-01";
    const to = req.query.to || "2999-12-31";
    const result = await reportModel.getTotalRevenue(req.user.tenant_id, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueByMarket = async (req, res, next) => {
  try {
    const from = req.query.from || "1970-01-01";
    const to = req.query.to || "2999-12-31";
    const result = await reportModel.getRevenueByMarket(req.user.tenant_id, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueByZone = async (req, res, next) => {
  try {
    const from = req.query.from || "1970-01-01";
    const to = req.query.to || "2999-12-31";
    const result = await reportModel.getRevenueByZone(req.user.tenant_id, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueByCollector = async (req, res, next) => {
  try {
    const from = req.query.from || "1970-01-01";
    const to = req.query.to || "2999-12-31";
    const result = await reportModel.getRevenueByCollector(req.user.tenant_id, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueByStripe = async (req, res, next) => {
  try {
    const from = req.query.from || "1970-01-01";
    const to = req.query.to || "2999-12-31";
    const result = await reportModel.getRevenueByStripe(req.user.tenant_id, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.getRevenueByCash = async (req, res, next) => {
  try {
    const from = req.query.from || "1970-01-01";
    const to = req.query.to || "2999-12-31";
    const result = await reportModel.getRevenueByCash(req.user.tenant_id, from, to);
    res.json(result);
  } catch (err) {
    next(err);
  }
};

exports.exportRevenueExcel = async (req, res, next) => {
  try {
    const data = await getSummary(req.query, req.user);
    const workbook = new ExcelJS.Workbook();
    
    const sheet1 = workbook.addWorksheet("Tổng quan");
    sheet1.columns = [
      { header: "Chỉ tiêu", key: "title", width: 30 },
      { header: "Giá trị", key: "value", width: 25 },
    ];
    sheet1.addRow({ title: "Tổng doanh thu", value: data.tongThu });
    sheet1.addRow({ title: "Doanh thu chuyển khoản", value: data.tongThuChuyenKhoan });
    sheet1.addRow({ title: "Doanh thu tiền mặt", value: data.tongThuTienMat });
    
    const sheet2 = workbook.addWorksheet("Theo chợ");
    sheet2.columns = [
      { header: "Chợ", key: "tenCho", width: 30 },
      { header: "Doanh thu", key: "tongThu", width: 25 },
    ];
    data.theoCho.forEach((row) => sheet2.addRow(row));
    
    const sheet3 = workbook.addWorksheet("Theo khu vực");
    sheet3.columns = [
      { header: "Khu vực", key: "tenKhu", width: 30 },
      { header: "Doanh thu", key: "tongThu", width: 25 },
    ];
    data.theoKhu.forEach((row) => sheet3.addRow(row));
    
    const sheet4 = workbook.addWorksheet("Theo nhân viên");
    sheet4.columns = [
      { header: "Nhân viên", key: "hoTen", width: 30 },
      { header: "Doanh thu", key: "tongThu", width: 25 },
    ];
    data.theoNhanVien.forEach((row) => sheet4.addRow(row));
    
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};