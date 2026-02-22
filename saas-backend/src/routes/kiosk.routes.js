const express = require("express");
const { auth } = require("../middleware/auth");
const { requirePerm } = require("../middleware/permission");
const c = require("../controllers/kiosk.controller");

const router = express.Router();

router.post("/", auth, requirePerm("CREATE_KIOSK"), c.createKiosk); // #29
router.put("/:id", auth, requirePerm("UPDATE_KIOSK"), c.updateKiosk); // #30
router.put("/:id/lock", auth, requirePerm("LOCK_KIOSK"), c.lockKiosk); // #31
router.get("/", auth, requirePerm("VIEW_KIOSK"), c.listKiosk); // #32
router.get("/:id", auth, requirePerm("VIEW_KIOSK"), c.getKioskById);

module.exports = router;
