const router = require("express").Router();
const { verifyToken }    = require("../middlewares/auth.middleware");
const { authorizeRoles } = require("../middlewares/role.middleware");
const { ROLES }          = require("../constants/role");
const paginate           = require("../middlewares/paginate");
const C                  = require("../controllers/merchant.controller");

router.get("/", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), paginate, C.list);
router.post("/", verifyToken, (req, res, next) => { next() }, authorizeRoles(ROLES.TENANT_ADMIN), C.create);
router.get("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN, ROLES.COLLECTOR), C.detail);
router.put("/:id", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.update);
router.patch("/:id/status", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.updateStatus);
router.patch("/:id/password", verifyToken, authorizeRoles(ROLES.TENANT_ADMIN), C.updatePassword);

module.exports = router;