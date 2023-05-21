const compose = require("../../utilities/compose");
const database = require("../../utilities/database");
const jwt = require("jsonwebtoken");
const { validationResult } = require("express-validator");

module.exports = async (req, res) => {
  const validatorErrors = validationResult(req);
  if (!validatorErrors.isEmpty()) {
    return res.json(compose.response(null, null, validatorErrors.array()));
  }
  
  try {
    // Extract token data from token provided as parameter
    const token = jwt.verify(req.body.token, process.env.JWT_REFRESH);

    // Get database connection
    const db = database.get();

    // Locate token in database
    const tokenRequest = await db
      .collection("tokens")
      .findOne({ token: req.body.token, type: "refresh" });
    if (!tokenRequest) {
      // Return error
      return res.json(
        compose.response(null, null, [
          {
            msg: "Failed to locate token in storage",
            location: "tokenRequest",
          },
        ])
      );
    }

    // Locate user in database
    const user = await db.collection("users").findOne({ uuid: token.user });

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

    // Return accessToken, refreshToken and user object to requesting user
    return res.json(
      compose.response(
        null,
        {
          accessToken,
          refreshToken: req.body.token,
          user,
        },
        null
      )
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
