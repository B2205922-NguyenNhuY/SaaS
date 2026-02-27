const router = require("express").Router();
const auth = require("../middlewares/auth");
const permission = require("../middlewares/permission");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/zone.controller");

router.post("/", auth, permission("CREATE_ZONE"), C.create); // 23
router.put("/:id", auth, permission("UPDATE_ZONE"), C.update); // 24
router.patch("/:id/status", auth, permission("LOCK_ZONE"), C.updateStatus); // 25
router.get("/", auth, permission("VIEW_ZONE"), paginate, C.list); // 26

module.exports = router;
