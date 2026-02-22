const { pool } = require("../config/db");
const { z } = require("zod");

const createSchema = z.object({
  tenCho: z.string().min(1),
  diaChi: z.string().optional(),
  dienTich: z.number().int().nonnegative().optional(),
});

const updateSchema = createSchema.partial();

async function createMarket(req, res) {
  const tenant_id = req.user.tenant_id;
  const data = createSchema.parse(req.body);

  // 1. Kiểm tra trùng tên trong cùng một tenant
  const [existing] = await pool.execute(
    `SELECT market_id FROM market WHERE tenant_id = ? AND tenCho = ? LIMIT 1`,
    [tenant_id, data.tenCho],
  );

  if (existing.length > 0) {
    return res.status(409).json({
      message: "Tên chợ này đã tồn tại trong hệ thống của bạn.",
    });
  }

  // 2. Nếu không trùng, tiến hành insert
  const [rs] = await pool.execute(
    `INSERT INTO market (tenant_id, tenCho, diaChi, dienTich, trangThai)
     VALUES (?, ?, ?, ?, 'active')`,
    [tenant_id, data.tenCho, data.diaChi ?? null, data.dienTich ?? null],
  );

  res.status(201).json({ market_id: rs.insertId });
}

async function updateMarket(req, res) {
  const tenant_id = req.user.tenant_id;
  const market_id = Number(req.params.id);
  const data = updateSchema.parse(req.body);

  const fields = [];
  const values = [];
  for (const k of ["tenCho", "diaChi", "dienTich"]) {
    if (data[k] !== undefined) {
      fields.push(`${k}=?`);
      values.push(data[k]);
    }
  }
  if (!fields.length) return res.json({ success: true });

  values.push(tenant_id, market_id);
  const [rs] = await pool.execute(
    `UPDATE market SET ${fields.join(", ")} WHERE tenant_id=? AND market_id=?`,
    values,
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Market not found" });
  res.json({ success: true });
}

async function lockMarket(req, res) {
  const tenant_id = req.user.tenant_id;
  const market_id = Number(req.params.id);
  const locked = req.body?.locked ?? true;

  const [rs] = await pool.execute(
    `UPDATE market SET trangThai=? WHERE tenant_id=? AND market_id=?`,
    [locked ? "locked" : "active", tenant_id, market_id],
  );
  if (rs.affectedRows === 0)
    return res.status(404).json({ message: "Market not found" });
  res.json({ success: true, locked: !!locked });
}

async function listMarket(req, res) {
  const tenant_id = req.user.tenant_id;
  const q = req.query.q ? `%${req.query.q}%` : null;

  // Sử dụng LEFT JOIN và GROUP BY để đếm số lượng kiosk
  const [rows] = await pool.execute(
    `SELECT 
        m.market_id, 
        m.tenCho, 
        m.diaChi, 
        m.dienTich, 
        m.trangThai,
        COUNT(k.kiosk_id) AS tongSoKiosk
     FROM market m
     LEFT JOIN zone z ON m.market_id = z.market_id
     LEFT JOIN kiosk k ON z.zone_id = k.zone_id
     WHERE m.tenant_id = ? 
       AND (? IS NULL OR m.tenCho LIKE ?)
     GROUP BY m.market_id
     ORDER BY m.market_id DESC`,
    [tenant_id, q, q],
  );

  res.json(rows);
}

async function getMarketById(req, res) {
  const tenant_id = req.user.tenant_id;
  const market_id = Number(req.params.id);

  const [rows] = await pool.execute(
    `SELECT market_id, tenCho, diaChi, dienTich, trangThai 
     FROM market 
     WHERE tenant_id = ? AND market_id = ?`,
    [tenant_id, market_id],
  );

  if (rows.length === 0)
    return res.status(404).json({ message: "Market not found" });

  res.json(rows[0]);
}

module.exports = {
  createMarket,
  updateMarket,
  lockMarket,
  listMarket,
  getMarketById,
};
