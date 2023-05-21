const express = require("express");
const router = express.Router();
const { body } = require("express-validator");

// URL: /auth/provider/email/signin
router.use(
  "/provider/email/signin",
  body("email").isEmail(),
  body("password").isLength({ min: 8 }),
  require("../controllers/auth/provider/email.signin")
);

// URL: /auth/provider/email/signup
router.use(
  "/provider/email/signup",
  body("email").isEmail(),
  body("displayname").isLength({ min: 6, max: 24 }),
  body("password").isLength({ min: 8 }),
  require("../controllers/auth/provider/email.signup")
);

// URL: /auth/refresh
router.use(
  "/refresh",
  body("token").isJWT(),
  require("../controllers/auth/refresh")
);

module.exports = router;
