const express = require('express');
const router = express.Router();

const authController = require('../controllers/authController');
const userController = require('../controllers/userController');
const followSystemcontroller = require('../controllers/followSystemController');

router.get("/allusers", authController.protect, userController.getAllUsers);
// you cant access get all users before getting through the protect middleware
router.patch("/followSystem/:userID", authController.protect, followSystemcontroller.followUnfollow);

module.exports = router;