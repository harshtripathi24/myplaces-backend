const jwt = require("jsonwebtoken");

const HttpError = require("../Models/http-error");

module.exports = (req, res, next) => {
  if (req.method === "OPTIONS") {
    next();
  }

  try {
    const token = req.headers.authorization.split(" ")[1]; //Authorization: Bearer Token

    if (!token) {
      throw new Error("Authentication Failed");
    }

    const decodedToken = jwt.verify(token, process.env.JWT_KEY);

    req.userData = { userId: decodedToken.userId };

    next();
  } catch (error) {
    const err = new HttpError("Authentication Failed ", 401);
    next(err);
  }
};
