const router = require("express").Router();
const { verifyToken } = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES } = require("../constants/role");
const paginate = require("../middlewares/paginate");
const C = require("../controllers/kioskAssignment.controller");

router.post("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.assign);

router.get(
  "/",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  paginate,
  C.list,
);

router.get("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.getById);

router.post(
  "/:id/ended",
  verifyToken,
  authorizeRoles(ROLES.TENANT_ADMIN),
  C.endAssignment,
);

module.exports = router;
