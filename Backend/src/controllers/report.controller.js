const db = require("../config/db");
const ExcelJS = require("exceljs");

async function getSummary(query, user) {
  const from = query.from || "1970-01-01";
  const to = query.to || "2999-12-31";
  const [[totalRevenue]] = await db.query(
    `SELECT COALESCE(SUM(soTienThu),0) tongThu FROM receipt WHERE tenant_id = ? AND DATE(thoiGianThu) BETWEEN ? AND ?`,
    [user.tenant_id, from, to],
  );
  const [byZone] = await db.query(
    `SELECT z.zone_id, z.tenKhu, COALESCE(SUM(rc.soTienDaTra),0) tongThu FROM receipt_charge rc JOIN charge c ON c.charge_id = rc.charge_id AND c.tenant_id = rc.tenant_id JOIN kiosk k ON k.kiosk_id = c.kiosk_id AND k.tenant_id = c.tenant_id JOIN zone z ON z.zone_id = k.zone_id AND z.tenant_id = k.tenant_id WHERE rc.tenant_id = ? AND EXISTS (SELECT 1 FROM receipt r WHERE r.receipt_id = rc.receipt_id AND r.tenant_id = rc.tenant_id AND DATE(r.thoiGianThu) BETWEEN ? AND ?) GROUP BY z.zone_id, z.tenKhu ORDER BY tongThu DESC`,
    [user.tenant_id, from, to],
  );
  const [byCollector] = await db.query(
    `SELECT u.user_id, u.hoTen, COALESCE(SUM(r.soTienThu),0) tongThu FROM receipt r LEFT JOIN users u ON u.user_id = r.user_id AND u.tenant_id = r.tenant_id WHERE r.tenant_id = ? AND DATE(r.thoiGianThu) BETWEEN ? AND ? GROUP BY u.user_id, u.hoTen ORDER BY tongThu DESC`,
    [user.tenant_id, from, to],
  );
  return {
    from,
    to,
    tongThu: totalRevenue.tongThu,
    theoKhu: byZone,
    theoNhanVien: byCollector,
  };
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
    res.json((await getSummary(req.query, req.user)).tongThu);
  } catch (err) {
    next(err);
  }
};
exports.getRevenueByZone = async (req, res, next) => {
  try {
    res.json((await getSummary(req.query, req.user)).theoKhu);
  } catch (err) {
    next(err);
  }
};
exports.getRevenueByCollector = async (req, res, next) => {
  try {
    res.json((await getSummary(req.query, req.user)).theoNhanVien);
  } catch (err) {
    next(err);
  }
};
exports.exportRevenueExcel = async (req, res, next) => {
  try {
    const data = await getSummary(req.query, req.user);
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report");
    sheet.columns = [
      { header: "Khu", key: "tenKhu", width: 20 },
      { header: "Tổng thu", key: "tongThu", width: 20 },
    ];
    data.theoKhu.forEach((row) => sheet.addRow(row));
    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
    );
    res.setHeader("Content-Disposition", "attachment; filename=report.xlsx");
    await workbook.xlsx.write(res);
    res.end();
  } catch (err) {
    next(err);
  }
};
