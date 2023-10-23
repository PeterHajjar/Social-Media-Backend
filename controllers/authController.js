const User = require("../models/userModel");
const validator = require("validator");
const jwt = require("jsonwebtoken");
const { promisify } = require("util"); // takes from us a function that has normal callbacks and transforms them into a function that works with the promises
const { request } = require("http");
const crypto = require("crypto");
const sendMail = require("../utils/email").sendMail; // CAUTION!!!: Here we dont add the paranthesis after sendMail 
// we will define two functions one to sign a token and one to send it
const signToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN,
  });
};

const createSendToken = (user, statusCode, message, res) => {
  const token = signToken(user._id);
  res.status(statusCode).json({
    status: "success",
    message: message,
    token,
    data: {
      user,
    },
  });
};

exports.signup = async (req, res) => {
  //public way
  try {
    // response payload which is a request
    /*
        1- check if there is an existing account with the same email or username
        2- if there is a matching account send an error message
        3- if there is no matching account, check if all the fields are valid
        4- if all the fields are valid, create account
        5- if everything works fine, send a success message to the user
        */

    const userCheck = await User.findOne({
      $or: [{ username: req.body.username }, { email: req.body.email }],
    });

    if (userCheck) {
      return res
        .status(409)
        .json({ message: "Username or email already exists" }); //we should use the return to make it quit the response and not continue
    }

    if (!validator.isEmail(req.body.email)) {
      return res.status(400).json({ message: "Invalid email address" }); //400 bad request
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" }); //400 bad request
    }

    const newUser = await User.create({
      fullname: req.body.fullname,
      username: req.body.username,
      email: req.body.email,
      password: req.body.password,
      phoneNumber: req.body.phoneNumber,
    });

    let message = `Dear ${req.body.fullname}, your account has been created successfully`;
    createSendToken(newUser, 201, message, res);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong! Please try again later" });
  }
};

exports.login = async function (req, res) {
  try {
    /* 
    1- search if the user exists based on their email
    2- check if the entered password is valid and equal to the stored password
    3- if everything is working good log in else throw an error */

    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (!(await user.checkPassword(req.body.password, user.password))) {
      return res.status(401).json({ message: "Invalid Credentials" });
    }

    let message = "Logged in successfully.";
    createSendToken(user, 200, message, res);
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message: "Something went wrong while logging in ! Please try again later",
    });
  }
};

exports.updatePassword = async (req, res) => {
  try {
    const user = await User.findById(req.params.userID);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    if (await user.checkPassword(req.body.password, user.password)) {
      return res.status(400).json({
        message:
          "You cannot use an old password. You must change your password",
      });
    }

    if (req.body.password !== req.body.confirmPassword) {
      return res.status(400).json({ message: "Passwords do not match" });
    }

    user.password = req.body.password;
    await user.save();
    return res
      .status(200)
      .json({ message: "Password Updated Successfully", data: user });
  } catch (err) {
    console.log(err);
    return res.status(500).json({
      message:
        "Something went wrong while updating your password ! Please try again later",
    });
  }
};

exports.protect = async (req, res, next) => {
  try {
    // 1- Check if the token exists
    // 2- token verification
    // 3- Check if the user changed their password after the token was issued
    // 4- Grant access to the protected route
    let token; // we get the token from the authorization header
    if (
      req.headers.authorization &&
      req.headers.authorization.startsWith("Bearer")
    ) {
      token = req.headers.authorization.split(" ")[1];
    }
    if (!token) {
      return res
        .status(401)
        .json({ message: "You are not logged in. Please Login to get access" });
    }

    //2- Verify the token validity so in order to verify it we should do the decoding
    let decoded;
    try {
      decoded = await promisify(jwt.verify)(token, process.env.JWT_SECRET);
      console.log("Decoded token:", decoded);
    } catch (error) {
      if (error.name === "JsonWebTokenError") {
        console.log(error);
        return res
          .status(401)
          .json({ message: "Invalid token, please log in again" });
      } else if (error.name === "TokenExpiredError") {
        return res
          .status(401)
          .json({ message: "Your Session was expired, please log in again" });
      }
    }

    //3- Check if the user after decoding still exists
    const currentUser = await User.findById(decoded.id);
    if (!currentUser) {
      return res.status(404).json({
        message: " The user belonging to this session no longer exists",
      });
    }
    //Check if the user changed their password after the issue was issued
    if (currentUser.passwordChangedAfterTokenIssued(decoded.iat)) {
      return res.status(401).json({
        message: "You recently changed your password, Please Login again.",
      });
    }
    // At this stage, everything is fine so we can the user to the requests
    req.user = currentUser;
    next(); //jump to the next middleware
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong while protecting the route" });
  }
};

exports.forgotPassword = async (req, res) => {
  try {
    // 1- Check if the entered email address exists and if it is associated with a user account
    // 2- Create a random token
    // 3- Send the token to the user email address
    // 4- If something went wrong, destroy the token
    const user = await User.findOne({ email: req.body.email });
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });
    // we should make a link like: http://127.0.0.1:3000/api/v1/auth/resetPassword/102835ydfhsdajklffad
    const url = `${req.protocol}://${req.get(
      "host"
    )}/api/v1/auth/resetPassword/${resetToken}`;
    const message =
      `Forgot your password? Submit a patch request with your new password and confirm password to: ${url}`;
    try {
      await sendMail({
        email: user.email,
        subject: "Your password reset token (valid for 10 mins)",
        message: message,
      });
    } catch (error) {
      console.log(error);
      user.passwordResetToken = undefined;
      user.passwordResetExpires = undefined;
    }

    return res.status(200).json({ message: "Token sent to email", data: url });
  } catch (err) {
    console.log(err);
    return res.status(500).json({ message: "Something went wrong" });
  }
};

exports.resetPassword = async (req, res) => {
  try {
    // 1- so here we send to the user an email containing the unhashed token so
    // in order to check if the token is valid we should hash it and compare it with the one stored
    // in the database because the hashing is one way we cant revert it back to the original
    // that's why we need crypto package
    // 2-
    // 3-
    // 4-

    const hashedToken = crypto
      .createHash("sha256")
      .update(req.params.token)
      .digest("hex");

    // We should search for the user that has this hashed token
    const user = await User.findOne({
      passwordResetToken: hashedToken,
      passwordResetExpires: { $gt: Date.now() },
    });
    if (!user) {
      return res
        .status(400)
        .json({ message: "Password reset token is invalid or has expired" });
    }
    if (req.body.password !== req.body.passwordConfirm) {
      return res.status(400).json({ message: "Passwords do not match" });
    }
    user.password = req.body.password;
    user.passwordResetToken = undefined;
    user.passwordResetExpires = undefined;
    await user.save();
    createSendToken(user, 200, "Password reset successfully", res);
  } catch (err) {
    console.log(err);
    return res
      .status(500)
      .json({ message: "Something went wrong while resetting your password" });
  }
};
