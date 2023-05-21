const express = require("express");
const router = express.Router();

// Auth specific routes
router.use("/auth", require("./auth"));

module.exports = router;