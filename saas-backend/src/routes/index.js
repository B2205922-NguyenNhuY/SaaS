const router = require("express").Router();

router.use("/markets", require("./market.routes"));
router.use("/zones", require("./zone.routes"));
router.use("/kiosk_types", require("./kioskType.routes"));
router.use("/kiosks", require("./kiosk.routes"));
router.use("/merchants", require("./merchant.routes"));
router.use("/kiosk_assignments", require("./kioskAssignment.routes"));

module.exports = router;
