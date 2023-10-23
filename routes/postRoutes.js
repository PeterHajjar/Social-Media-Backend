const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const postController = require('../controllers/postController');

router.use(authController.protect);//everything below this require login verification
router.post("/new-post",postController.createPost);
router.put("/likes/:postID",postController.like);

module.exports = router;
