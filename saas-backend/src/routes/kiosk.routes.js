const router = require("express").Router();
const auth = require("../middlewares/auth");
const permission = require("../middlewares/permission");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/kiosk.controller");

router.post("/", auth, permission("CREATE_KIOSK"), C.create); // 29
router.put("/:id", auth, permission("UPDATE_KIOSK"), C.update); // 30
router.patch("/:id/status", auth, permission("LOCK_KIOSK"), C.updateStatus); // 31
router.get("/", auth, permission("VIEW_KIOSK"), paginate, C.list); // 32
router.get("/:id", auth, permission("VIEW_KIOSK"), C.getById); // NEW

module.exports = router;
