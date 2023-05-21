const { validationResult } = require("express-validator");
const database = require("../../utilities/database");
const compose = require("../../utilities/compose");
const jwt = require("jsonwebtoken");

module.exports = async (req, res) => {
  const validatorErrors = validationResult(req);
  if (!validatorErrors.isEmpty()) {
    return res.json(compose.response(null, null, validatorErrors.array()));
  }

  try {
    // Extract token data from token provided as parameter
    jwt.verify(req.body.token, process.env.JWT_REFRESH);

    // Get database connection
    const db = database.get();

    // Delete token from database
    const tokenDelete = await db
      .collection("tokens")
      .deleteOne({ token: req.body.token, type: "refresh" });
    if (!tokenDelete.deletedCount) {
      // Return error
      return res.json(
        compose.response(null, null, [
          {
            msg: "Failed to clear token from storage",
            location: "tokenDelete",
          },
        ])
      );
    }

    // Return success message to user
    return res.json(compose.response("signoutSuccess", null, null));
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
