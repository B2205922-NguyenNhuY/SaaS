const express = require("express");

const marketRoutes = require("./market.routes");
const zoneRoutes = require("./zone.routes");
const kioskTypeRoutes = require("./kioskType.routes");
const kioskRoutes = require("./kiosk.routes");
const merchantRoutes = require("./merchant.routes");
const kioskAssignmentRoutes = require("./kioskAssignment.routes");

const router = express.Router();

router.use("/markets", marketRoutes);
router.use("/zones", zoneRoutes);
router.use("/kiosk_types", kioskTypeRoutes);
router.use("/kiosk", kioskRoutes);
router.use("/merchants", merchantRoutes);
router.use("/kiosk_assignments", kioskAssignmentRoutes);

module.exports = router;
