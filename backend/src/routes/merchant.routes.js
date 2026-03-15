const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/merchant.controller");

router.post("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.create);

router.put("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.update);

router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  paginate,
  C.list,
);

router.get("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.detail);

router.patch(
  "/:id/inactive",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  C.updateStatus,
);
module.exports = router;
