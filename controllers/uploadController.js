const cloudinary = require("../utils/cloudinary");
const multer = require("multer"); //compressing img specifiying the type...
const User = require("../models/userModel");

// 1- Create the storage (local)
const multerStorage = multer.diskStorage();

// 2- Create the image filter
const filter = (req, file, cb) => {
  if (file.mimetype.startsWith("image")) {
    //mimetype is the file type
    cb(null, true);
  } else {
    cb(new Error("Not an image! Please upload only images"), false);
  }
};
// 3- Create the upload instance
const upload = multer({
  storage: multerStorage,
  fileFilter: filter,
});

exports.uploadImage = upload.single("image"); // this is used as a middleware to populate the file to be uploaded
// 4- Create the upload function

exports.uploadToCloudinary = async (req, res) => {
  try {
    const image = await cloudinary.uploader.upload(req.file.path);

    req.user = await User.findByIdAndUpdate(req.user._id, {
      profilePic: image.secure_url,
      cloudinary_id: image.public_id,
    });

    res.status(200).json({ message: "Image successfully uploaded" });
  } catch (error) {
    console.log(error);
  }
};
