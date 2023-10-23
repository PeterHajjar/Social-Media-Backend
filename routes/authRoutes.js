const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");

//we should do post now cz sign up is post

router.post("/signup", authController.signup);
router.post("/login", authController.login);
//router.use(authController.protect);//everything below this require login verification
router.post("/forgotPassword", authController.forgotPassword);
router.patch("/resetPassword/:token", authController.resetPassword);


module.exports = router;
