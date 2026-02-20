const express = require("express");
const { auth } = require("../middleware/auth");
const { requirePerm } = require("../middleware/permission");
const c = require("../controllers/kioskType.controller");

const router = express.Router();

router.post("/", auth, requirePerm("CREATE_KIOSK_TYPE"), c.createKioskType); // #27
router.get("/", auth, requirePerm("VIEW_KIOSK_TYPE"), c.listKioskType); // #28

module.exports = router;
