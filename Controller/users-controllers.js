const { validationResult } = require("express-validator");

const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const HttpError = require("../Models/http-error");

const User = require("../Models/user");

const getUsers = async (req, res, next) => {
  let users;

  try {
    users = await User.find({}, "-password");
  } catch (error) {
    const err = new HttpError(
      "Something went wrong the user  try again later",
      500
    );

    return next(err);
  }

  if (!users || users.length === 0) {
    const err = new HttpError(
      "Fetching user failed, please try again later",
      500
    );

    return next(err);
  }

  res.json({ users: users.map((user) => user.toObject({ getters: true })) });
};

const signup = async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return next(
      new HttpError("Invalid input passed, please check your data", 422)
    );
  }
  const { name, email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Signup failed please try again later", 500);

    return next(err);
  }

  if (existingUser) {
    const error = new HttpError(
      "Could Not  create a user allready exist with same email Please login Instead ",
      422
    );

    return next(error);
  } else {
    let hashedPassword;

    try {
      hashedPassword = await bcrypt.hash(password, 12);
    } catch (err) {
      const error = new HttpError(
        "Could not create the User please try again later",
        500
      );

      return next(error);
    }

    /* Argument is salt or hashed value strnegth of 
    hashed Password Please know the bigger the value the greater time 
    it take to  encrypt and decrypt the password */

    const createdUser = new User({
      name,
      email,
      image: req.file.path,
      password: hashedPassword,
      places: [],
    });

    try {
      await createdUser.save();
    } catch (error) {
      const err = new HttpError(
        "Singing up failed please try again later ",
        500
      );

      return next(err);
    }

    let token;

    try {
      token = jwt.sign(
        { userId: createdUser.id, email: createdUser.email },
        process.env.JWT_KEY,
        { expiresIn: "1h" }
      );
    } catch (error) {
      const err = new HttpError(
        "Singing up failed please try again later",
        500
      );

      return next(err);
    }

    res
      .status(200)
      .json({ userId: createdUser.id, email: createdUser.email, token: token });
  }
};

const login = async (req, res, next) => {
  const { email, password } = req.body;

  let existingUser;
  try {
    existingUser = await User.findOne({ email: email });
  } catch (error) {
    const err = new HttpError("Login failed Could not log you in", 500);

    return next(err);
  }
  if (!existingUser) {
    const err = new HttpError(
      "Credentials Don't match could not log you in",
      401
    );

    return next(err);
  }

  let isValidPassword = false;

  try {
    isValidPassword = await bcrypt.compare(password, existingUser.password);
  } catch (error) {
    const err = new HttpError(
      "Could not log you in please check your credentials and try again !",
      500
    );

    return next(err);
  }

  if (!isValidPassword) {
    const err = new HttpError(
      "Could not log you in please check your credentials and try again !",
      500
    );

    return next(err);
  }

  let token;

  try {
    token = jwt.sign(
      { userId: existingUser.id, email: existingUser.email },
      process.env.JWT_KEY,
      { expiresIn: "1h" }
    );
  } catch (error) {
    const err = new HttpError(
      "Could not log you in please check your credentials and try again !",
      500
    );

    return next(err);
  }

  res.status(200).json({
    userId: existingUser.id,
    email: existingUser.email,
    token: token,
  });
};

module.exports = { getUsers, signup, login };
