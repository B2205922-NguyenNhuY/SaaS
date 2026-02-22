const express = require("express");
const { auth } = require("../middleware/auth");
const { requirePerm } = require("../middleware/permission");
const c = require("../controllers/market.controller");

const router = express.Router();

router.post("/", auth, requirePerm("CREATE_MARKET"), c.createMarket); // #19
router.put("/:id", auth, requirePerm("UPDATE_MARKET"), c.updateMarket); // #20
router.put("/:id/lock", auth, requirePerm("LOCK_MARKET"), c.lockMarket); // #21
router.get("/", auth, requirePerm("VIEW_MARKET"), c.listMarket); // #22
router.get("/:id", auth, requirePerm("VIEW_MARKET"), c.getMarketById);

module.exports = router;
