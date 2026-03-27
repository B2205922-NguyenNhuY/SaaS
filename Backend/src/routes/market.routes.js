const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/market.controller");

router.post("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.create);
router.put("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.update);
router.patch(
  "/:id/status",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  C.updateStatus,
);
router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR),
  paginate,
  C.list,
);
router.get(
  "/:id",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR),
  C.getById,
);

module.exports = router;
