const database = require("../../../utilities/database");
const compose = require("../../../utilities/compose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

module.exports = async (req, res) => {
  const validatorErrors = validationResult(req);
  if (!validatorErrors.isEmpty()) {
    return res.json(compose.response(null, null, validatorErrors.array()));
  }

  try {
    // Get database connection
    const db = database.get();

    // Find user in database
    const user = await db
      .collection("users")
      .findOne({ email: req.body.email });
    if (!user) {
      // Return error
      return res.json(
        compose.response("Forkert email/password", null, [
          { msg: "invalid credentials" },
        ])
      );
    }

    // Compare passwords using bcrypt
    if (!(await bcrypt.compare(req.body.password, user.password))) {
      // Return error
      return res.json(
        compose.response("Forkert email/password", null, [
          { msg: "invalid credentials" },
        ])
      );
    }

    // Delete hashed password and mongodb id
    delete user.password;
    delete user._id;

    // Create accessToken
    const accessToken = jwt.sign(
      {
        type: "access",
        user: user.uuid,
        email: user.email,
        displayname: user.displayname,
      },
      process.env.JWT_AUTH,
      {
        expiresIn: process.env.JWT_AUTH_EXPIRES,
      }
    );

    // Create refreshToken
    const refreshToken = jwt.sign(
      {
        type: "refresh",
        user: user.uuid,
      },
      process.env.JWT_REFRESH,
      {
        expiresIn: process.env.JWT_REFRESH_EXPIRES,
      }
    );

    // Insert newly created refresh token into database
    const refreshInsert = await db.collection("tokens").replaceOne(
      {
        type: "refresh",
        user: user.uuid,
      },
      {
        type: "refresh",
        user: user.uuid,
        token: refreshToken,
      },
      {
        upsert: true,
      }
    );

    if (!refreshInsert.upsertedId && !refreshInsert.modifiedCount) {
      // Return error
      return res.json(
        compose.response(null, null, [
          { msg: "Internal server error", location: "refreshInsert" },
        ])
      );
    }

    // Return accessToken, refreshToken and user object to requesting user
    return res.json(
      compose.response(null, { accessToken, refreshToken, user }, null)
    );
  } catch (error) {
    console.log(error);
    // Return error
    return res.json(
      compose.response(null, null, [
        { msg: "Internal server error", location: "trycatch", raw: error },
      ])
    );
  }
};
