const reportService = require("../services/report.service");
const ExcelJS = require("exceljs");


// Tổng doanh thu
exports.getTotalRevenue = async (req, res, next) => {

    try {

        const data = await reportService.getTotalRevenue(
            req.query,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Doanh thu theo zone
exports.getRevenueByZone = async (req, res, next) => {

    try {

        const data = await reportService.getRevenueByZone(
            req.query,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Doanh thu theo nhân viên
exports.getRevenueByCollector = async (req, res, next) => {

    try {

        const data = await reportService.getRevenueByCollector(
            req.query,
            req.user
        );

        res.json(data);

    } catch (err) {

        next(err);

    }

};


// Export Excel
exports.exportRevenueExcel = async (req, res, next) => {

    try {

        const data = await reportService.getRevenueByZone(
            req.query,
            req.user
        );

        const workbook = new ExcelJS.Workbook();
        const sheet = workbook.addWorksheet("Report");

        sheet.columns = [
            { header: "Khu", key: "tenKhu", width: 20 },
            { header: "Tổng thu", key: "tongThu", width: 20 }
        ];

        data.forEach(row => sheet.addRow(row));

        res.setHeader(
            "Content-Type",
            "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
        );

        res.setHeader(
            "Content-Disposition",
            "attachment; filename=report.xlsx"
        );

        await workbook.xlsx.write(res);

        res.end();

    } catch (err) {

        next(err);

    }

};