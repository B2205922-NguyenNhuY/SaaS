const db = require("../config/database");
exports.createPlan = async ({
  tenGoi,
  giaTien,
  gioiHanSoKiosk,
  gioiHanUser,
  gioiHanSoCho,
  moTa,
}) => {
  const [result] = await db.execute(
    "INSERT INTO plan(tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, moTa) VALUES (?,?,?,?,?,?)",
    [tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, moTa ?? null],
  );
  return result;
};
exports.getAllPlans = async (pagination, q) => {
  const where = ["1=1"];
  const params = [];
  if (q?.q) {
    where.push("(tenGoi LIKE ? OR moTa LIKE ?)");
    params.push(`%${q.q}%`, `%${q.q}%`);
  }
  const [[{ total }]] = await db.query(
    `SELECT COUNT(*) total FROM plan WHERE ${where.join(" AND ")}`,
    params,
  );
  const [rows] = await db.query(
    `SELECT * FROM plan WHERE ${where.join(" AND ")} ORDER BY created_at DESC LIMIT ? OFFSET ?`,
    [...params, pagination.limit, pagination.offset],
  );
  return {
    data: rows,
    meta: {
      page: pagination.page,
      limit: pagination.limit,
      total,
      totalPages: Math.ceil(total / pagination.limit) || 0,
    },
  };
};
exports.getPlanById = async (id) => {
  const [rows] = await db.execute("SELECT * FROM plan WHERE plan_id = ?", [id]);
  return rows[0];
};
exports.updateStatus = async (id, trangThai) => {
  const [result] = await db.execute(
    "UPDATE plan SET trangThai = ?, updated_at = CURRENT_TIMESTAMP WHERE plan_id = ?",
    [trangThai, id],
  );
  return result;
};
exports.checkDuplicate = async (tenGoi) => {
  const [rows] = await db.execute("SELECT plan_id FROM plan WHERE tenGoi = ?", [
    tenGoi,
  ]);
  return rows;
};
exports.checkDuplicateForUpdate = async (id, tenGoi) => {
  const [rows] = await db.execute(
    "SELECT plan_id FROM plan WHERE tenGoi = ? AND plan_id <> ?",
    [tenGoi, id],
  );
  return rows;
};
exports.updatePlan = async (id, data) => {
  const { tenGoi, giaTien, gioiHanSoKiosk, gioiHanUser, gioiHanSoCho, moTa } =
    data;

  const [result] = await db.execute(
    `UPDATE plan 
     SET tenGoi = ?, 
         giaTien = ?, 
         gioiHanSoKiosk = ?, 
         gioiHanUser = ?, 
         gioiHanSoCho = ?, 
         moTa = ?,
         updated_at = CURRENT_TIMESTAMP 
     WHERE plan_id = ?`,
    [
      tenGoi,
      giaTien,
      gioiHanSoKiosk,
      gioiHanUser,
      gioiHanSoCho,
      moTa ?? null,
      id,
    ],
  );
  return result;
};
