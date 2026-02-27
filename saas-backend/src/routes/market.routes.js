const router = require("express").Router();
const auth = require("../middlewares/auth");
const permission = require("../middlewares/permission");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/market.controller");

router.post("/", auth, permission("CREATE_MARKET"), C.create); // 19
router.put("/:id", auth, permission("UPDATE_MARKET"), C.update); // 20
router.patch("/:id/status", auth, permission("LOCK_MARKET"), C.updateStatus); // 21
router.get("/", auth, permission("VIEW_MARKET"), paginate, C.list); // 22

module.exports = router;
