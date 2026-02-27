const router = require("express").Router();
const auth = require("../middlewares/auth");
const permission = require("../middlewares/permission");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/kioskAssignment.controller");

router.post("/", auth, permission("ASSIGN_KIOSK"), C.assign); // POST create active
router.put("/:id/end", auth, permission("ASSIGN_KIOSK"), C.end); // PUT end => ended + ngayKetThuc auto
router.get("/", auth, permission("ASSIGN_KIOSK"), paginate, C.list); // list

module.exports = router;
