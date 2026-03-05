const reportModel = require("../models/report.model");


// Lấy tổng doanh thu
exports.getTotalRevenue = async (query, user) => {

    const from = query.from;
    const to = query.to;

    return await reportModel.getTotalRevenue(
        user.tenant_id,
        from,
        to
    );
};


// Lấy doanh thu theo zone
exports.getRevenueByZone = async (query, user) => {

    return await reportModel.getRevenueByZone(
        user.tenant_id,
        query.from,
        query.to
    );
};


// Lấy doanh thu theo nhân viên
exports.getRevenueByCollector = async (query, user) => {

    return await reportModel.getRevenueByCollector(
        user.tenant_id,
        query.from,
        query.to
    );
};