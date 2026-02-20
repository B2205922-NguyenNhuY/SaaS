const express = require("express");
const { auth } = require("../middleware/auth");
const { requirePerm } = require("../middleware/permission");
const c = require("../controllers/merchant.controller");

const router = express.Router();

router.post("/", auth, requirePerm("CREATE_MERCHANT"), c.createMerchant); // #33
router.put("/:id", auth, requirePerm("UPDATE_MERCHANT"), c.updateMerchant); // #34
router.get("/", auth, requirePerm("VIEW_MERCHANT"), c.listMerchant); // #35

module.exports = router;
