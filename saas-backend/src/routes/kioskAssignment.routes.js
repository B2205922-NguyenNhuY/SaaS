const express = require("express");
const { auth } = require("../middleware/auth");
const { requirePerm } = require("../middleware/permission");
const c = require("../controllers/kioskAssignment.controller");

const router = express.Router();

router.post("/", auth, requirePerm("ASSIGN_KIOSK"), c.assignKiosk); // #36
router.put(
  "/:id/terminate",
  auth,
  requirePerm("ASSIGN_KIOSK"),
  c.terminateAssignment,
);
router.get("/", auth, requirePerm("VIEW_ASSIGNMENT"), c.listAssignments);

module.exports = router;
