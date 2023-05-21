const database = require("../../../utilities/database");
const compose = require("../../../utilities/compose");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const crypto = require("crypto");
const { validationResult } = require("express-validator");

module.exports = async (req, res) => {
  const validatorErrors = validationResult(req);
  if (!validatorErrors.isEmpty()) {
    return res.json(compose.response(null, null, validatorErrors.array()));
  }

  const user = {
    uuid: crypto.randomUUID(),
    displayname: req.body.displayname.toLowerCase(),
    email: req.body.email.toLowerCase(),
    password: await bcrypt.hash(req.body.password, 10),
    signupDate: new Date(),
  };

  try {
    // Get database connection
    const db = database.get();

    // Check database for duplicate entries
    const duplicate = await db.collection("users").findOne({
      $or: [{ email: user.email }, { displayname: user.displayname }],
    });

    if (duplicate) {
      // Return error
      return res.json(
        compose.response(null, null, [{ msg: "Duplicate email entry" }])
      );
    }

    // Insert newly created user object into database
    const userInsert = await db.collection("users").insertOne(user);
    if (!userInsert.insertedId) {
      // Return error
      return res.json(
        compose.response(null, null, [
          { msg: "Internal server error", location: "userInsert" },
        ])
      );
    }

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

    // Remove password and mongodb id from user object
    delete user._id;
    delete user.password;

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
