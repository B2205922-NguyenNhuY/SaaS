const reportModel = require("../models/report.model");
const db = require("../config/database");

// Lấy tổng doanh thu
exports.getTotalRevenue = async (query, user) => {
  if (!query.from || !query.to) {
    throw new Error("from and to date required");
  }

  return await reportModel.getTotalRevenue(
    user.tenant_id,
    query.from,
    query.to,
  );
};

// Lấy doanh thu theo zone
exports.getRevenueByZone = async (query, user) => {
  if (!query.from || !query.to) {
    throw new Error("from and to date required");
  }

  return await reportModel.getRevenueByZone(
    user.tenant_id,
    query.from,
    query.to,
  );
};

// Lấy doanh thu theo nhân viên
exports.getRevenueByCollector = async (query, user) => {
  if (!query.from || !query.to) {
    throw new Error("from and to date required");
  }

  return await reportModel.getRevenueByCollector(
    user.tenant_id,
    query.from,
    query.to,
  );
};
