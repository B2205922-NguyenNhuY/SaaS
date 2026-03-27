const db = require("../config/db");

exports.createPlan = async (Data) => {
  const { tenGoi, giaTien, moTa, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, stripe_price_id } = Data;

  const [result] = await db.execute(
    "INSERT INTO plan(tenGoi, giaTien, moTa, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, stripe_price_id) VALUES (?,?,?,?,?,?,?)",
    [tenGoi, giaTien, moTa, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, stripe_price_id ?? null]
  );

  return result;
};

exports.getAllPlans = async () => {
  const [rows] = await db.execute("SELECT * FROM plan");
  return rows;
};

exports.getPlanById = async (id) => {
  const [rows] = await db.execute(
    "SELECT * FROM plan WHERE plan_id = ?",
    [id]
  );
  return rows[0];
};

exports.listPlans = async (filters, offset, limit) => {
  let sql = `
    SELECT plan_id, tenGoi, giaTien, trangThai, created_at,
           gioiHanSoCho, gioiHanSoKiosk, gioiHanUser, moTa, stripe_price_id
    FROM plan
    WHERE 1=1
  `;

  const params = [];

  if (filters.keyword) {
    sql += ` AND tenGoi LIKE ?`;
    params.push(`%${filters.keyword}%`);
  }
  if (filters.trangThai) {
    sql += ` AND trangThai = ?`;
    params.push(filters.trangThai);
  }
  if (filters.gia_min) {
    sql += ` AND giaTien >= ?`;
    params.push(filters.gia_min);
  }
  if (filters.gia_max) {
    sql += ` AND giaTien <= ?`;
    params.push(filters.gia_max);
  }

  const allowedSort = ["created_at", "giaTien", "tenGoi"];
  const sortBy = allowedSort.includes(filters.sortBy) ? filters.sortBy : "created_at";
  const sortOrder = filters.sortOrder === "ASC" ? "ASC" : "DESC";

  sql += ` ORDER BY ${sortBy} ${sortOrder}`;
  sql += ` LIMIT ${Number(limit)} OFFSET ${Number(offset)}`;

  const [rows] = await db.execute(sql, params);
  return rows;
};

exports.countPlans = async (filters) => {
  let sql = `SELECT COUNT(*) as total FROM plan WHERE 1=1`;
  const params = [];

  if (filters.keyword) { sql += ` AND tenGoi LIKE ?`; params.push(`%${filters.keyword}%`); }
  if (filters.trangThai) { sql += ` AND trangThai = ?`; params.push(filters.trangThai); }
  if (filters.gia_min) { sql += ` AND giaTien >= ?`; params.push(filters.gia_min); }
  if (filters.gia_max) { sql += ` AND giaTien <= ?`; params.push(filters.gia_max); }

  const [rows] = await db.execute(sql, params);
  return rows[0].total;
};

exports.updatePlan = async (id, data) => {
  const { tenGoi, giaTien, moTa, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, stripe_price_id } = data;

  const [result] = await db.execute(
    "UPDATE plan SET tenGoi=?, giaTien=?, moTa=?, gioiHanSoKiosk=?, gioiHanUser=?, gioiHanSoCho=?, stripe_price_id=? WHERE plan_id=?",
    [tenGoi, giaTien, moTa, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, stripe_price_id ?? null, id]
  );
  return result;
};

exports.checkDuplicate = async (tenGoi) => {
  const [rows] = await db.execute(
    "SELECT plan_id FROM plan WHERE tenGoi = ?",
    [tenGoi]
  );
  return rows;
};

exports.checkDuplicateForUpdate = async (id, tenGoi) => {
  const [rows] = await db.execute(
    "SELECT plan_id FROM plan WHERE tenGoi = ? AND plan_id != ?",
    [tenGoi, id]
  );
  return rows;
};

exports.inactivePlan = async (plan_id) => {
  const [result] = await db.execute(
    "UPDATE plan SET trangThai = 'inactive' WHERE plan_id = ?",
    [plan_id]
  );
  return result;
};

exports.isPlanActive = async (plan_id) => {
  const [rows] = await db.execute(
    "SELECT trangThai FROM plan WHERE plan_id = ?",
    [plan_id]
  );
  return rows[0].trangThai === "active";
};