const router = require("express").Router();
const auth = require("../middlewares/auth");
const permission = require("../middlewares/permission");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/merchant.controller");

router.post("/", auth, permission("CREATE_MERCHANT"), C.create); // 33
router.put("/:id", auth, permission("UPDATE_MERCHANT"), C.update); // 34
router.get("/", auth, permission("VIEW_MERCHANT"), paginate, C.list); // 35
router.get("/:id", auth, permission("VIEW_MERCHANT"), C.detail); // 55

module.exports = router;
