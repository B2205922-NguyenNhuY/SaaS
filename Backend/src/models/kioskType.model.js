const db = require("../config/db");

exports.existsTypeName = async (tenLoai, excludeId = null) => {

  const params = [tenLoai];

  let sql = `
    SELECT type_id
    FROM kiosk_type
    WHERE tenLoai = ?
  `;

  if (excludeId) {
    sql += " AND type_id <> ?";
    params.push(excludeId);
  }

  const [rows] = await db.query(sql + " LIMIT 1", params);

  return rows.length > 0;
};

exports.create = async (tenLoai, moTa) => {

  const [r] = await db.query(
    `INSERT INTO kiosk_type (tenLoai, moTa)
     VALUES (?, ?)`,
    [tenLoai, moTa]
  );

  return r.insertId;
};

exports.update = async (type_id, tenLoai, moTa) => {

  const [r] = await db.query(
    `UPDATE kiosk_type
     SET tenLoai = COALESCE(?, tenLoai),
         moTa = COALESCE(?, moTa)
     WHERE type_id = ?`,
    [tenLoai, moTa, type_id]
  );

  return r.affectedRows;
};

exports.count = async (whereSQL, params) => {

  const [[row]] = await db.query(
    `SELECT COUNT(*) total
     FROM kiosk_type
     WHERE ${whereSQL}`,
    params
  );

  return row.total;
};

exports.list = async (whereSQL, params, sort, order, limit, offset) => {

  const [rows] = await db.query(
    `SELECT *
     FROM kiosk_type
     WHERE ${whereSQL}
     ORDER BY ${sort} ${order}
     LIMIT ? OFFSET ?`,
    [...params, limit, offset]
  );

  return rows;
};

exports.getById = async (type_id) => {
  const [rows] = await db.query(
    `SELECT *
     FROM kiosk_type
     WHERE type_id = ?
     LIMIT 1`,
    [type_id]
  );

  return rows[0] || null;
};