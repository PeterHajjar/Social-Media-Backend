const express = require("express");
const router = express.Router();
const authController = require("../controllers/authController");
const uploadController = require("../controllers/uploadController");

router.patch("/upload/", authController.protect, uploadController.uploadImage,uploadController.uploadToCloudinary);


module.exports = router;