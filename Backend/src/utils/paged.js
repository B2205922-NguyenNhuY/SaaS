const db = require("../config/db");

async function queryPage(countSql, listSql, params, pg) {
  const [[{ total }]] = await db.query(countSql, params);
  const [rows] = await db.query(listSql, [...params, pg.limit, pg.offset]);
  return {
    data: rows,
    meta: {
      page: pg.page,
      limit: pg.limit,
      total,
      totalPages: Math.ceil(total / pg.limit) || 0,
    },
  };
}

module.exports = { queryPage };
