const router = require("express").Router();
const auth = require("../middlewares/auth");
const permission = require("../middlewares/permission");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/kioskType.controller");

router.post("/", auth, permission("CREATE_KIOSK_TYPE"), C.create); // 27
router.put("/:id", auth, permission("UPDATE_KIOSK_TYPE"), C.update); // NEW
router.get("/", auth, permission("VIEW_KIOSK_TYPE"), paginate, C.list); // 28

module.exports = router;
