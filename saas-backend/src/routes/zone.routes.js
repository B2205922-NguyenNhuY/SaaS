const express = require("express");
const { auth } = require("../middleware/auth");
const { requirePerm } = require("../middleware/permission");
const c = require("../controllers/zone.controller");

const router = express.Router();

router.post("/", auth, requirePerm("CREATE_ZONE"), c.createZone); // #23
router.put("/:id", auth, requirePerm("UPDATE_ZONE"), c.updateZone); // #24
router.put("/:id/lock", auth, requirePerm("LOCK_ZONE"), c.lockZone); // #25
router.get("/", auth, requirePerm("VIEW_ZONE"), c.listZone); // #26

module.exports = router;
